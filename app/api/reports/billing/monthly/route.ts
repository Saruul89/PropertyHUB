import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/reports/billing/monthly - Get monthly billing report
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const searchParams = req.nextUrl.searchParams;
    const month = searchParams.get('month'); // YYYY-MM format

    if (!month) {
        return NextResponse.json({ error: 'month parameter is required' }, { status: 400 });
    }

    try {
        const monthStart = `${month}-01`;
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        const monthEndStr = monthEnd.toISOString().split('T')[0];

        // Get billings with property info
        const { data: billings, error: billingsError } = await supabase
            .from('billings')
            .select(`
                *,
                tenant:tenants(name),
                unit:units(unit_number, property_id, property:properties(name)),
                billing_items(fee_type_id, fee_name, amount)
            `)
            .eq('company_id', companyUser.company_id)
            .eq('billing_month', monthStart);

        if (billingsError) throw billingsError;

        // Get payments for the month
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, billing_id')
            .eq('company_id', companyUser.company_id)
            .gte('payment_date', monthStart)
            .lt('payment_date', monthEndStr);

        if (paymentsError) throw paymentsError;

        // Group by property
        const propertyStats: Record<string, {
            property_id: string;
            property_name: string;
            total_billed: number;
            total_paid: number;
            billing_count: number;
            paid_count: number;
            unpaid_count: number;
            overdue_count: number;
        }> = {};

        // Group by fee type
        const feeTypeStats: Record<string, {
            fee_name: string;
            total_amount: number;
            count: number;
        }> = {};

        // Overdue tenants list
        const overdueTenants: {
            tenant_name: string;
            unit_number: string;
            property_name: string;
            total_amount: number;
            paid_amount: number;
            outstanding: number;
            due_date: string;
        }[] = [];

        // Create payment lookup by billing_id
        const paymentsByBilling: Record<string, number> = {};
        (payments || []).forEach(p => {
            if (p.billing_id) {
                paymentsByBilling[p.billing_id] = (paymentsByBilling[p.billing_id] || 0) + p.amount;
            }
        });

        (billings || []).forEach(billing => {
            const propertyId = billing.unit?.property_id;
            const propertyName = billing.unit?.property?.name || 'Unknown';

            // Initialize property stats
            if (propertyId && !propertyStats[propertyId]) {
                propertyStats[propertyId] = {
                    property_id: propertyId,
                    property_name: propertyName,
                    total_billed: 0,
                    total_paid: 0,
                    billing_count: 0,
                    paid_count: 0,
                    unpaid_count: 0,
                    overdue_count: 0,
                };
            }

            if (billing.status !== 'cancelled' && propertyId) {
                propertyStats[propertyId].total_billed += billing.total_amount;
                propertyStats[propertyId].total_paid += billing.paid_amount;
                propertyStats[propertyId].billing_count++;

                if (billing.status === 'paid') {
                    propertyStats[propertyId].paid_count++;
                } else {
                    propertyStats[propertyId].unpaid_count++;
                }

                if (billing.status === 'overdue') {
                    propertyStats[propertyId].overdue_count++;
                }
            }

            // Fee type breakdown
            (billing.billing_items || []).forEach((item: { fee_type_id?: string; fee_name: string; amount: number }) => {
                const key = item.fee_type_id || item.fee_name;
                if (!feeTypeStats[key]) {
                    feeTypeStats[key] = {
                        fee_name: item.fee_name,
                        total_amount: 0,
                        count: 0,
                    };
                }
                feeTypeStats[key].total_amount += item.amount;
                feeTypeStats[key].count++;
            });

            // Overdue tenants
            if (billing.status === 'overdue') {
                overdueTenants.push({
                    tenant_name: billing.tenant?.name || 'Unknown',
                    unit_number: billing.unit?.unit_number || '',
                    property_name: propertyName,
                    total_amount: billing.total_amount,
                    paid_amount: billing.paid_amount,
                    outstanding: billing.total_amount - billing.paid_amount,
                    due_date: billing.due_date,
                });
            }
        });

        // Calculate totals
        const totalStats = {
            total_billed: Object.values(propertyStats).reduce((sum, p) => sum + p.total_billed, 0),
            total_paid: Object.values(propertyStats).reduce((sum, p) => sum + p.total_paid, 0),
            total_outstanding: 0,
            collection_rate: 0,
        };

        totalStats.total_outstanding = totalStats.total_billed - totalStats.total_paid;
        totalStats.collection_rate = totalStats.total_billed > 0
            ? (totalStats.total_paid / totalStats.total_billed) * 100
            : 0;

        return NextResponse.json({
            data: {
                month,
                summary: totalStats,
                by_property: Object.values(propertyStats).sort((a, b) => b.total_billed - a.total_billed),
                by_fee_type: Object.values(feeTypeStats).sort((a, b) => b.total_amount - a.total_amount),
                overdue_tenants: overdueTenants.sort((a, b) => b.outstanding - a.outstanding),
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get monthly report';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
