import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/billings/[id] - Get billing details
export async function GET(req: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: billing, error } = await supabase
        .from('billings')
        .select(`
            *,
            tenant:tenants(*),
            unit:units(*, property:properties(*)),
            billing_items(*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!billing) {
        return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
    }

    return NextResponse.json({ data: billing });
}

// PUT /api/billings/[id] - Update billing
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Get existing billing
        const { data: existingBilling } = await supabase
            .from('billings')
            .select('*')
            .eq('id', id)
            .single();

        if (!existingBilling) {
            return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
        }

        // Only allow updating certain fields
        const updateData: Record<string, unknown> = {};
        if (body.issue_date) updateData.issue_date = body.issue_date;
        if (body.due_date) updateData.due_date = body.due_date;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.status) updateData.status = body.status;

        const { data: billing, error } = await supabase
            .from('billings')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data: billing });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update billing';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/billings/[id] - Cancel billing (soft delete)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get existing billing
        const { data: existingBilling } = await supabase
            .from('billings')
            .select('*')
            .eq('id', id)
            .single();

        if (!existingBilling) {
            return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
        }

        // Only allow cancelling unpaid or partially paid billings
        if (existingBilling.status === 'paid') {
            return NextResponse.json(
                { error: 'Cannot cancel a fully paid billing' },
                { status: 400 }
            );
        }

        // Soft delete - set status to cancelled
        const { data: billing, error } = await supabase
            .from('billings')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data: billing, message: 'Нэхэмжлэх цуцлагдлаа' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to cancel billing';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
