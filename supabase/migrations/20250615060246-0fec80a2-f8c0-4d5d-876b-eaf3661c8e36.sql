
-- Drop the customer_name column and add customer_id with proper foreign key
ALTER TABLE public.contracts 
DROP COLUMN customer_name,
ADD COLUMN customer_id uuid REFERENCES public.customers(id);

-- Add an index for better query performance
CREATE INDEX idx_contracts_customer_id ON public.contracts(customer_id);
