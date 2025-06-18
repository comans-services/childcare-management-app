
-- Fix the contract filtering logic in the timesheet_entries_report function
CREATE OR REPLACE FUNCTION public.timesheet_entries_report(
  p_start_date date, 
  p_end_date date, 
  p_user_id uuid DEFAULT NULL::uuid, 
  p_project_id uuid DEFAULT NULL::uuid, 
  p_customer_id uuid DEFAULT NULL::uuid, 
  p_contract_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  project_id uuid, 
  entry_date date, 
  hours_logged numeric, 
  notes text, 
  jira_task_id text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  start_time character varying, 
  end_time character varying, 
  project_name text, 
  project_description text, 
  project_customer_id uuid, 
  user_full_name text, 
  user_email text, 
  user_organization text, 
  user_time_zone text, 
  user_employee_card_id text
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  select
    te.id,
    te.user_id,
    te.project_id,
    te.entry_date,
    te.hours_logged,
    te.notes,
    te.jira_task_id,
    te.created_at,
    te.updated_at,
    te.start_time,
    te.end_time,
    CASE 
      WHEN te.entry_type = 'project' THEN prj.name
      WHEN te.entry_type = 'contract' THEN c.name
      ELSE 'Unknown'
    END as project_name,
    CASE 
      WHEN te.entry_type = 'project' THEN prj.description
      WHEN te.entry_type = 'contract' THEN c.description
      ELSE NULL
    END as project_description,
    CASE 
      WHEN te.entry_type = 'project' THEN prj.customer_id
      WHEN te.entry_type = 'contract' THEN c.customer_id
      ELSE NULL
    END as project_customer_id,
    prof.full_name    as user_full_name,
    prof.email        as user_email,
    prof.organization as user_organization,
    prof.time_zone    as user_time_zone,
    prof.employee_card_id as user_employee_card_id
  from timesheet_entries te
  left join projects  prj  on prj.id  = te.project_id AND te.entry_type = 'project'
  left join contracts c    on c.id   = te.contract_id AND te.entry_type = 'contract'
  join profiles  prof on prof.id = te.user_id
  where te.entry_date >= p_start_date
    and te.entry_date <= p_end_date
    and (p_user_id      is null or te.user_id      = p_user_id)
    and (p_project_id   is null or te.project_id   = p_project_id)
    and (p_customer_id  is null or 
         (te.entry_type = 'project' AND prj.customer_id = p_customer_id) OR
         (te.entry_type = 'contract' AND c.customer_id = p_customer_id))
    and (p_contract_id  is null or te.contract_id   = p_contract_id);
$function$
