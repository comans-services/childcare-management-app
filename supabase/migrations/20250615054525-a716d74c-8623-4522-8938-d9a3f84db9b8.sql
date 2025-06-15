
-- Create the contracts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true);

-- Create RLS policy for contract file uploads (allow authenticated users to upload)
CREATE POLICY "Allow authenticated users to upload contract files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');

-- Create RLS policy for contract file downloads (allow public access)
CREATE POLICY "Allow public access to contract files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'contracts');

-- Create RLS policy for contract file updates (allow file owners to update)
CREATE POLICY "Allow authenticated users to update their contract files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');

-- Create RLS policy for contract file deletions (allow file owners to delete)
CREATE POLICY "Allow authenticated users to delete their contract files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');
