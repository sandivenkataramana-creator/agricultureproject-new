const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Get all KPIs
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT k.*, h.name as hod_name, h.department 
      FROM kpis k 
      LEFT JOIN hods h ON k.hod_id = h.id 
      ORDER BY k.kpi_name
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KPI by ID
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT k.*, h.name as hod_name, h.department 
      FROM kpis k 
      LEFT JOIN hods h ON k.hod_id = h.id 
      WHERE k.id = ?
    `, [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'KPI not found' });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KPIs by HOD
router.get('/hod/:hodId', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM kpis WHERE hod_id = ?', [req.params.hodId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create KPI
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { hod_id, kpi_name, target_value, achieved_value, unit, period, status } = req.body;
    const [result] = await db.query(
      'INSERT INTO kpis (hod_id, kpi_name, target_value, achieved_value, unit, period, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [hod_id, kpi_name, target_value, achieved_value || 0, unit, period, status || 'on_track']
    );
    res.status(201).json({ id: result.insertId, message: 'KPI created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update KPI
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { hod_id, kpi_name, target_value, achieved_value, unit, period, status } = req.body;
    await db.query(
      'UPDATE kpis SET hod_id = ?, kpi_name = ?, target_value = ?, achieved_value = ?, unit = ?, period = ?, status = ? WHERE id = ?',
      [hod_id, kpi_name, target_value, achieved_value, unit, period, status, req.params.id]
    );
    res.json({ message: 'KPI updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete KPI
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM kpis WHERE id = ?', [req.params.id]);
    res.json({ message: 'KPI deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
