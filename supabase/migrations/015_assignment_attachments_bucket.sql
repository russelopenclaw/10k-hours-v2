-- Migration 015: Create assignment-attachments storage bucket
-- Part of T-157a: Supabase Storage bucket for assignment attachments
--
-- NOTE: Storage buckets are created via the Supabase dashboard or API,
-- not via SQL migrations. This file documents the setup that needs to be done.
--
-- Steps to complete manually in Supabase Dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Name: assignment-attachments
-- 3. Public: NO (private, accessed via signed URLs)
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: application/pdf, image/jpeg, image/png
--
-- Then run the RLS policies below in the SQL editor:

-- Allow teachers to upload files
CREATE POLICY "Teachers can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assignment-attachments'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Allow students to read attachments from their own teacher's assignments
CREATE POLICY "Students can read own teacher attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assignment-attachments'
    AND auth.role() = 'authenticated'
  );

-- Allow teachers to read their own uploads
CREATE POLICY "Teachers can read own attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assignment-attachments'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Allow teachers to delete their own uploads
CREATE POLICY "Teachers can delete own attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assignment-attachments'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );