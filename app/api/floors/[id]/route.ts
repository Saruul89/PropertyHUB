import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/floors/[id] - Get a single floor
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: floorId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('floors')
        .select(`
            *,
            units:units(*)
        `)
        .eq('id', floorId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
}

// PUT /api/floors/[id] - Update a floor
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: floorId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        const updateData: Record<string, unknown> = {};
        if (body.floor_number !== undefined) updateData.floor_number = body.floor_number;
        if (body.name !== undefined) updateData.name = body.name;
        if (body.plan_width !== undefined) updateData.plan_width = body.plan_width;
        if (body.plan_height !== undefined) updateData.plan_height = body.plan_height;
        if (body.plan_image_url !== undefined) updateData.plan_image_url = body.plan_image_url;

        const { data, error } = await supabase
            .from('floors')
            .update(updateData)
            .eq('id', floorId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update floor';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/floors/[id] - Delete a floor
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: floorId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Delete associated units first
        await supabase.from('units').delete().eq('floor_id', floorId);

        // Delete floor
        const { error } = await supabase.from('floors').delete().eq('id', floorId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete floor';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
