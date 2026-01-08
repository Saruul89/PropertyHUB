-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for documents bucket
-- Note: We do not alter table enable/disable RLS as that requires superuser/owner permissions

-- Allow authenticated users to upload files to documents bucket
CREATE POLICY "Authenticated users can upload to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents' 
    AND owner = auth.uid()
);

-- Allow authenticated users to select files from documents bucket
CREATE POLICY "Authenticated users can select from documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents'
    AND owner = auth.uid()
);
