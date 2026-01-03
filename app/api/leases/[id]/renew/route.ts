import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/leases/[id]/renew - Renew a lease
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: leaseId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Get current lease
        const { data: currentLease, error: fetchError } = await supabase
            .from('leases')
            .select('*')
            .eq('id', leaseId)
            .single();

        if (fetchError || !currentLease) {
            return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
        }

        if (currentLease.status !== 'active') {
            return NextResponse.json(
                { error: 'Only active leases can be renewed' },
                { status: 400 }
            );
        }

        // Calculate new dates
        const today = new Date();
        const newStartDate = body.start_date || today.toISOString().split('T')[0];

        let newEndDate = body.end_date;
        if (!newEndDate && currentLease.end_date) {
            // Default: add 1 year to current end date
            const endDate = new Date(currentLease.end_date);
            endDate.setFullYear(endDate.getFullYear() + 1);
            newEndDate = endDate.toISOString().split('T')[0];
        }

        // Mark current lease as expired
        const { error: updateError } = await supabase
            .from('leases')
            .update({
                status: 'expired',
                end_date: new Date().toISOString().split('T')[0],
            })
            .eq('id', leaseId);

        if (updateError) throw updateError;

        // Create new lease
        const newLeaseData = {
            tenant_id: currentLease.tenant_id,
            unit_id: currentLease.unit_id,
            company_id: currentLease.company_id,
            start_date: newStartDate,
            end_date: newEndDate,
            monthly_rent: body.monthly_rent ?? currentLease.monthly_rent,
            deposit: body.deposit ?? currentLease.deposit,
            payment_due_day: body.payment_due_day ?? currentLease.payment_due_day,
            status: 'active',
            terms: body.terms ?? currentLease.terms,
            notes: body.notes ?? currentLease.notes,
        };

        const { data: newLease, error: insertError } = await supabase
            .from('leases')
            .insert(newLeaseData)
            .select(`
                *,
                tenant:tenants(*),
                unit:units(*, property:properties(*))
            `)
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            data: newLease,
            message: 'Гэрээг сунгалаа',
        }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to renew lease';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
