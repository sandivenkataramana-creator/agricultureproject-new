const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT a.*, s.name as staff_name, s.employee_id, h.name as hod_name, h.department 
      FROM attendance a 
      LEFT JOIN staff s ON a.staff_id = s.id 
      LEFT JOIN hods h ON a.hod_id = h.id 
      ORDER BY a.date DESC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance by date range
router.get('/range', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const [results] = await db.query(`
      SELECT a.*, s.name as staff_name, s.employee_id, h.name as hod_name 
      FROM attendance a 
      LEFT JOIN staff s ON a.staff_id = s.id 
      LEFT JOIN hods h ON a.hod_id = h.id 
      WHERE a.date BETWEEN ? AND ?
      ORDER BY a.date DESC
    `, [start_date, end_date]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance by HOD
router.get('/hod/:hodId', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT a.*, s.name as staff_name, s.employee_id 
      FROM attendance a 
      LEFT JOIN staff s ON a.staff_id = s.id 
      WHERE a.hod_id = ?
      ORDER BY a.date DESC
    `, [req.params.hodId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance summary by HOD
router.get('/summary/by-hod', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        h.id as hod_id,
        h.name as hod_name,
        h.department,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'half_day' THEN 1 END) as half_day_count,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_count,
        COUNT(a.id) as total_records
      FROM hods h
      LEFT JOIN attendance a ON h.id = a.hod_id
      GROUP BY h.id, h.name, h.department
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create attendance record
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { staff_id, hod_id, date, status, check_in, check_out, remarks } = req.body;
    const [result] = await db.query(
      'INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [staff_id, hod_id, date, status || 'present', check_in, check_out, remarks]
    );
    res.status(201).json({ id: result.insertId, message: 'Attendance recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update attendance record
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { staff_id, hod_id, date, status, check_in, check_out, remarks } = req.body;
    await db.query(
      'UPDATE attendance SET staff_id = ?, hod_id = ?, date = ?, status = ?, check_in = ?, check_out = ?, remarks = ? WHERE id = ?',
      [staff_id, hod_id, date, status, check_in, check_out, remarks, req.params.id]
    );
    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete attendance record
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance statistics with filters
router.get('/statistics', async (req, res) => {
  try {
    const { start_date, end_date, hod_id, period, status, employee_type } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE a.date BETWEEN ? AND ?';
      params = [start_date, end_date];
    } else if (period === 'today') {
      dateFilter = 'WHERE DATE(a.date) = CURDATE()';
    } else if (period === 'week') {
      dateFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    } else if (period === 'quarter') {
      dateFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
    } else if (period === 'year') {
      dateFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    }
    
    if (hod_id) {
      dateFilter += dateFilter ? ' AND a.hod_id = ?' : 'WHERE a.hod_id = ?';
      params.push(hod_id);
    }

    if (employee_type && employee_type !== 'all') {
      dateFilter += dateFilter ? ' AND s.employee_type = ?' : 'WHERE s.employee_type = ?';
      params.push(employee_type);
    }
    
    // Get summary statistics - Fixed: present excludes late arrivals, late counts check_in > 10:45
    const [summary] = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN a.status = 'present' AND (a.check_in IS NULL OR TIME(a.check_in) <= '10:45:00') THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'half_day' THEN 1 END) as half_day,
        COUNT(CASE WHEN a.status = 'leave' OR a.status = 'on_leave' THEN 1 END) as on_leave,
        COUNT(CASE WHEN a.status = 'late' OR (a.status = 'present' AND a.check_in IS NOT NULL AND TIME(a.check_in) > '10:45:00') THEN 1 END) as late,
        COUNT(DISTINCT a.staff_id) as unique_staff,
        COUNT(DISTINCT a.date) as working_days
      FROM attendance a
      LEFT JOIN staff s ON a.staff_id = s.id
      ${dateFilter}
    `, params);
    
    // Get monthly trend data - Fixed: present excludes late arrivals
    const [monthlyTrend] = await db.query(`
      SELECT 
        DATE_FORMAT(a.date, '%Y-%m') as month,
        DATE_FORMAT(a.date, '%b %Y') as month_label,
        COUNT(CASE WHEN a.status = 'present' AND (a.check_in IS NULL OR TIME(a.check_in) <= '10:45:00') THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'half_day' THEN 1 END) as half_day,
        COUNT(CASE WHEN a.status = 'leave' OR a.status = 'on_leave' THEN 1 END) as on_leave,
        COUNT(CASE WHEN a.status = 'late' OR (a.status = 'present' AND a.check_in IS NOT NULL AND TIME(a.check_in) > '10:45:00') THEN 1 END) as late
      FROM attendance a
      LEFT JOIN staff s ON a.staff_id = s.id
      ${dateFilter}
      GROUP BY DATE_FORMAT(a.date, '%Y-%m'), DATE_FORMAT(a.date, '%b %Y')
      ORDER BY month DESC
      LIMIT 12
    `, params);
    
    // Build daily trend filter - Include today's data when period is 'today'
    let dailyFilter = '';
    let dailyParams = [];
    
    if (period === 'today') {
      dailyFilter = 'WHERE DATE(a.date) = CURDATE()';
    } else {
      dailyFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }
    
    if (hod_id) {
      dailyFilter += ' AND a.hod_id = ?';
      dailyParams.push(hod_id);
    }
    if (employee_type && employee_type !== 'all') {
      dailyFilter += ' AND s.employee_type = ?';
      dailyParams.push(employee_type);
    }

    // Get daily trend for last 30 days - Fixed: present excludes late arrivals
    const [dailyTrend] = await db.query(`
      SELECT 
        DATE_FORMAT(a.date, '%Y-%m-%d') as day,
        DATE_FORMAT(a.date, '%d %b') as day_label,
        COUNT(CASE WHEN a.status = 'present' AND (a.check_in IS NULL OR TIME(a.check_in) <= '10:45:00') THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'half_day' THEN 1 END) as half_day,
        COUNT(CASE WHEN a.status = 'leave' OR a.status = 'on_leave' THEN 1 END) as on_leave,
        COUNT(CASE WHEN a.status = 'late' OR (a.status = 'present' AND a.check_in IS NOT NULL AND TIME(a.check_in) > '10:45:00') THEN 1 END) as late
      FROM attendance a
      LEFT JOIN staff s ON a.staff_id = s.id
      ${dailyFilter}
      GROUP BY DATE_FORMAT(a.date, '%Y-%m-%d'), DATE_FORMAT(a.date, '%d %b')
      ORDER BY day DESC
    `, dailyParams);
    
    // Build department-wise filter with staff join for employee_type
    let deptFilter = '';
    let deptParams = [];
    
    if (start_date && end_date) {
      deptFilter = 'WHERE a.date BETWEEN ? AND ?';
      deptParams = [start_date, end_date];
    } else if (period === 'today') {
      deptFilter = 'WHERE DATE(a.date) = CURDATE()';
    } else if (period === 'week') {
      deptFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      deptFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    } else if (period === 'quarter') {
      deptFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
    } else if (period === 'year') {
      deptFilter = 'WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    }
    
    if (hod_id) {
      deptFilter += deptFilter ? ' AND a.hod_id = ?' : 'WHERE a.hod_id = ?';
      deptParams.push(hod_id);
    }

    if (employee_type && employee_type !== 'all') {
      deptFilter += deptFilter ? ' AND s.employee_type = ?' : 'WHERE s.employee_type = ?';
      deptParams.push(employee_type);
    }

    // Get department-wise summary - Fixed: present excludes late arrivals
    const [departmentWise] = await db.query(`
      SELECT 
        h.department,
        h.name as hod_name,
        COUNT(CASE WHEN a.status = 'present' AND (a.check_in IS NULL OR TIME(a.check_in) <= '10:45:00') THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'half_day' THEN 1 END) as half_day,
        COUNT(CASE WHEN a.status = 'leave' OR a.status = 'on_leave' THEN 1 END) as on_leave,
        COUNT(CASE WHEN a.status = 'late' OR (a.status = 'present' AND a.check_in IS NOT NULL AND TIME(a.check_in) > '10:45:00') THEN 1 END) as late,
        COUNT(*) as total
      FROM attendance a
      LEFT JOIN hods h ON a.hod_id = h.id
      LEFT JOIN staff s ON a.staff_id = s.id
      ${deptFilter}
      GROUP BY h.id, h.department, h.name
    `, deptParams);
    
    res.json({
      summary: summary[0],
      monthlyTrend: monthlyTrend.reverse(),
      dailyTrend: dailyTrend.reverse(),
      departmentWise
    });
  } catch (error) {
    console.error('Attendance statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get filtered attendance records
router.get('/filtered', async (req, res) => {
  try {
    const { start_date, end_date, hod_id, status, period, employee_type } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    
    if (start_date && end_date) {
      whereClause += ' AND a.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (period === 'today') {
      whereClause += ' AND DATE(a.date) = CURDATE()';
    } else if (period === 'week') {
      whereClause += ' AND a.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      whereClause += ' AND a.date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    } else if (period === 'quarter') {
      whereClause += ' AND a.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
    } else if (period === 'year') {
      whereClause += ' AND a.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    }
    
    if (hod_id) {
      whereClause += ' AND a.hod_id = ?';
      params.push(hod_id);
    }

    if (employee_type && employee_type !== 'all') {
      whereClause += ' AND s.employee_type = ?';
      params.push(employee_type);
    }
    
    if (status && status !== 'all') {
      if (status === 'late') {
        whereClause += " AND (a.status = 'late' OR (a.status = 'present' AND a.check_in IS NOT NULL AND TIME(a.check_in) > '10:45:00'))";
      } else if (status === 'leave') {
        whereClause += " AND (a.status = 'leave' OR a.status = 'on_leave')";
      } else if (status === 'present') {
        // Present excludes late arrivals
        whereClause += " AND a.status = 'present' AND (a.check_in IS NULL OR TIME(a.check_in) <= '10:45:00')";
      } else {
        whereClause += ' AND a.status = ?';
        params.push(status);
      }
    }
    
    const [results] = await db.query(`
      SELECT 
        a.*,
        s.name as staff_name, 
        s.employee_id,
        s.designation,
        s.phone,
        s.employee_type,
        h.name as hod_name, 
        h.department,
        CASE 
          WHEN a.status = 'late' THEN 'late'
          WHEN a.status = 'present' AND a.check_in IS NOT NULL AND TIME(a.check_in) > '10:45:00' THEN 'late'
          ELSE a.status
        END as display_status,
        CASE 
          WHEN a.check_in IS NOT NULL AND a.check_out IS NOT NULL 
          THEN TIMEDIFF(a.check_out, a.check_in)
          ELSE NULL
        END as working_hours
      FROM attendance a 
      LEFT JOIN staff s ON a.staff_id = s.id 
      LEFT JOIN hods h ON a.hod_id = h.id 
      WHERE ${whereClause}
      ORDER BY a.date DESC, a.check_in DESC
    `, params);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
