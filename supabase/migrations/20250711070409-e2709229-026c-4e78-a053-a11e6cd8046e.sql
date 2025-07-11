-- Insert default expense categories if they don't exist
INSERT INTO expense_categories (name, description, is_active, sort_order) 
SELECT name, description, is_active, sort_order FROM (
  VALUES 
    ('Travel', 'Business travel expenses including flights, hotels, and transportation', true, 1),
    ('Meals & Entertainment', 'Business meals, client entertainment, and catering', true, 2),
    ('Office Supplies', 'Stationery, equipment, and general office supplies', true, 3),
    ('Technology', 'Software, hardware, and IT-related expenses', true, 4),
    ('Professional Services', 'Consulting, legal, accounting, and other professional services', true, 5),
    ('Training & Development', 'Courses, conferences, and professional development', true, 6),
    ('Marketing', 'Advertising, promotional materials, and marketing campaigns', true, 7),
    ('Utilities', 'Phone, internet, and other business utilities', true, 8),
    ('Other', 'Miscellaneous business expenses', true, 9)
) AS categories(name, description, is_active, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories WHERE expense_categories.name = categories.name
);

-- Insert default subcategories if they don't exist
INSERT INTO expense_subcategories (category_id, name, description, is_active, sort_order)
SELECT 
  cat.id,
  sub.name,
  sub.description,
  true,
  sub.sort_order
FROM (
  VALUES
    ('Travel', 'Flights', 'Air travel for business', 1),
    ('Travel', 'Hotels', 'Accommodation expenses', 2),
    ('Travel', 'Ground Transport', 'Taxis, trains, rental cars', 3),
    ('Meals & Entertainment', 'Client Meals', 'Business meals with clients', 1),
    ('Meals & Entertainment', 'Team Meals', 'Team building and working meals', 2),
    ('Technology', 'Software', 'Software licenses and subscriptions', 1),
    ('Technology', 'Hardware', 'Computer equipment and accessories', 2),
    ('Office Supplies', 'Stationery', 'Pens, paper, notebooks', 1),
    ('Office Supplies', 'Equipment', 'Printers, scanners, furniture', 2)
) AS sub(category_name, name, description, sort_order)
JOIN expense_categories cat ON cat.name = sub.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM expense_subcategories 
  WHERE expense_subcategories.category_id = cat.id 
  AND expense_subcategories.name = sub.name
);