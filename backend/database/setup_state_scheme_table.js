const db = require('../config/database');

async function createStateSchemeTable() {
  try {
    console.log('Creating state_scheme_financials table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS state_scheme_financials (
          id INT AUTO_INCREMENT PRIMARY KEY,

          state_scheme_name VARCHAR(255) NOT NULL,
          hod VARCHAR(150) NOT NULL,

          budget_estimates DECIMAL(14,2) DEFAULT NULL,
          bro_released_amount DECIMAL(14,2) DEFAULT NULL,

          -- Bills Preferred
          bills_preferred_count INT DEFAULT 0,
          bills_preferred_amount DECIMAL(14,2) DEFAULT NULL,
          oldest_bill_date DATE DEFAULT NULL,

          -- Bills Cleared
          bills_cleared_count INT DEFAULT 0,
          bills_cleared_amount DECIMAL(14,2) DEFAULT NULL,
          latest_clearance_date DATE DEFAULT NULL,

          -- Pending Bills
          pending_bills_count INT DEFAULT 0,
          pending_bills_amount DECIMAL(14,2) DEFAULT NULL,

          financial_year VARCHAR(9) NOT NULL,
          status ENUM('active','inactive') DEFAULT 'active',

          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_financial_year (financial_year),
          INDEX idx_status (status)
      )
    `;
    
    await db.query(createTableSQL);
    console.log('✓ state_scheme_financials table created successfully');
    
    // Insert sample data
    console.log('Inserting sample state scheme data...');
    const schemes = [
      { name: 'Rythu Bharosa', hod: 'DoA' },
      { name: 'Rythu Bima', hod: 'DoA' },
      { name: 'Crop Insurance', hod: 'DoA' },
      { name: 'Supply of Seeds', hod: 'DoA' },
      { name: 'Farm Mechanisation', hod: 'DoA' }
    ];
    
    for (const scheme of schemes) {
      try {
        await db.query(
          `INSERT INTO state_scheme_financials (state_scheme_name, hod, financial_year, status)
           VALUES (?, ?, ?, ?)`,
          [scheme.name, scheme.hod, '2025-26', 'active']
        );
      } catch (err) {
        // Scheme might already exist
        if (!err.message.includes('Duplicate')) {
          console.warn(`Warning inserting ${scheme.name}:`, err.message);
        }
      }
    }
    
    console.log('✓ Sample state scheme data inserted');
    console.log('State scheme table setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating state scheme table:', error);
    process.exit(1);
  }
}

createStateSchemeTable();
