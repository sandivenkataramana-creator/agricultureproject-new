const db = require('./config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const [result] = await db.query('SELECT 1 as test');
    console.log('✓ Database connection successful');
    
    // Count HODs
    const [hods] = await db.query('SELECT COUNT(*) as count FROM hods');
    console.log(`✓ HODs count: ${hods[0].count}`);
    
    // Count Schemes
    const [schemes] = await db.query('SELECT COUNT(*) as count FROM schemes');
    console.log(`✓ Schemes count: ${schemes[0].count}`);
    
    // Count Staff
    const [staff] = await db.query('SELECT COUNT(*) as count FROM staff');
    console.log(`✓ Staff count: ${staff[0].count}`);
    
    // Count Beneficiaries
    const [beneficiaries] = await db.query('SELECT COUNT(*) as count FROM beneficiaries');
    console.log(`✓ Beneficiaries count: ${beneficiaries[0].count}`);
    
    // Check schemes table structure
    const [schemesSample] = await db.query('SELECT id, scheme_name, hod, financial_year, status FROM schemes LIMIT 3');
    console.log('\\n✓ Sample schemes data:');
    schemesSample.forEach(s => {
      console.log(`  - ID: ${s.id}, Name: ${s.scheme_name}, HOD: ${s.hod}, Year: ${s.financial_year}, Status: ${s.status}`);
    });
    
    // Check budget table
    const [budget] = await db.query('SELECT COUNT(*) as count, COALESCE(SUM(allocated_amount), 0) as total_allocated, COALESCE(SUM(utilized_amount), 0) as total_utilized FROM budget');
    console.log(`\\n✓ Budget: Count=${budget[0].count}, Total Allocated=${budget[0].total_allocated}, Total Utilized=${budget[0].total_utilized}`);
    
    // Check attendance today
    const [attendance] = await db.query('SELECT COUNT(*) as count FROM attendance WHERE DATE(date) = CURDATE()');
    console.log(`✓ Today's attendance records: ${attendance[0].count}`);
    
    console.log('\\n✓ All database checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testConnection();
