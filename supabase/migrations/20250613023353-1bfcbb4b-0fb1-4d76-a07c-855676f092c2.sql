
-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS public.get_user_activities(date, date, uuid);

-- Create dedicated audit_logs table for tracking deletions and other events
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_name text,
  action text NOT NULL,
  entity_name text,
  description text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs (admins can view all, users can view their own)
CREATE POLICY "Users can view their own audit logs or admins can view all" ON public.audit_logs
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() = 'admin'
);

CREATE POLICY "System can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- Create trigger function to log deletions
CREATE OR REPLACE FUNCTION public.log_deletion_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_display_name text;
  entity_name_val text;
  description_val text;
  details_val jsonb;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Handle different table deletions
  IF TG_TABLE_NAME = 'timesheet_entries' THEN
    -- Get project name for context
    SELECT COALESCE(p.name, c.name, 'Unknown Project/Contract') INTO entity_name_val
    FROM projects p 
    FULL OUTER JOIN contracts c ON c.id = OLD.contract_id
    WHERE p.id = OLD.project_id OR c.id = OLD.contract_id;
    
    description_val := 'Deleted timesheet entry for ' || entity_name_val || 
                      ' (' || OLD.hours_logged || ' hours on ' || OLD.entry_date || ')';
    details_val := jsonb_build_object(
      'project_id', OLD.project_id,
      'contract_id', OLD.contract_id,
      'hours_logged', OLD.hours_logged,
      'entry_date', OLD.entry_date,
      'entry_type', OLD.entry_type,
      'notes', OLD.notes
    );
    
  ELSIF TG_TABLE_NAME = 'projects' THEN
    entity_name_val := OLD.name;
    description_val := 'Deleted project: ' || OLD.name;
    details_val := jsonb_build_object(
      'project_name', OLD.name,
      'budget_hours', OLD.budget_hours,
      'customer_id', OLD.customer_id,
      'is_internal', OLD.is_internal
    );
    
  ELSIF TG_TABLE_NAME = 'contracts' THEN
    entity_name_val := OLD.name;
    description_val := 'Deleted contract: ' || OLD.name;
    details_val := jsonb_build_object(
      'contract_name', OLD.name,
      'customer_id', OLD.customer_id,
      'start_date', OLD.start_date,
      'end_date', OLD.end_date,
      'status', OLD.status
    );
    
  ELSIF TG_TABLE_NAME = 'project_assignments' THEN
    -- Get project and user names for context
    SELECT p.name INTO entity_name_val FROM projects p WHERE p.id = OLD.project_id;
    SELECT COALESCE(pr.full_name, pr.email, 'Unknown User') INTO description_val
    FROM profiles pr WHERE pr.id = OLD.user_id;
    
    description_val := 'Unassigned ' || description_val || ' from project: ' || entity_name_val;
    details_val := jsonb_build_object(
      'project_id', OLD.project_id,
      'project_name', entity_name_val,
      'unassigned_user_id', OLD.user_id
    );
    
  ELSIF TG_TABLE_NAME = 'contract_assignments' THEN
    -- Get contract and user names for context
    SELECT c.name INTO entity_name_val FROM contracts c WHERE c.id = OLD.contract_id;
    SELECT COALESCE(pr.full_name, pr.email, 'Unknown User') INTO description_val
    FROM profiles pr WHERE pr.id = OLD.user_id;
    
    description_val := 'Unassigned ' || description_val || ' from contract: ' || entity_name_val;
    details_val := jsonb_build_object(
      'contract_id', OLD.contract_id,
      'contract_name', entity_name_val,
      'unassigned_user_id', OLD.user_id
    );
    
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    entity_name,
    description,
    details
  ) VALUES (
    COALESCE(auth.uid(), OLD.user_id),
    user_display_name,
    CASE 
      WHEN TG_TABLE_NAME = 'timesheet_entries' THEN 'entry_deleted'
      WHEN TG_TABLE_NAME = 'projects' THEN 'project_deleted'
      WHEN TG_TABLE_NAME = 'contracts' THEN 'contract_deleted'
      WHEN TG_TABLE_NAME = 'project_assignments' THEN 'user_unassigned'
      WHEN TG_TABLE_NAME = 'contract_assignments' THEN 'user_unassigned'
    END,
    entity_name_val,
    description_val,
    details_val
  );

  RETURN OLD;
END;
$$;

-- Create deletion triggers
CREATE TRIGGER timesheet_entries_deletion_audit
  BEFORE DELETE ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();

CREATE TRIGGER projects_deletion_audit
  BEFORE DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();

CREATE TRIGGER contracts_deletion_audit
  BEFORE DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();

CREATE TRIGGER project_assignments_deletion_audit
  BEFORE DELETE ON public.project_assignments
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();

CREATE TRIGGER contract_assignments_deletion_audit
  BEFORE DELETE ON public.contract_assignments
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();

-- Create the new get_user_activities function (without entity_type)
CREATE OR REPLACE FUNCTION public.get_user_activities(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id text,
  user_id uuid,
  user_name text,
  action text,
  entity_name text,
  description text,
  details jsonb,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Timesheet entry activities
  SELECT 
    'te_' || te.id::text as id,
    te.user_id,
    COALESCE(p.full_name, p.email, 'Unknown User') as user_name,
    CASE 
      WHEN te.created_at = te.updated_at THEN 'entry_created'
      ELSE 'entry_updated'
    END as action,
    COALESCE(proj.name, cont.name, 'Unknown Project/Contract') as entity_name,
    CASE 
      WHEN te.created_at = te.updated_at THEN 
        'Created timesheet entry for ' || COALESCE(proj.name, cont.name, 'Unknown Project/Contract') || ' (' || te.hours_logged || ' hours on ' || te.entry_date || ')'
      ELSE 
        'Updated timesheet entry for ' || COALESCE(proj.name, cont.name, 'Unknown Project/Contract') || ' (' || te.hours_logged || ' hours on ' || te.entry_date || ')'
    END as description,
    jsonb_build_object(
      'project_id', te.project_id,
      'contract_id', te.contract_id,
      'project_name', proj.name,
      'contract_name', cont.name,
      'hours_logged', te.hours_logged,
      'entry_date', te.entry_date,
      'entry_type', te.entry_type,
      'notes', te.notes
    ) as details,
    GREATEST(te.created_at, te.updated_at) as created_at
  FROM timesheet_entries te
  LEFT JOIN profiles p ON p.id = te.user_id
  LEFT JOIN projects proj ON proj.id = te.project_id
  LEFT JOIN contracts cont ON cont.id = te.contract_id
  WHERE (p_start_date IS NULL OR te.entry_date >= p_start_date)
    AND (p_end_date IS NULL OR te.entry_date <= p_end_date)
    AND (p_user_id IS NULL OR te.user_id = p_user_id)

  UNION ALL

  -- Project creation/updates
  SELECT 
    'proj_' || proj.id::text as id,
    COALESCE(proj.created_by, auth.uid()) as user_id,
    COALESCE(p.full_name, p.email, 'System') as user_name,
    CASE 
      WHEN proj.created_at = proj.updated_at THEN 'project_created'
      ELSE 'project_updated'
    END as action,
    proj.name as entity_name,
    CASE 
      WHEN proj.created_at = proj.updated_at THEN 
        'Created project: ' || proj.name
      ELSE 
        'Updated project: ' || proj.name
    END as description,
    jsonb_build_object(
      'project_id', proj.id,
      'project_name', proj.name,
      'budget_hours', proj.budget_hours,
      'customer_id', proj.customer_id,
      'is_internal', proj.is_internal
    ) as details,
    GREATEST(proj.created_at, proj.updated_at) as created_at
  FROM projects proj
  LEFT JOIN profiles p ON p.id = proj.created_by
  WHERE (p_start_date IS NULL OR proj.created_at::date >= p_start_date)
    AND (p_end_date IS NULL OR proj.created_at::date <= p_end_date)
    AND (p_user_id IS NULL OR proj.created_by = p_user_id)

  UNION ALL

  -- Contract creation/updates
  SELECT 
    'cont_' || cont.id::text as id,
    auth.uid() as user_id,
    COALESCE(p.full_name, p.email, 'System') as user_name,
    CASE 
      WHEN cont.created_at = cont.updated_at THEN 'contract_created'
      ELSE 'contract_updated'
    END as action,
    cont.name as entity_name,
    CASE 
      WHEN cont.created_at = cont.updated_at THEN 
        'Created contract: ' || cont.name
      ELSE 
        'Updated contract: ' || cont.name
    END as description,
    jsonb_build_object(
      'contract_id', cont.id,
      'contract_name', cont.name,
      'customer_id', cont.customer_id,
      'start_date', cont.start_date,
      'end_date', cont.end_date,
      'status', cont.status
    ) as details,
    GREATEST(cont.created_at, cont.updated_at) as created_at
  FROM contracts cont
  LEFT JOIN profiles p ON p.id = auth.uid()
  WHERE (p_start_date IS NULL OR cont.created_at::date >= p_start_date)
    AND (p_end_date IS NULL OR cont.created_at::date <= p_end_date)
    AND (p_user_id IS NULL OR auth.uid() = p_user_id)

  UNION ALL

  -- Project assignments
  SELECT 
    'pa_' || pa.id::text as id,
    COALESCE(pa.assigned_by, pa.user_id) as user_id,
    COALESCE(p.full_name, p.email, 'System') as user_name,
    'user_assigned' as action,
    proj.name as entity_name,
    'Assigned ' || COALESCE(assigned_user.full_name, assigned_user.email, 'Unknown User') || ' to project: ' || proj.name as description,
    jsonb_build_object(
      'project_id', pa.project_id,
      'project_name', proj.name,
      'assigned_user_id', pa.user_id,
      'assigned_user_name', COALESCE(assigned_user.full_name, assigned_user.email, 'Unknown User')
    ) as details,
    pa.assigned_at as created_at
  FROM project_assignments pa
  LEFT JOIN profiles p ON p.id = pa.assigned_by
  LEFT JOIN profiles assigned_user ON assigned_user.id = pa.user_id
  LEFT JOIN projects proj ON proj.id = pa.project_id
  WHERE (p_start_date IS NULL OR pa.assigned_at::date >= p_start_date)
    AND (p_end_date IS NULL OR pa.assigned_at::date <= p_end_date)
    AND (p_user_id IS NULL OR pa.assigned_by = p_user_id OR pa.user_id = p_user_id)

  UNION ALL

  -- Contract assignments
  SELECT 
    'ca_' || ca.id::text as id,
    COALESCE(ca.assigned_by, ca.user_id) as user_id,
    COALESCE(p.full_name, p.email, 'System') as user_name,
    'user_assigned' as action,
    cont.name as entity_name,
    'Assigned ' || COALESCE(assigned_user.full_name, assigned_user.email, 'Unknown User') || ' to contract: ' || cont.name as description,
    jsonb_build_object(
      'contract_id', ca.contract_id,
      'contract_name', cont.name,
      'assigned_user_id', ca.user_id,
      'assigned_user_name', COALESCE(assigned_user.full_name, assigned_user.email, 'Unknown User')
    ) as details,
    ca.assigned_at as created_at
  FROM contract_assignments ca
  LEFT JOIN profiles p ON p.id = ca.assigned_by
  LEFT JOIN profiles assigned_user ON assigned_user.id = ca.user_id
  LEFT JOIN contracts cont ON cont.id = ca.contract_id
  WHERE (p_start_date IS NULL OR ca.assigned_at::date >= p_start_date)
    AND (p_end_date IS NULL OR ca.assigned_at::date <= p_end_date)
    AND (p_user_id IS NULL OR ca.assigned_by = p_user_id OR ca.user_id = p_user_id)

  UNION ALL

  -- Audit logs (deletions and other tracked events)
  SELECT 
    'audit_' || al.id::text as id,
    al.user_id,
    al.user_name,
    al.action,
    al.entity_name,
    al.description,
    al.details,
    al.created_at
  FROM audit_logs al
  WHERE (p_start_date IS NULL OR al.created_at::date >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at::date <= p_end_date)
    AND (p_user_id IS NULL OR al.user_id = p_user_id)

  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_activities TO authenticated;
