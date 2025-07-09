
-- Insert Victoria Australia public holidays for 2025 and 2026
INSERT INTO public.public_holidays (date, name, state, year) VALUES
-- 2025 holidays
('2025-01-01', 'New Year''s Day', 'VIC', 2025),
('2025-01-27', 'Australia Day', 'VIC', 2025),
('2025-03-10', 'Labour Day', 'VIC', 2025),
('2025-04-18', 'Good Friday', 'VIC', 2025),
('2025-04-19', 'Holy Saturday', 'VIC', 2025),
('2025-04-20', 'Easter', 'VIC', 2025),
('2025-04-21', 'Easter Monday', 'VIC', 2025),
('2025-04-25', 'Anzac Day', 'VIC', 2025),
('2025-06-09', 'King''s Official Birthday', 'VIC', 2025),
('2025-09-26', 'Friday before the AFL Grand Final', 'VIC', 2025),
('2025-11-04', 'Melbourne Cup', 'VIC', 2025),
('2025-12-25', 'Christmas Day', 'VIC', 2025),
('2025-12-26', 'Boxing Day', 'VIC', 2025),

-- 2026 holidays
('2026-01-01', 'New Year''s Day', 'VIC', 2026),
('2026-01-26', 'Australia Day', 'VIC', 2026),
('2026-03-09', 'Labour Day', 'VIC', 2026),
('2026-04-03', 'Good Friday', 'VIC', 2026),
('2026-04-04', 'Holy Saturday', 'VIC', 2026),
('2026-04-05', 'Easter', 'VIC', 2026),
('2026-04-06', 'Easter Monday', 'VIC', 2026),
('2026-04-25', 'Anzac Day', 'VIC', 2026),
('2026-06-08', 'King''s Official Birthday', 'VIC', 2026),
('2026-09-25', 'Friday before the AFL Grand Final', 'VIC', 2026),
('2026-11-03', 'Melbourne Cup', 'VIC', 2026),
('2026-12-25', 'Christmas Day', 'VIC', 2026),
('2026-12-28', 'Boxing Day', 'VIC', 2026)

ON CONFLICT (date, state) DO NOTHING;
