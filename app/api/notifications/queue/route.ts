/**
 * GET /api/notifications/queue - Дарааллын байдал авах
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
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

        // Get queue statistics
        const { data: stats } = await supabase
            .from('notifications_queue')
            .select('status')
            .eq('company_id', companyUser.company_id);

        const statusCounts = {
            pending: 0,
            sent: 0,
            failed: 0,
            skipped: 0,
        };

        for (const item of stats || []) {
            if (item.status in statusCounts) {
                statusCounts[item.status as keyof typeof statusCounts]++;
            }
        }

        // Get pending items
        const { data: pendingItems } = await supabase
            .from('notifications_queue')
            .select(`
                id,
                notification_type,
                channel,
                scheduled_at,
                attempts,
                tenants:recipient_id(name)
            `)
            .eq('company_id', companyUser.company_id)
            .eq('status', 'pending')
            .order('scheduled_at', { ascending: true })
            .limit(20);

        // Get recent failures
        const { data: recentFailures } = await supabase
            .from('notifications_queue')
            .select(`
                id,
                notification_type,
                channel,
                last_error,
                attempts,
                tenants:recipient_id(name)
            `)
            .eq('company_id', companyUser.company_id)
            .eq('status', 'failed')
            .order('created_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            stats: statusCounts,
            pending: pendingItems || [],
            recentFailures: recentFailures || [],
        });
    } catch (error) {
        console.error('Queue status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
