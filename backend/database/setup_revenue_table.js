const db = require('../config/database');

async function createRevenueTable() {
  try {
    console.log('Creating revenue_financials table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS revenue_financials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          
          cooperative_name VARCHAR(255) NOT NULL,
          
          loans DECIMAL(14,2) DEFAULT NULL,
          revenue DECIMAL(14,2) DEFAULT NULL,
          
          financial_year VARCHAR(9) NOT NULL,
          status ENUM('active','inactive') DEFAULT 'active',
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_financial_year (financial_year),
          INDEX idx_status (status)
      )
    `;
    
    await db.query(createTableSQL);
    console.log('✓ revenue_financials table created successfully');
    
    // Insert sample data
    console.log('Inserting sample revenue data...');
    const cooperatives = [
      'TG AGROS',
      'TG HDCL',
      'TG SDCL',
      'TG CRIC',
      'TG HOUSEFED',
      'HACA',
      'TG MARKFED',
      'TG OILFED',
      'TG OCA',
      'TG CU',
      'TG SWC',
      'PJTAU',
      'SKLTGHU'
    ];
    
    for (const coop of cooperatives) {
      try {
        await db.query(
          `INSERT INTO revenue_financials (cooperative_name, loans, revenue, financial_year, status)
           VALUES (?, ?, ?, ?, ?)`,
          [coop, null, null, '2025-26', 'active']
        );
      } catch (err) {
        // Cooperative might already exist
        if (!err.message.includes('Duplicate')) {
          console.warn(`Warning inserting ${coop}:`, err.message);
        }
      }
    }
    
    console.log('✓ Sample revenue data inserted');
    console.log('Revenue table setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating revenue table:', error);
    process.exit(1);
  }
}

createRevenueTable();
