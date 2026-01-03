import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/billings - Get all billings with filters
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company_id
    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    if (!companyUser) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const propertyId = searchParams.get('property_id');
    const billingMonth = searchParams.get('billing_month');
    const tenantId = searchParams.get('tenant_id');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sort') || 'billing_month';
    const sortOrder = searchParams.get('order') || 'desc';

    let query = supabase
        .from('billings')
        .select(`
            *,
            tenant:tenants(*),
            unit:units(*, property:properties(name))
        `, { count: 'exact' })
        .eq('company_id', companyUser.company_id);

    // Apply filters
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (propertyId) {
        query = query.eq('unit.property_id', propertyId);
    }

    if (billingMonth) {
        query = query.eq('billing_month', `${billingMonth}-01`);
    }

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    // Apply sorting
    const validSortFields = ['billing_month', 'due_date', 'total_amount', 'created_at', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'billing_month';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count, page, limit });
}
