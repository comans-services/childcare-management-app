-- Create expense status enum
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- Create expense_categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_subcategories table
CREATE TABLE public.expense_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id),
  subcategory_id UUID REFERENCES public.expense_subcategories(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  status public.expense_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_attachments table
CREATE TABLE public.expense_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-receipts', 'expense-receipts', false);

-- Enable RLS on all tables
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Anyone can view expense categories" ON public.expense_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage expense categories" ON public.expense_categories
  FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for expense_subcategories
CREATE POLICY "Anyone can view expense subcategories" ON public.expense_subcategories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage expense subcategories" ON public.expense_subcategories
  FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id OR get_current_user_role() = 'admin');

CREATE POLICY "Users can create their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft/submitted expenses" ON public.expenses
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    (status IN ('draft', 'submitted') OR get_current_user_role() = 'admin')
  );

CREATE POLICY "Users can delete their own draft expenses" ON public.expenses
  FOR DELETE USING (
    auth.uid() = user_id AND status = 'draft' OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Admins can manage all expenses" ON public.expenses
  FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for expense_attachments
CREATE POLICY "Users can view attachments for their expenses" ON public.expense_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE expenses.id = expense_attachments.expense_id 
      AND (expenses.user_id = auth.uid() OR get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Users can upload attachments to their expenses" ON public.expense_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE expenses.id = expense_attachments.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments from their expenses" ON public.expense_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE expenses.id = expense_attachments.expense_id 
      AND (expenses.user_id = auth.uid() OR get_current_user_role() = 'admin')
    )
  );

-- Storage policies for expense receipts
CREATE POLICY "Users can view their own expense receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'expense-receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own expense receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'expense-receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own expense receipts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'expense-receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage all expense receipts" ON storage.objects
  FOR ALL USING (
    bucket_id = 'expense-receipts' AND 
    get_current_user_role() = 'admin'
  );

-- Create timestamp update triggers
CREATE OR REPLACE FUNCTION public.update_expense_categories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_expense_subcategories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_expenses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_categories_timestamp();

CREATE TRIGGER update_expense_subcategories_updated_at
  BEFORE UPDATE ON public.expense_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_subcategories_timestamp();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expenses_timestamp();

-- Pre-populate expense categories and subcategories
INSERT INTO public.expense_categories (name, description, sort_order) VALUES
  ('Travel', 'Work-related travel expenses including transportation and accommodation', 1),
  ('Work Tools & Equipment', 'Specialized tools and equipment required for work', 2),
  ('Courier & Postage', 'Business-related shipping and postal costs', 3),
  ('Training & Certification', 'Work-directed training and certification expenses', 4),
  ('Meals', 'Meals during overnight travel or extended work hours', 5),
  ('Light Refreshments', 'Tea, coffee, and basic refreshments for internal meetings', 6);

-- Get category IDs for subcategories
WITH categories AS (
  SELECT id, name FROM public.expense_categories
)
INSERT INTO public.expense_subcategories (category_id, name, description, sort_order)
SELECT 
  c.id,
  sub.name,
  sub.description,
  sub.sort_order
FROM categories c
CROSS JOIN (
  VALUES 
    ('Travel', 'Taxi / Uber / Rideshare', 'Between client sites, airports, hotels, or events', 1),
    ('Travel', 'Flights', 'For approved work travel', 2),
    ('Travel', 'Accommodation', 'For overnight business trips only', 3),
    ('Travel', 'Parking Fees', 'For work-related meetings or site visits', 4),
    ('Travel', 'Tolls', 'Incurred on approved routes during work', 5),
    ('Travel', 'Public Transport', 'To/from meetings, events, or clients', 6),
    ('Work Tools & Equipment', 'Specialized Tools', 'Tools/equipment not provided, required for on-site work', 1),
    ('Work Tools & Equipment', 'Replacement Accessories', 'Cables, mice, headsets used during site work', 2),
    ('Courier & Postage', 'Courier Services', 'Send or receive business equipment, documents, replacement parts', 1),
    ('Training & Certification', 'Course Fees', 'Job-relevant certifications (Microsoft, Cisco, etc.)', 1),
    ('Training & Certification', 'Exam Fees', 'Where training is mandated or requested by business', 2),
    ('Meals', 'Travel Meals', 'Meals during overnight work travel', 1),
    ('Meals', 'Extended Hours Meals', 'Meals during extended hours (e.g., support shift beyond 10 PM)', 2),
    ('Light Refreshments', 'Meeting Refreshments', 'Tea, coffee, water, snacks for internal meetings or site visits', 1)
) AS sub(category_name, name, description, sort_order)
WHERE c.name = sub.category_name;

-- Create audit trigger for expenses
CREATE OR REPLACE FUNCTION public.log_expense_audit()
RETURNS TRIGGER AS $$
DECLARE
  user_display_name TEXT;
  category_name TEXT;
  subcategory_name TEXT;
  description_val TEXT;
  details_val JSONB;
  action_type TEXT;
  audit_user_id UUID;
BEGIN
  -- Determine action type and audit user
  IF TG_OP = 'INSERT' THEN
    action_type := 'expense_created';
    audit_user_id := NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check for status changes
    IF OLD.status != NEW.status THEN
      CASE NEW.status
        WHEN 'submitted' THEN action_type := 'expense_submitted';
        WHEN 'approved' THEN action_type := 'expense_approved';
        WHEN 'rejected' THEN action_type := 'expense_rejected';
        ELSE action_type := 'expense_updated';
      END CASE;
      audit_user_id := COALESCE(NEW.approved_by, NEW.user_id);
    ELSE
      action_type := 'expense_updated';
      audit_user_id := NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'expense_deleted';
    audit_user_id := OLD.user_id;
  END IF;

  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

  -- Get category and subcategory names
  IF TG_OP = 'DELETE' THEN
    SELECT name INTO category_name FROM public.expense_categories WHERE id = OLD.category_id;
    SELECT name INTO subcategory_name FROM public.expense_subcategories WHERE id = OLD.subcategory_id;
  ELSE
    SELECT name INTO category_name FROM public.expense_categories WHERE id = NEW.category_id;
    SELECT name INTO subcategory_name FROM public.expense_subcategories WHERE id = NEW.subcategory_id;
  END IF;

  -- Build description and details
  IF TG_OP = 'INSERT' THEN
    description_val := 'Created expense: ' || COALESCE(category_name, 'Unknown Category') || 
                     CASE WHEN subcategory_name IS NOT NULL THEN ' - ' || subcategory_name ELSE '' END ||
                     ' ($' || NEW.amount || ')';
    details_val := jsonb_build_object(
      'category_name', category_name,
      'subcategory_name', subcategory_name,
      'amount', NEW.amount,
      'expense_date', NEW.expense_date,
      'description', NEW.description,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    description_val := CASE action_type
      WHEN 'expense_submitted' THEN 'Submitted expense for approval'
      WHEN 'expense_approved' THEN 'Approved expense'
      WHEN 'expense_rejected' THEN 'Rejected expense'
      ELSE 'Updated expense'
    END || ': ' || COALESCE(category_name, 'Unknown Category') ||
    CASE WHEN subcategory_name IS NOT NULL THEN ' - ' || subcategory_name ELSE '' END ||
    ' ($' || NEW.amount || ')';
    
    details_val := jsonb_build_object(
      'category_name', category_name,
      'subcategory_name', subcategory_name,
      'amount', NEW.amount,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'approved_by', NEW.approved_by,
      'rejection_reason', NEW.rejection_reason
    );
  ELSIF TG_OP = 'DELETE' THEN
    description_val := 'Deleted expense: ' || COALESCE(category_name, 'Unknown Category') ||
                      CASE WHEN subcategory_name IS NOT NULL THEN ' - ' || subcategory_name ELSE '' END ||
                      ' ($' || OLD.amount || ')';
    details_val := jsonb_build_object(
      'category_name', category_name,
      'subcategory_name', subcategory_name,
      'amount', OLD.amount,
      'expense_date', OLD.expense_date,
      'status', OLD.status
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
    audit_user_id,
    user_display_name,
    action_type,
    'Expense',
    description_val,
    details_val
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE TRIGGER expense_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_expense_audit();

-- Add deletion audit trigger for expense_attachments
CREATE TRIGGER expense_attachments_audit_trigger
  AFTER DELETE ON public.expense_attachments
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();

-- Create helper function to check if expense is editable
CREATE OR REPLACE FUNCTION public.is_expense_editable(expense_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expense_status public.expense_status;
  expense_user_id UUID;
BEGIN
  SELECT status, user_id INTO expense_status, expense_user_id
  FROM public.expenses 
  WHERE id = expense_id;
  
  -- Admins can always edit
  IF get_current_user_role() = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Users can only edit their own expenses that are draft or submitted
  RETURN (
    expense_user_id = auth.uid() AND 
    expense_status IN ('draft', 'submitted')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;