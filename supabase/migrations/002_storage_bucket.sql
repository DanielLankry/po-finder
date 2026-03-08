-- Create photos storage bucket
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Allow anyone to read photos
create policy "Public read access" on storage.objects
  for select using (bucket_id = 'photos');

-- Allow authenticated users to upload photos for their own businesses
create policy "Authenticated users can upload photos" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own photos
create policy "Users can delete own photos" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and auth.role() = 'authenticated'
  );
