const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const XLSX = require('xlsx');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Export programs to CSV (must be before /:id)
router.get('/export', async (req, res) => {
  try {
    const [programs] = await db.query('SELECT * FROM programs ORDER BY created_at DESC');
    
    const csv = [
      ['ID', 'Name', 'Description', 'Budget', 'Start Date', 'End Date', 'Status', 'Created At'].join(','),
      ...programs.map(p => [
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.budget || 0,
        p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : '',
        p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : '',
        p.status || 'active',
        p.created_at ? new Date(p.created_at).toISOString() : ''
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="programs_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting programs:', error);
    res.status(500).json({ error: 'Failed to export programs' });
  }
});

// Import programs from Excel/CSV (must be before /:id)
router.post('/import', ...superAdminOnly, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let imported = 0;
    for (const row of data) {
      try {
        await db.query(
          'INSERT INTO programs (name, description, budget, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
          [
            row.Name || row.name,
            row.Description || row.description || null,
            parseFloat(row.Budget || row.budget) || 0,
            row['Start Date'] || row.start_date || null,
            row['End Date'] || row.end_date || null,
            row.Status || row.status || 'active'
          ]
        );
        imported++;
      } catch (err) {
        console.error('Error importing row:', err);
      }
    }

    res.json({ message: `Successfully imported ${imported} programs`, imported });
  } catch (error) {
    console.error('Error importing programs:', error);
    res.status(500).json({ error: 'Failed to import programs' });
  }
});

// Get all programs (public access)
router.get('/', async (req, res) => {
  try {
    const [programs] = await db.query(
      'SELECT * FROM programs ORDER BY created_at DESC'
    );
    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get program by ID (public access)
router.get('/:id', async (req, res) => {
  try {
    const [programs] = await db.query(
      'SELECT * FROM programs WHERE id = ?',
      [req.params.id]
    );
    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }
    res.json(programs[0]);
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

// Create new program
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { name, description, budget, start_date, end_date, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Program name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO programs (name, description, budget, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, budget || 0, start_date || null, end_date || null, status || 'active']
    );

    res.status(201).json({ id: result.insertId, message: 'Program created successfully' });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// Update program
router.put('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const { name, description, budget, start_date, end_date, status } = req.body;
    const { id } = req.params;

    if (!name) {
      return res.status(400).json({ error: 'Program name is required' });
    }

    const [result] = await db.query(
      'UPDATE programs SET name = ?, description = ?, budget = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?',
      [name, description || null, budget || 0, start_date || null, end_date || null, status || 'active', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({ message: 'Program updated successfully' });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Delete program
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM programs WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

module.exports = router;
