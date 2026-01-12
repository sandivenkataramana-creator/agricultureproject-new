const db = require('./config/database');

async function testDashboardQueries() {
  try {
    console.log('Testing dashboard queries...');
    
    const [totalHods] = await db.query('SELECT COUNT(*) as count FROM hods');
    console.log('Total HODs:', totalHods);
    
    const [activeHods] = await db.query('SELECT COUNT(*) as count FROM hods WHERE status = "active"');
    console.log('Active HODs:', activeHods);
    
    const [totalSchemes] = await db.query('SELECT COUNT(*) as count FROM schemes');
    console.log('Total Schemes:', totalSchemes);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDashboardQueries();
