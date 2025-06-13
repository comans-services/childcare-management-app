
-- Fix the ambiguous column reference in get_user_activities function
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
  entity_type text,
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
    'timesheet_entry' as entity_type,
    COALESCE(proj.name, 'Unknown Project') as entity_name,
    CASE 
      WHEN te.created_at = te.updated_at THEN 
        'Created timesheet entry for ' || COALESCE(proj.name, 'Unknown Project') || ' (' || te.hours_logged || ' hours on ' || te.entry_date || ')'
      ELSE 
        'Updated timesheet entry for ' || COALESCE(proj.name, 'Unknown Project') || ' (' || te.hours_logged || ' hours on ' || te.entry_date || ')'
    END as description,
    jsonb_build_object(
      'project_id', te.project_id,
      'project_name', proj.name,
      'hours_logged', te.hours_logged,
      'entry_date', te.entry_date,
      'entry_type', te.entry_type,
      'notes', te.notes
    ) as details,
    GREATEST(te.created_at, te.updated_at) as created_at
  FROM timesheet_entries te
  LEFT JOIN profiles p ON p.id = te.user_id
  LEFT JOIN projects proj ON proj.id = te.project_id
  WHERE (p_start_date IS NULL OR te.entry_date >= p_start_date)
    AND (p_end_date IS NULL OR te.entry_date <= p_end_date)
    AND (p_user_id IS NULL OR te.user_id = p_user_id)

  UNION ALL

  -- Project creation/updates
  SELECT 
    'proj_' || proj.id::text as id,
    COALESCE(proj.created_by, auth.uid()) as user_id, -- Fixed: removed ambiguous query
    COALESCE(p.full_name, p.email, 'System') as user_name,
    CASE 
      WHEN proj.created_at = proj.updated_at THEN 'project_created'
      ELSE 'project_updated'
    END as action,
    'project' as entity_type,
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

  -- Project assignments
  SELECT 
    'pa_' || pa.id::text as id,
    COALESCE(pa.assigned_by, pa.user_id) as user_id,
    COALESCE(p.full_name, p.email, 'System') as user_name,
    'user_assigned' as action,
    'project' as entity_type,
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

  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_activities TO authenticated;
