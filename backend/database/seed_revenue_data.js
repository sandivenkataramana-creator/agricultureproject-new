const db = require('../config/database');

const seedRevenueData = async () => {
  try {
    console.log('Seeding revenue data...');

    // First, get all HODs
    const [hods] = await db.query('SELECT id FROM hods LIMIT 20');
    
    if (hods.length === 0) {
      console.log('No HODs found. Please create HODs first.');
      await db.end();
      return;
    }

    // Revenue amounts for different departments (in rupees)
    const revenueAmounts = [
      1500000,
      2250000,
      1800000,
      950000,
      3200000,
      1100000,
      890000,
      2450000,
      1350000,
      2800000,
      1600000,
      1200000,
      1750000,
      2100000,
      1450000
    ];

    const sources = [
      'Government Grant',
      'Internal Revenue',
      'Tax Collection',
      'Fees and Charges',
      'Donations',
      'Interest Income',
      'Royalties',
      'Lease Income'
    ];

    const categories = [
      'Budget',
      'Non-Budget',
      'Special Grant',
      'Conditional Transfer',
      'Direct Benefit'
    ];

    let insertedCount = 0;

    // Insert revenue records for each HOD for the current financial year (2025-26)
    for (let i = 0; i < hods.length; i++) {
      const hod = hods[i];
      const amount = revenueAmounts[i % revenueAmounts.length];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Generate date within 2025-26 financial year (April 2025 - March 2026)
      const month = Math.floor(Math.random() * 12) + (4); // April (4) to March (3 of next year)
      const year = month <= 12 ? 2025 : 2026;
      const adjustedMonth = month > 12 ? month - 12 : month;
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(year, adjustedMonth - 1, day).toISOString().split('T')[0];

      await db.query(
        'INSERT INTO revenue (hod_id, amount, source, category, date, description) VALUES (?, ?, ?, ?, ?, ?)',
        [hod.id, amount, source, category, date, `Revenue collection for ${source}`]
      );
      insertedCount++;
    }

    console.log(`✓ Inserted ${insertedCount} revenue records`);
    
    // Verify data
    const [count] = await db.query('SELECT COUNT(*) as cnt FROM revenue');
    console.log(`Total revenue records in database: ${count[0].cnt}`);

    // Show sample by HOD
    const [sample] = await db.query(`
      SELECT h.name, COALESCE(SUM(r.amount), 0) as total
      FROM hods h
      LEFT JOIN revenue r ON h.id = r.hod_id
      GROUP BY h.id, h.name
      LIMIT 5
    `);
    console.log('\nSample revenue by HOD:');
    sample.forEach(row => {
      console.log(`  ${row.name}: ₹${row.total}`);
    });

    console.log('\n✓ Revenue data seeding completed successfully!');
    await db.end();
  } catch (error) {
    console.error('Error seeding revenue data:', error);
    await db.end();
    process.exit(1);
  }
};

seedRevenueData();
