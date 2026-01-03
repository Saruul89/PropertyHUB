import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { VALID_STATUS_TRANSITIONS } from '@/lib/constants';
import type { MaintenanceStatus } from '@/types';

// PUT /api/maintenance/[id]/status - Change maintenance request status
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { status: newStatus } = await req.json() as { status: MaintenanceStatus };

        // Get current maintenance request
        const { data: current, error: fetchError } = await supabase
            .from('maintenance_requests')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
        }

        const currentStatus = current.status as MaintenanceStatus;

        // Validate status transition
        const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
        if (!allowedTransitions.includes(newStatus)) {
            return NextResponse.json(
                {
                    error: `${currentStatus}-с ${newStatus} руу өөрчлөх боломжгүй`,
                    allowed: allowedTransitions,
                },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('maintenance_requests')
            .update({ status: newStatus })
            .eq('id', id)
            .select(`
                *,
                unit:units(*, property:properties(*)),
                tenant:tenants(*)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update status';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
