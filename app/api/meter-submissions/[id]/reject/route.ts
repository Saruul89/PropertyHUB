import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/meter-submissions/[id]/reject - Татгалзах
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rejection_reason } = body;

    if (!rejection_reason) {
        return NextResponse.json(
            { error: 'rejection_reason is required' },
            { status: 400 }
        );
    }

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
        .from('tenant_meter_submissions')
        .select(`
            *,
            units(property_id, properties(company_id))
        `)
        .eq('id', id)
        .single();

    if (fetchError || !submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Verify user belongs to the same company
    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    const submissionCompanyId = (
        (submission.units as Record<string, unknown>)?.properties as Record<string, unknown>
    )?.company_id;

    if (!companyUser || companyUser.company_id !== submissionCompanyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (submission.status !== 'pending') {
        return NextResponse.json(
            { error: 'Submission is not pending' },
            { status: 400 }
        );
    }

    // Update submission status
    const { error: updateError } = await supabase
        .from('tenant_meter_submissions')
        .update({
            status: 'rejected',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason,
        })
        .eq('id', id);

    if (updateError) {
        return NextResponse.json(
            { error: 'Failed to update submission' },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
