
-- Create public_holidays table for storing Victoria Australia holidays
CREATE TABLE public.public_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'VIC',
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate holidays for the same date and state
  CONSTRAINT unique_holiday_per_date_state UNIQUE (date, state)
);

-- Create index on date for fast lookups during validation
CREATE INDEX idx_public_holidays_date ON public.public_holidays (date);
CREATE INDEX idx_public_holidays_year_state ON public.public_holidays (year, state);

-- Add timestamp trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_public_holidays_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_public_holidays_timestamp
  BEFORE UPDATE ON public.public_holidays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_public_holidays_timestamp();

-- Enable Row Level Security
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_holidays table
-- Authenticated users can read public holidays
CREATE POLICY "Authenticated users can view public holidays"
  ON public.public_holidays
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert public holidays
CREATE POLICY "Admins can insert public holidays"
  ON public.public_holidays
  FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

-- Only admins can update public holidays
CREATE POLICY "Admins can update public holidays"
  ON public.public_holidays
  FOR UPDATE
  USING (get_current_user_role() = 'admin');

-- Only admins can delete public holidays
CREATE POLICY "Admins can delete public holidays"
  ON public.public_holidays
  FOR DELETE
  USING (get_current_user_role() = 'admin');

-- Add allow_holiday_entries column to work_schedules table
ALTER TABLE public.work_schedules 
ADD COLUMN allow_holiday_entries BOOLEAN NOT NULL DEFAULT false;

-- Create database function to check if a date is a public holiday
CREATE OR REPLACE FUNCTION public.is_public_holiday(entry_date DATE, target_state TEXT DEFAULT 'VIC')
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.public_holidays 
    WHERE date = entry_date 
      AND state = target_state
  );
$$;

-- Create function to get public holiday name for a date
CREATE OR REPLACE FUNCTION public.get_public_holiday_name(entry_date DATE, target_state TEXT DEFAULT 'VIC')
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT name 
  FROM public.public_holidays 
  WHERE date = entry_date 
    AND state = target_state
  LIMIT 1;
$$;
