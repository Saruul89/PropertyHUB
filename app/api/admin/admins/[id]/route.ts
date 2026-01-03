import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
    requireAdminRole,
    createErrorResponse,
    getClientIP,
    getUserAgent,
} from '@/lib/admin/require-admin';
import { logAdminUserAction, calculateDiff } from '@/lib/admin/audit-log';
import { AdminEditInput } from '@/types/admin';

// GET - Get single admin
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await requireAdminRole('support', req);
        const { id } = await params;

        const { data, error } = await supabase
            .from('system_admins')
            .select('id, user_id, role, is_active, name, email, created_at, updated_at')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching admin:', error);
            return NextResponse.json(
                { success: false, error: 'Admin not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return createErrorResponse(error);
    }
}

// PUT - Update admin (super only)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { admin, supabase } = await requireAdminRole('super', req);
        const { id } = await params;

        const body: AdminEditInput = await req.json();

        // Get current admin data
        const { data: currentAdmin, error: fetchError } = await supabase
            .from('system_admins')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !currentAdmin) {
            return NextResponse.json(
                { success: false, error: 'Admin not found' },
                { status: 404 }
            );
        }

        // Prevent self-deactivation
        if (currentAdmin.user_id === admin.user_id && body.is_active === false) {
            return NextResponse.json(
                { success: false, error: 'Cannot deactivate yourself' },
                { status: 400 }
            );
        }

        // Prevent removing last super admin
        if (currentAdmin.role === 'super' && body.role !== 'super') {
            const { count } = await supabase
                .from('system_admins')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'super')
                .eq('is_active', true);

            if (count && count <= 1) {
                return NextResponse.json(
                    { success: false, error: 'Cannot remove the last super admin' },
                    { status: 400 }
                );
            }
        }

        // Prepare update data
        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.role !== undefined) updateData.role = body.role;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        // Update admin
        const { data: updatedAdmin, error: updateError } = await supabase
            .from('system_admins')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating admin:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to update admin' },
                { status: 500 }
            );
        }

        // Log action
        const diff = calculateDiff(currentAdmin, updateData);
        await logAdminUserAction(admin, 'admin_edit', id, currentAdmin.name || currentAdmin.email, {
            oldValue: diff.old as Record<string, unknown>,
            newValue: diff.new as Record<string, unknown>,
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
        });

        return NextResponse.json({
            success: true,
            data: updatedAdmin,
            message: 'Admin updated successfully',
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}

// DELETE - Delete admin (super only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { admin, supabase } = await requireAdminRole('super', req);
        const { id } = await params;

        // Get current admin data
        const { data: targetAdmin, error: fetchError } = await supabase
            .from('system_admins')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !targetAdmin) {
            return NextResponse.json(
                { success: false, error: 'Admin not found' },
                { status: 404 }
            );
        }

        // Prevent self-deletion
        if (targetAdmin.user_id === admin.user_id) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete yourself' },
                { status: 400 }
            );
        }

        // Prevent deleting last super admin
        if (targetAdmin.role === 'super') {
            const { count } = await supabase
                .from('system_admins')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'super')
                .eq('is_active', true);

            if (count && count <= 1) {
                return NextResponse.json(
                    { success: false, error: 'Cannot delete the last super admin' },
                    { status: 400 }
                );
            }
        }

        // Create admin client for user deletion
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Delete system_admins record
        const { error: deleteError } = await supabase
            .from('system_admins')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting admin:', deleteError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete admin' },
                { status: 500 }
            );
        }

        // Delete auth user
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
            targetAdmin.user_id
        );

        if (authDeleteError) {
            console.error('Error deleting auth user:', authDeleteError);
            // Continue anyway - admin record is already deleted
        }

        // Log action
        await logAdminUserAction(admin, 'admin_delete', id, targetAdmin.name || targetAdmin.email, {
            oldValue: { email: targetAdmin.email, role: targetAdmin.role },
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
        });

        return NextResponse.json({
            success: true,
            message: 'Admin deleted successfully',
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
