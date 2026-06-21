-- Fix photo storage policies to read the uploaded object path, not businesses.name.
--
-- In the previous policy, split_part(name, '/', 1) was evaluated inside a
-- public.businesses subquery. PostgreSQL resolved the unqualified "name" to
-- public.businesses.name instead of storage.objects.name, so uploads to
-- <business_id>/<file> were rejected by RLS.

DROP POLICY IF EXISTS "Owners can upload to own business folder" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete own business photos" ON storage.objects;

CREATE POLICY "Owners can upload to own business folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id::text = split_part(storage.objects.name, '/', 1)
        AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete own business photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id::text = split_part(storage.objects.name, '/', 1)
        AND businesses.owner_id = auth.uid()
    )
  );
