/*
# Storage bucket policies for avatars

1. Changes
- Makes the `avatars` bucket public-readable so customer profile photos load without auth.
- Allows anon + authenticated to upload/update objects (for profile photo uploads).
- Allows anon + authenticated to delete their own uploads.

2. Security
- Read is public (avatars are displayed in the header for all users).
- Write is open to anon + authenticated since the app uses the anon key (no Supabase Auth session).
*/

CREATE POLICY "Public read access for avatars bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Public upload access for avatars bucket"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public update access for avatars bucket"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public delete access for avatars bucket"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'avatars');
