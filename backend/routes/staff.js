const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Get all staff
router.get('/', async (req, res) => {
  try {
    let results;
    try {
      [results] = await db.query(`
        SELECT s.*, h.name as hod_name 
        FROM staff s 
        LEFT JOIN hods h ON s.hod_id = h.id 
        ORDER BY s.name
      `);
    } catch (err) {
      console.error('Error fetching staff:', err);
      throw err;
    }
    res.json(results);
  } catch (error) {
    console.error('Error in staff route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get staff by ID
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT s.*, h.name as hod_name 
      FROM staff s 
      LEFT JOIN hods h ON s.hod_id = h.id 
      WHERE s.id = ?
    `, [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff by HOD
router.get('/hod/:hodId', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM staff WHERE hod_id = ?', [req.params.hodId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create staff
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { name, employee_id, designation, department, category_id, hod_id, email, phone, joining_date, status } = req.body;
    const [result] = await db.query(
      'INSERT INTO staff (name, employee_id, designation, department, category_id, hod_id, email, phone, joining_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, employee_id, designation, department, category_id || null, hod_id, email, phone, joining_date, status || 'active']
    );
    res.status(201).json({ id: result.insertId, message: 'Staff created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update staff
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { name, employee_id, designation, department, hod_id, email, phone, joining_date, status } = req.body;
    await db.query(
      'UPDATE staff SET name = ?, employee_id = ?, designation = ?, department = ?, hod_id = ?, email = ?, phone = ?, joining_date = ?, status = ? WHERE id = ?',
      [name, employee_id, designation, department, hod_id, email, phone, joining_date, status, req.params.id]
    );
    res.json({ message: 'Staff updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete staff
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM staff WHERE id = ?', [req.params.id]);
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
