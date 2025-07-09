
-- Create user_holiday_permissions table for granular control
CREATE TABLE public.user_holiday_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  holiday_id UUID NOT NULL REFERENCES public.public_holidays(id) ON DELETE CASCADE,
  is_allowed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  
  -- Prevent duplicate permissions for same user/holiday
  CONSTRAINT unique_user_holiday_permission UNIQUE (user_id, holiday_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_holiday_permissions_user_holiday ON public.user_holiday_permissions (user_id, holiday_id);
CREATE INDEX idx_user_holiday_permissions_holiday ON public.user_holiday_permissions (holiday_id);

-- Add timestamp trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_holiday_permissions_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_holiday_permissions_timestamp
  BEFORE UPDATE ON public.user_holiday_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_holiday_permissions_timestamp();

-- Enable Row Level Security
ALTER TABLE public.user_holiday_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can insert specific holiday permissions
CREATE POLICY "Admins can insert user holiday permissions"
  ON public.user_holiday_permissions
  FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

-- Only admins can update specific holiday permissions  
CREATE POLICY "Admins can update user holiday permissions"
  ON public.user_holiday_permissions
  FOR UPDATE
  USING (get_current_user_role() = 'admin');

-- Only admins can delete specific holiday permissions
CREATE POLICY "Admins can delete user holiday permissions"
  ON public.user_holiday_permissions
  FOR DELETE
  USING (get_current_user_role() = 'admin');

-- Users can view their own permissions or admins can view all
CREATE POLICY "Users can view relevant holiday permissions"
  ON public.user_holiday_permissions
  FOR SELECT
  USING (user_id = auth.uid() OR get_current_user_role() = 'admin');

-- Create enhanced holiday permission checking function
CREATE OR REPLACE FUNCTION public.check_user_holiday_permission(p_user_id UUID, p_holiday_date DATE, p_target_state TEXT DEFAULT 'VIC')
RETURNS TABLE(
  is_allowed BOOLEAN,
  permission_source TEXT,
  holiday_name TEXT,
  message TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  holiday_record RECORD;
  user_role TEXT;
  specific_permission BOOLEAN;
  general_permission BOOLEAN;
BEGIN
  -- Check if the date is a public holiday
  SELECT ph.id, ph.name INTO holiday_record
  FROM public.public_holidays ph
  WHERE ph.date = p_holiday_date AND ph.state = p_target_state;
  
  -- If not a holiday, allow entry
  IF holiday_record.id IS NULL THEN
    RETURN QUERY SELECT true, 'not_holiday'::TEXT, NULL::TEXT, 'Not a public holiday'::TEXT;
    RETURN;
  END IF;
  
  -- Get user role for admin override
  SELECT role::TEXT INTO user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Admin override: admins can always log holiday entries
  IF user_role = 'admin' THEN
    RETURN QUERY SELECT 
      true, 
      'admin_override'::TEXT, 
      holiday_record.name, 
      'Admin privilege allows holiday entries'::TEXT;
    RETURN;
  END IF;
  
  -- Check for specific holiday permission (highest priority)
  SELECT uhp.is_allowed INTO specific_permission
  FROM public.user_holiday_permissions uhp
  WHERE uhp.user_id = p_user_id AND uhp.holiday_id = holiday_record.id;
  
  -- If specific permission exists, use it
  IF specific_permission IS NOT NULL THEN
    IF specific_permission THEN
      RETURN QUERY SELECT 
        true, 
        'specific_permission'::TEXT, 
        holiday_record.name, 
        'Specific permission granted for this holiday'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        false, 
        'specific_permission'::TEXT, 
        holiday_record.name, 
        'Specifically blocked from working on ' || holiday_record.name || '. Contact your administrator.'::TEXT;
    END IF;
    RETURN;
  END IF;
  
  -- Fall back to general holiday permission
  SELECT ws.allow_holiday_entries INTO general_permission
  FROM public.work_schedules ws
  WHERE ws.user_id = p_user_id;
  
  -- Use general permission or default to false
  general_permission := COALESCE(general_permission, false);
  
  IF general_permission THEN
    RETURN QUERY SELECT 
      true, 
      'general_permission'::TEXT, 
      holiday_record.name, 
      'General holiday permission allows entry'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      false, 
      'general_permission'::TEXT, 
      holiday_record.name, 
      'Holiday entries not allowed for ' || holiday_record.name || '. Contact your administrator for approval.'::TEXT;
  END IF;
END;
$$;

-- Create function to get holiday permission matrix for admin UI
CREATE OR REPLACE FUNCTION public.get_holiday_permission_matrix(p_year INTEGER DEFAULT NULL)
RETURNS TABLE(
  holiday_id UUID,
  holiday_name TEXT,
  holiday_date DATE,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  specific_permission BOOLEAN,
  general_permission BOOLEAN,
  effective_permission BOOLEAN,
  permission_source TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  target_year INTEGER;
BEGIN
  -- Default to current year if not specified
  target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  RETURN QUERY
  SELECT 
    ph.id as holiday_id,
    ph.name as holiday_name,
    ph.date as holiday_date,
    p.id as user_id,
    COALESCE(p.full_name, p.email, 'Unknown User') as user_name,
    p.email as user_email,
    uhp.is_allowed as specific_permission,
    ws.allow_holiday_entries as general_permission,
    CASE 
      -- Admin always allowed
      WHEN p.role = 'admin' THEN true
      -- Specific permission takes priority
      WHEN uhp.is_allowed IS NOT NULL THEN uhp.is_allowed
      -- Fall back to general permission
      ELSE COALESCE(ws.allow_holiday_entries, false)
    END as effective_permission,
    CASE 
      WHEN p.role = 'admin' THEN 'admin_override'
      WHEN uhp.is_allowed IS NOT NULL THEN 'specific_permission'
      ELSE 'general_permission'
    END as permission_source
  FROM public.public_holidays ph
  CROSS JOIN public.profiles p
  LEFT JOIN public.user_holiday_permissions uhp ON uhp.user_id = p.id AND uhp.holiday_id = ph.id
  LEFT JOIN public.work_schedules ws ON ws.user_id = p.id
  WHERE ph.year = target_year AND ph.state = 'VIC'
  ORDER BY ph.date, p.full_name, p.email;
END;
$$;
