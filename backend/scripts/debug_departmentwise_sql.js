const db = require('../config/database');

(async () => {
  const period = 'year';
  const employee_type = 'outsource';

  const dateCondition = (() => {
    if (period === 'today') return 'DATE(a.date) = CURDATE()';
    if (period === 'week') return 'a.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    if (period === 'month') return 'a.date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    if (period === 'quarter') return 'a.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
    if (period === 'year') return 'a.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    return '';
  })();

  const attendanceJoinFilter = dateCondition ? ` AND ${dateCondition}` : '';
  const whereClause = employee_type && employee_type !== 'all' ? 'WHERE s.employee_type = ?' : '';
  const params = employee_type && employee_type !== 'all' ? [employee_type] : [];

  const sql = `
SELECT 
  h.id as hod_id,
  h.name as hod_name,
  h.department,
  COUNT(DISTINCT s.id) as total_emp,
  COUNT(CASE WHEN a.status = 'present' AND (a.check_in IS NULL OR TIME(a.check_in) <= '10:30:00') THEN 1 END) as present,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
  COUNT(CASE WHEN a.status = 'late' OR (a.status = 'present' AND a.check_in IS NOT NULL AND TIME(a.check_in) > '10:30:00') THEN 1 END) as late,
  COUNT(CASE WHEN a.status = 'leave' OR a.status = 'on_leave' THEN 1 END) as emp_leave
FROM hods h
LEFT JOIN staff s ON s.hod_id = h.id
LEFT JOIN attendance a ON a.staff_id = s.id${attendanceJoinFilter}
${whereClause}
GROUP BY h.id, h.name, h.department
ORDER BY h.department;
`;

  console.log('SQL:\n' + sql);
  console.log('Params:', params);

  try {
    const [rows] = await db.query(sql, params);
    console.log('Rows:', rows.length);
  } catch (e) {
    console.error('Error message:', e.message);
    console.error('SQL message:', e.sqlMessage);
    console.error('SQL state:', e.sqlState);
    console.error('Error code:', e.code);
    console.error('SQL (driver):', e.sql);
  } finally {
    process.exit(0);
  }
})();
