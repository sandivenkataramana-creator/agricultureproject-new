const mysql = require('mysql2/promise');

async function checkHODs() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });
  
  const [rows] = await conn.execute('SELECT id, name, department FROM hods ORDER BY id');
  console.log('Total HODs:', rows.length);
  console.log('---');
  rows.forEach(r => console.log(r.id + ': ' + r.department));
  
  await conn.end();
}

checkHODs();
