import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/meter-submissions - Менежмент компани: Бүх илгээлтийн жагсаалт
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
        .from('tenant_meter_submissions')
        .select(`
            *,
            fee_types(*),
            units(*, properties(name, company_id)),
            tenants(*)
        `, { count: 'exact' })
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by company_id
    let filteredData = data?.filter((s) => {
        const property = (s.units as Record<string, unknown>)?.properties as Record<string, unknown>;
        return property?.company_id === companyUser.company_id;
    }) ?? [];

    // Filter by status if provided
    if (status) {
        filteredData = filteredData.filter((s) => s.status === status);
    }

    return NextResponse.json({
        data: filteredData,
        total: filteredData.length,
        limit,
        offset,
    });
}
