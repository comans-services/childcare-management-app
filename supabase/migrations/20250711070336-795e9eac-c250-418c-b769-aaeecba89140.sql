-- Insert default expense categories if they don't exist
INSERT INTO expense_categories (name, description, is_active, sort_order) VALUES
('Travel', 'Business travel expenses including flights, hotels, and transportation', true, 1),
('Meals & Entertainment', 'Business meals, client entertainment, and catering', true, 2),
('Office Supplies', 'Stationery, equipment, and general office supplies', true, 3),
('Technology', 'Software, hardware, and IT-related expenses', true, 4),
('Professional Services', 'Consulting, legal, accounting, and other professional services', true, 5),
('Training & Development', 'Courses, conferences, and professional development', true, 6),
('Marketing', 'Advertising, promotional materials, and marketing campaigns', true, 7),
('Utilities', 'Phone, internet, and other business utilities', true, 8),
('Other', 'Miscellaneous business expenses', true, 9)
ON CONFLICT (name) DO NOTHING;

-- Insert default subcategories if they don't exist
INSERT INTO expense_subcategories (category_id, name, description, is_active, sort_order)
SELECT 
  cat.id,
  sub.name,
  sub.description,
  true,
  sub.sort_order
FROM (
  SELECT 'Travel' as category_name, 'Flights' as name, 'Air travel for business' as description, 1 as sort_order
  UNION ALL SELECT 'Travel', 'Hotels', 'Accommodation expenses', 2
  UNION ALL SELECT 'Travel', 'Ground Transport', 'Taxis, trains, rental cars', 3
  UNION ALL SELECT 'Meals & Entertainment', 'Client Meals', 'Business meals with clients', 1
  UNION ALL SELECT 'Meals & Entertainment', 'Team Meals', 'Team building and working meals', 2
  UNION ALL SELECT 'Technology', 'Software', 'Software licenses and subscriptions', 1
  UNION ALL SELECT 'Technology', 'Hardware', 'Computer equipment and accessories', 2
  UNION ALL SELECT 'Office Supplies', 'Stationery', 'Pens, paper, notebooks', 1
  UNION ALL SELECT 'Office Supplies', 'Equipment', 'Printers, scanners, furniture', 2
) sub
JOIN expense_categories cat ON cat.name = sub.category_name
ON CONFLICT (category_id, name) DO NOTHING;