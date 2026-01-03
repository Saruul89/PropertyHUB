import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/fee-types - Төлбөрийн төрлийн жагсаалт авах
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
    const activeOnly = searchParams.get('active_only') !== 'false';
    const calculationType = searchParams.get('calculation_type');

    let query = supabase
        .from('fee_types')
        .select('*')
        .eq('company_id', companyUser.company_id)
        .order('display_order');

    if (activeOnly) {
        query = query.eq('is_active', true);
    }

    if (calculationType) {
        query = query.eq('calculation_type', calculationType);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST /api/fee-types - Төлбөрийн төрөл шинээр үүсгэх
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, calculation_type, unit_label, default_amount, default_unit_price, display_order } = body;

    if (!name || !calculation_type) {
        return NextResponse.json(
            { error: 'name and calculation_type are required' },
            { status: 400 }
        );
    }

    // Get max display_order
    const { data: maxOrderData } = await supabase
        .from('fee_types')
        .select('display_order')
        .eq('company_id', companyUser.company_id)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

    const newDisplayOrder = display_order ?? (maxOrderData?.display_order ?? 0) + 1;

    const { data, error } = await supabase
        .from('fee_types')
        .insert({
            company_id: companyUser.company_id,
            name,
            calculation_type,
            unit_label,
            default_amount: default_amount ?? 0,
            default_unit_price,
            display_order: newDisplayOrder,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
