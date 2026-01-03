import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/units/[id]/latest-reading - Өрөөний хамгийн сүүлийн тоолуурын утга авах
export async function GET(
    request: NextRequest,
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

    const { searchParams } = new URL(request.url);
    const feeTypeId = searchParams.get('fee_type_id');

    let query = supabase
        .from('meter_readings')
        .select('*')
        .eq('unit_id', id)
        .order('reading_date', { ascending: false })
        .limit(1);

    if (feeTypeId) {
        query = query.eq('fee_type_id', feeTypeId);
    }

    const { data, error } = await query.single();

    if (error) {
        // Return 0 if no reading found
        if (error.code === 'PGRST116') {
            return NextResponse.json({
                unit_id: id,
                fee_type_id: feeTypeId,
                current_reading: 0,
                reading_date: null,
            });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        unit_id: id,
        fee_type_id: data.fee_type_id,
        current_reading: data.current_reading,
        reading_date: data.reading_date,
    });
}
