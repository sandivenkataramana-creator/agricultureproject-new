const fs = require('fs');
const path = require('path');

// Load backend .env regardless of cwd
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('../config/database');

function splitSqlStatements(sql) {
  // Remove single-line SQL comments, then split on semicolon + newline/end.
  // Works for our bootstrap/migration files (no stored procedures).
  const withoutLineComments = sql
    .split(/\r?\n/)
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  return withoutLineComments
    .split(/;\s*(?:\r?\n|$)/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function run() {
  const fileArg = process.argv[2];
  const relativeDefault = path.join('database', 'bootstrap_admin_superadmin.sql');
  const sqlFile = path.resolve(__dirname, '..', fileArg || relativeDefault);

  if (!fs.existsSync(sqlFile)) {
    console.error('SQL file not found:', sqlFile);
    process.exit(2);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');
  const statements = splitSqlStatements(sql);

  console.log(`Applying ${statements.length} SQL statements from ${sqlFile}`);

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await conn.query(stmt);
      } catch (err) {
        console.error(`\nFailed statement #${i + 1}:`);
        console.error(stmt);
        console.error('Error:', err.message || err);
        throw err;
      }
    }

    await conn.commit();
    console.log('✓ SQL applied successfully');
  } catch (err) {
    try {
      if (conn) await conn.rollback();
    } catch (_) {}
    process.exit(1);
  } finally {
    try {
      if (conn) conn.release();
    } catch (_) {}
    process.exit(0);
  }
}

run();
