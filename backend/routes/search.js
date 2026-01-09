const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Global search across all entities
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (query.length < 2) {
      return res.json([]);
    }
    
    const searchTerm = `%${query}%`;
    const results = [];

    // Search HODs
    const [hods] = await db.query(
      `SELECT id, name, department FROM hods WHERE name LIKE ? OR department LIKE ? LIMIT 5`,
      [searchTerm, searchTerm]
    );
    hods.forEach(h => {
      results.push({ type: 'HOD', name: `${h.name} - ${h.department}`, path: '/hods', id: h.id });
    });

    // Search Schemes
    const [schemes] = await db.query(
      `SELECT id, name, scheme_category FROM schemes WHERE name LIKE ? OR scheme_category LIKE ? LIMIT 5`,
      [searchTerm, searchTerm]
    );
    schemes.forEach(s => {
      results.push({ type: 'Scheme', name: `${s.name}`, path: '/schemes', id: s.id });
    });

    // Search Staff
    const [staff] = await db.query(
      `SELECT id, name, designation FROM staff WHERE name LIKE ? OR designation LIKE ? LIMIT 5`,
      [searchTerm, searchTerm]
    );
    staff.forEach(s => {
      results.push({ type: 'Staff', name: `${s.name} - ${s.designation}`, path: '/staff', id: s.id });
    });

    // Search Nodal Officers
    const [officers] = await db.query(
      `SELECT id, name, designation FROM nodal_officers WHERE name LIKE ? OR designation LIKE ? LIMIT 5`,
      [searchTerm, searchTerm]
    );
    officers.forEach(o => {
      results.push({ type: 'Nodal Officer', name: `${o.name} - ${o.designation}`, path: '/nodal-officers', id: o.id });
    });

    res.json(results.slice(0, 10));
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
