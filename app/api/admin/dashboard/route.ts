import { NextRequest, NextResponse } from 'next/server';
import {
    requireAdminRole,
    createErrorResponse,
} from '@/lib/admin/require-admin';

// GET - Get dashboard statistics
export async function GET(req: NextRequest) {
    try {
        const { supabase } = await requireAdminRole('support', req);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthStr = startOfMonth.toISOString();

        // Parallel queries for statistics
        const [
            companiesRes,
            propertiesRes,
            unitsRes,
            tenantsRes,
            billingsRes,
            paymentsRes,
            unpaidRes,
            subscriptionsRes,
            newCompaniesRes,
            expiringSubsRes,
        ] = await Promise.all([
            // Total companies
            supabase
                .from('companies')
                .select('id, company_type', { count: 'exact' }),

            // Total properties
            supabase
                .from('properties')
                .select('id', { count: 'exact', head: true }),

            // Total units
            supabase
                .from('units')
                .select('id', { count: 'exact', head: true }),

            // Total active tenants
            supabase
                .from('tenants')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true),

            // Total billings this month
            supabase
                .from('billings')
                .select('total_amount')
                .gte('billing_month', startOfMonthStr.split('T')[0]),

            // Total payments this month
            supabase
                .from('payments')
                .select('amount')
                .gte('payment_date', startOfMonthStr.split('T')[0]),

            // Total unpaid billings
            supabase
                .from('billings')
                .select('total_amount, paid_amount')
                .neq('status', 'paid')
                .neq('status', 'cancelled'),

            // Subscriptions by plan
            supabase
                .from('subscriptions')
                .select('plan, price_per_month, status'),

            // New companies this month
            supabase
                .from('companies')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', startOfMonthStr),

            // Expiring subscriptions (within 7 days)
            supabase
                .from('subscriptions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active')
                .lte('current_period_end', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        ]);

        // Calculate totals
        const totalBillings = billingsRes.data?.reduce(
            (sum, b) => sum + (Number(b.total_amount) || 0),
            0
        ) || 0;

        const totalPayments = paymentsRes.data?.reduce(
            (sum, p) => sum + (Number(p.amount) || 0),
            0
        ) || 0;

        const totalUnpaid = unpaidRes.data?.reduce(
            (sum, b) => sum + (Number(b.total_amount) || 0) - (Number(b.paid_amount) || 0),
            0
        ) || 0;

        // MRR calculation
        const mrr = subscriptionsRes.data
            ?.filter(s => s.status === 'active')
            .reduce((sum, s) => sum + (Number(s.price_per_month) || 0), 0) || 0;

        // Companies by plan
        const companiesByPlan: Record<string, number> = {
            free: 0,
            basic: 0,
            pro: 0,
            enterprise: 0,
        };
        subscriptionsRes.data?.forEach(s => {
            if (companiesByPlan[s.plan] !== undefined) {
                companiesByPlan[s.plan]++;
            }
        });

        // Companies by type
        const companiesByType: Record<string, number> = {};
        companiesRes.data?.forEach(c => {
            companiesByType[c.company_type] = (companiesByType[c.company_type] || 0) + 1;
        });

        // Check for limit exceeded companies
        const { data: limitCheckData } = await supabase
            .from('companies')
            .select(`
                id,
                subscriptions!inner (max_properties, max_units)
            `)
            .eq('is_active', true);

        let limitExceeded = 0;
        if (limitCheckData) {
            for (const company of limitCheckData) {
                const subs = company.subscriptions as { max_properties: number; max_units: number }[];
                const sub = subs?.[0];
                if (!sub) continue;

                const { count: propCount } = await supabase
                    .from('properties')
                    .select('id', { count: 'exact', head: true })
                    .eq('company_id', company.id);

                if (propCount && sub.max_properties > 0 && propCount > sub.max_properties) {
                    limitExceeded++;
                }
            }
        }

        // Get recent companies
        const { data: recentCompanies } = await supabase
            .from('companies')
            .select(`
                id, name, company_type, created_at,
                subscriptions (plan)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        // Get alerts
        const alerts = [];

        if (expiringSubsRes.count && expiringSubsRes.count > 0) {
            alerts.push({
                type: 'warning',
                message: `${expiringSubsRes.count} компанийн захиалга дуусах дөхсөн`,
            });
        }

        if (limitExceeded > 0) {
            alerts.push({
                type: 'warning',
                message: `${limitExceeded} компани хязгаараас хэтэрсэн`,
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    total_companies: companiesRes.count || 0,
                    total_properties: propertiesRes.count || 0,
                    total_units: unitsRes.count || 0,
                    total_tenants: tenantsRes.count || 0,
                    total_billings_this_month: totalBillings,
                    total_payments_this_month: totalPayments,
                    total_unpaid: totalUnpaid,
                    mrr,
                    companies_by_plan: companiesByPlan,
                    companies_by_type: companiesByType,
                    new_companies_this_month: newCompaniesRes.count || 0,
                    expiring_subscriptions: expiringSubsRes.count || 0,
                    limit_exceeded_companies: limitExceeded,
                },
                recent_companies: recentCompanies || [],
                alerts,
            },
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
