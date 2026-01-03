import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/meter-readings/bulk - Тоолуурын уншилт бөөнөөр бүртгэх
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { property_id, fee_type_id, reading_date, readings } = body;

    if (!property_id || !fee_type_id || !reading_date || !Array.isArray(readings)) {
        return NextResponse.json(
            { error: 'property_id, fee_type_id, reading_date, and readings are required' },
            { status: 400 }
        );
    }

    // Get fee type for unit_price
    const { data: feeType } = await supabase
        .from('fee_types')
        .select('default_unit_price')
        .eq('id', fee_type_id)
        .single();

    const defaultUnitPrice = feeType?.default_unit_price ?? 0;

    // Get all unit IDs
    const unitIds = readings.map((r: { unit_id: string }) => r.unit_id);

    // Batch fetch last readings for all units
    const { data: lastReadings } = await supabase
        .from('meter_readings')
        .select('unit_id, current_reading')
        .in('unit_id', unitIds)
        .eq('fee_type_id', fee_type_id)
        .order('reading_date', { ascending: false });

    // Create a map of unit_id to last reading
    const lastReadingMap = new Map<string, number>();
    lastReadings?.forEach((reading) => {
        if (!lastReadingMap.has(reading.unit_id)) {
            lastReadingMap.set(reading.unit_id, reading.current_reading);
        }
    });

    // Get unit-specific pricing if available
    const { data: unitFees } = await supabase
        .from('unit_fees')
        .select('unit_id, custom_unit_price')
        .in('unit_id', unitIds)
        .eq('fee_type_id', fee_type_id)
        .eq('is_active', true);

    const unitFeeMap = new Map<string, number>();
    unitFees?.forEach((uf) => {
        if (uf.custom_unit_price) {
            unitFeeMap.set(uf.unit_id, uf.custom_unit_price);
        }
    });

    // Prepare insert data
    const insertData = readings
        .filter((r: { unit_id: string; current_reading: number }) => {
            const previousReading = lastReadingMap.get(r.unit_id) ?? 0;
            return r.current_reading > previousReading;
        })
        .map((r: { unit_id: string; current_reading: number }) => {
            const previousReading = lastReadingMap.get(r.unit_id) ?? 0;
            const unitPrice = unitFeeMap.get(r.unit_id) ?? defaultUnitPrice;

            return {
                unit_id: r.unit_id,
                fee_type_id,
                reading_date,
                previous_reading: previousReading,
                current_reading: r.current_reading,
                unit_price: unitPrice,
                recorded_by: user.id,
            };
        });

    if (insertData.length === 0) {
        return NextResponse.json(
            { error: 'No valid readings to insert' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('meter_readings')
        .insert(insertData)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        inserted: data.length,
        data,
    }, { status: 201 });
}
