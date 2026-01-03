import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { userId, companyName, email, phone, companyType } = await req.json();

        const supabase = createAdminClient();

        // Компани үүсгэх (trigger-ээр features автоматаар тохируулагдана)
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: companyName,
                email,
                phone,
                company_type: companyType || 'apartment',
            })
            .select()
            .single();

        if (companyError) throw companyError;

        // company_users үүсгэх
        const { error: userError } = await supabase.from('company_users').insert({
            company_id: company.id,
            user_id: userId,
            role: 'admin',
        });

        if (userError) throw userError;

        // Үнэгүй захиалга үүсгэх
        const { error: subError } = await supabase.from('subscriptions').insert({
            company_id: company.id,
            plan: 'free',
            price_per_month: 0,
            status: 'active',
            max_properties: 1,
            max_units: 50,
        });

        if (subError) throw subError;

        return NextResponse.json({ success: true, companyId: company.id });
    } catch (error) {
        console.error('Register company error:', error);
        const message = error instanceof Error ? error.message : 'Бүртгэхэд алдаа гарлаа';
        return NextResponse.json({ message }, { status: 500 });
    }
}
