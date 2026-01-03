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

// GET - List all subscriptions
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const plan = searchParams.get('plan');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
        .from('subscriptions')
        .select('*, companies(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (plan && plan !== 'all') {
        query = query.eq('plan', plan);
    }

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const allSubscriptions = await supabase
        .from('subscriptions')
        .select('plan, status, price_per_month');

    const stats = {
        total: allSubscriptions.data?.length || 0,
        active: allSubscriptions.data?.filter(s => s.status === 'active').length || 0,
        monthlyRevenue: allSubscriptions.data
            ?.filter(s => s.status === 'active')
            .reduce((sum, s) => sum + (s.price_per_month || 0), 0) || 0,
        byPlan: {
            free: allSubscriptions.data?.filter(s => s.plan === 'free').length || 0,
            basic: allSubscriptions.data?.filter(s => s.plan === 'basic').length || 0,
            standard: allSubscriptions.data?.filter(s => s.plan === 'standard').length || 0,
            premium: allSubscriptions.data?.filter(s => s.plan === 'premium').length || 0,
        },
    };

    return NextResponse.json({ subscriptions: data, total: count, stats });
}

// PUT - Update subscription
export async function PUT(req: NextRequest) {
    const supabase = await createClient();

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, plan, price_per_month, max_properties, max_units, status } = await req.json();

    if (!id) {
        return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (plan !== undefined) updates.plan = plan;
    if (price_per_month !== undefined) updates.price_per_month = price_per_month;
    if (max_properties !== undefined) updates.max_properties = max_properties;
    if (max_units !== undefined) updates.max_units = max_units;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscription: data });
}
