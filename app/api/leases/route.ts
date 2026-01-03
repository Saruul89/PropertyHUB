import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/leases - Get all leases with filters
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
    const expiring = searchParams.get('expiring') === 'true';
    const sortBy = searchParams.get('sort') || 'start_date';
    const sortOrder = searchParams.get('order') || 'desc';

    let query = supabase
        .from('leases')
        .select(`
            *,
            tenant:tenants(*),
            unit:units(*, property:properties(*))
        `)
        .eq('company_id', companyUser.company_id);

    // Apply filters
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (propertyId) {
        query = query.eq('unit.property_id', propertyId);
    }

    // Filter for expiring leases (within 30 days)
    if (expiring) {
        const today = new Date();
        const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        query = query
            .eq('status', 'active')
            .not('end_date', 'is', null)
            .lte('end_date', thirtyDaysLater.toISOString().split('T')[0]);
    }

    // Apply sorting
    const validSortFields = ['start_date', 'end_date', 'monthly_rent', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'start_date';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

// POST /api/leases - Create a new lease
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Get company_id
        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        if (!companyUser) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Check if unit is available
        const { data: unit } = await supabase
            .from('units')
            .select('status')
            .eq('id', body.unit_id)
            .single();

        if (!unit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        }

        if (unit.status !== 'vacant') {
            return NextResponse.json(
                { error: 'Unit is not available' },
                { status: 400 }
            );
        }

        // Create lease
        const { data: lease, error: leaseError } = await supabase
            .from('leases')
            .insert({
                tenant_id: body.tenant_id,
                unit_id: body.unit_id,
                company_id: companyUser.company_id,
                start_date: body.start_date,
                end_date: body.end_date || null,
                monthly_rent: body.monthly_rent,
                deposit: body.deposit || 0,
                payment_due_day: body.payment_due_day || 1,
                status: body.status || 'active',
                terms: body.terms || {},
                notes: body.notes || null,
            })
            .select()
            .single();

        if (leaseError) throw leaseError;

        // Update unit status to occupied if lease is active
        if (body.status === 'active') {
            await supabase
                .from('units')
                .update({ status: 'occupied' })
                .eq('id', body.unit_id);
        }

        return NextResponse.json({ data: lease }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create lease';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
