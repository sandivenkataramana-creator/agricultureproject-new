const mysql = require('mysql2/promise');

async function addEmployeeType() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });

  try {
    // Check if column exists
    const [columns] = await connection.execute('SHOW COLUMNS FROM staff LIKE "employee_type"');
    
    if (columns.length === 0) {
      await connection.execute(`
        ALTER TABLE staff 
        ADD COLUMN employee_type ENUM('regular', 'outsource') DEFAULT 'regular' AFTER status
      `);
      console.log('Column employee_type added to staff table');
    } else {
      console.log('Column employee_type already exists');
    }

    // Update some staff to be outsource for variety
    await connection.execute(`UPDATE staff SET employee_type = 'outsource' WHERE id IN (3, 6, 9, 12, 15, 18)`);
    console.log('Updated some staff to outsource type');

    // Verify
    const [staff] = await connection.execute('SELECT id, name, employee_type FROM staff');
    console.log('\nStaff with employee types:');
    staff.forEach(s => console.log(`  ${s.id}: ${s.name} - ${s.employee_type}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addEmployeeType();
