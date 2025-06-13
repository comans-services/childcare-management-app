
-- Update existing work schedules for part-time employees to have 3 working days instead of 5
UPDATE public.work_schedules 
SET working_days = 3, updated_at = now()
WHERE user_id IN (
  SELECT id 
  FROM public.profiles 
  WHERE employment_type = 'part-time'
) 
AND working_days = 5;

-- Update the create_default_work_schedule function to use employment type defaults
CREATE OR REPLACE FUNCTION public.create_default_work_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  default_days integer;
BEGIN
  -- Get default working days based on employment type
  SELECT CASE 
    WHEN employment_type = 'part-time' THEN 3
    ELSE 5
  END INTO default_days
  FROM public.profiles 
  WHERE id = NEW.id;
  
  -- If no employment type found, default to 5 days
  IF default_days IS NULL THEN
    default_days := 5;
  END IF;
  
  INSERT INTO public.work_schedules (user_id, working_days, created_by)
  VALUES (NEW.id, default_days, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
