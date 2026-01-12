const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Get all DAOs
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM dao ORDER BY name');
    res.json(results);
  } catch (error) {
    console.error('Error fetching DAOs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get DAO by ID
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM dao WHERE id = ?', [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'DAO not found' });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create DAO
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { name, department, email, phone, status } = req.body;
    const [result] = await db.query(
      'INSERT INTO dao (name, department, email, phone, status) VALUES (?, ?, ?, ?, ?)',
      [name, department, email, phone, status || 'active']
    );
    res.status(201).json({ id: result.insertId, message: 'DAO created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update DAO
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { name, department, email, phone, status } = req.body;
    await db.query(
      'UPDATE dao SET name = ?, department = ?, email = ?, phone = ?, status = ? WHERE id = ?',
      [name, department, email, phone, status, req.params.id]
    );
    res.json({ message: 'DAO updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete DAO
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM dao WHERE id = ?', [req.params.id]);
    res.json({ message: 'DAO deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
