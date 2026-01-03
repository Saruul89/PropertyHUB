import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { generateInitialPassword } from '@/lib/utils/password-generator';
import { phoneToEmail } from '@/lib/utils/phone-to-email';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Нэвтрэлт шалгах
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Компанийн мэдээлэл авах
    const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    if (!companyUser) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    try {
        const { name, phone, unitId, tenantType, companyName, notes } = await req.json();

        const initialPassword = generateInitialPassword();
        const authEmail = phoneToEmail(phone);

        // Supabase Auth-д хэрэглэгч үүсгэх
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: authEmail,
            password: initialPassword,
            email_confirm: true,
            user_metadata: { name, phone, role: 'tenant' },
        });

        if (authError) throw authError;

        // tenants хүснэгтэд нэмэх
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                user_id: authData.user.id,
                company_id: companyUser.company_id,
                name,
                phone,
                tenant_type: tenantType || 'individual',
                company_name: companyName,
                auth_email: authEmail,
                initial_password: initialPassword,
            })
            .select()
            .single();

        if (tenantError) throw tenantError;

        // Өрөө заасан бол гэрээ үүсгэх
        if (unitId) {
            const { data: unit } = await supabase
                .from('units')
                .select('monthly_rent')
                .eq('id', unitId)
                .single();

            await supabase.from('leases').insert({
                unit_id: unitId,
                tenant_id: tenant.id,
                company_id: companyUser.company_id,
                start_date: new Date().toISOString().split('T')[0],
                monthly_rent: unit?.monthly_rent || 0,
                status: 'active',
            });

            await supabase.from('units').update({ status: 'occupied' }).eq('id', unitId);
        }

        return NextResponse.json({
            success: true,
            tenant,
            initialPassword,
        });
    } catch (error) {
        console.error('Create tenant error:', error);
        const message = error instanceof Error ? error.message : 'Оршин суугч үүсгэхэд алдаа гарлаа';
        return NextResponse.json({ message }, { status: 500 });
    }
}

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

    const { data: tenants, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('company_id', companyUser.company_id)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tenants });
}
