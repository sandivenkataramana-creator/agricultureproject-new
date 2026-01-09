const mysql = require('mysql2/promise');

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2',
    multipleStatements: true
  });

  console.log('Connected to database. Running fixes...\n');

  try {
    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Add missing category (ID 9 - Irrigation)
    console.log('1. Adding missing Irrigation category...');
    await connection.query(`
      INSERT INTO categories (id, name, description, status, created_at, updated_at) 
      VALUES (9, 'Irrigation', 'Irrigation and water management', 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);

    // 2. Fix schemes table - Update invalid hod_id references
    console.log('2. Fixing schemes table hod_id references...');
    await connection.query('UPDATE schemes SET hod_id = 11 WHERE hod_id = 1');
    await connection.query('UPDATE schemes SET hod_id = 12 WHERE hod_id = 2');
    await connection.query('UPDATE schemes SET hod_id = 13 WHERE hod_id = 3');
    await connection.query('UPDATE schemes SET hod_id = 14 WHERE hod_id = 4');
    await connection.query('UPDATE schemes SET hod_id = 15 WHERE hod_id = 5');

    // 3. Fix budget table
    console.log('3. Fixing budget table references...');
    await connection.query('UPDATE budget SET hod_id = 11 WHERE hod_id = 1');
    await connection.query('UPDATE budget SET hod_id = 12 WHERE hod_id = 2');
    await connection.query('UPDATE budget SET hod_id = 13 WHERE hod_id = 3');
    await connection.query('UPDATE budget SET hod_id = 14 WHERE hod_id = 4');
    await connection.query('UPDATE budget SET hod_id = 15 WHERE hod_id = 5');
    await connection.query('UPDATE budget SET hod_id = 16 WHERE hod_id = 6');
    await connection.query('UPDATE budget SET hod_id = 17 WHERE hod_id = 7');
    await connection.query('UPDATE budget SET hod_id = 18 WHERE hod_id = 8');

    // Fix scheme_id in budget
    await connection.query('UPDATE budget SET scheme_id = 15 WHERE scheme_id = 7');
    await connection.query('UPDATE budget SET scheme_id = 16 WHERE scheme_id = 8');
    await connection.query('UPDATE budget SET scheme_id = 17 WHERE scheme_id = 9');
    await connection.query('UPDATE budget SET scheme_id = 18 WHERE scheme_id = 10');
    await connection.query('UPDATE budget SET scheme_id = 14 WHERE scheme_id = 11');
    await connection.query('UPDATE budget SET scheme_id = 20 WHERE scheme_id = 12');

    // 4. Fix KPIs table
    console.log('4. Fixing KPIs table hod_id references...');
    await connection.query('UPDATE kpis SET hod_id = 11 WHERE hod_id = 1');
    await connection.query('UPDATE kpis SET hod_id = 12 WHERE hod_id = 2');
    await connection.query('UPDATE kpis SET hod_id = 13 WHERE hod_id = 3');
    await connection.query('UPDATE kpis SET hod_id = 14 WHERE hod_id = 4');
    await connection.query('UPDATE kpis SET hod_id = 15 WHERE hod_id = 5');

    // 5. Fix scheme_budget_allocation
    console.log('5. Fixing scheme_budget_allocation table...');
    await connection.query('UPDATE scheme_budget_allocation SET hod_id = 11, scheme_id = 9 WHERE hod_id = 1');
    await connection.query('UPDATE scheme_budget_allocation SET hod_id = 12, scheme_id = 10 WHERE hod_id = 2');
    await connection.query('UPDATE scheme_budget_allocation SET hod_id = 13, scheme_id = 11 WHERE hod_id = 3');
    await connection.query('UPDATE scheme_budget_allocation SET hod_id = 14, scheme_id = 12 WHERE hod_id = 4');
    await connection.query('UPDATE scheme_budget_allocation SET hod_id = 15, scheme_id = 13 WHERE hod_id = 5');
    await connection.query(`UPDATE scheme_budget_allocation sba JOIN hods h ON sba.hod_id = h.id SET sba.hod_name = h.name`);

    // 6. Fix nodal_officers
    console.log('6. Fixing nodal_officers table scheme_id references...');
    await connection.query('UPDATE nodal_officers SET scheme_id = 9 WHERE scheme_id = 1');
    await connection.query('UPDATE nodal_officers SET scheme_id = 10 WHERE scheme_id = 2');
    await connection.query('UPDATE nodal_officers SET scheme_id = 11 WHERE scheme_id = 3');
    await connection.query('UPDATE nodal_officers SET scheme_id = 12 WHERE scheme_id = 4');
    await connection.query('UPDATE nodal_officers SET scheme_id = 13 WHERE scheme_id = 5');

    // 7. Fix revenue table
    console.log('7. Fixing revenue table scheme_id references...');
    await connection.query('UPDATE revenue SET scheme_id = 9 WHERE scheme_id = 1');
    await connection.query('UPDATE revenue SET scheme_id = 10 WHERE scheme_id = 2');
    await connection.query('UPDATE revenue SET scheme_id = 11 WHERE scheme_id = 3');
    await connection.query('UPDATE revenue SET scheme_id = 12 WHERE scheme_id = 4');
    await connection.query('UPDATE revenue SET scheme_id = 13 WHERE scheme_id = 5');
    await connection.query('UPDATE revenue SET scheme_id = 14 WHERE scheme_id = 6');
    await connection.query('UPDATE revenue SET scheme_id = 15 WHERE scheme_id = 7');
    await connection.query('UPDATE revenue SET scheme_id = 16 WHERE scheme_id = 8');
    await connection.query('UPDATE revenue SET scheme_id = 17 WHERE scheme_id = 9');
    await connection.query('UPDATE revenue SET scheme_id = 18 WHERE scheme_id = 10');
    await connection.query('UPDATE revenue SET scheme_id = 19 WHERE scheme_id = 11');
    await connection.query('UPDATE revenue SET scheme_id = 20 WHERE scheme_id = 12');

    // 8. Fix users table
    console.log('8. Fixing users table hod_id references...');
    await connection.query('UPDATE users SET hod_id = 11 WHERE hod_id = 1');
    await connection.query('UPDATE users SET hod_id = 12 WHERE hod_id = 2');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n========== VERIFICATION ==========\n');

    // Verification queries
    const [orphanedSchemes] = await connection.query(`
      SELECT COUNT(*) as count FROM schemes s 
      LEFT JOIN hods h ON s.hod_id = h.id 
      WHERE h.id IS NULL
    `);
    console.log(`Orphaned hod_id in schemes: ${orphanedSchemes[0].count}`);

    const [orphanedBudgetHod] = await connection.query(`
      SELECT COUNT(*) as count FROM budget b 
      LEFT JOIN hods h ON b.hod_id = h.id 
      WHERE h.id IS NULL AND b.hod_id IS NOT NULL
    `);
    console.log(`Orphaned hod_id in budget: ${orphanedBudgetHod[0].count}`);

    const [orphanedKpis] = await connection.query(`
      SELECT COUNT(*) as count FROM kpis k 
      LEFT JOIN hods h ON k.hod_id = h.id 
      WHERE h.id IS NULL AND k.hod_id IS NOT NULL
    `);
    console.log(`Orphaned hod_id in kpis: ${orphanedKpis[0].count}`);

    const [orphanedUsers] = await connection.query(`
      SELECT COUNT(*) as count FROM users u 
      LEFT JOIN hods h ON u.hod_id = h.id 
      WHERE h.id IS NULL AND u.hod_id IS NOT NULL
    `);
    console.log(`Orphaned hod_id in users: ${orphanedUsers[0].count}`);

    const [orphanedBudgetScheme] = await connection.query(`
      SELECT COUNT(*) as count FROM budget b 
      LEFT JOIN schemes s ON b.scheme_id = s.id 
      WHERE s.id IS NULL AND b.scheme_id IS NOT NULL
    `);
    console.log(`Orphaned scheme_id in budget: ${orphanedBudgetScheme[0].count}`);

    const [orphanedNodal] = await connection.query(`
      SELECT COUNT(*) as count FROM nodal_officers n 
      LEFT JOIN schemes s ON n.scheme_id = s.id 
      WHERE s.id IS NULL AND n.scheme_id IS NOT NULL
    `);
    console.log(`Orphaned scheme_id in nodal_officers: ${orphanedNodal[0].count}`);

    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log(`\nTotal categories: ${categories[0].count}`);

    const [hods] = await connection.query('SELECT id, name, department FROM hods ORDER BY id');
    console.log('\n========== CURRENT HODs ==========');
    hods.forEach(h => console.log(`  ID ${h.id}: ${h.name} - ${h.department}`));

    console.log('\n========== DATABASE FIX COMPLETED SUCCESSFULLY ==========');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixDatabase();
