const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({host:'localhost', user:'root', password:'', database:'hod_management2'});
  const [cols] = await conn.query('SHOW COLUMNS FROM schemes');
  console.log(cols);
  await conn.end();
})();