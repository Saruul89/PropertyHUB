import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/documents - Upload a document (metadata only, file upload handled by Storage)
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get company_id
        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        if (!companyUser) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const body = await req.json();

        const { data, error } = await supabase
            .from('documents')
            .insert({
                company_id: companyUser.company_id,
                lease_id: body.lease_id || null,
                property_id: body.property_id || null,
                unit_id: body.unit_id || null,
                tenant_id: body.tenant_id || null,
                file_name: body.file_name,
                file_url: body.file_url,
                file_type: body.file_type,
                file_size: body.file_size,
                mime_type: body.mime_type,
                description: body.description || null,
                uploaded_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create document';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
