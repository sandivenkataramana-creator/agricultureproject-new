const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const superAdminOnly = [authenticateJWT, requireRole('superadmin')];

// Helper function to generate batch ID
const generateBatchId = () => {
  return `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get all flagship programmes with optional department filter
router.get('/', async (req, res) => {
  try {
    const department = req.query.department;
    const status = req.query.status || 'active';
    
    let query = 'SELECT * FROM flagship_programmes WHERE status = ?';
    const params = [status];
    
    if (department) {
      query += ' AND (department_id = ? OR department_name = ?)';
      params.push(department, department);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [results] = await db.query(query, params);
    
    // Parse JSON data for each record
    const programmes = results.map(prog => ({
      ...prog,
      data: typeof prog.data_json === 'string' ? JSON.parse(prog.data_json) : prog.data_json
    }));
    
    res.json(programmes);
  } catch (error) {
    console.error('Error fetching flagship programmes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dynamic Excel/CSV upload endpoint (must come before /:id route)
router.post('/upload', superAdminOnly, async (req, res) => {
  try {
    const { 
      file_data,          // Array of objects from Excel
      file_name,
      import_type,        // 'programme' or 'report'
      department_name
    } = req.body;
    
    if (!file_data || !Array.isArray(file_data) || file_data.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }
    
    if (!import_type || !['programme', 'report'].includes(import_type)) {
      return res.status(400).json({ error: 'Invalid import_type' });
    }
    
    const batchId = generateBatchId();
    const userId = req.user?.id || 1;
    const columnMapping = Object.keys(file_data[0] || {});
    
    let successCount = 0;
    let failedRecords = [];
    
    // Start transaction
    await db.query('START TRANSACTION');
    
    try {
      // Insert metadata
      await db.query(
        `INSERT INTO flagship_import_metadata 
         (import_batch_id, file_name, total_records, status, column_mapping, import_type, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [batchId, file_name, file_data.length, 'processing', JSON.stringify(columnMapping), import_type, userId]
      );
      
      // Insert records based on type
      if (import_type === 'programme') {
        for (let i = 0; i < file_data.length; i++) {
          try {
            const record = file_data[i];
            await db.query(
              `INSERT INTO flagship_programmes
               (department_name, programme_name, import_batch_id, data_json, status, created_by)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                department_name || record.department || 'General',
                record.programme_name || record.name || `Record ${i + 1}`,
                batchId,
                JSON.stringify(record),
                'active',
                userId
              ]
            );
            successCount++;
          } catch (err) {
            failedRecords.push({ record: i + 1, error: err.message });
          }
        }
      } else if (import_type === 'report') {
        for (let i = 0; i < file_data.length; i++) {
          try {
            const record = file_data[i];
            await db.query(
              `INSERT INTO flagship_reports
               (department_name, report_name, report_date, import_batch_id, data_json, status, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                department_name || record.department || 'General',
                record.report_name || record.name || `Report ${i + 1}`,
                record.report_date || new Date().toISOString().split('T')[0],
                batchId,
                JSON.stringify(record),
                'active',
                userId
              ]
            );
            successCount++;
          } catch (err) {
            failedRecords.push({ record: i + 1, error: err.message });
          }
        }
      }
      
      // Update metadata with results
      await db.query(
        `UPDATE flagship_import_metadata 
         SET successful_records = ?, failed_records = ?, status = ?, error_log = ?
         WHERE import_batch_id = ?`,
        [
          successCount,
          failedRecords.length,
          failedRecords.length === 0 ? 'completed' : 'completed',
          JSON.stringify(failedRecords),
          batchId
        ]
      );
      
      await db.query('COMMIT');
      
      res.json({
        success: true,
        batch_id: batchId,
        total: file_data.length,
        successful: successCount,
        failed: failedRecords.length,
        message: `Successfully imported ${successCount}/${file_data.length} records`
      });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get import history
router.get('/import-history', authenticateJWT, async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT * FROM flagship_import_metadata 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get batch details
router.get('/batch/:batchId', async (req, res) => {
  try {
    const [metadata] = await db.query(
      'SELECT * FROM flagship_import_metadata WHERE import_batch_id = ?',
      [req.params.batchId]
    );
    
    const [programmes] = await db.query(
      'SELECT * FROM flagship_programmes WHERE import_batch_id = ?',
      [req.params.batchId]
    );
    
    const [reports] = await db.query(
      'SELECT * FROM flagship_reports WHERE import_batch_id = ?',
      [req.params.batchId]
    );
    
    res.json({
      metadata: metadata[0] || {},
      programmes: programmes.map(p => ({
        ...p,
        data: typeof p.data_json === 'string' ? JSON.parse(p.data_json) : p.data_json
      })),
      reports: reports.map(r => ({
        ...r,
        data: typeof r.data_json === 'string' ? JSON.parse(r.data_json) : r.data_json
      }))
    });
  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export programmes to CSV (must come before /:id route)
router.get('/export/csv', async (req, res) => {
  try {
    const department = req.query.department;
    
    let query = 'SELECT * FROM flagship_programmes WHERE status = "active"';
    const params = [];
    
    if (department) {
      query += ' AND (department_id = ? OR department_name = ?)';
      params.push(department, department);
    }
    
    const [results] = await db.query(query, params);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }
    
    // Create CSV header from first record
    const firstRecord = results[0];
    const data = JSON.parse(firstRecord.data_json || '{}');
    const headers = Object.keys(data);
    
    // Build CSV content
    let csv = headers.join(',') + '\n';
    results.forEach(row => {
      const data = JSON.parse(row.data_json || '{}');
      const values = headers.map(h => {
        const val = data[h] || '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      });
      csv += values.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="flagship_programmes_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get programmes by department with summary (must come before /:id route)
router.get('/department/:departmentId', async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT 
        department_id,
        department_name,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
       FROM flagship_programmes
       WHERE department_id = ? OR department_name = ?
       GROUP BY department_id, department_name`,
      [req.params.departmentId, req.params.departmentId]
    );
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching department programmes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single flagship programme (must come before DELETE /:id)
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT * FROM flagship_programmes WHERE id = ?',
      [req.params.id]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Programme not found' });
    }
    
    const programme = {
      ...results[0],
      data: typeof results[0].data_json === 'string' ? JSON.parse(results[0].data_json) : results[0].data_json
    };
    
    res.json(programme);
  } catch (error) {
    console.error('Error fetching programme:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete programme (must be last of the /:id routes)
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM flagship_programmes WHERE id = ?',
      [req.params.id]
    );
    
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ message: 'Programme not found' });
    }
    
    res.json({ message: 'Programme deleted successfully' });
  } catch (error) {
    console.error('Error deleting programme:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
