import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/maintenance - Get all maintenance requests
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
    const priority = searchParams.get('priority');
    const propertyId = searchParams.get('property_id');

    let query = supabase
        .from('maintenance_requests')
        .select(`
            *,
            unit:units(*, property:properties(*)),
            tenant:tenants(*)
        `)
        .eq('company_id', companyUser.company_id)
        .order('created_at', { ascending: false });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }
    if (priority) {
        query = query.eq('priority', priority);
    }
    if (propertyId) {
        query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

// POST /api/maintenance - Create a maintenance request
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

        const { data, error } = await supabase
            .from('maintenance_requests')
            .insert({
                unit_id: body.unit_id || null,
                property_id: body.property_id,
                company_id: companyUser.company_id,
                requested_by: user.id,
                tenant_id: body.tenant_id || null,
                title: body.title,
                description: body.description || null,
                priority: body.priority || 'normal',
                category: body.category || null,
                scheduled_date: body.scheduled_date || null,
                vendor_name: body.vendor_name || null,
                vendor_phone: body.vendor_phone || null,
                estimated_cost: body.estimated_cost || null,
                status: 'pending',
            })
            .select(`
                *,
                unit:units(*, property:properties(*)),
                tenant:tenants(*)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create maintenance request';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
