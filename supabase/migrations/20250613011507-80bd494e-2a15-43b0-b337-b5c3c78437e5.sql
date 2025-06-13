
-- Create the audit logs table with comprehensive action tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL, -- Store the actual user name for immutable logging
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT, -- Store entity name for better readability
  description TEXT NOT NULL, -- Human-readable description in English
  details JSONB, -- Additional structured data
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy that only allows admins to view audit logs
CREATE POLICY "Only admins can view audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy that allows all authenticated users to insert audit logs
-- (This is needed for the audit service to work)
CREATE POLICY "All authenticated users can insert audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Prevent any updates or deletes on audit logs to ensure immutability
-- No UPDATE or DELETE policies = no one can modify or delete records

-- Create a function to get user's full name for audit logging
CREATE OR REPLACE FUNCTION public.get_user_display_name(p_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(full_name, email, 'Unknown User')
  FROM public.profiles 
  WHERE id = p_user_id
  LIMIT 1;
$$;

-- Create a trigger function to automatically set user_name on insert
CREATE OR REPLACE FUNCTION public.set_audit_user_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Automatically populate user_name from profiles table
  NEW.user_name := public.get_user_display_name(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set user_name
CREATE TRIGGER audit_logs_set_user_name
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_audit_user_name();
