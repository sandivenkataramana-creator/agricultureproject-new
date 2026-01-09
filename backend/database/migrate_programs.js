const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function migratePrograms() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hod_management_updated',
      multipleStatements: true
    });

    console.log('✓ Connected to database');
    
    // Read and execute programs table migration
    const sqlPath = path.join(__dirname, 'programs_table.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('Running programs table migration...');
    await connection.query(sql);
    
    console.log('✓ Programs table created successfully!');
    
    // Verify the table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'programs'");
    if (tables.length > 0) {
      console.log('✓ Verified: programs table exists');
      
      // Check if sample data exists
      const [rows] = await connection.query('SELECT COUNT(*) as count FROM programs');
      console.log(`✓ Programs table contains ${rows[0].count} records`);
    } else {
      console.log('✗ Error: programs table not found after migration');
    }
    
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed');
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migratePrograms()
    .then(() => {
      console.log('\n✓ Programs migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Programs migration failed');
      process.exit(1);
    });
}

module.exports = migratePrograms;
