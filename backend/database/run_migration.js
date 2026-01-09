const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2',
    multipleStatements: true
  });

  try {
    console.log('Connected to database');
    
    const sqlPath = path.join(__dirname, 'update_schema.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('Running migration...');
    await connection.query(sql);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration();
