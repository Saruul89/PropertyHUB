import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...';

        if (!hasKey) {
            return NextResponse.json({
                error: 'SUPABASE_SERVICE_ROLE_KEY is not set',
                hasUrl,
                hasKey,
            });
        }

        const supabase = createAdminClient();

        // Test select with service role (should bypass RLS)
        const { data: selectData, error: selectError } = await supabase
            .from('companies')
            .select('count')
            .limit(0);

        // Test insert with service role
        const testCompanyId = `test-${Date.now()}`;
        const { data: insertData, error: insertError } = await supabase
            .from('companies')
            .insert({
                name: `Test Company ${testCompanyId}`,
                email: `test-${testCompanyId}@test.com`,
                company_type: 'apartment',
            })
            .select()
            .single();

        // Clean up test data if insert succeeded
        if (insertData && !insertError) {
            await supabase.from('companies').delete().eq('id', insertData.id);
        }

        return NextResponse.json({
            status: insertError ? 'error' : 'ok',
            hasUrl,
            hasKey,
            keyPrefix,
            selectTest: { data: selectData, error: selectError },
            insertTest: { data: insertData, error: insertError },
        });
    } catch (e) {
        return NextResponse.json({
            error: String(e),
            stack: e instanceof Error ? e.stack : undefined,
        });
    }
}
