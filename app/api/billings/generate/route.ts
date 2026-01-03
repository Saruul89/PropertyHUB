import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { FeeType, UnitFee, MeterReading } from '@/types';

interface BillingItemInput {
    fee_type_id?: string;
    fee_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    amount: number;
    meter_reading_id?: string;
}

// POST /api/billings/generate - Generate billings for selected leases
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { billing_month, property_ids, issue_date, due_date, lease_ids } = body;

        if (!billing_month || !issue_date || !due_date) {
            return NextResponse.json(
                { error: 'billing_month, issue_date, and due_date are required' },
                { status: 400 }
            );
        }

        // Get company_id
        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        if (!companyUser) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Build query for active leases
        let leasesQuery = supabase
            .from('leases')
            .select(`
                *,
                tenant:tenants(*),
                unit:units(*, property:properties(*))
            `)
            .eq('company_id', companyUser.company_id)
            .eq('status', 'active');

        // Filter by property_ids if provided
        if (property_ids && property_ids.length > 0) {
            leasesQuery = leasesQuery.in('unit.property_id', property_ids);
        }

        // Filter by specific lease_ids if provided
        if (lease_ids && lease_ids.length > 0) {
            leasesQuery = leasesQuery.in('id', lease_ids);
        }

        const { data: leases, error: leasesError } = await leasesQuery;
        if (leasesError) throw leasesError;

        if (!leases || leases.length === 0) {
            return NextResponse.json({ error: 'No active leases found' }, { status: 404 });
        }

        // Check for existing billings in the same month
        const billingMonthDate = `${billing_month}-01`;
        const { data: existingBillings } = await supabase
            .from('billings')
            .select('unit_id')
            .eq('company_id', companyUser.company_id)
            .eq('billing_month', billingMonthDate);

        const existingUnitIds = new Set(existingBillings?.map(b => b.unit_id) || []);

        // Filter out leases that already have billings
        const eligibleLeases = leases.filter(l => !existingUnitIds.has(l.unit_id));

        if (eligibleLeases.length === 0) {
            return NextResponse.json(
                { error: 'All selected units already have billings for this month' },
                { status: 400 }
            );
        }

        // Get fee types
        const { data: feeTypes } = await supabase
            .from('fee_types')
            .select('*')
            .eq('company_id', companyUser.company_id)
            .eq('is_active', true)
            .order('display_order');

        // Get unit fees for eligible units
        const unitIds = eligibleLeases.map(l => l.unit_id);
        const { data: allUnitFees } = await supabase
            .from('unit_fees')
            .select('*, fee_type:fee_types(*)')
            .in('unit_id', unitIds)
            .eq('is_active', true);

        // Get meter readings for the billing month
        const startDate = billingMonthDate;
        const endDate = new Date(billing_month + '-01');
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];

        const { data: allMeterReadings } = await supabase
            .from('meter_readings')
            .select('*')
            .in('unit_id', unitIds)
            .gte('reading_date', startDate)
            .lt('reading_date', endDateStr)
            .order('reading_date', { ascending: false });

        // Group data by unit_id
        type UnitFeeWithType = UnitFee & { fee_type: FeeType };
        const unitFeesMap = new Map<string, UnitFeeWithType[]>();
        (allUnitFees as UnitFeeWithType[] | null)?.forEach(uf => {
            const existing = unitFeesMap.get(uf.unit_id) || [];
            existing.push(uf);
            unitFeesMap.set(uf.unit_id, existing);
        });

        const meterReadingsMap = new Map<string, MeterReading>();
        (allMeterReadings as MeterReading[] | null)?.forEach(mr => {
            const key = `${mr.unit_id}-${mr.fee_type_id}`;
            if (!meterReadingsMap.has(key)) {
                meterReadingsMap.set(key, mr);
            }
        });

        // Get current billing count for numbering
        const { count: billingCount } = await supabase
            .from('billings')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyUser.company_id)
            .like('billing_number', `INV-${billing_month.replace('-', '')}%`);

        const generatedBillings = [];
        let sequenceNumber = (billingCount || 0) + 1;

        for (const lease of eligibleLeases) {
            const items: BillingItemInput[] = [];

            // Add monthly rent
            items.push({
                fee_name: 'Түрээсийн төлбөр',
                description: `${billing_month} сарын`,
                quantity: 1,
                unit_price: lease.monthly_rent,
                amount: lease.monthly_rent,
            });

            // Process unit-specific fees
            const unitFees = unitFeesMap.get(lease.unit_id) || [];
            const addedFeeTypeIds = new Set<string>();

            for (const unitFee of unitFees) {
                const feeType = unitFee.fee_type;
                if (!feeType) continue;

                addedFeeTypeIds.add(feeType.id);

                let amount = 0;
                let quantity = 1;
                let unitPrice = 0;

                switch (feeType.calculation_type) {
                    case 'fixed':
                        unitPrice = unitFee.custom_amount ?? feeType.default_amount;
                        amount = unitPrice;
                        break;
                    case 'per_sqm':
                        unitPrice = unitFee.custom_unit_price ?? feeType.default_unit_price ?? 0;
                        quantity = lease.unit?.area_sqm ?? 0;
                        amount = unitPrice * quantity;
                        break;
                    case 'metered': {
                        const meterReading = meterReadingsMap.get(`${lease.unit_id}-${feeType.id}`);
                        if (meterReading) {
                            items.push({
                                fee_type_id: feeType.id,
                                fee_name: feeType.name,
                                description: `Хэрэглээ: ${meterReading.consumption} (${meterReading.previous_reading} → ${meterReading.current_reading})`,
                                quantity: meterReading.consumption,
                                unit_price: meterReading.unit_price,
                                amount: meterReading.total_amount,
                                meter_reading_id: meterReading.id,
                            });
                        }
                        continue;
                    }
                    case 'custom':
                        unitPrice = unitFee.custom_amount ?? 0;
                        amount = unitPrice;
                        break;
                }

                if (amount > 0) {
                    items.push({
                        fee_type_id: feeType.id,
                        fee_name: feeType.name,
                        quantity,
                        unit_price: unitPrice,
                        amount,
                    });
                }
            }

            // Add default fee types (not unit-specific)
            for (const feeType of (feeTypes || [])) {
                if (addedFeeTypeIds.has(feeType.id)) continue;

                let amount = 0;
                let quantity = 1;
                let unitPrice = 0;

                switch (feeType.calculation_type) {
                    case 'fixed':
                        if (feeType.default_amount === 0) continue;
                        unitPrice = feeType.default_amount;
                        amount = unitPrice;
                        break;
                    case 'per_sqm':
                        if (!feeType.default_unit_price) continue;
                        unitPrice = feeType.default_unit_price;
                        quantity = lease.unit?.area_sqm ?? 0;
                        amount = unitPrice * quantity;
                        break;
                    case 'metered': {
                        const meterReading = meterReadingsMap.get(`${lease.unit_id}-${feeType.id}`);
                        if (meterReading && !addedFeeTypeIds.has(feeType.id)) {
                            items.push({
                                fee_type_id: feeType.id,
                                fee_name: feeType.name,
                                description: `Хэрэглээ: ${meterReading.consumption} (${meterReading.previous_reading} → ${meterReading.current_reading})`,
                                quantity: meterReading.consumption,
                                unit_price: meterReading.unit_price,
                                amount: meterReading.total_amount,
                                meter_reading_id: meterReading.id,
                            });
                        }
                        continue;
                    }
                    case 'custom':
                        continue;
                }

                if (amount > 0) {
                    items.push({
                        fee_type_id: feeType.id,
                        fee_name: feeType.name,
                        quantity,
                        unit_price: unitPrice,
                        amount,
                    });
                }
            }

            const total = items.reduce((sum, item) => sum + item.amount, 0);
            const billingNumber = `INV-${billing_month.replace('-', '')}-${String(sequenceNumber).padStart(4, '0')}`;

            // Create billing
            const { data: billing, error: billingError } = await supabase
                .from('billings')
                .insert({
                    lease_id: lease.id,
                    tenant_id: lease.tenant_id,
                    unit_id: lease.unit_id,
                    company_id: companyUser.company_id,
                    billing_number: billingNumber,
                    billing_month: billingMonthDate,
                    issue_date,
                    due_date,
                    subtotal: total,
                    tax_amount: 0,
                    total_amount: total,
                    status: 'pending',
                    paid_amount: 0,
                })
                .select()
                .single();

            if (billingError) {
                console.error('Error creating billing:', billingError);
                continue;
            }

            // Create billing items
            for (const item of items) {
                await supabase.from('billing_items').insert({
                    billing_id: billing.id,
                    fee_type_id: item.fee_type_id || null,
                    fee_name: item.fee_name,
                    description: item.description || null,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    amount: item.amount,
                    meter_reading_id: item.meter_reading_id || null,
                });
            }

            generatedBillings.push(billing);
            sequenceNumber++;
        }

        return NextResponse.json({
            data: generatedBillings,
            count: generatedBillings.length,
            message: `${generatedBillings.length} нэхэмжлэх үүсгэгдлээ`,
        }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate billings';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
