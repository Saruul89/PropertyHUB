import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/billings/check-overdue - Check and update overdue billings
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get company_id (optional - if not provided, check all companies for system admin)
        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        const today = new Date().toISOString().split('T')[0];

        // Find billings that are past due
        let query = supabase
            .from('billings')
            .select('id, billing_number, tenant_id, due_date, status')
            .in('status', ['pending', 'partial'])
            .lt('due_date', today);

        // If company user, only check their company's billings
        if (companyUser) {
            query = query.eq('company_id', companyUser.company_id);
        }

        const { data: overdueBillings, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (!overdueBillings || overdueBillings.length === 0) {
            return NextResponse.json({
                message: 'Хугацаа хэтэрсэн нэхэмжлэх байхгүй',
                updated_count: 0,
            });
        }

        // Update status to overdue
        const billingIds = overdueBillings.map(b => b.id);

        const { error: updateError } = await supabase
            .from('billings')
            .update({ status: 'overdue' })
            .in('id', billingIds);

        if (updateError) throw updateError;

        return NextResponse.json({
            message: `${overdueBillings.length} нэхэмжлэхийг хугацаа хэтэрсэн болгож шинэчиллээ`,
            updated_count: overdueBillings.length,
            billing_ids: billingIds,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to check overdue billings';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
