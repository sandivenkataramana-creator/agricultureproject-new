const db = require('../config/database');

(async function(){
  try{
    const [rows] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema=DATABASE() AND table_name='beneficiaries'");
    console.log('columns:', rows.map(r=>r.COLUMN_NAME).join(','));
  } catch (e){
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
})();
