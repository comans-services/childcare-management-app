
-- Insert additional Victoria Australia public holidays for 2026
INSERT INTO public.public_holidays (date, name, state, year) VALUES
('2026-09-25', 'Friday before the AFL Grand Final', 'VIC', 2026),
('2026-11-03', 'Melbourne Cup', 'VIC', 2026),
('2026-12-25', 'Christmas Day', 'VIC', 2026),
('2026-12-28', 'Boxing Day', 'VIC', 2026)

ON CONFLICT (date, state) DO NOTHING;
