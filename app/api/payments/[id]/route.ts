import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/payments/[id] - Cancel/delete a payment
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get payment
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*, billing:billings(*)')
            .eq('id', id)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Verify user has access to this payment
        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        if (!companyUser || companyUser.company_id !== payment.company_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete payment
        const { error: deleteError } = await supabase
            .from('payments')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // Update billing if exists
        if (payment.billing_id && payment.billing) {
            const billing = payment.billing;
            const newPaidAmount = Math.max(0, billing.paid_amount - payment.amount);

            let newStatus = billing.status;
            if (newPaidAmount === 0) {
                // Check if overdue
                const today = new Date();
                const dueDate = new Date(billing.due_date);
                newStatus = dueDate < today ? 'overdue' : 'pending';
            } else if (newPaidAmount < billing.total_amount) {
                newStatus = 'partial';
            }

            await supabase
                .from('billings')
                .update({
                    paid_amount: newPaidAmount,
                    status: newStatus,
                    paid_at: null,
                })
                .eq('id', billing.id);
        }

        return NextResponse.json({
            message: 'Төлбөр цуцлагдлаа',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to cancel payment';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
