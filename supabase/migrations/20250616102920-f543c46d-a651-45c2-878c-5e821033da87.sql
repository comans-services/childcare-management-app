
-- Add foreign key constraint to establish relationship between contracts and customers
ALTER TABLE public.contracts 
ADD CONSTRAINT fk_contracts_customer 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Add an index on customer_id for better query performance
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON public.contracts(customer_id);
