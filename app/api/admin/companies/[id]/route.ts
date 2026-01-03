import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper to check if user is system admin
async function isSystemAdmin(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: adminCheck } = await supabase
        .from('system_admins')
        .select('id')
        .eq('user_id', user.id)
        .single();

    return !!adminCheck;
}

// GET - Get single company details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: company, error } = await supabase
        .from('companies')
        .select('*, subscriptions(*)')
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get stats
    const [propertiesRes, unitsRes, tenantsRes] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact' }).eq('company_id', id),
        supabase.from('units').select('id, property_id').eq('property_id', id),
        supabase.from('tenants').select('id', { count: 'exact' }).eq('company_id', id),
    ]);

    return NextResponse.json({
        company,
        stats: {
            properties: propertiesRes.count || 0,
            units: unitsRes.count || 0,
            tenants: tenantsRes.count || 0,
        },
    });
}

// PATCH - Update company features or settings
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data });
}

// DELETE - Deactivate company (soft delete)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
