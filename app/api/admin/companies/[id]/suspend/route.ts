import { NextRequest, NextResponse } from 'next/server';
import {
    requireAdminRole,
    createErrorResponse,
    getClientIP,
    getUserAgent,
} from '@/lib/admin/require-admin';
import { logCompanyAction } from '@/lib/admin/audit-log';
import { CompanySuspendInput } from '@/types/admin';

// POST - Suspend company
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { admin, supabase } = await requireAdminRole('admin', req);
        const { id } = await params;

        const body: CompanySuspendInput = await req.json();

        // Validate input
        if (!body.reason || body.reason.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Reason is required' },
                { status: 400 }
            );
        }

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

        if (!company.is_active) {
            return NextResponse.json(
                { success: false, error: 'Company is already suspended' },
                { status: 400 }
            );
        }

        // Suspend company
        const { error: updateError } = await supabase
            .from('companies')
            .update({ is_active: false })
            .eq('id', id);

        if (updateError) {
            console.error('Error suspending company:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to suspend company' },
                { status: 500 }
            );
        }

        // Deactivate all company users
        await supabase
            .from('company_users')
            .update({ is_active: false })
            .eq('company_id', id);

        // Log action
        await logCompanyAction(admin, 'company_suspend', id, company.name, {
            notes: body.reason,
            oldValue: { is_active: true },
            newValue: { is_active: false },
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req),
        });

        return NextResponse.json({
            success: true,
            message: 'Company suspended successfully',
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
