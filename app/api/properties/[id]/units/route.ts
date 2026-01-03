import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: units, error } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', propertyId)
        .order('unit_number');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ units });
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { unit_number, floor, area_sqm, rooms, monthly_rent, notes } = await req.json();

        const { data: unit, error } = await supabase
            .from('units')
            .insert({
                property_id: propertyId,
                unit_number,
                floor: floor || null,
                area_sqm: area_sqm || null,
                rooms: rooms || null,
                monthly_rent: monthly_rent || 0,
                notes: notes || null,
                status: 'vacant',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ unit }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Өрөө үүсгэхэд алдаа гарлаа';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
