import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/fee-types/[id] - Төлбөрийн төрөл шинэчлэх
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

    // Verify the fee_type belongs to the company
    const { data: existingFeeType } = await supabase
        .from('fee_types')
        .select('id')
        .eq('id', id)
        .eq('company_id', companyUser.company_id)
        .single();

    if (!existingFeeType) {
        return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, calculation_type, unit_label, default_amount, default_unit_price, is_active } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (calculation_type !== undefined) updateData.calculation_type = calculation_type;
    if (unit_label !== undefined) updateData.unit_label = unit_label;
    if (default_amount !== undefined) updateData.default_amount = default_amount;
    if (default_unit_price !== undefined) updateData.default_unit_price = default_unit_price;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
        .from('fee_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE /api/fee-types/[id] - Төлбөрийн төрөл устгах (идэвхгүй болгох)
export async function DELETE(
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

    // Soft delete by setting is_active to false
    const { error } = await supabase
        .from('fee_types')
        .update({ is_active: false })
        .eq('id', id)
        .eq('company_id', companyUser.company_id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
