import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/reports/billing/summary - Get billing summary for dashboard
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

    try {
        // Base query for the specified month or current month
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const monthStart = `${targetMonth}-01`;

        // Get all billings for the month
        let billingsQuery = supabase
            .from('billings')
            .select('total_amount, paid_amount, status')
            .eq('company_id', companyUser.company_id);

        if (month) {
            billingsQuery = billingsQuery.eq('billing_month', monthStart);
        }

        const { data: billings, error: billingsError } = await billingsQuery;

        if (billingsError) throw billingsError;

        // Get payments for the month
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        const monthEndStr = monthEnd.toISOString().split('T')[0];

        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount')
            .eq('company_id', companyUser.company_id)
            .gte('payment_date', monthStart)
            .lt('payment_date', monthEndStr);

        if (paymentsError) throw paymentsError;

        // Calculate summary
        const summary = {
            total_billed: 0,
            total_paid: 0,
            total_outstanding: 0,
            overdue_count: 0,
            overdue_amount: 0,
            pending_count: 0,
            partial_count: 0,
            paid_count: 0,
            cancelled_count: 0,
        };

        (billings || []).forEach(b => {
            if (b.status !== 'cancelled') {
                summary.total_billed += b.total_amount;
            }

            const outstanding = b.total_amount - b.paid_amount;

            switch (b.status) {
                case 'pending':
                    summary.pending_count++;
                    summary.total_outstanding += outstanding;
                    break;
                case 'partial':
                    summary.partial_count++;
                    summary.total_outstanding += outstanding;
                    break;
                case 'paid':
                    summary.paid_count++;
                    break;
                case 'overdue':
                    summary.overdue_count++;
                    summary.overdue_amount += outstanding;
                    summary.total_outstanding += outstanding;
                    break;
                case 'cancelled':
                    summary.cancelled_count++;
                    break;
            }
        });

        summary.total_paid = (payments || []).reduce((sum, p) => sum + p.amount, 0);

        // Get collection rate
        const collectionRate = summary.total_billed > 0
            ? ((summary.total_paid / summary.total_billed) * 100).toFixed(1)
            : '0';

        return NextResponse.json({
            data: {
                ...summary,
                collection_rate: parseFloat(collectionRate),
                month: targetMonth,
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get billing summary';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
