
-- Add has_budget_limit column to projects table
ALTER TABLE public.projects 
ADD COLUMN has_budget_limit boolean NOT NULL DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN public.projects.has_budget_limit IS 'Controls whether the project enforces budget tracking. When false, project has unlimited budget.';
