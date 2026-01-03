import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/documents/[id]/download - Get signed download URL
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: docId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get document
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('file_url, file_name')
            .eq('id', docId)
            .single();

        if (fetchError || !doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Extract storage path from URL
        const url = new URL(doc.file_url);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);

        if (!pathMatch) {
            // Return public URL if not in expected format
            return NextResponse.json({ url: doc.file_url, file_name: doc.file_name });
        }

        const path = decodeURIComponent(pathMatch[1]);

        // Create signed URL (valid for 60 minutes)
        const { data: signedData, error: signedError } = await supabase.storage
            .from('documents')
            .createSignedUrl(path, 60 * 60);

        if (signedError || !signedData) {
            // Return public URL as fallback
            return NextResponse.json({ url: doc.file_url, file_name: doc.file_name });
        }

        return NextResponse.json({
            url: signedData.signedUrl,
            file_name: doc.file_name,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate download URL';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
