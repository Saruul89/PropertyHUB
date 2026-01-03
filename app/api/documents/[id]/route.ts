import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/documents/[id] - Get a single document
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

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
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
        // Get document first
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('file_url, company_id')
            .eq('id', docId)
            .single();

        if (fetchError || !doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Try to delete from storage
        try {
            const url = new URL(doc.file_url);
            const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
            if (pathMatch) {
                const path = decodeURIComponent(pathMatch[1]);
                await supabase.storage.from('documents').remove([path]);
            }
        } catch {
            // Continue even if storage delete fails
            console.error('Failed to delete file from storage');
        }

        // Delete database record
        const { error } = await supabase.from('documents').delete().eq('id', docId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete document';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
