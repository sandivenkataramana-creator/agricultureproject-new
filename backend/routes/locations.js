const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all states
router.get('/states', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM states WHERE status = 1 ORDER BY name');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all districts
router.get('/districts', async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM districts WHERE (status = 1 OR status = 'active') ORDER BY name"
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get districts by state
router.get('/districts/:stateId', async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM districts WHERE state_id = ? AND (status = 1 OR status = 'active') ORDER BY name",
      [req.params.stateId]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all districts (useful for filter lists)
router.get('/districts', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, name FROM districts ORDER BY name');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mandals by district
router.get('/mandals/:districtId', async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM mandals WHERE district_id = ? AND (status = 1 OR status = 'active') ORDER BY name",
      [req.params.districtId]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all mandals (useful for pages that need full lists)
router.get('/mandals', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT m.id, m.name, m.district_id, d.name as district_name
      FROM mandals m
      LEFT JOIN districts d ON m.district_id = d.id
      WHERE m.status = 1
      ORDER BY d.name, m.name
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching all mandals', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get villages by mandal (from budget table distinct entries)
router.get('/villages/mandal/:mandalId', async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT DISTINCT village FROM budget WHERE mandal_id = ? AND village IS NOT NULL AND village != '' ORDER BY village`,
      [req.params.mandalId]
    );
    // Normalize to consistent object shape
    res.json(results.map(r => ({ name: r.village })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get villages by district (aggregate across mandals)
router.get('/villages/district/:districtId', async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT DISTINCT village FROM budget WHERE district_id = ? AND village IS NOT NULL AND village != '' ORDER BY village`,
      [req.params.districtId]
    );
    res.json(results.map(r => ({ name: r.village })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get villages by state (aggregate across districts)
router.get('/villages/state/:stateId', async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT DISTINCT village FROM budget WHERE state_id = ? AND village IS NOT NULL AND village != '' ORDER BY village`,
      [req.params.stateId]
    );
    res.json(results.map(r => ({ name: r.village })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary counts for locations (districts, mandals, villages)
router.get('/counts', async (req, res) => {
  try {
    const [[districts]] = await db.query('SELECT COUNT(*) as count FROM districts');
    const [[mandals]] = await db.query('SELECT COUNT(*) as count FROM mandals');
    const [[villages]] = await db.query('SELECT COUNT(*) as count FROM villages');
    res.json({ totalDistricts: districts.count || 0, totalMandals: mandals.count || 0, totalVillages: villages.count || 0 });
  } catch (error) {
    console.error('Error fetching location counts', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


