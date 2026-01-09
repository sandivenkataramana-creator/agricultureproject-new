const db = require('./config/database');

(async () => {
  try {
    const [rows] = await db.query(`SELECT h.*, c.name as category_name FROM hods h LEFT JOIN categories c ON h.category_id = c.id ORDER BY h.name`);
    console.log('rows count', rows.length);
    console.log(rows[0] || 'no rows');
    await db.end();
  } catch (e) {
    console.error('ERR', e);
  }
})();