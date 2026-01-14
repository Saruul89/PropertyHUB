import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tenant/meter-submissions - Оршин суугч: Өөрийн илгээлтийн түүх
export async function GET(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
        .from('tenant_meter_submissions')
        .select(`
            *,
            fee_types(name)
        `)
        .eq('tenant_id', tenant.id)
        .order('submitted_at', { ascending: false })
        .limit(limit);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST /api/tenant/meter-submissions - Оршин суугч: Шинээр илгээх
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, company_id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get active lease to find unit_id
    const { data: lease } = await supabase
        .from('leases')
        .select('unit_id')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .single();

    if (!lease) {
        return NextResponse.json({ error: 'No active lease found' }, { status: 400 });
    }

    const body = await request.json();
    const { fee_type_id, submitted_reading, photo_url, notes } = body;

    if (!fee_type_id || submitted_reading === undefined) {
        return NextResponse.json(
            { error: 'fee_type_id and submitted_reading are required' },
            { status: 400 }
        );
    }

    // Check if there's already a pending submission for this fee type
    const { data: existingPending } = await supabase
        .from('tenant_meter_submissions')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('fee_type_id', fee_type_id)
        .eq('status', 'pending')
        .single();

    if (existingPending) {
        return NextResponse.json(
            { error: 'There is already a pending submission for this fee type' },
            { status: 400 }
        );
    }

    // Get last reading to validate
    const { data: lastReading } = await supabase
        .from('meter_readings')
        .select('current_reading')
        .eq('unit_id', lease.unit_id)
        .eq('fee_type_id', fee_type_id)
        .order('reading_date', { ascending: false })
        .limit(1)
        .single();

    const previousReading = lastReading?.current_reading ?? 0;

    if (submitted_reading < previousReading) {
        return NextResponse.json(
            { error: 'submitted_reading must be greater than or equal to previous reading' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('tenant_meter_submissions')
        .insert({
            tenant_id: tenant.id,
            unit_id: lease.unit_id,
            fee_type_id,
            submitted_reading,
            photo_url,
            notes,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get tenant name and fee type name for notification
    const { data: tenantInfo } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenant.id)
        .single();

    const { data: feeType } = await supabase
        .from('fee_types')
        .select('name')
        .eq('id', fee_type_id)
        .single();

    // Create in-app notification for company users
    await supabase.from('notifications').insert({
        company_id: tenant.company_id,
        recipient_type: 'company_user',
        recipient_id: tenant.company_id, // Will be filtered by company_id
        type: 'reminder',
        title: 'Тоолуурын заалт илгээгдлээ',
        message: `${tenantInfo?.name || 'Оршин суугч'} ${feeType?.name || 'тоолуур'}-ын заалт илгээлээ: ${submitted_reading}`,
        channel: 'in_app',
        status: 'sent',
        related_type: 'meter_submission',
        related_id: data.id,
    });

    return NextResponse.json(data, { status: 201 });
}
