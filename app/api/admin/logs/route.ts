import { NextRequest, NextResponse } from 'next/server';
import {
    requireAdminRole,
    createErrorResponse,
} from '@/lib/admin/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - Get audit logs with filters
export async function GET(req: NextRequest) {
    try {
        // Нэвтрэлт шалгах
        await requireAdminRole('support', req);

        // Өгөгдөл авахдаа service role client ашиглана (RLS алгасах)
        const supabase = createAdminClient();

        const searchParams = req.nextUrl.searchParams;
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const adminId = searchParams.get('admin_id');
        const action = searchParams.get('action');
        const targetType = searchParams.get('target_type');
        const targetId = searchParams.get('target_id');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('admin_audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate + 'T23:59:59.999Z');
        }

        if (adminId) {
            query = query.eq('admin_id', adminId);
        }

        if (action) {
            query = query.eq('action', action);
        }

        if (targetType) {
            query = query.eq('target_type', targetType);
        }

        if (targetId) {
            query = query.eq('target_id', targetId);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching audit logs:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch audit logs' },
                { status: 500 }
            );
        }

        // Get unique admin IDs for reference
        const adminIds = [...new Set(data?.map(log => log.admin_id).filter(Boolean))];

        let admins: Record<string, { name: string; email: string }> = {};
        if (adminIds.length > 0) {
            const { data: adminsData } = await supabase
                .from('system_admins')
                .select('id, name, email')
                .in('id', adminIds);

            if (adminsData) {
                admins = adminsData.reduce((acc, admin) => {
                    acc[admin.id] = { name: admin.name, email: admin.email };
                    return acc;
                }, {} as Record<string, { name: string; email: string }>);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                logs: data,
                admins,
                total: count,
                limit,
                offset,
            },
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
