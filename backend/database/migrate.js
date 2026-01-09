const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    for (const statement of statements) {
      try {
        // Skip CREATE DATABASE and USE statements if they cause issues
        if (statement.toUpperCase().includes('CREATE DATABASE') || 
            statement.toUpperCase().includes('USE ')) {
          continue;
        }
        
        await db.query(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      } catch (err) {
        // Ignore "table already exists" errors
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || 
            err.code === 'ER_DUP_ENTRY' ||
            err.message.includes('already exists')) {
          console.log('Skipped (already exists):', statement.substring(0, 50) + '...');
          continue;
        }
        console.error('Error executing statement:', err.message);
        console.error('Statement:', statement.substring(0, 100));
      }
    }
    
    console.log('Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();


