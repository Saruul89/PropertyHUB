import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: unit, error } = await supabase
        .from('units')
        .select('*, properties(*)')
        .eq('id', id)
        .single();

    if (error || !unit) {
        return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    // Идэвхтэй гэрээ болон оршин суугчийн мэдээлэл авах
    const { data: lease } = await supabase
        .from('leases')
        .select('*, tenants(*)')
        .eq('unit_id', id)
        .eq('status', 'active')
        .single();

    return NextResponse.json({ unit, lease });
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
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
            .update({
                unit_number,
                floor: floor || null,
                area_sqm: area_sqm || null,
                rooms: rooms || null,
                monthly_rent: monthly_rent || 0,
                notes: notes || null,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ unit });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Өрөө шинэчлэхэд алдаа гарлаа';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Идэвхтэй гэрээ байгаа эсэхийг шалгах
        const { data: activeLease } = await supabase
            .from('leases')
            .select('id')
            .eq('unit_id', id)
            .eq('status', 'active')
            .single();

        if (activeLease) {
            return NextResponse.json(
                { error: 'Идэвхтэй гэрээтэй өрөөг устгах боломжгүй' },
                { status: 400 }
            );
        }

        const { error } = await supabase.from('units').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Өрөө устгахад алдаа гарлаа';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
