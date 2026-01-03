import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tenant/billings - Get billings for the logged-in tenant
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
        .from('billings')
        .select(`
            *,
            billing_items(*),
            unit:units(unit_number, property:properties(name))
        `, { count: 'exact' })
        .eq('tenant_id', tenant.id);

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    query = query
        .order('billing_month', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count, page, limit });
}
