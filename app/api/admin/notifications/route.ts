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

// GET - List all notifications
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');
    const type = searchParams.get('type');
    const companyId = searchParams.get('company_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
        .from('notifications')
        .select('*, companies(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (channel && channel !== 'all') {
        query = query.eq('channel', channel);
    }

    if (type && type !== 'all') {
        query = query.eq('type', type);
    }

    if (companyId) {
        query = query.eq('company_id', companyId);
    }

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const allNotifications = await supabase
        .from('notifications')
        .select('status, channel');

    const stats = {
        total: allNotifications.data?.length || 0,
        pending: allNotifications.data?.filter(n => n.status === 'pending').length || 0,
        sent: allNotifications.data?.filter(n => n.status === 'sent').length || 0,
        read: allNotifications.data?.filter(n => n.status === 'read').length || 0,
        failed: allNotifications.data?.filter(n => n.status === 'failed').length || 0,
        byChannel: {
            email: allNotifications.data?.filter(n => n.channel === 'email').length || 0,
            sms: allNotifications.data?.filter(n => n.channel === 'sms').length || 0,
            in_app: allNotifications.data?.filter(n => n.channel === 'in_app').length || 0,
        },
    };

    return NextResponse.json({ notifications: data, total: count, stats });
}

// POST - Send new notification (admin broadcast)
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, recipient_type, recipient_ids, type, title, message, channel } = await req.json();

    if (!company_id || !recipient_ids?.length || !type || !title || !message || !channel) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notifications = recipient_ids.map((recipientId: string) => ({
        company_id,
        recipient_type: recipient_type || 'tenant',
        recipient_id: recipientId,
        type,
        title,
        message,
        channel,
        status: 'pending',
    }));

    const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark in_app notifications as sent immediately
    if (channel === 'in_app') {
        const ids = data.map((n: { id: string }) => n.id);
        await supabase
            .from('notifications')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .in('id', ids);
    }

    return NextResponse.json({ success: true, count: data.length });
}

// PATCH - Retry failed notifications
export async function PATCH(req: NextRequest) {
    const supabase = await createClient();

    if (!(await isSystemAdmin(supabase))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notification_ids } = await req.json();

    if (!notification_ids?.length) {
        return NextResponse.json({ error: 'Notification IDs are required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('notifications')
        .update({ status: 'pending', error_message: null })
        .in('id', notification_ids);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
