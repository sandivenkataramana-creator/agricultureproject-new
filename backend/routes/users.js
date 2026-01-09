const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all users (Admin only)
router.get('/', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.username, u.email, u.role, u.name, u.status, 
             h.name as hod_name, s.name as staff_name
      FROM users u
      LEFT JOIN hods h ON u.hod_id = h.id
      LEFT JOIN staff s ON u.staff_id = s.id
      WHERE u.status = 'active'
      ORDER BY u.name
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

