const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });

  try {
    console.log('Connected to database');
    
    // Check if state_id column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'hod_management2' 
      AND TABLE_NAME = 'nodal_officers' 
      AND COLUMN_NAME IN ('state_id', 'district_id', 'mandal_id')
    `);
    
    if (columns.length > 0) {
      console.log('Columns already exist:', columns.map(c => c.COLUMN_NAME).join(', '));
      console.log('Migration already applied. Skipping...');
      return;
    }
    
    console.log('Adding state_id, district_id, mandal_id columns to nodal_officers...');
    await connection.query(`
      ALTER TABLE nodal_officers 
      ADD COLUMN state_id INT DEFAULT 1 AFTER purpose,
      ADD COLUMN district_id INT AFTER state_id,
      ADD COLUMN mandal_id INT AFTER district_id
    `);
    
    console.log('Adding foreign key constraints...');
    
    // Add foreign key for state_id
    await connection.query(`
      ALTER TABLE nodal_officers 
      ADD CONSTRAINT fk_nodal_officers_state 
      FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL
    `);
    
    // Add foreign key for district_id
    await connection.query(`
      ALTER TABLE nodal_officers 
      ADD CONSTRAINT fk_nodal_officers_district 
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
    `);
    
    // Add foreign key for mandal_id
    await connection.query(`
      ALTER TABLE nodal_officers 
      ADD CONSTRAINT fk_nodal_officers_mandal 
      FOREIGN KEY (mandal_id) REFERENCES mandals(id) ON DELETE SET NULL
    `);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration();
