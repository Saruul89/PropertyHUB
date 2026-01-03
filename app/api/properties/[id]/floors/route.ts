import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/properties/[id]/floors - Get all floors for a property
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get floors with units
    const { data: floors, error } = await supabase
        .from('floors')
        .select(`
            *,
            units:units(*)
        `)
        .eq('property_id', propertyId)
        .order('floor_number', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: floors });
}

// POST /api/properties/[id]/floors - Create a new floor
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Verify property exists and user has access
        const { data: property, error: propertyError } = await supabase
            .from('properties')
            .select('company_id')
            .eq('id', propertyId)
            .single();

        if (propertyError || !property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        // Create floor
        const { data, error } = await supabase
            .from('floors')
            .insert({
                property_id: propertyId,
                floor_number: body.floor_number,
                name: body.name || `${body.floor_number}F`,
                plan_width: body.plan_width || 800,
                plan_height: body.plan_height || 600,
                plan_image_url: body.plan_image_url || null,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create floor';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
