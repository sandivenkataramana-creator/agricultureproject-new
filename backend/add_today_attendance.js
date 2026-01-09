const mysql = require('mysql2/promise');

async function addTodayAttendance() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });

  try {
    // Get today's date in MySQL format
    const today = new Date().toISOString().split('T')[0];
    console.log(`Adding attendance for today: ${today}`);

    // Check if we already have attendance for today
    const [existing] = await connection.query(
      'SELECT COUNT(*) as count FROM attendance WHERE date = ?',
      [today]
    );

    if (existing[0].count > 0) {
      console.log(`Already have ${existing[0].count} attendance records for today`);
      // Delete existing and create fresh
      await connection.query('DELETE FROM attendance WHERE date = ?', [today]);
      console.log('Deleted existing records');
    }

    // Get all staff with their HOD ids
    const [staff] = await connection.query('SELECT id, hod_id FROM staff');
    console.log(`Found ${staff.length} staff members`);

    // Add attendance for each staff member
    for (const s of staff) {
      // Randomly assign status and check-in times
      const rand = Math.random();
      let status, checkIn, checkOut;

      if (rand < 0.5) {
        // Present on time (50%)
        status = 'present';
        const hour = 8 + Math.floor(Math.random() * 2); // 8 or 9 AM
        const min = Math.floor(Math.random() * 60);
        checkIn = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
        checkOut = '17:30:00';
      } else if (rand < 0.7) {
        // Late (20%)
        status = 'present';
        const hour = 11 + Math.floor(Math.random() * 2); // 11 or 12 AM (after 10:45)
        const min = Math.floor(Math.random() * 60);
        checkIn = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
        checkOut = '18:00:00';
      } else if (rand < 0.85) {
        // Absent (15%)
        status = 'absent';
        checkIn = null;
        checkOut = null;
      } else if (rand < 0.92) {
        // Half day (7%)
        status = 'half_day';
        checkIn = '09:00:00';
        checkOut = '13:00:00';
      } else {
        // Leave (8%)
        status = 'leave';
        checkIn = null;
        checkOut = null;
      }

      await connection.query(
        `INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.hod_id, today, status, checkIn, checkOut, 'Auto-generated for today']
      );
    }

    // Count results
    const [counts] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'present' AND (check_in IS NULL OR TIME(check_in) <= '10:45:00') THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'present' AND check_in IS NOT NULL AND TIME(check_in) > '10:45:00' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_day,
        COUNT(CASE WHEN status = 'leave' THEN 1 END) as on_leave
      FROM attendance WHERE date = ?
    `, [today]);

    console.log('\n=== Today\'s Attendance Summary ===');
    console.log(`Total Records: ${counts[0].total}`);
    console.log(`Present (On Time): ${counts[0].present}`);
    console.log(`Late (After 10:45 AM): ${counts[0].late}`);
    console.log(`Absent: ${counts[0].absent}`);
    console.log(`Half Day: ${counts[0].half_day}`);
    console.log(`On Leave: ${counts[0].on_leave}`);

    console.log('\nToday\'s attendance data added successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

addTodayAttendance();
