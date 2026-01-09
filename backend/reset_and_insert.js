const mysql = require('mysql2/promise');

async function resetAndInsert() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });

  console.log('Connected to database...\n');

  try {
    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // ============================================
    // 1. RESET HODs TABLE - Start from ID 1
    // ============================================
    console.log('1. Clearing HODs table and resetting auto-increment...');
    await connection.query('TRUNCATE TABLE hods');
    
    // Insert 20 Agriculture Department HODs starting from ID 1
    console.log('2. Inserting 20 HODs starting from ID 1...');
    const hodInsertSQL = `
      INSERT INTO hods (name, department, category_id, email, phone, status) VALUES
      ('Secretary A&C', 'A&C Secretariat', 1, 'secretary.ac@agri.gov.in', '9876543220', 'active'),
      ('Director of Agriculture', 'Director of Agriculture', 1, 'director.agriculture@agri.gov.in', '9876543221', 'active'),
      ('Director H&S', 'Horticulture and Sericulture', 1, 'director.hs@agri.gov.in', '9876543222', 'active'),
      ('Director Marketing', 'Agricultural Marketing', 1, 'director.marketing@agri.gov.in', '9876543223', 'active'),
      ('Registrar Cooperation', 'Cooperation', 1, 'registrar.cooperation@agri.gov.in', '9876543224', 'active'),
      ('Vice Chancellor PJTAU', 'Prof Jayashankar Telangana State Agricultural University (PJTAU)', 5, 'vc.pjtau@agri.gov.in', '9876543225', 'active'),
      ('Vice Chancellor SKLTSHU', 'Sri Konda Laxman Telangana State Horticulture University (SKLTSHU)', 5, 'vc.skltshu@agri.gov.in', '9876543226', 'active'),
      ('Director SAMETI', 'SAMETI', 5, 'director.sameti@agri.gov.in', '9876543227', 'active'),
      ('MD TG MARKFED', 'Telangana State Marketing Federation Limited (TG MARKFED)', 1, 'md.markfed@agri.gov.in', '9876543228', 'active'),
      ('MD TGSDCL', 'Telangana State Seed Development Corporation (TGSDCL)', 1, 'md.tgsdcl@agri.gov.in', '9876543229', 'active'),
      ('Director TGSOCA', 'Telangana State Seed and Organic Certification Authority (TGSOCA)', 1, 'director.tgsoca@agri.gov.in', '9876543230', 'active'),
      ('MD TGAGROS', 'Telangana State Agro Industries Development Corp Ltd (TGAGROS)', 1, 'md.tgagros@agri.gov.in', '9876543231', 'active'),
      ('MD TGOILFED', 'Telangana State Coop Oil Seeds Growers Federation Ltd (TGOILFED)', 1, 'md.tgoilfed@agri.gov.in', '9876543232', 'active'),
      ('MD TGWC', 'Telangana State Warehousing Corporation (TGWC)', 1, 'md.tgwc@agri.gov.in', '9876543233', 'active'),
      ('MD HACA', 'The Hyderabad Agricultural Cooperative Association Ltd (HACA)', 1, 'md.haca@agri.gov.in', '9876543234', 'active'),
      ('MD TGHDCL', 'Telangana State Horticulture Development Corporation (TGHDCL)', 1, 'md.tghdcl@agri.gov.in', '9876543235', 'active'),
      ('MD TGRIC', 'Telangana State Cooperative Rural Irrigation Corp (TGRIC)', 1, 'md.tgric@agri.gov.in', '9876543236', 'active'),
      ('MD TGCU', 'Telangana State Cooperative Union (TGCU)', 1, 'md.tgcu@agri.gov.in', '9876543237', 'active'),
      ('MD TG HOUSEFED', 'Telangana State Cooperative Housing Federation (TG HOUSEFED)', 1, 'md.housefed@agri.gov.in', '9876543238', 'active'),
      ('Secretary AMC', 'Agriculture Market Committee', 1, 'secretary.amc@agri.gov.in', '9876543239', 'active')
    `;
    await connection.query(hodInsertSQL);

    // ============================================
    // 2. RESET STAFF TABLE - Add 19 dummy staff
    // ============================================
    console.log('3. Clearing Staff table and resetting auto-increment...');
    await connection.query('TRUNCATE TABLE staff');

    console.log('4. Inserting 19 dummy staff members...');
    const staffInsertSQL = `
      INSERT INTO staff (name, employee_id, designation, department, category_id, hod_id, email, phone, joining_date, status) VALUES
      ('Rajesh Kumar', 'EMP001', 'Assistant Director', 'A&C Secretariat', 1, 1, 'rajesh.kumar@agri.gov.in', '9000000001', '2020-01-15', 'active'),
      ('Priya Sharma', 'EMP002', 'Senior Officer', 'Director of Agriculture', 1, 2, 'priya.sharma@agri.gov.in', '9000000002', '2019-06-20', 'active'),
      ('Venkat Reddy', 'EMP003', 'Deputy Director', 'Horticulture and Sericulture', 1, 3, 'venkat.reddy@agri.gov.in', '9000000003', '2018-03-10', 'active'),
      ('Lakshmi Devi', 'EMP004', 'Marketing Officer', 'Agricultural Marketing', 1, 4, 'lakshmi.devi@agri.gov.in', '9000000004', '2021-02-28', 'active'),
      ('Mohammed Imran', 'EMP005', 'Cooperation Officer', 'Cooperation', 1, 5, 'mohammed.imran@agri.gov.in', '9000000005', '2020-07-15', 'active'),
      ('Suresh Babu', 'EMP006', 'Research Associate', 'PJTAU', 5, 6, 'suresh.babu@agri.gov.in', '9000000006', '2019-11-01', 'active'),
      ('Anitha Rao', 'EMP007', 'Horticulture Specialist', 'SKLTSHU', 5, 7, 'anitha.rao@agri.gov.in', '9000000007', '2018-09-15', 'active'),
      ('Ganesh Prasad', 'EMP008', 'Training Coordinator', 'SAMETI', 5, 8, 'ganesh.prasad@agri.gov.in', '9000000008', '2021-04-20', 'active'),
      ('Kavitha Rani', 'EMP009', 'Marketing Executive', 'TG MARKFED', 1, 9, 'kavitha.rani@agri.gov.in', '9000000009', '2020-08-10', 'active'),
      ('Ramesh Naidu', 'EMP010', 'Seed Officer', 'TGSDCL', 1, 10, 'ramesh.naidu@agri.gov.in', '9000000010', '2019-05-25', 'active'),
      ('Srinivas Murthy', 'EMP011', 'Certification Officer', 'TGSOCA', 1, 11, 'srinivas.murthy@agri.gov.in', '9000000011', '2018-12-01', 'active'),
      ('Padma Kumari', 'EMP012', 'Industry Liaison', 'TGAGROS', 1, 12, 'padma.kumari@agri.gov.in', '9000000012', '2021-01-10', 'active'),
      ('Nagaraju Goud', 'EMP013', 'Oil Federation Officer', 'TGOILFED', 1, 13, 'nagaraju.goud@agri.gov.in', '9000000013', '2020-03-18', 'active'),
      ('Swathi Reddy', 'EMP014', 'Warehouse Manager', 'TGWC', 1, 14, 'swathi.reddy@agri.gov.in', '9000000014', '2019-09-05', 'active'),
      ('Bharath Singh', 'EMP015', 'Cooperative Officer', 'HACA', 1, 15, 'bharath.singh@agri.gov.in', '9000000015', '2018-06-22', 'active'),
      ('Rekha Varma', 'EMP016', 'Horticulture Officer', 'TGHDCL', 1, 16, 'rekha.varma@agri.gov.in', '9000000016', '2021-05-30', 'active'),
      ('Kiran Kumar', 'EMP017', 'Irrigation Officer', 'TGRIC', 1, 17, 'kiran.kumar@agri.gov.in', '9000000017', '2020-10-12', 'active'),
      ('Sunitha Reddy', 'EMP018', 'Union Coordinator', 'TGCU', 1, 18, 'sunitha.reddy@agri.gov.in', '9000000018', '2019-02-14', 'active'),
      ('Mahesh Chandra', 'EMP019', 'Housing Officer', 'TG HOUSEFED', 1, 19, 'mahesh.chandra@agri.gov.in', '9000000019', '2018-08-08', 'active')
    `;
    await connection.query(staffInsertSQL);

    // ============================================
    // 3. UPDATE RELATED TABLES TO REFERENCE NEW IDs
    // ============================================
    console.log('5. Updating related tables with new HOD IDs...');
    
    // Clear and reset attendance
    await connection.query('TRUNCATE TABLE attendance');
    
    // Update schemes to use new HOD IDs (1-20)
    await connection.query('UPDATE schemes SET hod_id = 1 WHERE hod_id = 11');
    await connection.query('UPDATE schemes SET hod_id = 2 WHERE hod_id = 12');
    await connection.query('UPDATE schemes SET hod_id = 3 WHERE hod_id = 13');
    await connection.query('UPDATE schemes SET hod_id = 4 WHERE hod_id = 14');
    await connection.query('UPDATE schemes SET hod_id = 5 WHERE hod_id = 15');
    await connection.query('UPDATE schemes SET hod_id = 6 WHERE hod_id = 16');
    await connection.query('UPDATE schemes SET hod_id = 7 WHERE hod_id = 17');
    await connection.query('UPDATE schemes SET hod_id = 8 WHERE hod_id = 18');

    // Update budget
    await connection.query('UPDATE budget SET hod_id = 1 WHERE hod_id = 11');
    await connection.query('UPDATE budget SET hod_id = 2 WHERE hod_id = 12');
    await connection.query('UPDATE budget SET hod_id = 3 WHERE hod_id = 13');
    await connection.query('UPDATE budget SET hod_id = 4 WHERE hod_id = 14');
    await connection.query('UPDATE budget SET hod_id = 5 WHERE hod_id = 15');
    await connection.query('UPDATE budget SET hod_id = 6 WHERE hod_id = 16');
    await connection.query('UPDATE budget SET hod_id = 7 WHERE hod_id = 17');
    await connection.query('UPDATE budget SET hod_id = 8 WHERE hod_id = 18');

    // Update revenue
    await connection.query('UPDATE revenue SET hod_id = 1 WHERE hod_id = 11');
    await connection.query('UPDATE revenue SET hod_id = 2 WHERE hod_id = 12');
    await connection.query('UPDATE revenue SET hod_id = 3 WHERE hod_id = 13');
    await connection.query('UPDATE revenue SET hod_id = 4 WHERE hod_id = 14');
    await connection.query('UPDATE revenue SET hod_id = 5 WHERE hod_id = 15');
    await connection.query('UPDATE revenue SET hod_id = 6 WHERE hod_id = 16');
    await connection.query('UPDATE revenue SET hod_id = 7 WHERE hod_id = 17');
    await connection.query('UPDATE revenue SET hod_id = 8 WHERE hod_id = 18');

    // Update KPIs
    await connection.query('UPDATE kpis SET hod_id = 1 WHERE hod_id = 11');
    await connection.query('UPDATE kpis SET hod_id = 2 WHERE hod_id = 12');
    await connection.query('UPDATE kpis SET hod_id = 3 WHERE hod_id = 13');
    await connection.query('UPDATE kpis SET hod_id = 4 WHERE hod_id = 14');
    await connection.query('UPDATE kpis SET hod_id = 5 WHERE hod_id = 15');

    // Update users
    await connection.query('UPDATE users SET hod_id = 1 WHERE hod_id = 11');
    await connection.query('UPDATE users SET hod_id = 2 WHERE hod_id = 12');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // ============================================
    // 4. VERIFICATION
    // ============================================
    console.log('\n========== VERIFICATION ==========\n');

    const [hods] = await connection.query('SELECT id, name, department FROM hods ORDER BY id');
    console.log(`Total HODs: ${hods.length}`);
    console.log('\nHODs List:');
    hods.forEach(h => console.log(`  ${h.id}: ${h.name} - ${h.department.substring(0, 40)}...`));

    const [staff] = await connection.query('SELECT id, name, employee_id, department FROM staff ORDER BY id');
    console.log(`\nTotal Staff: ${staff.length}`);
    console.log('\nStaff List:');
    staff.forEach(s => console.log(`  ${s.id}: ${s.name} (${s.employee_id}) - ${s.department}`));

    console.log('\n========== COMPLETED SUCCESSFULLY ==========');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetAndInsert();
