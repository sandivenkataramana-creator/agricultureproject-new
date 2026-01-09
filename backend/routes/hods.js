const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Get all HODs
router.get('/', async (req, res) => {
  try {
    // Check if categories table exists, if not, use simpler query
    let results;
    try {
      [results] = await db.query(`
        SELECT h.*, c.name as category_name 
        FROM hods h 
        LEFT JOIN categories c ON h.category_id = c.id 
        ORDER BY h.name
      `);
    } catch (err) {
      // If categories table doesn't exist, fall back to simple query
      if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes('categories')) {
        [results] = await db.query('SELECT * FROM hods ORDER BY name');
      } else {
        throw err;
      }
    }
    res.json(results);
  } catch (error) {
    console.error('Error fetching HODs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get HOD by ID
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM hods WHERE id = ?', [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'HOD not found' });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create HOD
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { name, department, category_id, email, phone, status } = req.body;
    const [result] = await db.query(
      'INSERT INTO hods (name, department, category_id, email, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, department, category_id || null, email, phone, status || 'active']
    );
    res.status(201).json({ id: result.insertId, message: 'HOD created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update HOD
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { name, department, category_id, email, phone, status } = req.body;
    await db.query(
      'UPDATE hods SET name = ?, department = ?, category_id = ?, email = ?, phone = ?, status = ? WHERE id = ?',
      [name, department, category_id || null, email, phone, status, req.params.id]
    );
    res.json({ message: 'HOD updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete HOD
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM hods WHERE id = ?', [req.params.id]);
    res.json({ message: 'HOD deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get HOD with all related data
router.get('/:id/details', async (req, res) => {
  try {
    const [hod] = await db.query('SELECT * FROM hods WHERE id = ?', [req.params.id]);
    if (hod.length === 0) {
      return res.status(404).json({ message: 'HOD not found' });
    }
    
    const [schemes] = await db.query('SELECT * FROM schemes WHERE hod_id = ?', [req.params.id]);
    const [staff] = await db.query('SELECT * FROM staff WHERE hod_id = ?', [req.params.id]);
    const [budget] = await db.query('SELECT * FROM budget WHERE hod_id = ?', [req.params.id]);
    const [kpis] = await db.query('SELECT * FROM kpis WHERE hod_id = ?', [req.params.id]);
    
    res.json({
      ...hod[0],
      schemes,
      staff,
      budget,
      kpis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
