/**
 * GET /api/notifications/history - Мэдэгдлийн түүх авах
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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const channel = searchParams.get('channel');
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        const offset = (page - 1) * limit;

        // Query notifications_queue without JOIN (no FK relationship)
        let query = supabase
            .from('notifications_queue')
            .select('*', { count: 'exact' })
            .eq('company_id', companyUser.company_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (channel) {
            query = query.eq('channel', channel);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (type) {
            query = query.eq('notification_type', type);
        }

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data: notifications, error, count } = await query;

        if (error) {
            console.error('Failed to fetch notification history:', error);
            return NextResponse.json(
                { error: 'Failed to fetch notification history' },
                { status: 500 }
            );
        }

        // Fetch tenant info separately for tenant recipients
        const tenantIds = [...new Set(
            (notifications || [])
                .filter(n => n.recipient_type === 'tenant')
                .map(n => n.recipient_id)
        )];

        let tenantsMap: Record<string, { id: string; name: string; email?: string; phone: string }> = {};

        if (tenantIds.length > 0) {
            const { data: tenants } = await supabase
                .from('tenants')
                .select('id, name, email, phone')
                .in('id', tenantIds);

            if (tenants) {
                tenantsMap = tenants.reduce((acc, t) => {
                    acc[t.id] = t;
                    return acc;
                }, {} as typeof tenantsMap);
            }
        }

        // Combine data
        const data = (notifications || []).map(n => ({
            ...n,
            tenants: n.recipient_type === 'tenant' ? tenantsMap[n.recipient_id] || null : null,
        }));

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Notification history error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
