import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/units/[id]/position - Update unit position and size
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: unitId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Validate input
        if (
            typeof body.position_x !== 'number' ||
            typeof body.position_y !== 'number' ||
            typeof body.width !== 'number' ||
            typeof body.height !== 'number'
        ) {
            return NextResponse.json(
                { error: 'Invalid input: position_x, position_y, width, and height are required numbers' },
                { status: 400 }
            );
        }

        // Validate minimum values
        if (body.position_x < 0 || body.position_y < 0) {
            return NextResponse.json(
                { error: 'Position values must be non-negative' },
                { status: 400 }
            );
        }

        if (body.width < 20 || body.height < 20) {
            return NextResponse.json(
                { error: 'Width and height must be at least 20px' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('units')
            .update({
                position_x: body.position_x,
                position_y: body.position_y,
                width: body.width,
                height: body.height,
            })
            .eq('id', unitId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update unit position';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
