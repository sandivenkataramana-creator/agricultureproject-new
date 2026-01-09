const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Checking schemes table columns...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'schemes'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('Schemes columns:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (nullable: ${col.IS_NULLABLE})`);
    });
    
    console.log('\nChecking nodal_officers table columns...');
    const [nodalCols] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'nodal_officers'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('Nodal officers columns:');
    nodalCols.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (nullable: ${col.IS_NULLABLE})`);
    });

    console.log('\nChecking schemes table data...');
    const [schemes] = await connection.query(`SELECT * FROM schemes LIMIT 3`);
    console.log('Sample schemes:');
    if (schemes.length > 0) {
      console.log(JSON.stringify(schemes[0], null, 2));
    } else {
      console.log('No schemes found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTables();
