-- Create DAO (District Agriculture Officers) Table
CREATE TABLE IF NOT EXISTS dao (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample DAO data
INSERT INTO dao (name, department, email, phone, status) VALUES
('Krishna Murthy', 'Agriculture', 'krishna.murthy@agri.gov.in', '9876543210', 'active'),
('Sampath Kumar', 'Horticulture', 'sampath.kumar@agri.gov.in', '9876543211', 'active'),
('Kavya Reddy', 'Animal Husbandry', 'kavya.reddy@agri.gov.in', '9876543212', 'active'),
('Rajesh Babu', 'Dairy Development', 'rajesh.babu@agri.gov.in', '9876543213', 'active'),
('Anjali Devi', 'Cooperative', 'anjali.devi@agri.gov.in', '9876543214', 'active'),
('Venkat Kumar', 'Extension Services', 'venkat.kumar@agri.gov.in', '9876543215', 'active'),
('Priya Singh', 'Soil Conservation', 'priya.singh@agri.gov.in', '9876543216', 'active'),
('Arun Prasad', 'Irrigation', 'arun.prasad@agri.gov.in', '9876543217', 'active'),
('Sneha Patel', 'Rural Development', 'sneha.patel@agri.gov.in', '9876543218', 'active'),
('Mahesh Gupta', 'Agricultural Marketing', 'mahesh.gupta@agri.gov.in', '9876543219', 'active');
