import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    if (!companyUser) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('company_id', companyUser.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ properties });
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    if (!companyUser) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    try {
        const { name, property_type, address, description, total_floors } = await req.json();

        const { data: property, error } = await supabase
            .from('properties')
            .insert({
                company_id: companyUser.company_id,
                name,
                property_type,
                address,
                description: description || null,
                total_floors: total_floors || 1,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ property }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Барилга үүсгэхэд алдаа гарлаа';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
