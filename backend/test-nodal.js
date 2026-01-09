const mysql = require('mysql2/promise');
require('dotenv').config();

async function testNodalOfficers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Testing nodal_officers query...');
    const [results] = await connection.query(`
      SELECT n.*, s.scheme_name,
             st.name as state_name,
             d.name as district_name,
             m.name as mandal_name,
             COALESCE(
               n.total_days,
               CASE 
                 WHEN n.start_date IS NOT NULL AND n.end_date IS NOT NULL THEN DATEDIFF(n.end_date, n.start_date) + 1
                 ELSE NULL
               END
             ) AS total_days
      FROM nodal_officers n 
      LEFT JOIN schemes s ON n.scheme_id = s.id
      LEFT JOIN states st ON n.state_id = st.id
      LEFT JOIN districts d ON n.district_id = d.id
      LEFT JOIN mandals m ON n.mandal_id = m.id
      ORDER BY n.name
    `);
    console.log('Query successful! Results:');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Query failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await connection.end();
  }
}

testNodalOfficers();
