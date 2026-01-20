const mysql = require('mysql2/promise');

const seedRevenue = async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'hod_management2'
    });

    console.log('Fetching HODs...');
    const [hods] = await conn.execute('SELECT id, name FROM hods LIMIT 20');
    
    if (hods.length === 0) {
      console.log('No HODs found');
      await conn.end();
      return;
    }

    console.log(`Found ${hods.length} HODs. Seeding revenue data...`);

    const amounts = [1500000, 2250000, 1800000, 950000, 3200000, 1100000, 890000, 2450000, 1350000, 2800000, 1600000, 1200000, 1750000, 2100000, 1450000];
    const sources = ['Government Grant', 'Internal Revenue', 'Tax Collection', 'Fees', 'Donations', 'Interest', 'Royalties', 'Lease'];
    const categories = ['Budget', 'Non-Budget', 'Special Grant', 'Transfer', 'Direct Benefit'];

    let count = 0;
    for (let i = 0; i < hods.length; i++) {
      const amount = amounts[i % amounts.length];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const month = Math.floor(Math.random() * 12) + 4; // April onwards
      const year = month > 12 ? 2026 : 2025;
      const adjustedMonth = month > 12 ? month - 12 : month;
      const day = Math.floor(Math.random() * 28) + 1;
      const dateStr = `${year}-${String(adjustedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      await conn.execute(
        'INSERT INTO revenue (hod_id, amount, source, category, date, description) VALUES (?, ?, ?, ?, ?, ?)',
        [hods[i].id, amount, source, category, dateStr, `Revenue: ${source}`]
      );
      count++;
    }

    console.log(`✓ Inserted ${count} revenue records`);

    // Verify
    const [result] = await conn.execute('SELECT COUNT(*) as cnt FROM revenue');
    console.log(`Total revenue records: ${result[0].cnt}`);

    const [sample] = await conn.execute(`
      SELECT h.name, SUM(r.amount) as total
      FROM hods h
      LEFT JOIN revenue r ON h.id = r.hod_id
      GROUP BY h.id
      LIMIT 3
    `);

    console.log('\nSample data:');
    sample.forEach(row => console.log(`  ${row.name}: ₹${row.total}`));
    console.log('\n✓ Done!');

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
};

seedRevenue();
