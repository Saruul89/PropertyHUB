import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/maintenance/[id] - Get a single maintenance request
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
            *,
            unit:units(*, property:properties(*)),
            tenant:tenants(*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
}

// PUT /api/maintenance/[id] - Update a maintenance request
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        const updateData: Record<string, unknown> = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.scheduled_date !== undefined) updateData.scheduled_date = body.scheduled_date;
        if (body.vendor_name !== undefined) updateData.vendor_name = body.vendor_name;
        if (body.vendor_phone !== undefined) updateData.vendor_phone = body.vendor_phone;
        if (body.estimated_cost !== undefined) updateData.estimated_cost = body.estimated_cost;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const { data, error } = await supabase
            .from('maintenance_requests')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                unit:units(*, property:properties(*)),
                tenant:tenants(*)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update maintenance request';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/maintenance/[id] - Delete a maintenance request
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { error } = await supabase
            .from('maintenance_requests')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete maintenance request';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
