import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
    requireAdminRole,
    createErrorResponse,
    getClientIP,
    getUserAgent,
} from '@/lib/admin/require-admin';
import { logCompanyAction } from '@/lib/admin/audit-log';

// Rate limiting: Track deletions per admin
const deletionTracker = new Map<string, { count: number; resetAt: number }>();
const MAX_DELETIONS_PER_HOUR = 10;

function checkRateLimit(adminId: string): boolean {
    const now = Date.now();
    const tracker = deletionTracker.get(adminId);

    if (!tracker || tracker.resetAt < now) {
        deletionTracker.set(adminId, {
            count: 1,
            resetAt: now + 60 * 60 * 1000, // 1 hour
        });
        return true;
    }

    if (tracker.count >= MAX_DELETIONS_PER_HOUR) {
        return false;
    }

    tracker.count++;
    return true;
}

// POST - Delete company permanently (requires confirmation)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { admin, supabase } = await requireAdminRole('super', req);
        const { id } = await params;

        const body = await req.json();

        // Validate confirmation
        if (!body.confirmName) {
            return NextResponse.json(
                { success: false, error: 'Company name confirmation is required' },
                { status: 400 }
            );
        }

        if (!body.reason) {
            return NextResponse.json(
                { success: false, error: 'Deletion reason is required' },
                { status: 400 }
            );
        }

        // Check rate limit
        if (!checkRateLimit(admin.id)) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Maximum 10 deletions per hour.' },
                { status: 429 }
            );
        }

        // Get company data
        const { data: company, error: fetchError } = await supabase
            .from('companies')
            .select(`
                id, name, email, company_type, is_active, created_at,
                subscriptions (plan, status)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !company) {
            return NextResponse.json(
                { success: false, error: 'Company not found' },
                { status: 404 }
            );
        }

        // Verify confirmation name matches
        if (body.confirmName !== company.name) {
            return NextResponse.json(
                { success: false, error: 'Company name does not match' },
                { status: 400 }
            );
        }

        // Get stats for audit log
        const [propertiesRes, unitsRes, tenantsRes, usersRes] = await Promise.all([
            supabase.from('properties').select('id', { count: 'exact', head: true }).eq('company_id', id),
            supabase.from('units').select('id', { count: 'exact', head: true })
                .in('property_id',
                    (await supabase.from('properties').select('id').eq('company_id', id)).data?.map(p => p.id) || []
                ),
            supabase.from('tenants').select('id, user_id', { count: 'exact' }).eq('company_id', id),
            supabase.from('company_users').select('id, user_id').eq('company_id', id),
        ]);

        const deletionSummary = {
            companyName: company.name,
            companyEmail: company.email,
            companyType: company.company_type,
            createdAt: company.created_at,
            subscription: company.subscriptions,
            stats: {
                properties: propertiesRes.count || 0,
                units: unitsRes.count || 0,
                tenants: tenantsRes.count || 0,
                users: usersRes.data?.length || 0,
            },
        };

        // Create admin client for cascade deletion and auth user cleanup
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Collect user IDs to delete from auth
        const userIdsToDelete: string[] = [];

        // Tenant user IDs
        if (tenantsRes.data) {
            tenantsRes.data.forEach(t => {
                if (t.user_id) userIdsToDelete.push(t.user_id);
            });
        }

        // Company user IDs
        if (usersRes.data) {
            usersRes.data.forEach(u => {
                if (u.user_id) userIdsToDelete.push(u.user_id);
            });
        }

        // Use cascade delete function
        const { error: deleteError } = await supabaseAdmin.rpc('delete_company_cascade', {
            p_company_id: id,
        });

        if (deleteError) {
            console.error('Error deleting company:', deleteError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete company: ' + deleteError.message },
                { status: 500 }
            );
        }

        // Delete auth users
        for (const userId of userIdsToDelete) {
            try {
                await supabaseAdmin.auth.admin.deleteUser(userId);
            } catch (err) {
                console.error('Error deleting auth user:', userId, err);
                // Continue with other deletions
            }
        }

        // Log action (using the admin supabase client since RLS may block)
        await logCompanyAction(admin, 'company_delete', id, company.name, {
            oldValue: deletionSummary,
            notes: body.reason,
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
        });

        return NextResponse.json({
            success: true,
            message: 'Company deleted permanently',
            deletedData: deletionSummary,
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
