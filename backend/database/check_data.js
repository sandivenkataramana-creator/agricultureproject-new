const mysql = require('mysql2/promise');

async function checkData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });

  try {
    console.log('Checking states...');
    const [states] = await connection.query('SELECT * FROM states');
    console.log('States:', states);

    console.log('\nChecking districts for state_id = 1...');
    const [districts] = await connection.query('SELECT * FROM districts WHERE state_id = 1');
    console.log('Districts:', districts);

    console.log('\nAll districts...');
    const [allDistricts] = await connection.query('SELECT * FROM districts');
    console.log('All Districts:', allDistricts);

    console.log('\nChecking mandals...');
    const [mandals] = await connection.query('SELECT * FROM mandals LIMIT 5');
    console.log('Mandals (first 5):', mandals);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkData();
