import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/tenant/billings/[id] - Get billing details for tenant
export async function GET(req: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const { id } = await params;

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

    const { data: billing, error } = await supabase
        .from('billings')
        .select(`
            *,
            billing_items(*),
            unit:units(unit_number, property:properties(name, address))
        `)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!billing) {
        return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
    }

    return NextResponse.json({ data: billing });
}
