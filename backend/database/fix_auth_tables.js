const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hod_management',
  multipleStatements: true
};

async function fixAuthTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Update users table to make email required
    console.log('Updating users table...');
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN email VARCHAR(255) UNIQUE NOT NULL
    `).catch(err => {
      if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_BAD_FIELD_ERROR') {
        console.log('Email column already updated or error:', err.message);
      }
    });

    // Add password_changed column if it doesn't exist
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN password_changed BOOLEAN DEFAULT FALSE
    `).catch(err => {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.log('password_changed column already exists or error:', err.message);
      }
    });

    // Create password_reset_otps table
    console.log('Creating password_reset_otps table...');
    await connection.query(`
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
      )
    `);

    console.log('✅ Auth tables updated successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing auth tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

fixAuthTables();

