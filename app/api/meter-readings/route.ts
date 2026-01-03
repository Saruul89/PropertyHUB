import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/meter-readings - Тоолуурын түүх авах
export async function GET(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company_id from company_users
    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    if (!companyUser) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');
    const unitId = searchParams.get('unit_id');
    const feeTypeId = searchParams.get('fee_type_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
        .from('meter_readings')
        .select(`
            *,
            fee_types(*),
            units!inner(*, properties!inner(*))
        `, { count: 'exact' })
        .eq('units.properties.company_id', companyUser.company_id)
        .order('reading_date', { ascending: false })
        .range(offset, offset + limit - 1);

    if (propertyId) {
        query = query.eq('units.property_id', propertyId);
    }
    if (unitId) {
        query = query.eq('unit_id', unitId);
    }
    if (feeTypeId) {
        query = query.eq('fee_type_id', feeTypeId);
    }
    if (startDate) {
        query = query.gte('reading_date', startDate);
    }
    if (endDate) {
        query = query.lte('reading_date', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        data,
        total: count,
        limit,
        offset,
    });
}

// POST /api/meter-readings - Тоолуурын уншилт бүртгэх
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
        unit_id,
        fee_type_id,
        reading_date,
        previous_reading,
        current_reading,
        unit_price,
        notes,
    } = body;

    if (!unit_id || !fee_type_id || !reading_date || current_reading === undefined) {
        return NextResponse.json(
            { error: 'unit_id, fee_type_id, reading_date, and current_reading are required' },
            { status: 400 }
        );
    }

    // Validate current_reading >= previous_reading
    if (current_reading < previous_reading) {
        return NextResponse.json(
            { error: 'current_reading must be greater than or equal to previous_reading' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('meter_readings')
        .insert({
            unit_id,
            fee_type_id,
            reading_date,
            previous_reading: previous_reading ?? 0,
            current_reading,
            unit_price: unit_price ?? 0,
            notes,
            recorded_by: user.id,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
