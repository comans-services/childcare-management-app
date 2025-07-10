-- Phase 1: Leave Application System - Database Schema & Core Infrastructure

-- Create enum for leave application status
CREATE TYPE public.leave_status AS ENUM (
  'pending',
  'approved', 
  'rejected',
  'cancelled'
);

-- Create leave_types table (system-defined leave categories)
CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  requires_attachment BOOLEAN NOT NULL DEFAULT false,
  default_balance_days INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave_balances table (track available leave days per user per type)
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  total_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  remaining_days NUMERIC(5,1) GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, leave_type_id, year)
);

-- Create leave_applications table (main application records)
CREATE TABLE public.leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  business_days_count NUMERIC(4,1) NOT NULL,
  reason TEXT,
  status public.leave_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  manager_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_business_days CHECK (business_days_count > 0)
);

-- Create leave_application_attachments table (supporting documents)
CREATE TABLE public.leave_application_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.leave_applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for leave application attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('leave-attachments', 'leave-attachments', false);

-- Enable RLS on all tables
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_application_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_types (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view leave types" ON public.leave_types
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for leave_balances
CREATE POLICY "Users can view their own leave balances" ON public.leave_balances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leave balances" ON public.leave_balances
  FOR SELECT TO authenticated USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage leave balances" ON public.leave_balances
  FOR ALL TO authenticated USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies for leave_applications  
CREATE POLICY "Users can view their own leave applications" ON public.leave_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leave applications" ON public.leave_applications
  FOR SELECT TO authenticated USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can create their own leave applications" ON public.leave_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending leave applications" ON public.leave_applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all leave applications" ON public.leave_applications
  FOR ALL TO authenticated USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies for leave_application_attachments
CREATE POLICY "Users can view attachments for their applications" ON public.leave_application_attachments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.leave_applications la 
      WHERE la.id = application_id AND la.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attachments" ON public.leave_application_attachments
  FOR SELECT TO authenticated USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can upload attachments to their applications" ON public.leave_application_attachments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leave_applications la 
      WHERE la.id = application_id AND la.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all attachments" ON public.leave_application_attachments
  FOR ALL TO authenticated USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Storage policies for leave attachments
CREATE POLICY "Users can upload their own leave attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'leave-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own leave attachments" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'leave-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all leave attachments" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'leave-attachments' AND 
    get_current_user_role() = 'admin'
  );

-- Function to calculate business days between two dates
CREATE OR REPLACE FUNCTION public.calculate_business_days(
  start_date DATE,
  end_date DATE,
  target_state TEXT DEFAULT 'VIC'
) RETURNS NUMERIC AS $$
DECLARE
  business_days NUMERIC := 0;
  current_date DATE;
BEGIN
  current_date := start_date;
  
  WHILE current_date <= end_date LOOP
    -- Skip weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      -- Skip public holidays
      IF NOT is_public_holiday(current_date, target_state) THEN
        business_days := business_days + 1;
      END IF;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN business_days;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update leave balances when application is approved
CREATE OR REPLACE FUNCTION public.update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Update the leave balance
    UPDATE public.leave_balances 
    SET used_days = used_days + NEW.business_days_count,
        updated_at = now()
    WHERE user_id = NEW.user_id 
      AND leave_type_id = NEW.leave_type_id 
      AND year = EXTRACT(YEAR FROM NEW.start_date);
    
    -- If no balance record exists, create one
    IF NOT FOUND THEN
      INSERT INTO public.leave_balances (user_id, leave_type_id, year, total_days, used_days)
      SELECT NEW.user_id, NEW.leave_type_id, EXTRACT(YEAR FROM NEW.start_date), 
             COALESCE(lt.default_balance_days, 0), NEW.business_days_count
      FROM public.leave_types lt WHERE lt.id = NEW.leave_type_id;
    END IF;
    
    -- Lock timesheet entries for approved leave dates
    PERFORM public.lock_leave_dates(NEW.user_id, NEW.start_date, NEW.end_date, NEW.id);
  END IF;
  
  -- If status changed from approved to something else, reverse the balance update
  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.leave_balances 
    SET used_days = used_days - NEW.business_days_count,
        updated_at = now()
    WHERE user_id = NEW.user_id 
      AND leave_type_id = NEW.leave_type_id 
      AND year = EXTRACT(YEAR FROM NEW.start_date);
    
    -- Unlock timesheet entries
    PERFORM public.unlock_leave_dates(NEW.user_id, NEW.start_date, NEW.end_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock timesheet dates for approved leave
CREATE OR REPLACE FUNCTION public.lock_leave_dates(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_application_id UUID
) RETURNS VOID AS $$
DECLARE
  current_date DATE;
BEGIN
  current_date := p_start_date;
  
  WHILE current_date <= p_end_date LOOP
    -- Skip weekends
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      -- Update work_schedules to lock this date for this user
      UPDATE public.work_schedules 
      SET locked_until_date = CASE 
        WHEN locked_until_date IS NULL OR locked_until_date < current_date 
        THEN current_date 
        ELSE locked_until_date 
      END,
      lock_reason = CASE 
        WHEN locked_until_date IS NULL OR locked_until_date < current_date
        THEN 'Leave Application (ID: ' || p_application_id || ')'
        ELSE lock_reason
      END,
      locked_at = now(),
      locked_by = auth.uid()
      WHERE user_id = p_user_id;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock timesheet dates when leave is cancelled/rejected
CREATE OR REPLACE FUNCTION public.unlock_leave_dates(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS VOID AS $$
BEGIN
  -- Only unlock dates that were locked by leave applications
  UPDATE public.work_schedules 
  SET locked_until_date = NULL,
      lock_reason = NULL,
      locked_at = NULL,
      locked_by = NULL
  WHERE user_id = p_user_id 
    AND lock_reason LIKE 'Leave Application%'
    AND locked_until_date >= p_start_date 
    AND locked_until_date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for leave balance updates
CREATE TRIGGER update_leave_balance_trigger
  AFTER UPDATE ON public.leave_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_leave_balance_on_approval();

-- Create trigger for automatic business days calculation
CREATE OR REPLACE FUNCTION public.set_business_days_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.business_days_count := public.calculate_business_days(NEW.start_date, NEW.end_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_business_days_trigger
  BEFORE INSERT OR UPDATE ON public.leave_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_business_days_count();

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION public.update_leave_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update timestamp triggers
CREATE TRIGGER update_leave_types_timestamp
  BEFORE UPDATE ON public.leave_types
  FOR EACH ROW EXECUTE FUNCTION public.update_leave_timestamps();

CREATE TRIGGER update_leave_balances_timestamp
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_leave_timestamps();

CREATE TRIGGER update_leave_applications_timestamp
  BEFORE UPDATE ON public.leave_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_leave_timestamps();

-- Pre-populate leave types with Australian standards
INSERT INTO public.leave_types (name, description, requires_attachment, default_balance_days) VALUES
('Annual Leave', 'Paid annual vacation leave', false, 20),
('Personal/Sick Leave', 'Personal illness or injury leave', true, 10),
('Carer''s Leave', 'Care for family member or household member', true, 2),
('Compassionate Leave', 'Bereavement or compassionate circumstances', false, 2),
('Parental Leave', 'Maternity, paternity, or adoption leave', true, 0),
('Unpaid Leave', 'Leave without pay', false, 0),
('Time in Lieu (TOIL)', 'Time off in lieu of overtime payment', false, 0),
('Study Leave', 'Educational or professional development leave', false, 0),
('Public Holiday Substitution', 'Substitute day for public holiday', false, 0);

-- Create initial leave balances for all existing users (Annual and Personal/Sick leave)
INSERT INTO public.leave_balances (user_id, leave_type_id, total_days, used_days)
SELECT 
  p.id as user_id,
  lt.id as leave_type_id,
  lt.default_balance_days as total_days,
  0 as used_days
FROM public.profiles p
CROSS JOIN public.leave_types lt
WHERE lt.name IN ('Annual Leave', 'Personal/Sick Leave', 'Carer''s Leave', 'Compassionate Leave')
  AND lt.default_balance_days > 0;