const pool = require('../config/database');

async function createDAOTable() {
  try {
    const connection = await pool.getConnection();
    
    // Check if table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hod_management2' AND TABLE_NAME = 'dao'
    `);
    
    if (tables.length === 0) {
      console.log('Creating dao table...');
      
      // Create table
      await connection.query(`
        CREATE TABLE dao (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          department VARCHAR(100),
          email VARCHAR(100) UNIQUE,
          phone VARCHAR(20),
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✓ Table created!');
      
      // Insert sample data
      console.log('Inserting sample DAO data...');
      await connection.query(`
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
        ('Mahesh Gupta', 'Agricultural Marketing', 'mahesh.gupta@agri.gov.in', '9876543219', 'active')
      `);
      
      console.log('✓ DAO table created and populated successfully!');
    } else {
      console.log('✓ DAO table already exists!');
    }
    
    connection.release();
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createDAOTable();
