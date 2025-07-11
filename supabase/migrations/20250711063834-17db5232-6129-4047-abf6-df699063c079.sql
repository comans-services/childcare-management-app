-- Create expense notification audit logs
INSERT INTO audit_logs (user_id, user_name, action, entity_name, description, details)
SELECT 
  user_id,
  'System' as user_name,
  'expense_audit_system_enabled' as action,
  'Expense Management' as entity_name,
  'Enhanced expense management system with notifications and audit trails activated' as description,
  jsonb_build_object(
    'features', ARRAY['notifications', 'audit_trails', 'advanced_search', 'mobile_optimization', 'export'],
    'timestamp', now()
  ) as details
FROM profiles 
WHERE role = 'admin'
LIMIT 1;

-- Create expense storage bucket for receipts if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for expense receipts
CREATE POLICY "Users can upload receipts for their expenses" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'expense-receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view receipts for their expenses" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'expense-receipts' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Users can update receipts for their expenses" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'expense-receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete receipts for their expenses" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'expense-receipts' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

-- Create trigger to log expense changes for audit trail
CREATE OR REPLACE FUNCTION log_expense_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_display_name text;
  description_val text;
  details_val jsonb;
  action_type text;
  audit_user_id uuid;
BEGIN
  -- Determine action type and audit user
  IF TG_OP = 'INSERT' THEN
    action_type := 'expense_created';
    audit_user_id := NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check for status changes to determine specific action
    IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
      action_type := 'expense_submitted';
      audit_user_id := NEW.user_id;
    ELSIF OLD.status = 'submitted' AND NEW.status = 'approved' THEN
      action_type := 'expense_approved';
      audit_user_id := NEW.approved_by;
    ELSIF OLD.status = 'submitted' AND NEW.status = 'rejected' THEN
      action_type := 'expense_rejected';
      audit_user_id := NEW.approved_by;
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

  -- Build description and details
  IF TG_OP = 'INSERT' THEN
    description_val := 'Created expense: ' || COALESCE(NEW.description, 'No description') ||
                     ' for ' || NEW.amount;
    details_val := jsonb_build_object(
      'expense_id', NEW.id,
      'amount', NEW.amount,
      'category_id', NEW.category_id,
      'expense_date', NEW.expense_date,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF action_type = 'expense_approved' THEN
      description_val := 'Approved expense: ' || COALESCE(NEW.description, 'No description') ||
                        ' for ' || NEW.amount;
    ELSIF action_type = 'expense_rejected' THEN
      description_val := 'Rejected expense: ' || COALESCE(NEW.description, 'No description') ||
                        ' for ' || NEW.amount || 
                        CASE WHEN NEW.rejection_reason IS NOT NULL 
                             THEN ' - Reason: ' || NEW.rejection_reason 
                             ELSE '' END;
    ELSIF action_type = 'expense_submitted' THEN
      description_val := 'Submitted expense for approval: ' || COALESCE(NEW.description, 'No description') ||
                        ' for ' || NEW.amount;
    ELSE
      description_val := 'Updated expense: ' || COALESCE(NEW.description, 'No description');
    END IF;
    
    details_val := jsonb_build_object(
      'expense_id', NEW.id,
      'amount', NEW.amount,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'rejection_reason', NEW.rejection_reason,
      'approved_by', NEW.approved_by,
      'approved_at', NEW.approved_at
    );
  ELSIF TG_OP = 'DELETE' THEN
    description_val := 'Deleted expense: ' || COALESCE(OLD.description, 'No description') ||
                      ' for ' || OLD.amount;
    details_val := jsonb_build_object(
      'expense_id', OLD.id,
      'amount', OLD.amount,
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
$$;

-- Create triggers for expense audit logging
CREATE TRIGGER expense_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION log_expense_audit();