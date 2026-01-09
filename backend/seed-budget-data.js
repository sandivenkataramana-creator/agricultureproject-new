const db = require('./config/database');

async function seedBudgetData() {
  try {
    console.log('Seeding budget data...');
    
    // Check current count
    const [current] = await db.query('SELECT COUNT(*) as count FROM budget');
    console.log(`Current budget records: ${current[0].count}`);
    
    if (current[0].count > 0) {
      console.log('Budget table already has data. Skipping seed.');
      process.exit(0);
    }
    
    // Insert budget data for all 20 HODs
    const budgetData = [
      [1, 1, 216, 1, 1, null, 5000000.00, 3500000.00, 3500000.00, 1500000.00, '2025-26'],
      [2, 2, 217, 1, 1, null, 8000000.00, 6200000.00, 6200000.00, 1800000.00, '2025-26'],
      [3, 3, 218, 1, 2, null, 6500000.00, 4800000.00, 4800000.00, 1700000.00, '2025-26'],
      [4, 4, 219, 1, 3, null, 4500000.00, 3200000.00, 3200000.00, 1300000.00, '2025-26'],
      [5, 5, 220, 1, 4, null, 7000000.00, 5500000.00, 5500000.00, 1500000.00, '2025-26'],
      [6, 6, 221, 1, 5, null, 5500000.00, 4100000.00, 4100000.00, 1400000.00, '2025-26'],
      [7, 7, 222, 1, 6, null, 6000000.00, 4500000.00, 4500000.00, 1500000.00, '2025-26'],
      [8, 8, 223, 1, 7, null, 4800000.00, 3600000.00, 3600000.00, 1200000.00, '2025-26'],
      [9, 9, 224, 1, 8, null, 7500000.00, 5800000.00, 5800000.00, 1700000.00, '2025-26'],
      [10, 10, 225, 1, 9, null, 6200000.00, 4700000.00, 4700000.00, 1500000.00, '2025-26'],
      [11, 11, 226, 1, 10, null, 5800000.00, 4300000.00, 4300000.00, 1500000.00, '2025-26'],
      [12, 12, 227, 1, 11, null, 4900000.00, 3700000.00, 3700000.00, 1200000.00, '2025-26'],
      [13, 13, 228, 1, 12, null, 6800000.00, 5200000.00, 5200000.00, 1600000.00, '2025-26'],
      [14, 14, 229, 1, 13, null, 5200000.00, 3900000.00, 3900000.00, 1300000.00, '2025-26'],
      [15, 15, 230, 1, 14, null, 7200000.00, 5600000.00, 5600000.00, 1600000.00, '2025-26'],
      [16, 16, 231, 1, 15, null, 6100000.00, 4600000.00, 4600000.00, 1500000.00, '2025-26'],
      [17, 17, 232, 1, 16, null, 5400000.00, 4000000.00, 4000000.00, 1400000.00, '2025-26'],
      [18, 18, 233, 1, 17, null, 6600000.00, 5000000.00, 5000000.00, 1600000.00, '2025-26'],
      [19, 19, 216, 1, 18, null, 5900000.00, 4400000.00, 4400000.00, 1500000.00, '2025-26'],
      [20, 20, 217, 1, 19, null, 7100000.00, 5500000.00, 5500000.00, 1600000.00, '2025-26']
    ];
    
    for (const row of budgetData) {
      await db.query(
        `INSERT INTO budget (id, hod_id, scheme_id, state_id, district_id, mandal_id, allocated_amount, spent_amount, utilized_amount, remaining_amount, financial_year, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        row
      );
    }
    
    console.log(`✓ Inserted ${budgetData.length} budget records`);
    
    // Verify
    const [final] = await db.query('SELECT COUNT(*) as count, SUM(allocated_amount) as total_allocated, SUM(utilized_amount) as total_utilized FROM budget');
    console.log(`\n✓ Final budget records: ${final[0].count}`);
    console.log(`✓ Total allocated: ₹${final[0].total_allocated.toLocaleString()}`);
    console.log(`✓ Total utilized: ₹${final[0].total_utilized.toLocaleString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding budget data:', error.message);
    process.exit(1);
  }
}

seedBudgetData();
