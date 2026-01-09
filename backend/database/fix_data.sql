-- Fix HOD Revenue and Attendance Data
-- Run this script in phpMyAdmin to fix the pie chart issues

USE hod_management2;

-- =====================================================
-- 1. FIX REVENUE TABLE - Update hod_id to match actual HODs (11-18)
-- =====================================================
UPDATE revenue SET hod_id = 11 WHERE hod_id = 1;  -- Dr. Rajesh Kumar (Horticulture)
UPDATE revenue SET hod_id = 12 WHERE hod_id = 2;  -- Smt. Priya Sharma (Sericulture)
UPDATE revenue SET hod_id = 13 WHERE hod_id = 3;  -- Shri. Venkat Rao (Fisheries)
UPDATE revenue SET hod_id = 14 WHERE hod_id = 4;  -- Dr. Lakshmi Devi (Animal Husbandry)
UPDATE revenue SET hod_id = 15 WHERE hod_id = 5;  -- Shri. Mohd. Imran (Soil Conservation)
UPDATE revenue SET hod_id = 16 WHERE hod_id = 6;  -- Dr. Suresh Reddy (Seed Certification)
UPDATE revenue SET hod_id = 17 WHERE hod_id = 7;  -- Smt. Kavitha Rani (Agricultural Marketing)
UPDATE revenue SET hod_id = 18 WHERE hod_id = 8;  -- Shri. Ramesh Babu (Irrigation)

-- =====================================================
-- 2. FIX STAFF TABLE - Assign HODs to staff members
-- =====================================================
UPDATE staff SET hod_id = 11 WHERE id = 1;  -- Venkat -> Horticulture
UPDATE staff SET hod_id = 12 WHERE id = 2;  -- Ajay -> Sericulture
UPDATE staff SET hod_id = 13 WHERE id = 3;  -- Ramesh -> Fisheries
UPDATE staff SET hod_id = 14 WHERE id = 4;  -- Suresh -> Animal Husbandry
UPDATE staff SET hod_id = 15 WHERE id = 5;  -- Kiran -> Soil Conservation

-- =====================================================
-- 3. ADD ATTENDANCE DATA - For all staff for last 7 days
-- =====================================================
-- Clear any existing attendance data first
DELETE FROM attendance;

-- Today's attendance
INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES
(1, 11, CURDATE(), 'present', '09:00:00', '18:00:00', 'On time'),
(2, 12, CURDATE(), 'present', '09:15:00', '18:30:00', 'On time'),
(3, 13, CURDATE(), 'present', '09:00:00', '17:45:00', 'Left early'),
(4, 14, CURDATE(), 'absent', NULL, NULL, 'Sick leave'),
(5, 15, CURDATE(), 'half_day', '09:00:00', '13:00:00', 'Personal work');

-- Yesterday's attendance
INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES
(1, 11, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00', NULL),
(2, 12, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00', NULL),
(3, 13, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00', NULL),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:30:00', '18:00:00', 'Late'),
(5, 15, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00', NULL);

-- 2 days ago attendance
INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES
(1, 11, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present', '09:00:00', '18:00:00', NULL),
(2, 12, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'absent', NULL, NULL, 'Medical leave'),
(3, 13, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present', '09:00:00', '18:00:00', NULL),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present', '09:00:00', '18:00:00', NULL),
(5, 15, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'half_day', '09:00:00', '13:30:00', NULL);

-- 3 days ago attendance
INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES
(1, 11, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'present', '09:00:00', '18:00:00', NULL),
(2, 12, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'present', '09:00:00', '18:00:00', NULL),
(3, 13, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'leave', NULL, NULL, 'Annual leave'),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'present', '09:00:00', '18:00:00', NULL),
(5, 15, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'present', '09:00:00', '18:00:00', NULL);

-- 4 days ago attendance
INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES
(1, 11, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'present', '09:00:00', '18:00:00', NULL),
(2, 12, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'present', '09:00:00', '18:00:00', NULL),
(3, 13, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'present', '09:00:00', '18:00:00', NULL),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'absent', NULL, NULL, 'Emergency'),
(5, 15, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'present', '09:00:00', '18:00:00', NULL);

-- 5 days ago attendance
INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES
(1, 11, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'half_day', '09:00:00', '13:00:00', 'Doctor appointment'),
(2, 12, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'present', '09:00:00', '18:00:00', NULL),
(3, 13, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'present', '09:00:00', '18:00:00', NULL),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'present', '09:00:00', '18:00:00', NULL),
(5, 15, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'present', '09:00:00', '18:00:00', NULL);

-- 6 days ago attendance
INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES
(1, 11, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'present', '09:00:00', '18:00:00', NULL),
(2, 12, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'present', '09:00:00', '18:00:00', NULL),
(3, 13, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'present', '09:00:00', '18:00:00', NULL),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'present', '09:00:00', '18:00:00', NULL),
(5, 15, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'leave', NULL, NULL, 'Festival leave');

-- =====================================================
-- VERIFY THE DATA
-- =====================================================
SELECT 'Revenue by HOD:' as Info;
SELECT h.name as hod_name, h.department, COALESCE(SUM(r.amount), 0) as total_revenue
FROM hods h
LEFT JOIN revenue r ON h.id = r.hod_id
GROUP BY h.id, h.name, h.department;

SELECT 'Attendance Summary:' as Info;
SELECT h.name as hod_name, 
       SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
       SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
       SUM(CASE WHEN a.status = 'half_day' THEN 1 ELSE 0 END) as half_day,
       SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END) as on_leave
FROM hods h
LEFT JOIN attendance a ON h.id = a.hod_id
GROUP BY h.id, h.name;
