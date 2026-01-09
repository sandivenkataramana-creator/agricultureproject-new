const db = require('../config/database');
(async function(){
  try{
    const [rows] = await db.query('SELECT id, username, email, password, role FROM users WHERE status = "active" LIMIT 10');
    console.log('Active users:\n', rows);
  } catch (e) {
    console.error('Error querying users', e);
  } finally {
    process.exit(0);
  }
})();