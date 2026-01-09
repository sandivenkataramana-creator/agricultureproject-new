-- beneficiaries_schema.sql
-- Run this as part of migration to add beneficiaries and master tables

CREATE TABLE IF NOT EXISTS districts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS mandals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    district_id INT NOT NULL,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
    INDEX idx_mandal_district (district_id)
);

CREATE TABLE IF NOT EXISTS villages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    mandal_id INT NOT NULL,
    FOREIGN KEY (mandal_id) REFERENCES mandals(id) ON DELETE CASCADE,
    INDEX idx_village_mandal (mandal_id)
);

CREATE TABLE IF NOT EXISTS schemes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    hod_id INT DEFAULT NULL,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS hods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS beneficiaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    beneficiary_name VARCHAR(150) NOT NULL,
    aadhaar_hash VARCHAR(255),
    aadhaar VARCHAR(20),
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
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT,
    FOREIGN KEY (mandal_id) REFERENCES mandals(id) ON DELETE RESTRICT,
    FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE RESTRICT,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE SET NULL,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL,
    INDEX idx_location (district_id, mandal_id, village_id),
    INDEX idx_scheme (scheme_id),
    INDEX idx_hod (hod_id),
    INDEX idx_created_at (created_at)
);

-- Example: Ensure unique aadhaar per beneficiary if aadhaar_hash present (optional)
-- ALTER TABLE beneficiaries ADD UNIQUE KEY uq_aadhaar_hash (aadhaar_hash);

-- Optional: audit logs table for import/export actions
CREATE TABLE IF NOT EXISTS beneficiary_audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(50) NOT NULL,
    performed_by INT NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import jobs table to track large async imports
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
);

-- Import errors per-row
CREATE TABLE IF NOT EXISTS beneficiary_import_errors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id BIGINT NOT NULL,
    row_number INT NOT NULL,
    error_message TEXT NOT NULL,
    row_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES beneficiary_import_jobs(id) ON DELETE CASCADE
);
