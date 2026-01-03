import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/maintenance/[id]/complete - Complete a maintenance request
export async function POST(
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
        const body = await req.json();

        // Validate required completed_date
        if (!body.completed_date) {
            return NextResponse.json(
                { error: 'Дуусгасан огноо заавал шаардлагатай' },
                { status: 400 }
            );
        }

        // Check current status
        const { data: current, error: fetchError } = await supabase
            .from('maintenance_requests')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
        }

        if (current.status !== 'in_progress') {
            return NextResponse.json(
                { error: 'Зөвхөн шийдвэрлэж буй хүсэлтийг дуусгах боломжтой' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('maintenance_requests')
            .update({
                status: 'completed',
                completed_date: body.completed_date,
                actual_cost: body.actual_cost || null,
                notes: body.notes || null,
            })
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
        const message = error instanceof Error ? error.message : 'Failed to complete maintenance request';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
