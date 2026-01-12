const db = require('./config/database');

(async () => {
  try {
    console.log('🔍 Testing HOD counts...\n');
    
    const [totalHods] = await db.query('SELECT COUNT(*) as count FROM hods');
    console.log('Total HODs:', totalHods[0].count);
    
    const [activeHods] = await db.query('SELECT COUNT(*) as count FROM hods WHERE status = "active"');
    console.log('Active HODs:', activeHods[0].count);
    
    const [allHods] = await db.query('SELECT * FROM hods LIMIT 5');
    console.log('\nFirst 5 HODs:');
    allHods.forEach(hod => console.log(`- ${hod.name} (${hod.status})`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
