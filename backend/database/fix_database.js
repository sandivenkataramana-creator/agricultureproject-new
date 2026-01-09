const db = require('../config/database');

async function fixDatabase() {
  try {
    console.log('Checking and fixing database schema...');
    
    // Check and create categories table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Categories table created/verified');
    } catch (err) {
      console.error('Error creating categories table:', err.message);
    }

    // Add category_id to hods if it doesn't exist
    try {
      await db.query(`
        ALTER TABLE hods 
        ADD COLUMN category_id INT NULL
      `);
      console.log('✓ Added category_id to hods table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ category_id already exists in hods table');
      } else {
        console.error('Error adding category_id to hods:', err.message);
      }
    }

    // Add category_id to staff if it doesn't exist
    try {
      await db.query(`
        ALTER TABLE staff 
        ADD COLUMN category_id INT NULL
      `);
      console.log('✓ Added category_id to staff table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ category_id already exists in staff table');
      } else {
        console.error('Error adding category_id to staff:', err.message);
      }
    }

    // Add category_id to schemes if it doesn't exist
    try {
      await db.query(`
        ALTER TABLE schemes 
        ADD COLUMN category_id INT NULL
      `);
      console.log('✓ Added category_id to schemes table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ category_id already exists in schemes table');
      } else {
        console.error('Error adding category_id to schemes:', err.message);
      }
    }

    // Add location fields to budget
    const locationFields = [
      { name: 'state_id', type: 'INT NULL' },
      { name: 'district_id', type: 'INT NULL' },
      { name: 'mandal_id', type: 'INT NULL' },
      { name: 'village', type: 'VARCHAR(255) NULL' }
    ];

    for (const field of locationFields) {
      try {
        await db.query(`
          ALTER TABLE budget 
          ADD COLUMN ${field.name} ${field.type}
        `);
        console.log(`✓ Added ${field.name} to budget table`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`✓ ${field.name} already exists in budget table`);
        } else {
          console.error(`Error adding ${field.name} to budget:`, err.message);
        }
      }
    }

    // Ensure description column exists on budget
    try {
      await db.query(`
        ALTER TABLE budget
        ADD COLUMN description TEXT NULL
      `);
      console.log('✓ Added description to budget table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ description already exists in budget table');
      } else {
        console.error('Error adding description to budget:', err.message);
      }
    }

    // Create states table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS states (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          status TINYINT(1) DEFAULT 1
        )
      `);
      console.log('✓ States table created/verified');
    } catch (err) {
      console.error('Error creating states table:', err.message);
    }

    // Create districts table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS districts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          state_id INT NOT NULL,
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          status TINYINT(1) DEFAULT 1,
          FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
        )
      `);
      console.log('✓ Districts table created/verified');
    } catch (err) {
      console.error('Error creating districts table:', err.message);
    }

    // Create mandals table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS mandals (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(150) NOT NULL,
          district_id INT NOT NULL,
          created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          status TINYINT(1) DEFAULT 1,
          FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
        )
      `);
      console.log('✓ Mandals table created/verified');
    } catch (err) {
      console.error('Error creating mandals table:', err.message);
    }

    // Insert sample categories
    try {
      await db.query(`
        INSERT IGNORE INTO categories (name, description, status) VALUES
        ('Agriculture', 'Agriculture and related departments', 'active'),
        ('Rural Development', 'Rural development and welfare', 'active'),
        ('Urban Planning', 'Urban planning and infrastructure', 'active'),
        ('Health & Welfare', 'Health and welfare departments', 'active'),
        ('Education', 'Education and training departments', 'active'),
        ('Employment', 'Employment and skill development', 'active'),
        ('Infrastructure', 'Infrastructure development', 'active'),
        ('Sanitation', 'Sanitation and cleanliness', 'active')
      `);
      console.log('✓ Sample categories inserted');
    } catch (err) {
      console.error('Error inserting categories:', err.message);
    }

    // Insert Telangana state
    try {
      await db.query(`
        INSERT IGNORE INTO states (id, name, status) VALUES (1, 'Telangana', 1)
      `);
      console.log('✓ Telangana state inserted');
    } catch (err) {
      console.error('Error inserting state:', err.message);
    }

    console.log('\n✅ Database schema update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
}

fixDatabase();


