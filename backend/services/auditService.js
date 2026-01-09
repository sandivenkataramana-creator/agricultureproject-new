const db = require('../config/database');

async function logAudit(action, performedBy, details = {}) {
  try {
    await db.query('INSERT INTO beneficiary_audit_logs (action, performed_by, details) VALUES (?, ?, ?)', [action, performedBy, JSON.stringify(details)]);
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

module.exports = { logAudit };