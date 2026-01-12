const db = require('./config/database');
const fs = require('fs');
const path = require('path');

const setupFlagshipTables = async () => {
  try {
    console.log('🔄 Reading SQL file...');
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'database/create_flagship_programmes_table.sql'),
      'utf8'
    );
    
    // Split by semicolon and filter out empty statements
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute...\n`);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        console.log(`⏳ Executing: ${statement.substring(0, 80)}...`);
        await db.query(statement);
        console.log(`✅ Success!\n`);
      } catch (error) {
        console.error(`❌ Error: ${error.message}\n`);
        throw error;
      }
    }
    
    console.log('✅ All tables created successfully!');
    console.log('📊 Tables created:');
    console.log('   - flagship_programmes');
    console.log('   - flagship_import_metadata');
    console.log('   - flagship_reports');
    console.log('\n🎉 Setup complete! You can now use the Flagship Programmes feature.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

setupFlagshipTables();
