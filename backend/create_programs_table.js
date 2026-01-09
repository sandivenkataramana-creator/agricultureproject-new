const db = require('./config/database');

async function createProgramsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS programs (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        description text,
        budget decimal(15,2) DEFAULT 0.00,
        start_date date DEFAULT NULL,
        end_date date DEFAULT NULL,
        status enum('active','inactive','completed') DEFAULT 'active',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_status (status),
        KEY idx_dates (start_date, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Programs table created');

    const [existing] = await db.query('SELECT COUNT(*) as count FROM programs');
    if (existing[0].count === 0) {
      await db.query(`
        INSERT INTO programs (name, description, budget, start_date, end_date, status) VALUES
        ('PM-KISAN', 'Pradhan Mantri Kisan Samman Nidhi - Direct income support', 7500000.00, '2024-01-01', '2024-12-31', 'active'),
        ('Kisan Credit Card', 'Credit facility for farmers', 5000000.00, '2024-01-01', '2024-12-31', 'active'),
        ('Soil Health Card', 'Soil health cards for better crop management', 2500000.00, '2024-01-01', '2024-12-31', 'active'),
        ('National Food Security Mission', 'Enhancing production of crops', 8000000.00, '2024-01-01', '2025-03-31', 'active'),
        ('Organic Farming Program', 'Promotion of organic farming', 3500000.00, '2024-01-01', '2024-12-31', 'active')
      `);
      console.log('✓ Seeded 5 sample programs');
    }

    const [programs] = await db.query('SELECT COUNT(*) as count FROM programs');
    console.log(`✓ Total programs: ${programs[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createProgramsTable();
