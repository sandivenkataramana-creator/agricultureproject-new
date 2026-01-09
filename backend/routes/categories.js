const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM categories WHERE status = "active" ORDER BY name');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin only)
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const [result] = await db.query(
      'INSERT INTO categories (name, description, status) VALUES (?, ?, ?)',
      [name, description, status || 'active']
    );
    res.status(201).json({ id: result.insertId, message: 'Category created successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    await db.query(
      'UPDATE categories SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description, status, req.params.id]
    );
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('UPDATE categories SET status = "inactive" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


