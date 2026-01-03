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

// GET - List all companies
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
        .from('companies')
        .select('*, subscriptions(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (type && type !== 'all') {
        query = query.eq('company_type', type);
    }

    if (active !== null && active !== 'all') {
        query = query.eq('is_active', active === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ companies: data, total: count });
}

// PUT - Update company
export async function PUT(req: NextRequest) {
    const supabase = await createClient();

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updates } = await req.json();

    if (!id) {
        return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

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
