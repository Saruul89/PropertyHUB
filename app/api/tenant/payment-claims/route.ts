import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tenant/payment-claims - Tenant submits payment claim
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, company_id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { billing_id, amount, notes } = body;

    if (!billing_id || !amount) {
        return NextResponse.json(
            { error: 'billing_id and amount are required' },
            { status: 400 }
        );
    }

    // Get the billing to verify ownership and get details
    const { data: billing, error: billingError } = await supabase
        .from('billings')
        .select('id, company_id, lease_id, billing_month, total_amount, paid_amount, tenant_id')
        .eq('id', billing_id)
        .single();

    if (billingError || !billing) {
        return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
    }

    // Verify the billing belongs to this tenant
    if (billing.tenant_id !== tenant.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create a pending payment record
    const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
            billing_id: billing.id,
            lease_id: billing.lease_id,
            company_id: billing.company_id,
            amount,
            payment_date: new Date().toISOString().split('T')[0],
            payment_month: billing.billing_month,
            payment_method: 'bank_transfer',
            status: 'pending',
            notes: notes || 'Түрээслэгчээс төлбөр төлсөн гэж мэдэгдсэн',
        })
        .select()
        .single();

    if (paymentError) {
        return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    // Create in-app notification for company users
    await supabase.from('notifications').insert({
        company_id: tenant.company_id,
        recipient_type: 'company_user',
        recipient_id: tenant.company_id,
        type: 'billing',
        title: 'Төлбөр баталгаажуулах хүсэлт',
        message: `${tenant.name} ₮${amount.toLocaleString()} төлсөн гэж мэдэгдлээ. Баталгаажуулна уу.`,
        channel: 'in_app',
        status: 'sent',
        related_type: 'payment_claim',
        related_id: billing.id,
    });

    return NextResponse.json(payment, { status: 201 });
}
