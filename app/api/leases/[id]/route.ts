import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/leases/[id] - Get a single lease
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: leaseId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('leases')
        .select(`
            *,
            tenant:tenants(*),
            unit:units(*, property:properties(*))
        `)
        .eq('id', leaseId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
}

// PUT /api/leases/[id] - Update a lease
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: leaseId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        const updateData: Record<string, unknown> = {};

        if (body.tenant_id !== undefined) updateData.tenant_id = body.tenant_id;
        if (body.unit_id !== undefined) updateData.unit_id = body.unit_id;
        if (body.start_date !== undefined) updateData.start_date = body.start_date;
        if (body.end_date !== undefined) updateData.end_date = body.end_date;
        if (body.monthly_rent !== undefined) updateData.monthly_rent = body.monthly_rent;
        if (body.deposit !== undefined) updateData.deposit = body.deposit;
        if (body.payment_due_day !== undefined) updateData.payment_due_day = body.payment_due_day;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.terms !== undefined) updateData.terms = body.terms;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const { data, error } = await supabase
            .from('leases')
            .update(updateData)
            .eq('id', leaseId)
            .select(`
                *,
                tenant:tenants(*),
                unit:units(*, property:properties(*))
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update lease';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/leases/[id] - Delete a lease
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: leaseId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get lease to check unit
        const { data: lease } = await supabase
            .from('leases')
            .select('unit_id, status')
            .eq('id', leaseId)
            .single();

        if (!lease) {
            return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
        }

        // Delete lease
        const { error } = await supabase.from('leases').delete().eq('id', leaseId);

        if (error) throw error;

        // Update unit status to vacant if lease was active
        if (lease.status === 'active') {
            await supabase
                .from('units')
                .update({ status: 'vacant' })
                .eq('id', lease.unit_id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete lease';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
