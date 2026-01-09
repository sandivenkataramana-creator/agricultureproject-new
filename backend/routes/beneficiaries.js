const express = require('express');
const router = express.Router();
const db = require('../config/database');
const beneficiaryService = require('../services/beneficiaryService');
let upload;
try {
  const multer = require('multer');
  upload = multer({ dest: 'uploads/' });
} catch (err) {
  console.warn('Warning: multer not installed - file upload endpoints will return 500. Run `npm install` to enable imports.');
  upload = {
    single: () => (req, res, next) => {
      res.status(500).json({ error: 'File upload support not available. Run `npm install` to enable this feature.' });
    }
  };
}
const { authenticateJWT, requireRole } = require('../middleware/auth');
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (err) {
  console.warn('Warning: express-rate-limit not installed - export endpoints will not be rate-limited. Run `npm install` to enable rate limiting.');
  rateLimit = null;
}
const importQueue = require('../queues/importQueue');
const { logAudit } = require('../services/auditService');

// per-user export rate limiter (5 exports per minute)
const exportLimiter = rateLimit ? rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many export requests, try again later' },
  keyGenerator: (req) => (req.user && req.user.id) ? String(req.user.id) : req.ip
}) : ((req, res, next) => next());

// POST /api/beneficiaries/search
router.post('/search', authenticateJWT, requireRole(['admin','superadmin','hod','district_officer']), async (req, res, next) => {
  try {
    const filters = req.body || {};
    // District and Mandal are now optional - empty values mean "fetch all"
    
    // If the caller is an HOD, restrict queries to their own HOD id
    if (req.user && req.user.role === 'hod') {
      filters.hodId = req.user.hod_id || req.user.hodId || filters.hodId;
    }

    const result = await beneficiaryService.searchBeneficiaries(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/beneficiaries/export
router.post('/export', authenticateJWT, requireRole(['admin','superadmin','hod','district_officer']), exportLimiter, async (req, res, next) => {
  try {
    const filters = req.body || {};

    // If caller is HOD, restrict to their HOD
    if (req.user && req.user.role === 'hod') {
      filters.hodId = req.user.hod_id || req.user.hodId || filters.hodId;
    }

    // Audit log
    await logAudit('export_started', req.user.id || 0, { filters });

    await beneficiaryService.exportBeneficiaries(filters, res, req.query.format || 'csv');

    // Audit export success (note: streaming may already have started)
    await logAudit('export_completed', req.user.id || 0, { filters });
  } catch (err) {
    await logAudit('export_failed', req.user ? req.user.id : 0, { error: err.message });
    next(err);
  }
});

// POST /api/beneficiaries/import -- multipart form, file field: file, districtId in body
router.post('/import', authenticateJWT, requireRole(['superadmin']), upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const { districtId } = req.body;
    const uploadedBy = req.user ? req.user.id : 0;

    if (!file) return res.status(400).json({ error: 'File is required' });
    if (!districtId) return res.status(400).json({ error: 'districtId is required in form data' });

    const result = await beneficiaryService.importBeneficiaries(file.path, Number(districtId), Number(uploadedBy));
    const jobId = result.jobId;

    // Enqueue job in Bull
    await importQueue.add({ jobId, filePath: file.path, districtId: Number(districtId), uploadedBy: Number(uploadedBy) });

    await logAudit('import_started', uploadedBy, { jobId, file: file.originalname, districtId });

    res.json({ success: true, jobId });
  } catch (err) {
    await logAudit('import_failed', req.user ? req.user.id : 0, { error: err.message });
    next(err);
  }
});

// GET import job status
router.get('/import/:jobId/status', authenticateJWT, requireRole(['admin','superadmin','hod','district_officer']), async (req, res, next) => {
  try {
    const jobId = Number(req.params.jobId);
    const [rows] = await db.query('SELECT * FROM beneficiary_import_jobs WHERE id = ?', [jobId]);
    if (!rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/beneficiaries/summary
router.get('/summary', authenticateJWT, requireRole(['admin','superadmin','hod','district_officer']), async (req, res, next) => {
  try {
    const { districtId, mandalId } = req.query || {};
    const filters = {};
    if (districtId) filters.districtId = Number(districtId);
    if (mandalId) filters.mandalId = Number(mandalId);

    // If caller is HOD, restrict to their HOD
    if (req.user && req.user.role === 'hod') {
      filters.hodId = req.user.hod_id || req.user.hodId;
    }

    const result = await beneficiaryService.summaryBeneficiaries(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

module.exports = router;
