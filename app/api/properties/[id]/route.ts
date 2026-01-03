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

    const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property });
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
        const { name, property_type, address, description, total_floors } = await req.json();

        const { data: property, error } = await supabase
            .from('properties')
            .update({
                name,
                property_type,
                address,
                description: description || null,
                total_floors: total_floors || 1,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ property });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Барилга шинэчлэхэд алдаа гарлаа';
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
        const { error } = await supabase
            .from('properties')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Барилга устгахад алдаа гарлаа';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
