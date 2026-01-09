const mysql = require('mysql2/promise');

const departments = [
  { name: 'Secretary A&C', department: 'A&C Secretariat', email: 'secretary.ac@agri.gov.in', phone: '9876543220' },
  { name: 'Director of Agriculture', department: 'Director of Agriculture', email: 'director.agriculture@agri.gov.in', phone: '9876543221' },
  { name: 'Director H&S', department: 'Horticulture and Sericulture', email: 'director.hs@agri.gov.in', phone: '9876543222' },
  { name: 'Director Marketing', department: 'Agricultural Marketing', email: 'director.marketing@agri.gov.in', phone: '9876543223' },
  { name: 'Registrar Cooperation', department: 'Cooperation', email: 'registrar.cooperation@agri.gov.in', phone: '9876543224' },
  { name: 'Vice Chancellor PJTAU', department: 'Prof Jayashankar Telangana State Agricultural University (PJTAU)', email: 'vc.pjtau@agri.gov.in', phone: '9876543225' },
  { name: 'Vice Chancellor SKLTSHU', department: 'Sri Konda Laxman Telangana State Horticulture University (SKLTSHU)', email: 'vc.skltshu@agri.gov.in', phone: '9876543226' },
  { name: 'Director SAMETI', department: 'SAMETI', email: 'director.sameti@agri.gov.in', phone: '9876543227' },
  { name: 'MD TG MARKFED', department: 'Telangana State Marketing Federation Limited (TG MARKFED)', email: 'md.markfed@agri.gov.in', phone: '9876543228' },
  { name: 'MD TGSDCL', department: 'Telangana State Seed Development Corporation (TGSDCL)', email: 'md.tgsdcl@agri.gov.in', phone: '9876543229' },
  { name: 'Director TGSOCA', department: 'Telangana State Seed & Organic Certification Authority (TGSOCA)', email: 'director.tgsoca@agri.gov.in', phone: '9876543230' },
  { name: 'MD TGAGROS', department: 'Telangana State Agro Industries Development Corp Ltd (TGAGROS)', email: 'md.tgagros@agri.gov.in', phone: '9876543231' },
  { name: 'MD TGOILFED', department: 'Telangana State Coop Oil Seeds Growers Federation Ltd (TGOILFED)', email: 'md.tgoilfed@agri.gov.in', phone: '9876543232' },
  { name: 'MD TGWC', department: 'Telangana State Warehousing Corporation (TGWC)', email: 'md.tgwc@agri.gov.in', phone: '9876543233' },
  { name: 'MD HACA', department: 'The Hyderabad Agricultural Cooperative Association Ltd (HACA)', email: 'md.haca@agri.gov.in', phone: '9876543234' },
  { name: 'MD TGHDCL', department: 'Telangana State Horticulture Development Corporation (TGHDCL)', email: 'md.tghdcl@agri.gov.in', phone: '9876543235' },
  { name: 'MD TGRIC', department: 'Telangana State Cooperative Rural Irrigation Corp (TGRIC)', email: 'md.tgric@agri.gov.in', phone: '9876543236' },
  { name: 'MD TGCU', department: 'Telangana State Cooperative Union (TGCU)', email: 'md.tgcu@agri.gov.in', phone: '9876543237' },
  { name: 'MD TG HOUSEFED', department: 'Telangana State Cooperative Housing Federation (TG HOUSEFED)', email: 'md.housefed@agri.gov.in', phone: '9876543238' },
  { name: 'Secretary AMC', department: 'Agriculture Market Committee', email: 'secretary.amc@agri.gov.in', phone: '9876543239' }
];

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });

  // Check current count
  const [before] = await conn.execute('SELECT COUNT(*) as cnt FROM hods');
  console.log('HODs before insert:', before[0].cnt);

  // Insert departments
  for (const d of departments) {
    try {
      await conn.execute(
        'INSERT INTO hods (name, department, category_id, email, phone, status) VALUES (?, ?, 1, ?, ?, "active")',
        [d.name, d.department, d.email, d.phone]
      );
      console.log('Inserted:', d.department);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('Already exists:', d.department);
      } else {
        console.error('Error inserting', d.department, ':', err.message);
      }
    }
  }

  // Check final count
  const [after] = await conn.execute('SELECT COUNT(*) as cnt FROM hods');
  console.log('\\nHODs after insert:', after[0].cnt);

  // List all departments
  const [rows] = await conn.execute('SELECT id, department FROM hods ORDER BY id');
  console.log('\\nAll Departments:');
  rows.forEach(r => console.log(r.id + ':', r.department));

  await conn.end();
}

run();
