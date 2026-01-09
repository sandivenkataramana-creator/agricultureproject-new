const fs = require('fs');
const path = require('path');
// Explicitly load the backend .env so the script works regardless of cwd
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/database');

async function run() {
  const sqlFile = path.resolve(__dirname, '..', 'database', 'seed_beneficiaries.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error('Seed file not found:', sqlFile);
    process.exit(2);
  }

  // Validate DB env vars early to catch common mistakes
  const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please set them in your .env file (in backend/) or pass them when running the script, e.g.');
    console.error('  DB_USER=root DB_PASSWORD=secret node scripts/apply_beneficiary_seed.js');
    process.exit(2);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');

  // Split statements on semicolon followed by newline (basic but works for this file)
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`Applying ${statements.length} SQL statements from ${sqlFile}`);

  let conn;
  try {
    try {
      conn = await db.getConnection();
    } catch (err) {
      if (err && err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('Database access denied. Please check DB_USER and DB_PASSWORD in backend/.env and ensure the user has privileges for the database.');
        console.error('Error details:', err.message);
        process.exit(3);
      }
      throw err;
    }

    await conn.beginTransaction();

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await conn.query(stmt);
      } catch (err) {
        // If a statement fails, log it but keep going for idempotency where reasonable
        console.warn(`Statement ${i + 1} failed: ${err.code} - ${err.message}`);
      }
    }

    await conn.commit();

    // Quick verification
    const [vTables] = await conn.query("SHOW TABLES LIKE 'villages'");
    const [bTables] = await conn.query("SHOW TABLES LIKE 'beneficiaries'");

    console.log('Verification:');
    console.log('villages table exists:', vTables.length > 0);
    console.log('beneficiaries table exists:', bTables.length > 0);

    if (vTables.length > 0) {
      const [rows] = await conn.query('SELECT COUNT(1) as cnt FROM villages');
      console.log('villages count:', rows[0].cnt);
    }
    if (bTables.length > 0) {
      const [rows] = await conn.query('SELECT COUNT(1) as cnt FROM beneficiaries');
      console.log('beneficiaries count:', rows[0].cnt);
    }

    // Check mandal ids used in sample villages
    const mandalIds = [64,65,66,1,2,3,59];
    const [existingMandals] = await conn.query(`SELECT id FROM mandals WHERE id IN (${mandalIds.join(',')})`);
    const existingSet = new Set(existingMandals.map(r => r.id));
    const missingMandals = mandalIds.filter(id => !existingSet.has(id));
    if (missingMandals.length) {
      console.warn('Warning: the following sample mandal IDs used for villages were NOT found in `mandals` table:', missingMandals);
      console.warn('You may want to either insert matching mandals or update the seed file to use your mandal IDs. The village records were inserted with the mandal_id values as provided in the seed file.');
    }

    console.log('Done. If you see missing mandal warnings, either insert the mandals or adjust the seed file.');

  } catch (err) {
    console.error('Error applying seed:', err.message || err);
    try { if (conn) await conn.rollback(); } catch (e) {}
    process.exit(1);
  } finally {
    try { if (conn) conn.release(); } catch (e) {}
    process.exit(0);
  }
}

run();