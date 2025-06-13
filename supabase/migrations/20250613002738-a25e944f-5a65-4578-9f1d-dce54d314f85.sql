
-- Add the missing RLS policy to allow users to view contracts they are assigned to
CREATE POLICY "Users can view assigned contracts" 
ON public.contracts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.contract_assignments ca
    WHERE ca.contract_id = contracts.id 
    AND ca.user_id = auth.uid()
  )
);
