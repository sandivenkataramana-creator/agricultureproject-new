-- Migration script to add new tables and columns
-- Run this if you already have an existing database

-- Add categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add category_id to hods table if it doesn't exist
ALTER TABLE hods 
ADD COLUMN IF NOT EXISTS category_id INT,
ADD FOREIGN KEY IF NOT EXISTS (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Add category_id to staff table if it doesn't exist
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS category_id INT,
ADD FOREIGN KEY IF NOT EXISTS (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Add category_id to schemes table if it doesn't exist
ALTER TABLE schemes 
ADD COLUMN IF NOT EXISTS category_id INT,
ADD FOREIGN KEY IF NOT EXISTS (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Enable superadmin + district_officer roles for RBAC (run on existing DBs)
-- Note: MySQL requires MODIFY COLUMN for ENUM updates; adjust if your column is VARCHAR.
ALTER TABLE users MODIFY COLUMN role ENUM('superadmin','admin','hod','staff','district_officer') NOT NULL DEFAULT 'staff';

-- Add central scheme name column if it doesn't exist
ALTER TABLE schemes
ADD COLUMN IF NOT EXISTS central_scheme_name VARCHAR(150);

-- Add location fields to budget table if they don't exist
ALTER TABLE budget 
ADD COLUMN IF NOT EXISTS state_id INT,
ADD COLUMN IF NOT EXISTS district_id INT,
ADD COLUMN IF NOT EXISTS mandal_id INT,
ADD COLUMN IF NOT EXISTS village VARCHAR(255);

-- Add additional details to nodal_officers if they don't exist
ALTER TABLE nodal_officers 
ADD COLUMN IF NOT EXISTS purpose VARCHAR(255),
ADD COLUMN IF NOT EXISTS state_id INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS district_id INT,
ADD COLUMN IF NOT EXISTS mandal_id INT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS total_days INT;

-- Create states table if it doesn't exist
CREATE TABLE IF NOT EXISTS states (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT(1) DEFAULT 1
);

-- Create districts table if it doesn't exist
CREATE TABLE IF NOT EXISTS districts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT(1) DEFAULT 1,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

-- Create mandals table if it doesn't exist
CREATE TABLE IF NOT EXISTS mandals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    district_id INT NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT(1) DEFAULT 1,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
);

-- Add foreign keys for location fields in budget (only if columns were just added)
-- Note: MySQL doesn't support IF NOT EXISTS for foreign keys, so you may need to run these manually
-- ALTER TABLE budget ADD FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL;
-- ALTER TABLE budget ADD FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL;
-- ALTER TABLE budget ADD FOREIGN KEY (mandal_id) REFERENCES mandals(id) ON DELETE SET NULL;

-- Add foreign keys for nodal_officers location fields
-- Check and add foreign keys only if they don't exist
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'nodal_officers' 
                  AND CONSTRAINT_NAME = 'nodal_officers_ibfk_2');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE nodal_officers ADD CONSTRAINT nodal_officers_ibfk_2 FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL',
    'SELECT "Foreign key nodal_officers_ibfk_2 already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'nodal_officers' 
                  AND CONSTRAINT_NAME = 'nodal_officers_ibfk_3');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE nodal_officers ADD CONSTRAINT nodal_officers_ibfk_3 FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL',
    'SELECT "Foreign key nodal_officers_ibfk_3 already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'nodal_officers' 
                  AND CONSTRAINT_NAME = 'nodal_officers_ibfk_4');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE nodal_officers ADD CONSTRAINT nodal_officers_ibfk_4 FOREIGN KEY (mandal_id) REFERENCES mandals(id) ON DELETE SET NULL',
    'SELECT "Foreign key nodal_officers_ibfk_4 already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert sample categories if they don't exist
INSERT IGNORE INTO categories (name, description, status) VALUES
('Agriculture', 'Agriculture and related departments', 'active'),
('Rural Development', 'Rural development and welfare', 'active'),
('Urban Planning', 'Urban planning and infrastructure', 'active'),
('Health & Welfare', 'Health and welfare departments', 'active'),
('Education', 'Education and training departments', 'active'),
('Employment', 'Employment and skill development', 'active'),
('Infrastructure', 'Infrastructure development', 'active'),
('Sanitation', 'Sanitation and cleanliness', 'active');

-- Insert Telangana state if it doesn't exist
INSERT IGNORE INTO states (id, name, status) VALUES (1, 'Telangana', 1);


