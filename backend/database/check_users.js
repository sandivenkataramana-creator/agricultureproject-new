const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hod_management',
  multipleStatements: true
};

async function checkUsers() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database\n');

    // Check users
    const [users] = await connection.query('SELECT id, username, email, role, status FROM users');
    
    console.log('Users in database:');
    console.log('==================');
    users.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`  Username: ${u.username}`);
      console.log(`  Email: ${u.email || 'NULL (MISSING!)'}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Status: ${u.status}`);
      console.log('');
    });

    // Check for users with NULL email
    const [nullEmailUsers] = await connection.query('SELECT id, username FROM users WHERE email IS NULL OR email = ""');
    if (nullEmailUsers.length > 0) {
      console.log('\n⚠️  Users with NULL or empty email:');
      nullEmailUsers.forEach(u => {
        console.log(`  - ID: ${u.id}, Username: ${u.username}`);
      });
      console.log('\nThese users need email addresses to login via email.');
    }

    // Test email login query
    console.log('\nTesting email login query:');
    const testEmail = 'admin@gov.in';
    const [testUsers] = await connection.query(
      `SELECT id, username, email FROM users WHERE LOWER(TRIM(email)) = LOWER(?) AND status = "active"`,
      [testEmail]
    );
    console.log(`Query for "${testEmail}": ${testUsers.length} user(s) found`);
    if (testUsers.length > 0) {
      testUsers.forEach(u => {
        console.log(`  - ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

checkUsers();

