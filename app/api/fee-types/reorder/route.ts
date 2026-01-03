import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/fee-types/reorder - Дараалал өөрчлөх
export async function PUT(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company_id from company_users
    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    if (!companyUser) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const { order } = body; // Array of { id: string, display_order: number }

    if (!Array.isArray(order)) {
        return NextResponse.json(
            { error: 'order must be an array' },
            { status: 400 }
        );
    }

    // Update each fee type's display_order
    const updates = order.map(
        async (item: { id: string; display_order: number }) => {
            return supabase
                .from('fee_types')
                .update({ display_order: item.display_order })
                .eq('id', item.id)
                .eq('company_id', companyUser.company_id);
        }
    );

    try {
        await Promise.all(updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
