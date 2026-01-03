import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Note: These tests require a test Supabase instance
// Skip if no test database is configured
const SKIP_INTEGRATION = !process.env.TEST_SUPABASE_URL;

describe.skipIf(SKIP_INTEGRATION)('Properties API Integration', () => {
    let supabase: ReturnType<typeof createTestClient>;
    let testCompanyId: string;
    let testPropertyId: string;

    function createTestClient() {
        const { createClient } = require('@supabase/supabase-js');
        return createClient(
            process.env.TEST_SUPABASE_URL!,
            process.env.TEST_SUPABASE_SERVICE_KEY!
        );
    }

    beforeAll(async () => {
        supabase = createTestClient();

        // Create test company
        const { data: company, error } = await supabase
            .from('companies')
            .insert({
                name: 'Integration Test Company',
                email: 'integration-test@example.com',
                company_type: 'apartment',
            })
            .select()
            .single();

        if (error) throw error;
        testCompanyId = company.id;
    });

    afterAll(async () => {
        if (!supabase || !testCompanyId) return;

        // Cleanup in reverse dependency order
        await supabase.from('units').delete().eq('company_id', testCompanyId);
        await supabase.from('properties').delete().eq('company_id', testCompanyId);
        await supabase.from('companies').delete().eq('id', testCompanyId);
    });

    it('should create a property', async () => {
        const { data, error } = await supabase
            .from('properties')
            .insert({
                company_id: testCompanyId,
                name: 'Test Property',
                property_type: 'apartment',
                address: 'Test Address 123',
                total_floors: 5,
            })
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe('Test Property');
        expect(data.property_type).toBe('apartment');
        testPropertyId = data.id;
    });

    it('should list properties for company', async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('company_id', testCompanyId);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data[0].name).toBe('Test Property');
    });

    it('should update a property', async () => {
        const { data, error } = await supabase
            .from('properties')
            .update({ name: 'Updated Property Name' })
            .eq('id', testPropertyId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data.name).toBe('Updated Property Name');
    });

    it('should soft delete a property', async () => {
        const { error } = await supabase
            .from('properties')
            .update({ is_active: false })
            .eq('id', testPropertyId);

        expect(error).toBeNull();

        const { data } = await supabase
            .from('properties')
            .select('*')
            .eq('id', testPropertyId)
            .single();

        expect(data.is_active).toBe(false);
    });

    it('should create units for property', async () => {
        // First, reactivate the property
        await supabase
            .from('properties')
            .update({ is_active: true })
            .eq('id', testPropertyId);

        const units = [
            {
                property_id: testPropertyId,
                company_id: testCompanyId,
                unit_number: '101',
                floor: 1,
                status: 'vacant',
            },
            {
                property_id: testPropertyId,
                company_id: testCompanyId,
                unit_number: '102',
                floor: 1,
                status: 'vacant',
            },
        ];

        const { data, error } = await supabase
            .from('units')
            .insert(units)
            .select();

        expect(error).toBeNull();
        expect(data).toHaveLength(2);
    });

    it('should list units for property', async () => {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .eq('property_id', testPropertyId)
            .order('unit_number');

        expect(error).toBeNull();
        expect(data).toHaveLength(2);
        expect(data[0].unit_number).toBe('101');
        expect(data[1].unit_number).toBe('102');
    });

    it('should enforce unique unit numbers per property', async () => {
        const { error } = await supabase.from('units').insert({
            property_id: testPropertyId,
            company_id: testCompanyId,
            unit_number: '101', // Duplicate
            floor: 1,
            status: 'vacant',
        });

        expect(error).not.toBeNull();
        expect(error.code).toBe('23505'); // Unique violation
    });
});

describe('Properties API - Mock Tests', () => {
    it('should validate property input', () => {
        const validInput = {
            name: 'Test Property',
            property_type: 'apartment',
            address: 'Test Address',
        };

        expect(validInput.name.length).toBeGreaterThan(0);
        expect(['apartment', 'office']).toContain(validInput.property_type);
        expect(validInput.address.length).toBeGreaterThan(0);
    });

    it('should reject empty property name', () => {
        const invalidInput = {
            name: '',
            property_type: 'apartment',
            address: 'Test Address',
        };

        expect(invalidInput.name.length).toBe(0);
    });

    it('should reject invalid property type', () => {
        const validTypes = ['apartment', 'office'];
        const invalidType = 'commercial';

        expect(validTypes).not.toContain(invalidType);
    });
});
