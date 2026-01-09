const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all schemes with budget allocation
router.get('/', async (req, res) => {
  try {
    try {
      const [results] = await db.query(`
        SELECT 
          s.id,
          s.scheme_name,
          s.central_scheme_name,
          s.hod AS hod_name,
          s.financial_year,
          s.status,
          COALESCE(SUM(sba.allocated_amount), 0) AS budget_allocated,
          COALESCE(SUM(sba.spent_amount), 0) AS budget_utilized
        FROM schemes s
        LEFT JOIN scheme_budget_allocation sba ON s.id = sba.scheme_id
        GROUP BY s.id
        ORDER BY s.scheme_name
      `);
      return res.json(results);
    } catch (innerErr) {
      console.warn('Primary schemes query failed, falling back to simplified schema:', innerErr.message);
      const [fallback] = await db.query(`
        SELECT 
          id,
          scheme_name,
          central_scheme_name,
          hod AS hod_name,
          financial_year,
          status,
          0 AS budget_allocated,
          0 AS budget_utilized
        FROM schemes
        ORDER BY scheme_name
      `);
      return res.json(fallback);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get consolidated financial progress (CSS report style)
router.get('/financial-progress', async (req, res) => {
  try {
    const year = req.query.year || '2025-26';
    
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Try primary query first (with all financial columns)
    try {
      const [results] = await db.query(
        `SELECT
           id,
           scheme_name,
           COALESCE(central_scheme_name, scheme_name) AS central_scheme_name,
           hod,
           financial_year,
           COALESCE(allocation_goi_share, 0) AS allocation_goi_share,
           COALESCE(allocation_state_share, 0) AS allocation_state_share,
           COALESCE(allocation_total, 0) AS allocation_total,
           COALESCE(slsc_goi_share, 0) AS slsc_goi_share,
           COALESCE(slsc_state_share, 0) AS slsc_state_share,
           COALESCE(slsc_total, 0) AS slsc_total,
           COALESCE(sanction_goi_share, 0) AS sanction_goi_share,
           COALESCE(sanction_state_share, 0) AS sanction_state_share,
           COALESCE(sanction_total, 0) AS sanction_total,
           COALESCE(bro_released_amount, 0) AS bro_released_amount,
           COALESCE(dt_authorized_amount, 0) AS dt_authorized_amount,
           COALESCE(bills_preferred_count, 0) AS bills_preferred_count,
           COALESCE(bills_preferred_amount, 0) AS bills_preferred_amount,
           oldest_bill_date,
           COALESCE(bills_cleared_count, 0) AS bills_cleared_count,
           COALESCE(bills_cleared_amount, 0) AS bills_cleared_amount,
           latest_bill_date,
           remark
         FROM schemes
         WHERE financial_year = ? AND status IN ('active', 'ACTIVE')
         ORDER BY scheme_name;
        `,
        [year]
      );
      console.log('Financial-progress query result:', { year, count: results.length, firstItem: results[0] });
      return res.json(results);
    } catch (innerErr) {
      console.warn('Primary financial-progress query failed, attempting fallback:', innerErr.message);
      
      const [fallbackResults] = await db.query(
        `SELECT
           id,
           scheme_name,
           COALESCE(central_scheme_name, scheme_name) AS central_scheme_name,
           hod,
           financial_year,
           0 AS allocation_goi_share,
           0 AS allocation_state_share,
           0 AS allocation_total,
           0 AS slsc_goi_share,
           0 AS slsc_state_share,
           0 AS slsc_total,
           0 AS sanction_goi_share,
           0 AS sanction_state_share,
           0 AS sanction_total,
           0 AS bro_released_amount,
           0 AS dt_authorized_amount,
           0 AS bills_preferred_count,
           0 AS bills_preferred_amount,
           NULL AS oldest_bill_date,
           0 AS bills_cleared_count,
           0 AS bills_cleared_amount,
           NULL AS latest_bill_date,
           NULL AS remark
         FROM schemes
         WHERE financial_year = ? AND status IN ('active', 'ACTIVE')
         ORDER BY scheme_name;
        `,
        [year]
      );
      console.log('Fallback financial-progress query result:', { year, count: fallbackResults.length });
      return res.json(fallbackResults);
    }
  } catch (error) {
    console.error('Error in financial-progress endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scheme by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT s.*, h.name as hod_name, h.department 
      FROM schemes s 
      LEFT JOIN hods h ON s.hod_id = h.id 
      WHERE s.id = ?
    `, [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Scheme not found' });
    }
    
    // Get budget allocations for this scheme
    const [budgetAllocations] = await db.query(
      'SELECT * FROM scheme_budget_allocation WHERE scheme_id = ?',
      [req.params.id]
    );
    
    res.json({ ...results[0], budget_allocations: budgetAllocations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schemes by HOD
router.get('/hod/:hodId', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT s.*, 
             COALESCE(SUM(sba.allocated_amount), 0) as budget_allocated,
             COALESCE(SUM(sba.spent_amount), 0) as budget_utilized
      FROM schemes s 
      LEFT JOIN scheme_budget_allocation sba ON s.id = sba.scheme_id
      WHERE s.hod_id = ?
      GROUP BY s.id
    `, [req.params.hodId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create scheme
router.post('/', async (req, res) => {
  console.log('POST /schemes payload received:', JSON.stringify(req.body, null, 2));
  console.log('TOTAL fields specifically:', {
    allocation_total: req.body.allocation_total,
    slsc_total: req.body.slsc_total,
    sanction_total: req.body.sanction_total,
    oldest_bill_date: req.body.oldest_bill_date,
    latest_bill_date: req.body.latest_bill_date
  });
  try {
    const { 
      name, 
      hod_id,
      category_id,
      scheme_description, 
      scheme_objective, 
      scheme_benefits_desc, 
      scheme_benefits_person,
      total_budget, 
      start_date, 
      end_date, 
      status, 
      scheme_category,
      scheme_name,
      central_scheme_name,
      hod,
      financial_year,
      allocation_goi_share,
      allocation_state_share,
      allocation_total,
      slsc_goi_share,
      slsc_state_share,
      slsc_total,
      sanction_goi_share,
      sanction_state_share,
      sanction_total,
      bro_released_amount,
      dt_authorized_amount,
      bills_preferred_count,
      bills_preferred_amount,
      oldest_bill_date,
      bills_cleared_count,
      bills_cleared_amount,
      latest_bill_date,
      remark
    } = req.body;

    // Always have a central scheme name value to persist
    const centralName = (central_scheme_name || '').trim() || scheme_name || name || null;

    const insertSql = `INSERT INTO schemes (
      scheme_name, central_scheme_name, hod, financial_year, status,
      allocation_goi_share, allocation_state_share, allocation_total,
      slsc_goi_share, slsc_state_share, slsc_total,
      sanction_goi_share, sanction_state_share, sanction_total,
      bro_released_amount, dt_authorized_amount,
      bills_preferred_count, bills_preferred_amount, oldest_bill_date,
      bills_cleared_count, bills_cleared_amount, latest_bill_date, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertParams = [
      scheme_name || name,
      centralName,
      hod || hod_id || 'N/A',
      financial_year || '2025-26',
      status || 'active',
      allocation_goi_share || null,
      allocation_state_share || null,
      allocation_total || null,
      slsc_goi_share || null,
      slsc_state_share || null,
      slsc_total || null,
      sanction_goi_share || null,
      sanction_state_share || null,
      sanction_total || null,
      bro_released_amount || null,
      dt_authorized_amount || null,
      bills_preferred_count || null,
      bills_preferred_amount || null,
      oldest_bill_date || null,
      bills_cleared_count || null,
      bills_cleared_amount || null,
      latest_bill_date || null,
      remark || null
    ];

    try {
      const [result] = await db.query(insertSql, insertParams);
      console.log('Scheme created successfully', { id: result.insertId, scheme: scheme_name || name, central_scheme_name: centralName });
      return res.status(201).json({ id: result.insertId, message: 'Scheme created successfully' });
    } catch (innerErr) {
      console.warn('Primary scheme insert failed:', innerErr.message, { body: req.body });

      // If central_scheme_name column is missing, add it and retry once
      if (innerErr.message && innerErr.message.toLowerCase().includes('central_scheme_name')) {
        try {
          await db.query('ALTER TABLE schemes ADD COLUMN IF NOT EXISTS central_scheme_name VARCHAR(150)');
          const [retry] = await db.query(insertSql, insertParams);
          console.log('Scheme created after adding central_scheme_name column', { id: retry.insertId, scheme: scheme_name || name });
          return res.status(201).json({ id: retry.insertId, message: 'Scheme created successfully (after adding column)' });
        } catch (retryErr) {
          console.warn('Retry insert after adding central_scheme_name failed:', retryErr.message, { body: req.body });
        }
      }

      const [result] = await db.query(insertSql, insertParams);
      console.log('Scheme created via fallback insert', { id: result.insertId, scheme: scheme_name || name });
      // If fallback path used, still try to persist central scheme name when column exists
      try {
        await db.query('UPDATE schemes SET central_scheme_name = ? WHERE id = ?', [centralName, result.insertId]);
      } catch (updateErr) {
        console.warn('Unable to backfill central_scheme_name after fallback insert:', updateErr.message, { id: result.insertId });
      }
      return res.status(201).json({ id: result.insertId, message: 'Scheme created successfully (fallback schema)' });
    }
  } catch (error) {
    console.error('Unhandled error creating scheme', { error: error.message, body: req.body });
    res.status(500).json({ error: error.message });
  }
});

// Update scheme
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /schemes/:id received for id:', req.params.id, 'with payload:', JSON.stringify(req.body, null, 2));
    const { 
      name, 
      scheme_name,
      central_scheme_name,
      hod,
      financial_year,
      status,
      allocation_goi_share,
      allocation_state_share,
      allocation_total,
      slsc_goi_share,
      slsc_state_share,
      slsc_total,
      sanction_goi_share,
      sanction_state_share,
      sanction_total,
      bro_released_amount,
      dt_authorized_amount,
      bills_preferred_count,
      bills_preferred_amount,
      oldest_bill_date,
      bills_cleared_count,
      bills_cleared_amount,
      latest_bill_date,
      remark
    } = req.body;

    const centralNameUpdate = (central_scheme_name || '').trim() || scheme_name || name || null;

    const [result] = await db.query(
      `UPDATE schemes SET 
         scheme_name = ?, central_scheme_name = ?, hod = ?, financial_year = ?, status = ?,
         allocation_goi_share = ?, allocation_state_share = ?, allocation_total = ?,
         slsc_goi_share = ?, slsc_state_share = ?, slsc_total = ?,
         sanction_goi_share = ?, sanction_state_share = ?, sanction_total = ?,
         bro_released_amount = ?, dt_authorized_amount = ?,
         bills_preferred_count = ?, bills_preferred_amount = ?, oldest_bill_date = ?,
         bills_cleared_count = ?, bills_cleared_amount = ?, latest_bill_date = ?, remark = ?
       WHERE id = ?`,
      [scheme_name || name, centralNameUpdate, hod || 'N/A', financial_year || '2025-26', status || 'active',
       allocation_goi_share || null, allocation_state_share || null, allocation_total || null,
       slsc_goi_share || null, slsc_state_share || null, slsc_total || null,
       sanction_goi_share || null, sanction_state_share || null, sanction_total || null,
       bro_released_amount || null, dt_authorized_amount || null,
       bills_preferred_count || null, bills_preferred_amount || null, oldest_bill_date || null,
       bills_cleared_count || null, bills_cleared_amount || null, latest_bill_date || null, remark || null, req.params.id]
    );
    console.log('Scheme update result:', { id: req.params.id, affectedRows: result.affectedRows, changedRows: result.changedRows });
    return res.json({ message: 'Scheme updated successfully', affectedRows: result.affectedRows });
  } catch (error) {
    console.error('Error updating scheme:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete scheme
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM schemes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Scheme deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SCHEME BUDGET ALLOCATION ROUTES ============

// Get all budget allocations
router.get('/budget-allocations/all', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT sba.*, s.name as scheme_name, s.scheme_category
      FROM scheme_budget_allocation sba
      LEFT JOIN schemes s ON sba.scheme_id = s.id
      ORDER BY sba.created_at DESC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget allocations for a specific scheme
router.get('/:schemeId/budget-allocations', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT * FROM scheme_budget_allocation WHERE scheme_id = ?',
      [req.params.schemeId]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create budget allocation
router.post('/:schemeId/budget-allocations', async (req, res) => {
  try {
    const { hod_id, hod_name, allocated_amount, spent_amount, financial_year } = req.body;
    const [result] = await db.query(
      `INSERT INTO scheme_budget_allocation (scheme_id, hod_id, hod_name, allocated_amount, spent_amount, financial_year) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.schemeId, hod_id, hod_name, allocated_amount || 0, spent_amount || 0, financial_year]
    );
    res.status(201).json({ id: result.insertId, message: 'Budget allocation created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update budget allocation
router.put('/budget-allocations/:id', async (req, res) => {
  try {
    const { hod_id, hod_name, allocated_amount, spent_amount, financial_year } = req.body;
    await db.query(
      `UPDATE scheme_budget_allocation SET hod_id = ?, hod_name = ?, allocated_amount = ?, 
       spent_amount = ?, financial_year = ? WHERE id = ?`,
      [hod_id, hod_name, allocated_amount, spent_amount, financial_year, req.params.id]
    );
    res.json({ message: 'Budget allocation updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete budget allocation
router.delete('/budget-allocations/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM scheme_budget_allocation WHERE id = ?', [req.params.id]);
    res.json({ message: 'Budget allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STATE SCHEME ROUTES ============

// Get all state schemes
router.get('/state-schemes/all', async (req, res) => {
  try {
    const year = req.query.year || '2025-26';
    
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const [results] = await db.query(
      `SELECT 
        id,
        state_scheme_name AS name,
        hod,
        budget_estimates AS budgetEstimates,
        bro_released_amount AS broReleased,
        bills_preferred_count AS billsPreferredNo,
        bills_preferred_amount AS billsPreferredAmount,
        oldest_bill_date AS billsPreferredOldestDate,
        bills_cleared_count AS billsClearedNo,
        bills_cleared_amount AS billsClearedAmount,
        latest_clearance_date AS billsClearedLatestDate,
        pending_bills_count AS pendingNo,
        pending_bills_amount AS pendingAmount,
        financial_year,
        status
       FROM state_scheme_financials
       WHERE financial_year = ? AND status = 'active'
       ORDER BY state_scheme_name`,
      [year]
    );
    console.log('State schemes query result:', { year, count: results.length });
    res.json(results);
  } catch (error) {
    console.error('Error fetching state schemes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create state scheme
router.post('/state-schemes', async (req, res) => {
  try {
    console.log('POST /state-schemes payload:', JSON.stringify(req.body, null, 2));
    const {
      name,
      hod,
      budgetEstimates,
      broReleased,
      billsPreferredNo,
      billsPreferredAmount,
      billsPreferredOldestDate,
      billsClearedNo,
      billsClearedAmount,
      billsClearedLatestDate,
      pendingNo,
      pendingAmount,
      financial_year,
      status
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO state_scheme_financials (
        state_scheme_name, hod, budget_estimates, bro_released_amount,
        bills_preferred_count, bills_preferred_amount, oldest_bill_date,
        bills_cleared_count, bills_cleared_amount, latest_clearance_date,
        pending_bills_count, pending_bills_amount, financial_year, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        hod || 'N/A',
        budgetEstimates || null,
        broReleased || null,
        billsPreferredNo || 0,
        billsPreferredAmount || null,
        billsPreferredOldestDate || null,
        billsClearedNo || 0,
        billsClearedAmount || null,
        billsClearedLatestDate || null,
        pendingNo || 0,
        pendingAmount || null,
        financial_year || '2025-26',
        status || 'active'
      ]
    );
    console.log('State scheme created successfully:', { id: result.insertId, name });
    res.status(201).json({ id: result.insertId, message: 'State scheme created successfully' });
  } catch (error) {
    console.error('Error creating state scheme:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update state scheme
router.put('/state-schemes/:id', async (req, res) => {
  try {
    console.log('PUT /state-schemes/:id received for id:', req.params.id);
    const {
      name,
      hod,
      budgetEstimates,
      broReleased,
      billsPreferredNo,
      billsPreferredAmount,
      billsPreferredOldestDate,
      billsClearedNo,
      billsClearedAmount,
      billsClearedLatestDate,
      pendingNo,
      pendingAmount,
      financial_year,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE state_scheme_financials SET 
        state_scheme_name = ?, hod = ?, budget_estimates = ?, bro_released_amount = ?,
        bills_preferred_count = ?, bills_preferred_amount = ?, oldest_bill_date = ?,
        bills_cleared_count = ?, bills_cleared_amount = ?, latest_clearance_date = ?,
        pending_bills_count = ?, pending_bills_amount = ?, financial_year = ?, status = ?
       WHERE id = ?`,
      [
        name,
        hod || 'N/A',
        budgetEstimates || null,
        broReleased || null,
        billsPreferredNo || 0,
        billsPreferredAmount || null,
        billsPreferredOldestDate || null,
        billsClearedNo || 0,
        billsClearedAmount || null,
        billsClearedLatestDate || null,
        pendingNo || 0,
        pendingAmount || null,
        financial_year || '2025-26',
        status || 'active',
        req.params.id
      ]
    );
    console.log('State scheme updated:', { id: req.params.id, affectedRows: result.affectedRows });
    res.json({ message: 'State scheme updated successfully', affectedRows: result.affectedRows });
  } catch (error) {
    console.error('Error updating state scheme:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete state scheme
router.delete('/state-schemes/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM state_scheme_financials WHERE id = ?', [req.params.id]);
    res.json({ message: 'State scheme deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ REVENUE ROUTES ============

// Get all revenue data
router.get('/revenue/all', async (req, res) => {
  try {
    const year = req.query.year || '2025-26';
    
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const [results] = await db.query(
      `SELECT 
        id,
        cooperative_name AS cooperativeName,
        loans,
        revenue,
        financial_year,
        status
       FROM revenue_financials
       WHERE financial_year = ? AND status = 'active'
       ORDER BY cooperative_name`,
      [year]
    );
    console.log('Revenue query result:', { year, count: results.length });
    res.json(results);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create revenue entry
router.post('/revenue', async (req, res) => {
  try {
    console.log('POST /revenue payload:', JSON.stringify(req.body, null, 2));
    const {
      cooperativeName,
      loans,
      revenue,
      financial_year,
      status
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO revenue_financials (
        cooperative_name, loans, revenue, financial_year, status
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        cooperativeName,
        loans || null,
        revenue || null,
        financial_year || '2025-26',
        status || 'active'
      ]
    );
    console.log('Revenue entry created successfully:', { id: result.insertId, cooperativeName });
    res.status(201).json({ id: result.insertId, message: 'Revenue entry created successfully' });
  } catch (error) {
    console.error('Error creating revenue entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update revenue entry
router.put('/revenue/:id', async (req, res) => {
  try {
    console.log('PUT /revenue/:id received for id:', req.params.id);
    const {
      cooperativeName,
      loans,
      revenue,
      financial_year,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE revenue_financials SET 
        cooperative_name = ?, loans = ?, revenue = ?, financial_year = ?, status = ?
       WHERE id = ?`,
      [
        cooperativeName,
        loans || null,
        revenue || null,
        financial_year || '2025-26',
        status || 'active',
        req.params.id
      ]
    );
    console.log('Revenue entry updated:', { id: req.params.id, affectedRows: result.affectedRows });
    res.json({ message: 'Revenue entry updated successfully', affectedRows: result.affectedRows });
  } catch (error) {
    console.error('Error updating revenue entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete revenue entry
router.delete('/revenue/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM revenue_financials WHERE id = ?', [req.params.id]);
    res.json({ message: 'Revenue entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;