-- Create Database
CREATE DATABASE IF NOT EXISTS hod_management;
USE hod_management;

-- HODs Table
CREATE TABLE IF NOT EXISTS hods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    category_id INT,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Schemes Table
CREATE TABLE IF NOT EXISTS schemes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150),
    hod_id INT,
    category_id INT,
    scheme_description TEXT,
    scheme_objective TEXT,
    scheme_benefits_desc TEXT,
    scheme_benefits_person INT DEFAULT 0,
    total_budget DECIMAL(15, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'active', 'inactive') DEFAULT 'PLANNED',
    scheme_category VARCHAR(100),
    scheme_name VARCHAR(150),
    central_scheme_name VARCHAR(150),
    hod VARCHAR(255),
    financial_year VARCHAR(20),
    allocation_goi_share DECIMAL(15, 2),
    allocation_state_share DECIMAL(15, 2),
    allocation_total DECIMAL(15, 2),
    slsc_goi_share DECIMAL(15, 2),
    slsc_state_share DECIMAL(15, 2),
    slsc_total DECIMAL(15, 2),
    sanction_goi_share DECIMAL(15, 2),
    sanction_state_share DECIMAL(15, 2),
    sanction_total DECIMAL(15, 2),
    bro_released_amount DECIMAL(15, 2),
    dt_authorized_amount DECIMAL(15, 2),
    bills_preferred_count INT,
    bills_preferred_amount DECIMAL(15, 2),
    oldest_bill_date DATE,
    bills_cleared_count INT,
    bills_cleared_amount DECIMAL(15, 2),
    latest_bill_date DATE,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Scheme Budget Allocation Table
CREATE TABLE IF NOT EXISTS scheme_budget_allocation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    scheme_id INT NOT NULL,
    hod_id INT NOT NULL,
    hod_name VARCHAR(255) NOT NULL,
    allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(15, 2) DEFAULT 0,
    financial_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE CASCADE
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    designation VARCHAR(100),
    department VARCHAR(255),
    category_id INT,
    hod_id INT,
    email VARCHAR(255),
    phone VARCHAR(20),
    joining_date DATE,
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Budget Table
CREATE TABLE IF NOT EXISTS budget (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hod_id INT,
    scheme_id INT,
    financial_year VARCHAR(20),
    allocated_amount DECIMAL(15, 2) DEFAULT 0,
    utilized_amount DECIMAL(15, 2) DEFAULT 0,
    category VARCHAR(100),
    description TEXT,
    dao_id INT,
    section VARCHAR(255),
    budget_estimation_state DECIMAL(15, 2) DEFAULT 0,
    budget_estimation_central DECIMAL(15, 2) DEFAULT 0,
    budget_sanction_state DECIMAL(15, 2) DEFAULT 0,
    budget_sanction_central DECIMAL(15, 2) DEFAULT 0,
    budget_remaining_state DECIMAL(15, 2) DEFAULT 0,
    budget_remaining_central DECIMAL(15, 2) DEFAULT 0,
    budget_pending_state DECIMAL(15, 2) DEFAULT 0,
    budget_pending_central DECIMAL(15, 2) DEFAULT 0,
    state_id INT,
    district_id INT,
    mandal_id INT,
    village VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE SET NULL,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
    FOREIGN KEY (mandal_id) REFERENCES mandals(id) ON DELETE SET NULL
);

-- KPIs Table
CREATE TABLE IF NOT EXISTS kpis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hod_id INT,
    kpi_name VARCHAR(255) NOT NULL,
    target_value DECIMAL(15, 2),
    achieved_value DECIMAL(15, 2) DEFAULT 0,
    unit VARCHAR(50),
    period VARCHAR(50),
    status ENUM('on_track', 'at_risk', 'behind', 'completed') DEFAULT 'on_track',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL
);

-- District Agriculture Officers (DAO) Table
CREATE TABLE IF NOT EXISTS dao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Nodal Officers Table
CREATE TABLE IF NOT EXISTS nodal_officers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    department VARCHAR(255),
    scheme_id INT,
    purpose VARCHAR(255),
    state_id INT DEFAULT 1,
    district_id INT,
    mandal_id INT,
    start_date DATE,
    end_date DATE,
    total_days INT,
    email VARCHAR(255),
    phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE SET NULL,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
    FOREIGN KEY (mandal_id) REFERENCES mandals(id) ON DELETE SET NULL
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    hod_id INT,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'half_day', 'leave') DEFAULT 'present',
    check_in TIME,
    check_out TIME,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL
);

-- Revenue Table
CREATE TABLE IF NOT EXISTS revenue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hod_id INT,
    scheme_id INT,
    amount DECIMAL(15, 2) NOT NULL,
    source VARCHAR(255),
    category VARCHAR(100),
    date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE SET NULL
);

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('superadmin', 'admin', 'hod', 'staff', 'district_officer') NOT NULL DEFAULT 'staff',
    hod_id INT NULL,
    staff_id INT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    password_changed BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- OTP Table for Password Reset
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_otp (otp),
    INDEX idx_expires (expires_at)
);

-- Categories/Departments Table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- States Table (from telangana_db)
CREATE TABLE IF NOT EXISTS states (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT(1) DEFAULT 1
);

-- Districts Table (from telangana_db)
CREATE TABLE IF NOT EXISTS districts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT(1) DEFAULT 1,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

-- Mandals Table (from telangana_db)
CREATE TABLE IF NOT EXISTS mandals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    district_id INT NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT(1) DEFAULT 1,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
);

-- Insert Sample Data
-- Clear existing data before inserting (run in correct order due to foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM attendance;
DELETE FROM revenue;
DELETE FROM budget;
DELETE FROM kpis;
DELETE FROM nodal_officers;
DELETE FROM scheme_budget_allocation;
DELETE FROM staff;
DELETE FROM schemes;
DELETE FROM users;
DELETE FROM hods;
DELETE FROM categories;
DELETE FROM mandals;
DELETE FROM districts;
DELETE FROM states;
DELETE FROM password_reset_otps;
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto increment values
ALTER TABLE attendance AUTO_INCREMENT = 1;
ALTER TABLE revenue AUTO_INCREMENT = 1;
ALTER TABLE budget AUTO_INCREMENT = 1;
ALTER TABLE kpis AUTO_INCREMENT = 1;
ALTER TABLE nodal_officers AUTO_INCREMENT = 1;
ALTER TABLE scheme_budget_allocation AUTO_INCREMENT = 1;
ALTER TABLE staff AUTO_INCREMENT = 1;
ALTER TABLE schemes AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE hods AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE mandals AUTO_INCREMENT = 1;
ALTER TABLE districts AUTO_INCREMENT = 1;
ALTER TABLE states AUTO_INCREMENT = 1;

-- Sample Categories (Agriculture Departments)
INSERT INTO categories (name, description, status) VALUES
('Horticulture', 'Fruits, vegetables, and ornamental plants cultivation', 'active'),
('Sericulture', 'Silk farming and production', 'active'),
('Fisheries', 'Fish farming and aquaculture', 'active'),
('Animal Husbandry', 'Livestock and dairy farming', 'active'),
('Soil Conservation', 'Soil health and conservation programs', 'active'),
('Seed Certification', 'Quality seed production and certification', 'active'),
('Agricultural Marketing', 'Market linkages and price support', 'active'),
('Crop Insurance', 'Crop protection and insurance schemes', 'active'),
('Irrigation', 'Water management and irrigation systems', 'active'),
('Organic Farming', 'Organic and sustainable agriculture', 'active');

-- Sample HODs (Agriculture Department Heads)
INSERT INTO hods (name, department, category_id, email, phone, status) VALUES
('Dr. Rajesh Kumar', 'Horticulture', 1, 'rajesh.kumar@agri.gov.in', '9876543210', 'active'),
('Smt. Priya Sharma', 'Sericulture', 2, 'priya.sharma@agri.gov.in', '9876543211', 'active'),
('Shri. Venkat Rao', 'Fisheries', 3, 'venkat.rao@agri.gov.in', '9876543212', 'active'),
('Dr. Lakshmi Devi', 'Animal Husbandry', 4, 'lakshmi.devi@agri.gov.in', '9876543213', 'active'),
('Shri. Mohd. Imran', 'Soil Conservation', 5, 'mohd.imran@agri.gov.in', '9876543214', 'active'),
('Dr. Suresh Reddy', 'Seed Certification', 6, 'suresh.reddy@agri.gov.in', '9876543215', 'active'),
('Smt. Kavitha Rani', 'Agricultural Marketing', 7, 'kavitha.rani@agri.gov.in', '9876543216', 'active'),
('Shri. Ramesh Babu', 'Irrigation', 9, 'ramesh.babu@agri.gov.in', '9876543217', 'active');

-- Sample Schemes (Agriculture Schemes)
INSERT INTO schemes (name, hod_id, category_id, scheme_description, scheme_objective, scheme_benefits_desc, scheme_benefits_person, total_budget, start_date, end_date, status, scheme_category) VALUES
('Rythu Bandhu', 1, 1, 'Investment support scheme for farmers providing Rs.10,000 per acre per season', 'To provide investment support for agriculture and horticulture crops', 'Direct benefit transfer to farmer bank accounts twice a year', 580000, 75000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Farmer Support'),
('PM-KISAN', 1, 1, 'Direct income support of Rs.6000 per year to land-holding farmers', 'To supplement financial needs of small and marginal farmers', 'Three equal installments of Rs.2000 directly to bank accounts', 450000, 60000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Farmer Support'),
('Silk Samagra', 2, 2, 'Integrated scheme for development of silk industry', 'To boost silk production and support sericulture farmers', 'Subsidy on mulberry cultivation, silkworm rearing equipment', 25000, 15000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Sericulture'),
('Blue Revolution', 3, 3, 'Integrated development of inland fisheries', 'To increase fish production and provide livelihood to fishermen', 'Financial assistance for pond construction, fish seed, feed', 35000, 20000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Fisheries'),
('Rashtriya Gokul Mission', 4, 4, 'Development and conservation of indigenous cattle breeds', 'To enhance productivity of bovines and increase milk production', 'Support for breeding, fodder development, healthcare', 120000, 45000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Dairy'),
('Pradhan Mantri Fasal Bima Yojana', 5, 8, 'Crop insurance scheme for farmers', 'To provide insurance coverage and financial support in case of crop failure', 'Low premium rates and quick claim settlement', 380000, 55000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Insurance'),
('Soil Health Card', 5, 5, 'Soil testing and nutrient management program', 'To promote balanced use of fertilizers and improve soil health', 'Free soil testing and crop-wise fertilizer recommendations', 200000, 12000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Soil Health'),
('National Mission on Oilseeds', 6, 6, 'Promotion of oilseed crops production', 'To increase production and productivity of oilseeds', 'Certified seeds, demonstrations, farm mechanization support', 95000, 25000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Oilseeds'),
('e-NAM', 7, 7, 'Electronic National Agriculture Market platform', 'To create unified national market for agricultural commodities', 'Better price discovery, transparent trading, online payments', 150000, 18000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Marketing'),
('Micro Irrigation', 8, 9, 'Drip and sprinkler irrigation systems promotion', 'To improve water use efficiency in agriculture', 'Subsidy up to 90% on drip and sprinkler systems', 85000, 35000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Irrigation'),
('Paramparagat Krishi Vikas Yojana', 1, 10, 'Promotion of organic farming', 'To develop organic farming through cluster approach', 'Support for organic inputs, certification, marketing', 45000, 22000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Organic Farming'),
('Kisan Credit Card', 7, 7, 'Credit support for farmers', 'To provide adequate and timely credit to farmers', 'Low interest loans up to Rs.3 lakhs for crop production', 320000, 40000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Credit');

-- Sample Scheme Budget Allocations
INSERT INTO scheme_budget_allocation (scheme_id, hod_id, hod_name, allocated_amount, spent_amount, financial_year) VALUES
(1, 1, 'Dr. Rajesh Kumar', 75000000.00, 52000000.00, '2024-25'),
(2, 1, 'Dr. Rajesh Kumar', 60000000.00, 45000000.00, '2024-25'),
(3, 2, 'Smt. Priya Sharma', 15000000.00, 11000000.00, '2024-25'),
(4, 3, 'Shri. Venkat Rao', 20000000.00, 14000000.00, '2024-25'),
(5, 4, 'Dr. Lakshmi Devi', 45000000.00, 32000000.00, '2024-25'),
(6, 5, 'Shri. Mohd. Imran', 55000000.00, 38000000.00, '2024-25'),
(7, 5, 'Shri. Mohd. Imran', 12000000.00, 9500000.00, '2024-25'),
(8, 6, 'Dr. Suresh Reddy', 25000000.00, 18000000.00, '2024-25'),
(9, 7, 'Smt. Kavitha Rani', 18000000.00, 12000000.00, '2024-25'),
(10, 8, 'Shri. Ramesh Babu', 35000000.00, 28000000.00, '2024-25'),
(11, 1, 'Dr. Rajesh Kumar', 22000000.00, 15000000.00, '2024-25'),
(12, 7, 'Smt. Kavitha Rani', 40000000.00, 30000000.00, '2024-25');

-- Sample Staff (Agriculture Officers)
INSERT INTO staff (name, employee_id, designation, department, category_id, hod_id, email, phone, joining_date, status) VALUES
('Amit Patel', 'AGR001', 'Senior Horticulture Officer', 'Horticulture', 1, 1, 'amit.patel@agri.gov.in', '9876543220', '2020-01-15', 'active'),
('Sneha Reddy', 'AGR002', 'Sericulture Development Officer', 'Sericulture', 2, 2, 'sneha.reddy@agri.gov.in', '9876543221', '2019-06-01', 'active'),
('Ravi Teja', 'AGR003', 'Assistant Fisheries Officer', 'Fisheries', 3, 3, 'ravi.teja@agri.gov.in', '9876543222', '2021-03-10', 'active'),
('Kavitha Kumari', 'AGR004', 'Veterinary Officer', 'Animal Husbandry', 4, 4, 'kavitha.kumari@agri.gov.in', '9876543223', '2018-08-20', 'active'),
('Suresh Kumar', 'AGR005', 'Soil Conservation Officer', 'Soil Conservation', 5, 5, 'suresh.kumar@agri.gov.in', '9876543224', '2022-01-05', 'active'),
('Meena Devi', 'AGR006', 'Seed Certification Officer', 'Seed Certification', 6, 6, 'meena.devi@agri.gov.in', '9876543225', '2021-07-15', 'active'),
('Prasad Rao', 'AGR007', 'Agricultural Marketing Officer', 'Agricultural Marketing', 7, 7, 'prasad.rao@agri.gov.in', '9876543226', '2020-11-01', 'active'),
('Lakshmi Narayana', 'AGR008', 'Irrigation Engineer', 'Irrigation', 9, 8, 'lakshmi.narayana@agri.gov.in', '9876543227', '2019-04-10', 'active'),
('Bharat Singh', 'AGR009', 'Junior Horticulture Officer', 'Horticulture', 1, 1, 'bharat.singh@agri.gov.in', '9876543228', '2023-02-01', 'active'),
('Anitha Rao', 'AGR010', 'Field Assistant - Fisheries', 'Fisheries', 3, 3, 'anitha.rao@agri.gov.in', '9876543229', '2022-06-15', 'active'),
('Ganesh Reddy', 'AGR011', 'Dairy Development Officer', 'Animal Husbandry', 4, 4, 'ganesh.reddy@agri.gov.in', '9876543230', '2020-09-01', 'active'),
('Sita Kumari', 'AGR012', 'Agriculture Extension Officer', 'Agricultural Marketing', 7, 7, 'sita.kumari@agri.gov.in', '9876543231', '2021-11-20', 'active');

-- Sample DAO (District Agriculture Officers)
INSERT INTO dao (name, department, email, phone, status) VALUES
('Shri. Krishna Murthy', 'Hyderabad', 'km@agri.gov.in', '9876543240', 'active'),
('Dr. Sampath Kumar', 'Rangareddy', 'sampath@agri.gov.in', '9876543241', 'active'),
('Smt. Kavya Reddy', 'Medak', 'kavya@agri.gov.in', '9876543242', 'active'),
('Shri. Rajesh Babu', 'Nalgonda', 'rajesh@agri.gov.in', '9876543243', 'active'),
('Dr. Anjali Devi', 'Khammam', 'anjali@agri.gov.in', '9876543244', 'active'),
('Shri. Ramakrishnan', 'Warangal', 'ramakrishnan@agri.gov.in', '9876543245', 'active'),
('Smt. Deepa Sharma', 'Karimnagar', 'deepa@agri.gov.in', '9876543246', 'active'),
('Shri. Mahesh Kumar', 'Adilabad', 'mahesh@agri.gov.in', '9876543247', 'active'),
('Dr. Vasanthi', 'Nizamabad', 'vasanthi@agri.gov.in', '9876543248', 'active'),
('Shri. Prakash Rao', 'Mancherial', 'prakash@agri.gov.in', '9876543249', 'active');

-- Sample Budget entries
INSERT INTO budget (hod_id, scheme_id, financial_year, allocated_amount, utilized_amount, category, description) VALUES
(1, 1, '2024-25', 75000000.00, 52000000.00, 'Farmer Support', 'Rythu Bandhu scheme budget for Horticulture'),
(1, 2, '2024-25', 60000000.00, 45000000.00, 'Farmer Support', 'PM-KISAN budget allocation'),
(2, 3, '2024-25', 15000000.00, 11000000.00, 'Sericulture', 'Silk Samagra scheme budget'),
(3, 4, '2024-25', 20000000.00, 14000000.00, 'Fisheries', 'Blue Revolution budget'),
(4, 5, '2024-25', 45000000.00, 32000000.00, 'Dairy', 'Rashtriya Gokul Mission budget'),
(5, 6, '2024-25', 55000000.00, 38000000.00, 'Insurance', 'PMFBY budget allocation'),
(5, 7, '2024-25', 12000000.00, 9500000.00, 'Soil Health', 'Soil Health Card budget'),
(6, 8, '2024-25', 25000000.00, 18000000.00, 'Oilseeds', 'National Mission on Oilseeds budget'),
(7, 9, '2024-25', 18000000.00, 12000000.00, 'Marketing', 'e-NAM platform budget'),
(8, 10, '2024-25', 35000000.00, 28000000.00, 'Irrigation', 'Micro Irrigation scheme budget'),
(1, 11, '2024-25', 22000000.00, 15000000.00, 'Organic Farming', 'PKVY scheme budget'),
(7, 12, '2024-25', 40000000.00, 30000000.00, 'Credit', 'Kisan Credit Card budget');

-- Sample KPIs (Agriculture Performance Indicators)
INSERT INTO kpis (hod_id, kpi_name, target_value, achieved_value, unit, period, status) VALUES
(1, 'Farmers Benefited under Rythu Bandhu', 580000, 485000, 'Farmers', 'Yearly', 'on_track'),
(1, 'Organic Farm Area Covered', 50000, 38000, 'Acres', 'Yearly', 'on_track'),
(2, 'Silk Production', 5000, 4200, 'MT', 'Yearly', 'on_track'),
(2, 'Sericulture Farmers Supported', 25000, 21000, 'Farmers', 'Yearly', 'on_track'),
(3, 'Fish Production', 15000, 12500, 'MT', 'Yearly', 'on_track'),
(3, 'New Ponds Constructed', 500, 380, 'Ponds', 'Yearly', 'at_risk'),
(4, 'Cattle Vaccinated', 500000, 420000, 'Cattle', 'Yearly', 'on_track'),
(4, 'Milk Production Increase', 20, 15, 'Percentage', 'Yearly', 'on_track'),
(5, 'Farmers Insured under PMFBY', 380000, 320000, 'Farmers', 'Yearly', 'on_track'),
(5, 'Soil Health Cards Issued', 200000, 175000, 'Cards', 'Yearly', 'on_track'),
(6, 'Certified Seeds Distributed', 50000, 42000, 'Quintals', 'Yearly', 'on_track'),
(7, 'Farmers Registered on e-NAM', 150000, 125000, 'Farmers', 'Yearly', 'on_track'),
(8, 'Micro Irrigation Coverage', 85000, 72000, 'Acres', 'Yearly', 'on_track');

-- Sample Nodal Officers (Agriculture Scheme Officers)
INSERT INTO nodal_officers (name, designation, department, scheme_id, purpose, district, mandal, start_date, end_date, email, phone, status) VALUES
('Ramesh Kumar', 'Rythu Bandhu Nodal Officer', 'Horticulture', 1, 'Farmer investment support', 'Hyderabad', 'Serilingampally', '2024-04-01', '2024-12-31', 'ramesh.kumar@agri.gov.in', '9876543240', 'active'),
('Sita Lakshmi', 'PM-KISAN Nodal Officer', 'Horticulture', 2, 'Income support distribution', 'Nalgonda', 'Choutuppal', '2024-01-15', '2024-12-31', 'sita.lakshmi@agri.gov.in', '9876543241', 'active'),
('Ganesh Rao', 'Silk Samagra Nodal Officer', 'Sericulture', 3, 'Silk cluster coordination', 'Warangal', 'Hanamkonda', '2024-02-01', '2024-11-30', 'ganesh.rao@agri.gov.in', '9876543242', 'active'),
('Anitha Devi', 'Blue Revolution Nodal Officer', 'Fisheries', 4, 'Inland fisheries promotion', 'Karimnagar', 'Manakondur', '2024-03-01', '2024-12-15', 'anitha.devi@agri.gov.in', '9876543243', 'active'),
('Bharat Kumar', 'Gokul Mission Nodal Officer', 'Animal Husbandry', 5, 'Breed improvement support', 'Mahbubnagar', 'Gadwal', '2024-01-10', '2024-10-31', 'bharat.kumar@agri.gov.in', '9876543244', 'active'),
('Priya Reddy', 'PMFBY Nodal Officer', 'Soil Conservation', 6, 'Crop insurance facilitation', 'Adilabad', 'Utnoor', '2024-02-15', '2024-12-31', 'priya.reddy@agri.gov.in', '9876543245', 'active'),
('Venkat Rao', 'Soil Health Card Nodal Officer', 'Soil Conservation', 7, 'Soil sample collection', 'Khammam', 'Wyra', '2024-01-20', '2024-09-30', 'venkat.rao2@agri.gov.in', '9876543246', 'active'),
('Kavitha Singh', 'Oilseeds Mission Nodal Officer', 'Seed Certification', 8, 'Oilseed productivity drive', 'Medak', 'Sangareddy', '2024-02-05', '2024-12-05', 'kavitha.singh@agri.gov.in', '9876543247', 'active'),
('Suresh Babu', 'e-NAM Nodal Officer', 'Agricultural Marketing', 9, 'Market linkage support', 'Rangareddy', 'Shamshabad', '2024-01-25', '2024-12-31', 'suresh.babu@agri.gov.in', '9876543248', 'active'),
('Lakshmi Rani', 'Micro Irrigation Nodal Officer', 'Irrigation', 10, 'Micro irrigation rollout', 'Nizamabad', 'Armur', '2024-03-10', '2024-12-31', 'lakshmi.rani@agri.gov.in', '9876543249', 'active'),
('Mohd. Saleem', 'PKVY Nodal Officer', 'Horticulture', 11, 'Organic cluster formation', 'Karimnagar', 'Huzurabad', '2024-02-20', '2024-12-20', 'mohd.saleem@agri.gov.in', '9876543250', 'active'),
('Ravi Shankar', 'KCC Nodal Officer', 'Agricultural Marketing', 12, 'Credit enablement', 'Hyderabad', 'Secunderabad', '2024-01-05', '2024-12-31', 'ravi.shankar@agri.gov.in', '9876543251', 'active');

-- Sample Attendance (for agriculture staff - last 7 days)
INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out) VALUES
(1, 1, CURDATE(), 'present', '09:00:00', '18:00:00'),
(2, 2, CURDATE(), 'present', '09:15:00', '18:30:00'),
(3, 3, CURDATE(), 'present', '09:00:00', '17:45:00'),
(4, 4, CURDATE(), 'present', '09:30:00', '18:00:00'),
(5, 5, CURDATE(), 'present', '09:00:00', '18:00:00'),
(6, 6, CURDATE(), 'absent', NULL, NULL),
(7, 7, CURDATE(), 'present', '09:00:00', '18:00:00'),
(8, 8, CURDATE(), 'present', '09:15:00', '18:15:00'),
(9, 1, CURDATE(), 'present', '09:00:00', '18:00:00'),
(10, 3, CURDATE(), 'half_day', '09:00:00', '13:00:00'),
(11, 4, CURDATE(), 'present', '09:00:00', '18:00:00'),
(12, 7, CURDATE(), 'present', '09:30:00', '18:00:00'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00'),
(3, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'half_day', '09:00:00', '13:00:00'),
(4, 4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00'),
(5, 5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00'),
(6, 6, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00'),
(7, 7, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'absent', NULL, NULL),
(8, 8, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', '09:00:00', '18:00:00'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present', '09:00:00', '18:00:00'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present', '09:00:00', '18:00:00'),
(3, 3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present', '09:00:00', '18:00:00'),
(4, 4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'leave', NULL, NULL);

-- Sample Revenue (Agriculture Revenue Sources)
INSERT INTO revenue (hod_id, scheme_id, amount, source, category, date, description) VALUES
(1, 1, 25000000.00, 'State Government Grant', 'Farmer Support', '2024-12-01', 'Rythu Bandhu Q4 allocation'),
(1, 2, 20000000.00, 'Central Government Fund', 'Farmer Support', '2024-12-01', 'PM-KISAN funds'),
(2, 3, 8000000.00, 'Central Silk Board', 'Sericulture', '2024-12-01', 'Silk Samagra funds'),
(3, 4, 12000000.00, 'Blue Revolution Fund', 'Fisheries', '2024-12-01', 'Fisheries development funds'),
(4, 5, 18000000.00, 'Central Government', 'Dairy', '2024-12-01', 'Gokul Mission allocation'),
(5, 6, 22000000.00, 'Central Pool', 'Insurance', '2024-12-01', 'PMFBY premium subsidy'),
(5, 7, 6000000.00, 'State Budget', 'Soil Health', '2024-12-01', 'Soil testing funds'),
(6, 8, 10000000.00, 'NMOOP Fund', 'Oilseeds', '2024-11-15', 'Oilseeds mission allocation'),
(7, 9, 8000000.00, 'e-NAM Fund', 'Marketing', '2024-11-20', 'Digital marketing platform funds'),
(8, 10, 15000000.00, 'PMKSY Fund', 'Irrigation', '2024-12-01', 'Micro irrigation subsidy'),
(1, 11, 9000000.00, 'Organic Farming Fund', 'Organic Farming', '2024-11-25', 'PKVY scheme funds'),
(7, 12, 18000000.00, 'NABARD', 'Credit', '2024-12-05', 'KCC interest subvention');

-- Sample Users (Agriculture Department Users)
INSERT INTO users (username, password, email, role, hod_id, staff_id, name, status) VALUES
('admin', 'password123', 'admin@agri.gov.in', 'admin', NULL, NULL, 'Agriculture Admin', 'active'),
('hod_horticulture', 'password123', 'rajesh.kumar@agri.gov.in', 'hod', 1, NULL, 'Dr. Rajesh Kumar', 'active'),
('hod_sericulture', 'password123', 'priya.sharma@agri.gov.in', 'hod', 2, NULL, 'Smt. Priya Sharma', 'active'),
('hod_fisheries', 'password123', 'venkat.rao@agri.gov.in', 'hod', 3, NULL, 'Shri. Venkat Rao', 'active'),
('hod_animal', 'password123', 'lakshmi.devi@agri.gov.in', 'hod', 4, NULL, 'Dr. Lakshmi Devi', 'active'),
('hod_soil', 'password123', 'mohd.imran@agri.gov.in', 'hod', 5, NULL, 'Shri. Mohd. Imran', 'active'),
('hod_seed', 'password123', 'suresh.reddy@agri.gov.in', 'hod', 6, NULL, 'Dr. Suresh Reddy', 'active'),
('hod_marketing', 'password123', 'kavitha.rani@agri.gov.in', 'hod', 7, NULL, 'Smt. Kavitha Rani', 'active'),
('hod_irrigation', 'password123', 'ramesh.babu@agri.gov.in', 'hod', 8, NULL, 'Shri. Ramesh Babu', 'active'),
('staff_amit', 'password123', 'amit.patel@agri.gov.in', 'staff', 1, 1, 'Amit Patel', 'active'),
('staff_sneha', 'password123', 'sneha.reddy@agri.gov.in', 'staff', 2, 2, 'Sneha Reddy', 'active'),
('staff_ravi', 'password123', 'ravi.teja@agri.gov.in', 'staff', 3, 3, 'Ravi Teja', 'active');

-- Sample States (from telangana_db)
INSERT INTO states (id, name, status) VALUES
(1, 'Telangana', 1);

-- Sample Districts (from telangana_db - first 10)
INSERT INTO districts (id, name, state_id, status) VALUES
(2, 'Jagtial', 1, 1),
(3, 'Kumaram Bheem Asifabad', 1, 1),
(4, 'Mancherial', 1, 1),
(5, 'Adilabad', 1, 1),
(6, 'Nirmal', 1, 1),
(7, 'Nizamabad', 1, 1),
(8, 'Kamareddy', 1, 1),
(9, 'Peddapalli', 1, 1),
(10, 'Karimnagar', 1, 1),
(11, 'Rajanna Sircilla', 1, 1);

-- Sample Mandals (from telangana_db - first 20)
INSERT INTO mandals (id, name, district_id, status) VALUES
(1, 'Adilabad', 5, 1),
(2, 'Adilabad (rural)', 5, 1),
(3, 'Adilabad (urban)', 5, 1),
(58, 'Beerpur', 2, 1),
(59, 'Bheemaram', 2, 1),
(60, 'Buggaram', 2, 1),
(61, 'Dharmapuri', 2, 1),
(62, 'Gollapalle', 2, 1),
(63, 'Ibrahimpatnam', 2, 1),
(64, 'Jagtial', 2, 1),
(65, 'Jagtial rural', 2, 1),
(66, 'Kodimial', 2, 1),
(67, 'Koratla', 2, 1),
(68, 'Kothlapur', 2, 1),
(69, 'Mallapur', 2, 1),
(70, 'Mallial', 2, 1),
(71, 'Medipalle', 2, 1),
(72, 'Metpalle', 2, 1),
(73, 'Pegadapalle', 2, 1),
(74, 'Raikal', 2, 1);
