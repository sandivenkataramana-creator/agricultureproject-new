const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Ensure older databases have the newer location/date columns needed by this route.
// Some dumped databases only contain basic nodal_officers columns; without the
// additional fields the queries below fail with "Unknown column" errors. We run
// a lightweight one-time migration on server start to add the missing columns.
let nodalSchemaEnsured = false;
async function ensureNodalOfficerSchema() {
  if (nodalSchemaEnsured) return;

  try {
    const requiredColumns = ['purpose', 'state_id', 'district_id', 'mandal_id', 'start_date', 'end_date', 'total_days'];
    const [existing] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'nodal_officers'
         AND COLUMN_NAME IN (?, ?, ?, ?, ?, ?, ?);`,
      requiredColumns
    );

    const present = new Set(existing.map((col) => col.COLUMN_NAME));
    const statements = [];
    if (!present.has('purpose')) statements.push('ADD COLUMN purpose VARCHAR(255)');
    if (!present.has('state_id')) statements.push('ADD COLUMN state_id INT DEFAULT 1');
    if (!present.has('district_id')) statements.push('ADD COLUMN district_id INT');
    if (!present.has('mandal_id')) statements.push('ADD COLUMN mandal_id INT');
    if (!present.has('start_date')) statements.push('ADD COLUMN start_date DATE');
    if (!present.has('end_date')) statements.push('ADD COLUMN end_date DATE');
    if (!present.has('total_days')) statements.push('ADD COLUMN total_days INT');

    if (statements.length) {
      await db.query(`ALTER TABLE nodal_officers ${statements.join(', ')}`);
      console.log('Added missing columns to nodal_officers:', statements);
    }

    nodalSchemaEnsured = true;
  } catch (err) {
    console.error('Error ensuring nodal_officers schema:', err.message);
    // If schema check fails, continue anyway - the queries may still work
  }
}

// Get all nodal officers
router.get('/', async (req, res) => {
  try {
    // Ensure schema is set up on first call
    await ensureNodalOfficerSchema();
    
    const [results] = await db.query(`
      SELECT n.*, s.scheme_name,
             st.name as state_name,
             d.name as district_name,
             m.name as mandal_name,
             COALESCE(
               n.total_days,
               CASE 
                 WHEN n.start_date IS NOT NULL AND n.end_date IS NOT NULL THEN DATEDIFF(n.end_date, n.start_date) + 1
                 ELSE NULL
               END
             ) AS total_days
      FROM nodal_officers n 
      LEFT JOIN schemes s ON n.scheme_id = s.id
      LEFT JOIN states st ON n.state_id = st.id
      LEFT JOIN districts d ON n.district_id = d.id
      LEFT JOIN mandals m ON n.mandal_id = m.id
      ORDER BY n.name
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nodal officer by ID
router.get('/:id', async (req, res) => {
  try {
    // Ensure schema is set up on first call
    await ensureNodalOfficerSchema();
    
    const [results] = await db.query(`
      SELECT n.*, s.scheme_name,
             st.name as state_name,
             d.name as district_name,
             m.name as mandal_name,
             COALESCE(
               n.total_days,
               CASE 
                 WHEN n.start_date IS NOT NULL AND n.end_date IS NOT NULL THEN DATEDIFF(n.end_date, n.start_date) + 1
                 ELSE NULL
               END
             ) AS total_days
      FROM nodal_officers n 
      LEFT JOIN schemes s ON n.scheme_id = s.id
      LEFT JOIN states st ON n.state_id = st.id
      LEFT JOIN districts d ON n.district_id = d.id
      LEFT JOIN mandals m ON n.mandal_id = m.id
      WHERE n.id = ?
    `, [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Nodal officer not found' });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create nodal officer
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { name, designation, department, scheme_id, purpose, state_id, district_id, mandal_id, start_date, end_date, email, phone, status } = req.body;
    const normalizedStart = start_date || null;
    const normalizedEnd = end_date || null;
    const totalDays = normalizedStart && normalizedEnd
      ? Math.ceil((new Date(normalizedEnd) - new Date(normalizedStart)) / (1000 * 60 * 60 * 24)) + 1
      : null;
    const [result] = await db.query(
      'INSERT INTO nodal_officers (name, designation, department, scheme_id, purpose, state_id, district_id, mandal_id, start_date, end_date, total_days, email, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, designation, department, scheme_id, purpose, state_id || 1, district_id, mandal_id, normalizedStart, normalizedEnd, totalDays, email, phone, status || 'active']
    );
    res.status(201).json({ id: result.insertId, message: 'Nodal officer created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update nodal officer
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { name, designation, department, scheme_id, purpose, state_id, district_id, mandal_id, start_date, end_date, email, phone, status } = req.body;
    const normalizedStart = start_date || null;
    const normalizedEnd = end_date || null;
    const totalDays = normalizedStart && normalizedEnd
      ? Math.ceil((new Date(normalizedEnd) - new Date(normalizedStart)) / (1000 * 60 * 60 * 24)) + 1
      : null;
    await db.query(
      'UPDATE nodal_officers SET name = ?, designation = ?, department = ?, scheme_id = ?, purpose = ?, state_id = ?, district_id = ?, mandal_id = ?, start_date = ?, end_date = ?, total_days = ?, email = ?, phone = ?, status = ? WHERE id = ?',
      [name, designation, department, scheme_id, purpose, state_id || 1, district_id, mandal_id, normalizedStart, normalizedEnd, totalDays, email, phone, status, req.params.id]
    );
    res.json({ message: 'Nodal officer updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete nodal officer
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM nodal_officers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Nodal officer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
