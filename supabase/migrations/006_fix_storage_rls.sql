-- Fix storage RLS: anyone authenticated could delete ANY photo
-- Replace with ownership check via photos table

DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;

-- Upload: only to own business folder (path starts with business_id/)
CREATE POLICY "Owners can upload to own business folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id::text = split_part(name, '/', 1)
      AND owner_id = auth.uid()
    )
  );

-- Delete: only files that belong to own business
CREATE POLICY "Owners can delete own business photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id::text = split_part(name, '/', 1)
      AND owner_id = auth.uid()
    )
  );
