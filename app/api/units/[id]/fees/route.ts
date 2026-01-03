import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/units/[id]/fees - Өрөөний төлбөрийн тохиргоо авах
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

    // Get company_id from company_users
    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    if (!companyUser) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify unit belongs to company
    const { data: unit } = await supabase
        .from('units')
        .select('id, properties!inner(company_id)')
        .eq('id', id)
        .single();

    if (!unit) {
        return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    const properties = unit.properties as unknown as { company_id: string };
    const unitCompanyId = properties?.company_id;
    if (unitCompanyId !== companyUser.company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all fee types for the company
    const { data: feeTypes } = await supabase
        .from('fee_types')
        .select('*')
        .eq('company_id', companyUser.company_id)
        .eq('is_active', true)
        .order('display_order');

    // Get unit-specific fee settings
    const { data: unitFees } = await supabase
        .from('unit_fees')
        .select('*')
        .eq('unit_id', id);

    // Create a map of fee_type_id to unit_fee
    const unitFeeMap = new Map(
        unitFees?.map((uf) => [uf.fee_type_id, uf]) ?? []
    );

    // Combine fee types with unit-specific settings
    const combinedFees = feeTypes?.map((feeType) => ({
        fee_type: feeType,
        unit_fee: unitFeeMap.get(feeType.id) ?? null,
    })) ?? [];

    return NextResponse.json({
        unit_id: id,
        fees: combinedFees,
    });
}

// PUT /api/units/[id]/fees - Өрөөний төлбөрийн тохиргоо шинэчлэх
export async function PUT(
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

    // Get company_id from company_users
    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    if (!companyUser) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify unit belongs to company
    const { data: unit } = await supabase
        .from('units')
        .select('id, properties!inner(company_id)')
        .eq('id', id)
        .single();

    if (!unit) {
        return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    const propertiesData = unit.properties as unknown as { company_id: string };
    const unitCompanyId = propertiesData?.company_id;
    if (unitCompanyId !== companyUser.company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { fees } = body; // Array of { fee_type_id, custom_amount?, custom_unit_price?, is_active? }

    if (!Array.isArray(fees)) {
        return NextResponse.json(
            { error: 'fees must be an array' },
            { status: 400 }
        );
    }

    // Process each fee update
    const results = [];
    for (const fee of fees) {
        const { fee_type_id, custom_amount, custom_unit_price, is_active } = fee;

        if (!fee_type_id) continue;

        // Check if unit_fee already exists
        const { data: existingUnitFee } = await supabase
            .from('unit_fees')
            .select('id')
            .eq('unit_id', id)
            .eq('fee_type_id', fee_type_id)
            .single();

        if (existingUnitFee) {
            // Update existing
            const { data, error } = await supabase
                .from('unit_fees')
                .update({
                    custom_amount,
                    custom_unit_price,
                    is_active: is_active ?? true,
                })
                .eq('id', existingUnitFee.id)
                .select()
                .single();

            if (!error) results.push(data);
        } else {
            // Insert new
            const { data, error } = await supabase
                .from('unit_fees')
                .insert({
                    unit_id: id,
                    fee_type_id,
                    custom_amount,
                    custom_unit_price,
                    is_active: is_active ?? true,
                })
                .select()
                .single();

            if (!error) results.push(data);
        }
    }

    return NextResponse.json({
        success: true,
        updated: results.length,
        data: results,
    });
}
