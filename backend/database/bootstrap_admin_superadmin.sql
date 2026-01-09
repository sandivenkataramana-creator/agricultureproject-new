-- Development bootstrap for admin + superadmin users
-- WARNING: For local/dev use only. Change passwords immediately.

-- 1) Ensure role enum supports RBAC roles
-- If your `users.role` is VARCHAR, you can skip this ALTER.
ALTER TABLE users MODIFY COLUMN role ENUM('superadmin','admin','hod','staff','district_officer') NOT NULL DEFAULT 'staff';

-- 2) Ensure an admin user exists
INSERT INTO users (username, password, email, role, hod_id, staff_id, name, status, password_changed)
SELECT 'admin', 'admin123', 'admin@agri.gov.in', 'admin', NULL, NULL, 'Admin User', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 3) Create a superadmin user
INSERT INTO users (username, password, email, role, hod_id, staff_id, name, status, password_changed)
SELECT 'superadmin', 'superadmin123', 'superadmin@agri.gov.in', 'superadmin', NULL, NULL, 'Super Admin', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin');
