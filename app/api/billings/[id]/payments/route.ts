import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/billings/[id]/payments - Get payment history for a billing
export async function GET(req: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const { id: billingId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('billing_id', billingId)
        .order('payment_date', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: payments });
}

// POST /api/billings/[id]/payments - Record a payment
export async function POST(req: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const { id: billingId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { amount, payment_date, payment_method, reference_number, notes } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        if (!payment_date) {
            return NextResponse.json({ error: 'Payment date is required' }, { status: 400 });
        }

        // Get billing
        const { data: billing, error: billingError } = await supabase
            .from('billings')
            .select('*')
            .eq('id', billingId)
            .single();

        if (billingError || !billing) {
            return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
        }

        if (billing.status === 'paid') {
            return NextResponse.json({ error: 'Billing is already fully paid' }, { status: 400 });
        }

        if (billing.status === 'cancelled') {
            return NextResponse.json({ error: 'Cannot pay a cancelled billing' }, { status: 400 });
        }

        const remainingAmount = billing.total_amount - billing.paid_amount;

        // Warn if overpaying, but allow it
        if (amount > remainingAmount) {
            console.warn(`Overpayment detected: ${amount} > ${remainingAmount}`);
        }

        // Create payment
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                billing_id: billingId,
                lease_id: billing.lease_id,
                company_id: billing.company_id,
                amount,
                payment_date,
                payment_month: billing.billing_month,
                payment_method: payment_method || 'cash',
                reference_number: reference_number || null,
                notes: notes || null,
                status: 'completed',
                recorded_by: user.id,
            })
            .select()
            .single();

        if (paymentError) throw paymentError;

        // Update billing
        const newPaidAmount = billing.paid_amount + amount;
        let newStatus = billing.status;

        if (newPaidAmount >= billing.total_amount) {
            newStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'partial';
        }

        const { error: updateError } = await supabase
            .from('billings')
            .update({
                paid_amount: newPaidAmount,
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
            })
            .eq('id', billingId);

        if (updateError) throw updateError;

        return NextResponse.json({
            data: payment,
            billing_status: newStatus,
            message: `Төлбөр бүртгэгдлээ (Үлдэгдэл: ₮${Math.max(0, billing.total_amount - newPaidAmount).toLocaleString()})`,
        }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to record payment';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
