const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Get all revenue records
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT r.*, h.name as hod_name, s.name as scheme_name 
      FROM revenue r 
      LEFT JOIN hods h ON r.hod_id = h.id 
      LEFT JOIN schemes s ON r.scheme_id = s.id 
      ORDER BY r.date DESC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue by HOD
router.get('/hod/:hodId', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT r.*, s.name as scheme_name 
      FROM revenue r 
      LEFT JOIN schemes s ON r.scheme_id = s.id 
      WHERE r.hod_id = ?
      ORDER BY r.date DESC
    `, [req.params.hodId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue summary
router.get('/summary/by-hod', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        h.id as hod_id,
        h.name as hod_name,
        h.department,
        SUM(r.amount) as total_revenue,
        COUNT(r.id) as transaction_count
      FROM hods h
      LEFT JOIN revenue r ON h.id = r.hod_id
      GROUP BY h.id, h.name, h.department
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create revenue record
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { hod_id, scheme_id, amount, source, category, date, description } = req.body;
    const [result] = await db.query(
      'INSERT INTO revenue (hod_id, scheme_id, amount, source, category, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [hod_id, scheme_id, amount, source, category, date, description]
    );
    res.status(201).json({ id: result.insertId, message: 'Revenue recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update revenue record
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { hod_id, scheme_id, amount, source, category, date, description } = req.body;
    await db.query(
      'UPDATE revenue SET hod_id = ?, scheme_id = ?, amount = ?, source = ?, category = ?, date = ?, description = ? WHERE id = ?',
      [hod_id, scheme_id, amount, source, category, date, description, req.params.id]
    );
    res.json({ message: 'Revenue updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete revenue record
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM revenue WHERE id = ?', [req.params.id]);
    res.json({ message: 'Revenue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
