import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/leases/expiring - Get leases expiring within N days
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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

    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
        .from('leases')
        .select(`
            *,
            tenant:tenants(*),
            unit:units(*, property:properties(*))
        `)
        .eq('company_id', companyUser.company_id)
        .eq('status', 'active')
        .not('end_date', 'is', null)
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to expected format with days remaining
    const leasesWithDays = data.map((lease) => {
        const endDate = new Date(lease.end_date);
        const daysRemaining = Math.ceil(
            (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
            id: lease.id,
            tenant_name: lease.tenant?.name || '-',
            unit_number: lease.unit?.unit_number || '-',
            property_name: lease.unit?.property?.name || '-',
            end_date: lease.end_date,
            days_remaining: daysRemaining,
        };
    });

    return NextResponse.json({
        data: leasesWithDays,
        count: leasesWithDays.length,
    });
}
