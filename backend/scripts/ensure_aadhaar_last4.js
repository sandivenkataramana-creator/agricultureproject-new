const db = require('../config/database');

(async function(){
  try{
    // Only run if explicitly enabled via env var
    if (!process.env.ENABLE_AADHAAR_LAST4) {
      console.log('Skipping aadhaar_last4 ensure: set ENABLE_AADHAAR_LAST4=1 to enable');
      return;
    }

    const [cols] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema=DATABASE() AND table_name='beneficiaries' AND COLUMN_NAME='aadhaar_last4'");
    if (cols.length === 0) {
      console.log('aadhaar_last4 not found, adding column...');
      await db.query('ALTER TABLE beneficiaries ADD COLUMN aadhaar_last4 VARCHAR(4) DEFAULT NULL');
      console.log('aadhaar_last4 added');
    } else {
      console.log('aadhaar_last4 already exists');
    }

    console.log('Populating aadhaar_last4 from aadhaar where missing...');
    const [res] = await db.query("UPDATE beneficiaries SET aadhaar_last4 = RIGHT(aadhaar,4) WHERE aadhaar IS NOT NULL AND (aadhaar_last4 IS NULL OR aadhaar_last4 = '')");
    console.log('Rows updated:', res.affectedRows);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
})();