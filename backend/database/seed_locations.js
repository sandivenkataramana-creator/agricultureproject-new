const mysql = require('mysql2/promise');

async function seedData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });

  try {
    console.log('Connected to database');
    
    // Check if Telangana state exists
    const [states] = await connection.query('SELECT * FROM states WHERE id = 1');
    if (states.length === 0) {
      console.log('Inserting Telangana state...');
      await connection.query(`INSERT INTO states (id, name, status) VALUES (1, 'Telangana', 1)`);
    } else {
      console.log('Telangana state already exists');
    }
    
    // Check if districts exist
    const [districts] = await connection.query('SELECT COUNT(*) as count FROM districts WHERE state_id = 1');
    if (districts[0].count === 0) {
      console.log('Inserting sample districts...');
      await connection.query(`
        INSERT INTO districts (name, state_id, status) VALUES
        ('Hyderabad', 1, 1),
        ('Medchal-Malkajgiri', 1, 1),
        ('Rangareddy', 1, 1),
        ('Sangareddy', 1, 1),
        ('Medak', 1, 1),
        ('Nizamabad', 1, 1),
        ('Karimnagar', 1, 1),
        ('Warangal Urban', 1, 1),
        ('Warangal Rural', 1, 1),
        ('Khammam', 1, 1),
        ('Nalgonda', 1, 1),
        ('Mahbubnagar', 1, 1)
      `);
    } else {
      console.log(`${districts[0].count} districts already exist`);
    }
    
    // Check if mandals exist
    const [mandals] = await connection.query('SELECT COUNT(*) as count FROM mandals');
    if (mandals[0].count === 0) {
      console.log('Inserting sample mandals...');
      
      // Get district IDs
      const [districtList] = await connection.query('SELECT id, name FROM districts WHERE state_id = 1');
      
      for (const district of districtList.slice(0, 5)) { // Add mandals for first 5 districts
        await connection.query(`
          INSERT INTO mandals (name, district_id, status) VALUES
          ('${district.name} Urban', ${district.id}, 1),
          ('${district.name} Rural', ${district.id}, 1),
          ('${district.name} North', ${district.id}, 1),
          ('${district.name} South', ${district.id}, 1)
        `);
      }
    } else {
      console.log(`${mandals[0].count} mandals already exist`);
    }
    
    console.log('Seed data completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

seedData();
