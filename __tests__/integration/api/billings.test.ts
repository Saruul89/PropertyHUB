import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Note: These tests require a test Supabase instance
const SKIP_INTEGRATION = !process.env.TEST_SUPABASE_URL;

describe.skipIf(SKIP_INTEGRATION)('Billings API Integration', () => {
    let supabase: ReturnType<typeof createTestClient>;
    let testData: {
        companyId: string;
        propertyId: string;
        unitId: string;
        tenantId: string;
        leaseId: string;
        billingId: string;
    };

    function createTestClient() {
        const { createClient } = require('@supabase/supabase-js');
        return createClient(
            process.env.TEST_SUPABASE_URL!,
            process.env.TEST_SUPABASE_SERVICE_KEY!
        );
    }

    beforeAll(async () => {
        supabase = createTestClient();

        // Create complete test data set
        const { data: company } = await supabase
            .from('companies')
            .insert({
                name: 'Billing Test Company',
                email: 'billing-test@example.com',
                company_type: 'apartment',
            })
            .select()
            .single();

        const { data: property } = await supabase
            .from('properties')
            .insert({
                company_id: company.id,
                name: 'Billing Test Property',
                property_type: 'apartment',
                address: 'Test Address',
            })
            .select()
            .single();

        const { data: unit } = await supabase
            .from('units')
            .insert({
                property_id: property.id,
                company_id: company.id,
                unit_number: '101',
                floor: 1,
                monthly_rent: 500000,
                status: 'occupied',
            })
            .select()
            .single();

        const { data: tenant } = await supabase
            .from('tenants')
            .insert({
                company_id: company.id,
                name: 'Test Tenant',
                phone: '99001234',
                tenant_type: 'individual',
            })
            .select()
            .single();

        const { data: lease } = await supabase
            .from('leases')
            .insert({
                company_id: company.id,
                tenant_id: tenant.id,
                unit_id: unit.id,
                start_date: '2024-01-01',
                monthly_rent: 500000,
                status: 'active',
            })
            .select()
            .single();

        testData = {
            companyId: company.id,
            propertyId: property.id,
            unitId: unit.id,
            tenantId: tenant.id,
            leaseId: lease.id,
            billingId: '',
        };
    });

    afterAll(async () => {
        if (!supabase || !testData?.companyId) return;

        // Cleanup in reverse dependency order
        await supabase.from('payments').delete().eq('company_id', testData.companyId);
        await supabase
            .from('billing_items')
            .delete()
            .eq('billing_id', testData.billingId);
        await supabase.from('billings').delete().eq('company_id', testData.companyId);
        await supabase.from('leases').delete().eq('company_id', testData.companyId);
        await supabase.from('tenants').delete().eq('company_id', testData.companyId);
        await supabase.from('units').delete().eq('company_id', testData.companyId);
        await supabase.from('properties').delete().eq('company_id', testData.companyId);
        await supabase.from('companies').delete().eq('id', testData.companyId);
    });

    it('should create a billing', async () => {
        const { data, error } = await supabase
            .from('billings')
            .insert({
                company_id: testData.companyId,
                tenant_id: testData.tenantId,
                unit_id: testData.unitId,
                billing_number: 'INV-202403-0001',
                billing_month: '2024-03',
                issue_date: '2024-03-01',
                due_date: '2024-03-15',
                total_amount: 72000,
                paid_amount: 0,
                status: 'pending',
            })
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.billing_number).toBe('INV-202403-0001');
        expect(data.total_amount).toBe(72000);
        testData.billingId = data.id;
    });

    it('should create billing items', async () => {
        const items = [
            {
                billing_id: testData.billingId,
                fee_name: '管理費',
                quantity: 1,
                unit_price: 50000,
                amount: 50000,
            },
            {
                billing_id: testData.billingId,
                fee_name: '水道代',
                quantity: 4.8,
                unit_price: 2500,
                amount: 12000,
            },
            {
                billing_id: testData.billingId,
                fee_name: 'ゴミ代',
                quantity: 1,
                unit_price: 10000,
                amount: 10000,
            },
        ];

        const { data, error } = await supabase
            .from('billing_items')
            .insert(items)
            .select();

        expect(error).toBeNull();
        expect(data).toHaveLength(3);
    });

    it('should register a partial payment', async () => {
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                billing_id: testData.billingId,
                company_id: testData.companyId,
                amount: 30000,
                payment_date: '2024-03-10',
                payment_method: 'bank_transfer',
            })
            .select()
            .single();

        expect(paymentError).toBeNull();
        expect(payment.amount).toBe(30000);

        // Update billing paid_amount
        const { error: updateError } = await supabase
            .from('billings')
            .update({
                paid_amount: 30000,
                status: 'partial',
            })
            .eq('id', testData.billingId);

        expect(updateError).toBeNull();
    });

    it('should show correct billing status after partial payment', async () => {
        const { data, error } = await supabase
            .from('billings')
            .select('*')
            .eq('id', testData.billingId)
            .single();

        expect(error).toBeNull();
        expect(data.status).toBe('partial');
        expect(data.paid_amount).toBe(30000);
    });

    it('should register remaining payment and mark as paid', async () => {
        const { error: paymentError } = await supabase.from('payments').insert({
            billing_id: testData.billingId,
            company_id: testData.companyId,
            amount: 42000,
            payment_date: '2024-03-12',
            payment_method: 'cash',
        });

        expect(paymentError).toBeNull();

        // Update billing to paid
        const { error: updateError } = await supabase
            .from('billings')
            .update({
                paid_amount: 72000,
                status: 'paid',
                paid_at: new Date().toISOString(),
            })
            .eq('id', testData.billingId);

        expect(updateError).toBeNull();

        // Verify
        const { data } = await supabase
            .from('billings')
            .select('*')
            .eq('id', testData.billingId)
            .single();

        expect(data.status).toBe('paid');
        expect(data.paid_amount).toBe(72000);
    });

    it('should list payment history', async () => {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('billing_id', testData.billingId)
            .order('payment_date');

        expect(error).toBeNull();
        expect(data).toHaveLength(2);
        expect(data[0].amount).toBe(30000);
        expect(data[1].amount).toBe(42000);
    });
});

describe('Billing Calculation - Mock Tests', () => {
    it('should calculate billing total correctly', () => {
        const items = [
            { amount: 50000 },
            { amount: 12000 },
            { amount: 10000 },
        ];

        const total = items.reduce((sum, item) => sum + item.amount, 0);
        expect(total).toBe(72000);
    });

    it('should calculate outstanding amount', () => {
        const totalAmount = 72000;
        const paidAmount = 30000;
        const outstanding = totalAmount - paidAmount;

        expect(outstanding).toBe(42000);
    });

    it('should determine overdue status', () => {
        const dueDate = new Date('2024-03-15');
        const currentDate = new Date('2024-03-20');
        const isPastDue = currentDate > dueDate;

        expect(isPastDue).toBe(true);
    });
});
