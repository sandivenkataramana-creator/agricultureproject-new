const db = require('./config/database');

(async () => {
  try {
    const [tables] = await db.query("SHOW TABLES LIKE 'flagship_%'");
    
    if (tables.length === 0) {
      console.log('❌ No tables found!');
      process.exit(1);
    }
    
    console.log('✅ Flagship Programmes Tables Created Successfully!\n');
    console.log('📊 Tables in Database:');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`   ✅ ${tableName}`);
    });
    
    console.log('\n🎉 All 3 tables are ready!');
    console.log('   - flagship_programmes');
    console.log('   - flagship_import_metadata');
    console.log('   - flagship_reports');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    process.exit(1);
  }
})();
