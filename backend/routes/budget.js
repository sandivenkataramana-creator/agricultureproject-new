const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Get all budget entries
router.get('/', async (req, res) => {
  try {
    let results;
    try {
      [results] = await db.query(`
        SELECT b.*, h.name as hod_name, h.department as department, s.scheme_name as scheme_name, st.name as state_name, d.name as district_name, m.name as mandal_name, da.name as dao_name
        FROM budget b
        LEFT JOIN hods h ON b.hod_id = h.id
        LEFT JOIN schemes s ON b.scheme_id = s.id
        LEFT JOIN dao da ON b.dao_id = da.id
        LEFT JOIN states st ON b.state_id = st.id
        LEFT JOIN districts d ON b.district_id = d.id
        LEFT JOIN mandals m ON b.mandal_id = m.id
        ORDER BY b.financial_year DESC
      `);
    } catch (err) {
      console.error('Error fetching budget:', err);
      throw err;
    }
    res.json(results);
  } catch (error) {
    console.error('Error in budget route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get budget by ID
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT b.*, h.name as hod_name, h.department as department, s.scheme_name as scheme_name, st.name as state_name, d.name as district_name, m.name as mandal_name, da.name as dao_name
      FROM budget b 
      LEFT JOIN hods h ON b.hod_id = h.id 
      LEFT JOIN schemes s ON b.scheme_id = s.id 
      LEFT JOIN dao da ON b.dao_id = da.id
      LEFT JOIN states st ON b.state_id = st.id
      LEFT JOIN districts d ON b.district_id = d.id
      LEFT JOIN mandals m ON b.mandal_id = m.id
      WHERE b.id = ?
    `, [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Budget entry not found' });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget by HOD
router.get('/hod/:hodId', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT b.*, s.scheme_name as scheme_name, st.name as state_name, d.name as district_name, m.name as mandal_name, da.name as dao_name
      FROM budget b 
      LEFT JOIN schemes s ON b.scheme_id = s.id 
      LEFT JOIN dao da ON b.dao_id = da.id
      LEFT JOIN states st ON b.state_id = st.id
      LEFT JOIN districts d ON b.district_id = d.id
      LEFT JOIN mandals m ON b.mandal_id = m.id
      WHERE b.hod_id = ?
    `, [req.params.hodId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget summary
router.get('/summary/overview', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        financial_year,
        SUM(allocated_amount) as total_allocated,
        SUM(utilized_amount) as total_utilized,
        (SUM(allocated_amount) - SUM(utilized_amount)) as remaining
      FROM budget
      GROUP BY financial_year
      ORDER BY financial_year DESC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create budget entry
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { hod_id, scheme_id, financial_year, allocated_amount, utilized_amount, category, description, dao_id, section, budget_estimation_state, budget_estimation_central, budget_sanction_state, budget_sanction_central, budget_remaining_state, budget_remaining_central, budget_pending_state, budget_pending_central, state_id, district_id, mandal_id, village } = req.body;
    const [result] = await db.query(
      'INSERT INTO budget (hod_id, scheme_id, financial_year, allocated_amount, utilized_amount, category, description, dao_id, section, budget_estimation_state, budget_estimation_central, budget_sanction_state, budget_sanction_central, budget_remaining_state, budget_remaining_central, budget_pending_state, budget_pending_central, state_id, district_id, mandal_id, village) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [hod_id, scheme_id, financial_year, allocated_amount || 0, utilized_amount || 0, category, description, dao_id || null, section || null, budget_estimation_state ?? null, budget_estimation_central ?? null, budget_sanction_state ?? null, budget_sanction_central ?? null, budget_remaining_state ?? null, budget_remaining_central ?? null, budget_pending_state ?? null, budget_pending_central ?? null, state_id || null, district_id || null, mandal_id || null, village || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Budget entry created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update budget entry
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { hod_id, scheme_id, financial_year, allocated_amount, utilized_amount, category, description, dao_id, section, budget_estimation_state, budget_estimation_central, budget_sanction_state, budget_sanction_central, budget_remaining_state, budget_remaining_central, budget_pending_state, budget_pending_central, state_id, district_id, mandal_id, village } = req.body;
    await db.query(
      'UPDATE budget SET hod_id = ?, scheme_id = ?, financial_year = ?, allocated_amount = ?, utilized_amount = ?, category = ?, description = ?, dao_id = ?, section = ?, budget_estimation_state = ?, budget_estimation_central = ?, budget_sanction_state = ?, budget_sanction_central = ?, budget_remaining_state = ?, budget_remaining_central = ?, budget_pending_state = ?, budget_pending_central = ?, state_id = ?, district_id = ?, mandal_id = ?, village = ? WHERE id = ?',
      [hod_id, scheme_id, financial_year, allocated_amount, utilized_amount, category, description, dao_id || null, section || null, budget_estimation_state ?? null, budget_estimation_central ?? null, budget_sanction_state ?? null, budget_sanction_central ?? null, budget_remaining_state ?? null, budget_remaining_central ?? null, budget_pending_state ?? null, budget_pending_central ?? null, state_id || null, district_id || null, mandal_id || null, village || null, req.params.id]
    );
    res.json({ message: 'Budget entry updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete budget entry
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM budget WHERE id = ?', [req.params.id]);
    res.json({ message: 'Budget entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
