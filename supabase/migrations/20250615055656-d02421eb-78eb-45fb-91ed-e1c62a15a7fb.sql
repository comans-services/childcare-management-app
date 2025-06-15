
-- Drop RLS policies for contract files
DROP POLICY IF EXISTS "Allow authenticated users to upload contract files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to contract files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their contract files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their contract files" ON storage.objects;

-- Drop the contracts storage bucket
DELETE FROM storage.buckets WHERE id = 'contracts';
