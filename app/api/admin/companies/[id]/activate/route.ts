import { NextRequest, NextResponse } from 'next/server';
import {
    requireAdminRole,
    createErrorResponse,
    getClientIP,
    getUserAgent,
} from '@/lib/admin/require-admin';
import { logCompanyAction } from '@/lib/admin/audit-log';

// POST - Activate (unsuspend) company
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { admin, supabase } = await requireAdminRole('admin', req);
        const { id } = await params;

        // Get current company data
        const { data: company, error: fetchError } = await supabase
            .from('companies')
            .select('id, name, is_active')
            .eq('id', id)
            .single();

        if (fetchError || !company) {
            return NextResponse.json(
                { success: false, error: 'Company not found' },
                { status: 404 }
            );
        }

        if (company.is_active) {
            return NextResponse.json(
                { success: false, error: 'Company is already active' },
                { status: 400 }
            );
        }

        // Activate company
        const { error: updateError } = await supabase
            .from('companies')
            .update({ is_active: true })
            .eq('id', id);

        if (updateError) {
            console.error('Error activating company:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to activate company' },
                { status: 500 }
            );
        }

        // Reactivate company admin users (staff stays as-is)
        await supabase
            .from('company_users')
            .update({ is_active: true })
            .eq('company_id', id)
            .eq('role', 'admin');

        // Log action
        await logCompanyAction(admin, 'company_activate', id, company.name, {
            oldValue: { is_active: false },
            newValue: { is_active: true },
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
        });

        return NextResponse.json({
            success: true,
            message: 'Company activated successfully',
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
