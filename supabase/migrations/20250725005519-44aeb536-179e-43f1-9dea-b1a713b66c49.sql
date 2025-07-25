-- Update the expense-receipts bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'expense-receipts';

-- Create RLS policies for expense receipts access control
-- Users can view their own receipts (filename format: user_id/...)
CREATE POLICY "Users can view their own expense receipts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'expense-receipts' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ))
);

-- Users can upload their own receipts
CREATE POLICY "Users can upload their own expense receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'expense-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own receipts
CREATE POLICY "Users can update their own expense receipts" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'expense-receipts' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ))
);

-- Users can delete their own receipts
CREATE POLICY "Users can delete their own expense receipts" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'expense-receipts' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ))
);