const db = require('../config/database');

async function addOTPColumns() {
  try {
    console.log('Checking if reset_otp column exists...');
    
    // Check if column exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_otp'
    `);

    if (columns.length === 0) {
      console.log('Adding reset_otp and reset_otp_expiry columns to users table...');
      
      await db.query(`
        ALTER TABLE users ADD COLUMN reset_otp VARCHAR(6) NULL DEFAULT NULL
      `);
      
      await db.query(`
        ALTER TABLE users ADD COLUMN reset_otp_expiry TIMESTAMP NULL DEFAULT NULL
      `);
      
      console.log('✓ Columns added successfully');
    } else {
      console.log('✓ Columns already exist');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addOTPColumns();
