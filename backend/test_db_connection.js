require('dotenv').config();
const db = require('./config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DB Config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD ? '***' : 'empty'
    });

    // Test connection
    const connection = await db.getConnection();
    console.log('✓ Connected to database');
    
    // Check if programs table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'programs'");
    console.log('✓ Programs table exists:', tables.length > 0);
    
    // Get all programs
    const [programs] = await connection.query('SELECT * FROM programs');
    console.log('✓ Programs count:', programs.length);
    console.log('Programs:', JSON.stringify(programs, null, 2));
    
    connection.release();
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
  process.exit(0);
}

testConnection();
