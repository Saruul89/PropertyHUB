import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
    requireAdminRole,
    createErrorResponse,
    getClientIP,
    getUserAgent,
} from '@/lib/admin/require-admin';
import { logAdminUserAction } from '@/lib/admin/audit-log';
import { AdminCreateInput } from '@/types/admin';

// GET - List all system admins
export async function GET(req: NextRequest) {
    try {
        const { admin, supabase } = await requireAdminRole('support', req);

        const { data, error } = await supabase
            .from('system_admins')
            .select('id, user_id, role, is_active, name, email, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admins:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch admins' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return createErrorResponse(error);
    }
}

// POST - Create new system admin (super only)
export async function POST(req: NextRequest) {
    try {
        const { admin, supabase } = await requireAdminRole('super', req);

        const body: AdminCreateInput = await req.json();

        // Validate input
        if (!body.email || !body.name || !body.password || !body.role) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate role
        if (!['super', 'admin', 'support'].includes(body.role)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Create Supabase admin client for user creation
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
        });

        if (authError) {
            console.error('Error creating auth user:', authError);
            return NextResponse.json(
                { success: false, error: authError.message },
                { status: 400 }
            );
        }

        // Create system_admins record
        const { data: newAdmin, error: adminError } = await supabaseAdmin
            .from('system_admins')
            .insert({
                user_id: authData.user.id,
                role: body.role,
                is_active: true,
                name: body.name,
                email: body.email,
            })
            .select()
            .single();

        if (adminError) {
            // Rollback: delete auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

            console.error('Error creating admin record:', adminError);
            return NextResponse.json(
                { success: false, error: 'Failed to create admin record' },
                { status: 500 }
            );
        }

        // Log action
        await logAdminUserAction(admin, 'admin_create', newAdmin.id, body.name, {
            newValue: { email: body.email, role: body.role },
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
        });

        return NextResponse.json(
            {
                success: true,
                data: newAdmin,
                message: 'Admin created successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        return createErrorResponse(error);
    }
}
