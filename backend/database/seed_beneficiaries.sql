-- seed_beneficiaries.sql
-- Migration & seed for Beneficiaries module
-- Usage: run this file against your database (e.g. via phpMyAdmin or mysql CLI):
--   mysql -u <user> -p hod_management2 < backend/database/seed_beneficiaries.sql

SET FOREIGN_KEY_CHECKS=0;

-- Ensure schemes table has hod_id (backwards compatible)
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS hod_id INT DEFAULT NULL;

-- Ensure beneficiaries table has new columns used by UI and import
-- Add mobile/gender/dob/aadhaar and amount column used in UI
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS mobile VARCHAR(20) DEFAULT NULL;
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT NULL;
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS dob DATE DEFAULT NULL;
-- Add plain Aadhaar column per user request (be aware this stores PII in plaintext)
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS aadhaar VARCHAR(20) DEFAULT NULL;
-- Add amount column for beneficiary values
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2) DEFAULT 0;

-- Create villages table if missing
CREATE TABLE IF NOT EXISTS villages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  mandal_id INT NOT NULL,
  INDEX idx_village_mandal (mandal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create beneficiaries table if missing
CREATE TABLE IF NOT EXISTS beneficiaries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  beneficiary_name VARCHAR(150) NOT NULL,
  aadhaar_hash VARCHAR(255),
  mobile VARCHAR(20),
  gender VARCHAR(20),
  dob DATE,
  hod_id INT,
  district_id INT NOT NULL,
  mandal_id INT NOT NULL,
  village_id INT,
  scheme_id INT,
  amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_location (district_id, mandal_id, village_id),
  INDEX idx_scheme (scheme_id),
  INDEX idx_hod (hod_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create import/jobs/audit tables if not present (safe to run multiple times)
CREATE TABLE IF NOT EXISTS beneficiary_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(50) NOT NULL,
  performed_by INT NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS beneficiary_import_jobs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  district_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  status ENUM('pending','processing','completed','failed') DEFAULT 'pending',
  total_rows INT DEFAULT 0,
  processed_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  errors LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS beneficiary_import_errors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  job_id BIGINT NOT NULL,
  row_number INT NOT NULL,
  error_message TEXT NOT NULL,
  row_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES beneficiary_import_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create schemes table if missing and insert sample schemes
CREATE TABLE IF NOT EXISTS schemes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  hod_id INT DEFAULT NULL,
  INDEX idx_hod (hod_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO schemes (id, name) VALUES
  (9, 'Raithubandhu'),
  (10, 'Krishi Kalyan'),
  (11, 'Rural Support'),
  (12, 'Livelihood Aid'),
  (13, 'Women Empower')
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET FOREIGN_KEY_CHECKS=1;

-- Insert sample villages (mandal_id should exist in your mandals table)
-- These villages are intentionally small and named so you can find them when filtering by mandal
INSERT INTO villages (name, mandal_id) VALUES
  ('Ankamma Puram', 64),
  ('Bhadra Puram', 64),
  ('Chinna Palli', 65),
  ('Gopalapuram', 66),
  ('Kothla Village', 1),
  ('Radha Nagar', 2),
  ('Mohanpet', 3),
  ('Venkateshwara Puram', 59)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Ensure sample districts (if your DB is missing these)
INSERT INTO districts (id, name) VALUES
  (2, 'East District'),
  (3, 'North District'),
  (5, 'South District'),
  (10, 'West District')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Ensure sample mandals for those districts
INSERT INTO mandals (id, name, district_id) VALUES
  (1, 'Mandal One', 5),
  (2, 'Mandal Two', 5),
  (3, 'Mandal Three', 5),
  (59, 'Mandal Fifty Nine', 10),
  (64, 'Mandal Sixty Four', 2),
  (65, 'Mandal Sixty Five', 2),
  (66, 'Mandal Sixty Six', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name), district_id = VALUES(district_id);

-- Ensure HODs used by sample schemes
INSERT INTO hods (id, name, department, email, phone, status) VALUES
  (11, 'HOD A', 'Dept A', 'hodA@example.com', '9000000001', 'active'),
  (12, 'HOD B', 'Dept B', 'hodB@example.com', '9000000002', 'active'),
  (13, 'HOD C', 'Dept C', 'hodC@example.com', '9000000003', 'active'),
  (14, 'HOD D', 'Dept D', 'hodD@example.com', '9000000004', 'active'),
  (15, 'HOD E', 'Dept E', 'hodE@example.com', '9000000005', 'active'),
  (16, 'HOD F', 'Dept F', 'hodF@example.com', '9000000006', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), department = VALUES(department), email = VALUES(email), phone = VALUES(phone), status = VALUES(status);

-- Ensure sample schemes (associate to HODs)
INSERT INTO schemes (id, name, hod_id) VALUES
  (9, 'Raithubandhu', 11),
  (10, 'Sheep Subsidy', 12),
  (11, 'Irrigation Support', 13),
  (12, 'Crop Insurance', 14),
  (13, 'Seed Distribution', 15)
ON DUPLICATE KEY UPDATE name = VALUES(name), hod_id = VALUES(hod_id);

-- Insert sample beneficiaries (some with village assigned, some with village NULL)
INSERT INTO beneficiaries (beneficiary_name, aadhaar, hod_id, district_id, mandal_id, village_id, scheme_id, amount, created_at) VALUES
  ('Rama Rao','1111222233334444',11,2,64,(SELECT id FROM villages WHERE name='Ankamma Puram' AND mandal_id=64 LIMIT 1),9,1500.00,'2025-12-15 08:30:00'),
  ('Sita Devi','2222333344445555',11,2,64,NULL,9,1200.50,'2025-12-16 09:10:00'),
  ('Lakshmi','3333444455556666',12,2,65,(SELECT id FROM villages WHERE name='Chinna Palli' AND mandal_id=65 LIMIT 1),10,800.00,'2025-12-17 10:45:00'),
  ('Krishna','4444555566667777',12,2,66,(SELECT id FROM villages WHERE name='Gopalapuram' AND mandal_id=66 LIMIT 1),10,950.00,'2025-12-18 11:00:00'),
  ('Gopal','5555666677778888',13,5,1,(SELECT id FROM villages WHERE name='Kothla Village' AND mandal_id=1 LIMIT 1),11,2000.00,'2025-12-19 14:30:00'),
  ('Radha','6666777788889999',13,5,2,(SELECT id FROM villages WHERE name='Radha Nagar' AND mandal_id=2 LIMIT 1),11,500.00,'2025-12-20 08:00:00'),
  ('Mohan','7777888899990000',14,5,3,(SELECT id FROM villages WHERE name='Mohanpet' AND mandal_id=3 LIMIT 1),12,750.00,'2025-12-21 09:20:00'),
  ('Suresh','8888999900001111',14,5,3,NULL,12,0.00,'2025-12-22 10:50:00'),
  ('Anita','9999000011112222',15,3,2,NULL,13,1800.00,'2025-12-23 12:15:00'),
  ('Venkatesh','0000111122223333',16,10,59,(SELECT id FROM villages WHERE name='Venkateshwara Puram' AND mandal_id=59 LIMIT 1),9,3000.00,'2025-12-24 13:30:00');

-- Helpful Queries
-- Paginated search (server uses similar query):
-- Parameters: districtId, mandalId, page (0-index), size (50 or 100)

SELECT b.id, b.beneficiary_name, d.name as district_name, m.name as mandal_name, v.name as village_name, s.name as scheme_name, h.name as hod_name, b.aadhaar, b.mobile, b.amount, b.created_at
FROM beneficiaries b
LEFT JOIN districts d ON b.district_id = d.id
LEFT JOIN mandals m ON b.mandal_id = m.id
LEFT JOIN villages v ON b.village_id = v.id
LEFT JOIN schemes s ON b.scheme_id = s.id
LEFT JOIN hods h ON b.hod_id = h.id
WHERE b.district_id = ? AND b.mandal_id = ?
ORDER BY b.id DESC
LIMIT ? OFFSET ?;

-- Count total for filters
SELECT COUNT(1) as total FROM beneficiaries b WHERE b.district_id = ? AND b.mandal_id = ?;

-- Top schemes
SELECT s.name as scheme_name, COUNT(1) as cnt FROM beneficiaries b JOIN schemes s ON b.scheme_id = s.id WHERE b.district_id = ? GROUP BY s.id ORDER BY cnt DESC LIMIT 10;

-- Recent additions
SELECT id, beneficiary_name, created_at FROM beneficiaries WHERE district_id = ? ORDER BY created_at DESC LIMIT 10;