import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/meter-submissions/[id]/approve - Зөвшөөрөх
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

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
        .from('tenant_meter_submissions')
        .select(`
            *,
            fee_types(default_unit_price),
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

    // Get last reading for this unit and fee type
    const { data: lastReading } = await supabase
        .from('meter_readings')
        .select('current_reading')
        .eq('unit_id', submission.unit_id)
        .eq('fee_type_id', submission.fee_type_id)
        .order('reading_date', { ascending: false })
        .limit(1)
        .single();

    const previousReading = lastReading?.current_reading ?? 0;

    // Get unit price (custom or default)
    const { data: unitFee } = await supabase
        .from('unit_fees')
        .select('custom_unit_price')
        .eq('unit_id', submission.unit_id)
        .eq('fee_type_id', submission.fee_type_id)
        .eq('is_active', true)
        .single();

    const feeType = submission.fee_types as { default_unit_price?: number } | null;
    const unitPrice = unitFee?.custom_unit_price ?? feeType?.default_unit_price ?? 0;

    // Create meter reading
    const { data: meterReading, error: readingError } = await supabase
        .from('meter_readings')
        .insert({
            unit_id: submission.unit_id,
            fee_type_id: submission.fee_type_id,
            reading_date: new Date().toISOString().split('T')[0],
            previous_reading: previousReading,
            current_reading: submission.submitted_reading,
            unit_price: unitPrice,
            recorded_by: user.id,
            notes: `Оршин суугчийн илгээлтийг зөвшөөрсөн (ID: ${submission.id})`,
        })
        .select()
        .single();

    if (readingError) {
        return NextResponse.json(
            { error: 'Failed to create meter reading' },
            { status: 500 }
        );
    }

    // Update submission status
    const { error: updateError } = await supabase
        .from('tenant_meter_submissions')
        .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            meter_reading_id: meterReading.id,
        })
        .eq('id', id);

    if (updateError) {
        return NextResponse.json(
            { error: 'Failed to update submission' },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        meter_reading: meterReading,
    });
}
