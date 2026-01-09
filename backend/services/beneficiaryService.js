const db = require('../config/database');
const crypto = require('crypto');
const fs = require('fs');

const AADHAAR_SECRET = process.env.AADHAAR_SECRET || 'change-this-secret';

function hashAadhaar(aadhaar) {
  if (!aadhaar) return null;
  const sanitized = aadhaar.toString().replace(/\D/g, '');
  return crypto.createHmac('sha256', AADHAAR_SECRET).update(sanitized).digest('hex');
}

function buildWhere(filters) {
  const where = [];
  const params = [];

  if (filters.districtId) { where.push('b.district_id = ?'); params.push(filters.districtId); }
  if (filters.mandalId) { where.push('b.mandal_id = ?'); params.push(filters.mandalId); }
  if (filters.hodId) { where.push('b.hod_id = ?'); params.push(filters.hodId); }
  if (filters.villageId) { where.push('b.village_id = ?'); params.push(filters.villageId); }
  // Allow village filtering by name (case-insensitive). Village is optional.
  if (filters.villageName) { where.push('EXISTS (SELECT 1 FROM villages vv WHERE vv.id = b.village_id AND LOWER(vv.name) = ?)'); params.push(String(filters.villageName).toLowerCase()); }
  if (filters.schemeId) { where.push('b.scheme_id = ?'); params.push(filters.schemeId); }

  return { whereClause: where.length ? ('WHERE ' + where.join(' AND ')) : '', params };
}

async function searchBeneficiaries(filters) {
  const page = Number.isInteger(filters.page) ? filters.page : 0;
  const size = filters.size === 100 ? 100 : 50; // only 50 or 100
  const offset = page * size;

  const { whereClause, params } = buildWhere(filters);

  // Count total
  const countSql = `SELECT COUNT(1) as total FROM beneficiaries b ${whereClause}`;
  let totalRecords = 0;
  try {
    const [countRes] = await db.query(countSql, params);
    totalRecords = countRes[0].total || 0;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      throw new Error('Database not seeded: missing table. Run the provided SQL migration to add beneficiaries and villages tables.');
    }
    throw err;
  }

  // Data query with joins (include HOD, mobile, gender, dob, amount and Aadhaar)
  const dataSql = `SELECT b.id, b.beneficiary_name, b.created_at, 
    d.name as district_name, m.name as mandal_name, v.name as village_name, s.scheme_name, h.name as hod_name, b.aadhaar, b.mobile, b.gender, b.dob, b.amount
    FROM beneficiaries b
    LEFT JOIN districts d ON b.district_id = d.id
    LEFT JOIN mandals m ON b.mandal_id = m.id
    LEFT JOIN villages v ON b.village_id = v.id
    LEFT JOIN schemes s ON b.scheme_id = s.id
    LEFT JOIN hods h ON b.hod_id = h.id
    ${whereClause}
    ORDER BY b.id DESC
    LIMIT ? OFFSET ?`; 

  let rows = [];
  try {
    const [r] = await db.query(dataSql, params.concat([size, offset]));
    rows = r;
  } catch (err) {
    // If the amount column does not exist, retry replacing b.amount with NULL as amount
    if (err && err.code === 'ER_BAD_FIELD_ERROR' && /b\.amount/.test(err.sqlMessage || '')) {
      const fallbackSql = dataSql.replace(/b\.amount/, 'NULL as amount');
      const [r2] = await db.query(fallbackSql, params.concat([size, offset]));
      rows = r2;
    } else if (err && err.code === 'ER_NO_SUCH_TABLE') {
      throw new Error('Database not seeded: missing table. Run the provided SQL migration to add beneficiaries and villages tables.');
    } else {
      throw err;
    }
  }

  return {
    totalRecords,
    page,
    size,
    data: rows
  };
}

async function exportBeneficiaries(filters, res, format = 'csv') {
  if (!filters.districtId || !filters.mandalId) {
    throw new Error('District and Mandal are required');
  }

  const MAX_EXPORT_ROWS = Number(process.env.MAX_EXPORT_ROWS) || 50000;
  const chunkSize = 5000; // fetch per chunk

  const { whereClause, params } = buildWhere(filters);
  const countSql = `SELECT COUNT(1) as total FROM beneficiaries b ${whereClause}`;
  let total = 0;
  try {
    const [countRes] = await db.query(countSql, params);
    total = countRes[0].total || 0;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      throw new Error('Database not seeded: missing table. Run the provided SQL migration to add beneficiaries and villages tables.');
    }
    throw err;
  }

  if (total > MAX_EXPORT_ROWS) {
    throw new Error(`Export limit exceeded. Max ${MAX_EXPORT_ROWS} rows allowed. Found ${total}`);
  }

  if (format === 'excel' || format === 'xlsx') {
    // stream Excel using exceljs
    const Excel = require('exceljs');
    const workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet('Beneficiaries');

    // set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=beneficiaries_${Date.now()}.xlsx`);

    worksheet.addRow(['ID','Beneficiary Name','District','Mandal','Village','Scheme','HOD','Aadhaar','Mobile','Gender','DOB','Amount','Created At']).commit();

    for (let offset = 0; offset < total; offset += chunkSize) {
      const sql = `SELECT b.id, b.beneficiary_name, d.name as district, m.name as mandal, v.name as village, s.scheme_name as scheme, h.name as hod_name, b.aadhaar, b.mobile, b.gender, b.dob, b.amount, b.created_at
        FROM beneficiaries b
        LEFT JOIN districts d ON b.district_id = d.id
        LEFT JOIN mandals m ON b.mandal_id = m.id
        LEFT JOIN villages v ON b.village_id = v.id
        LEFT JOIN schemes s ON b.scheme_id = s.id
        LEFT JOIN hods h ON b.hod_id = h.id
        ${whereClause}
        ORDER BY b.id DESC
        LIMIT ? OFFSET ?`;

      let rows;
      try {
        const [rowsRes] = await db.query(sql, params.concat([chunkSize, offset]));
        rows = rowsRes;
      } catch (err) {
        if (err && err.code === 'ER_BAD_FIELD_ERROR' && /b\.amount/.test(err.sqlMessage || '')) {
          const fallbackSql = sql.replace(/b\.amount/, 'NULL as amount');
          const [rowsRes2] = await db.query(fallbackSql, params.concat([chunkSize, offset]));
          rows = rowsRes2;
        } else {
          throw err;
        }
      }

      for (const r of rows) {
        const dobVal = r.dob ? (r.dob instanceof Date ? r.dob.toISOString().split('T')[0] : String(r.dob)) : '';
        worksheet.addRow([r.id, r.beneficiary_name, r.district || '', r.mandal || '', r.village || '', r.scheme || '', r.hod_name || '', r.aadhaar || '', r.mobile || '', r.gender || '', dobVal, r.amount != null ? r.amount : '', r.created_at ? r.created_at.toISOString() : '']).commit();
      }
    }

    await workbook.commit();
    return;
  }

  // Stream CSV
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=beneficiaries_${Date.now()}.csv`);

  // Header row (include gender and dob)
  res.write('id,beneficiary_name,district,mandal,village,scheme,hod,aadhaar,mobile,gender,dob,amount,created_at\n');

  for (let offset = 0; offset < total; offset += chunkSize) {
      const sql = `SELECT b.id, b.beneficiary_name, d.name as district, m.name as mandal, v.name as village, s.scheme_name as scheme, h.name as hod_name, b.aadhaar, b.mobile, b.gender, b.dob, b.amount, b.created_at
      FROM beneficiaries b
      LEFT JOIN districts d ON b.district_id = d.id
      LEFT JOIN mandals m ON b.mandal_id = m.id
      LEFT JOIN villages v ON b.village_id = v.id
      LEFT JOIN schemes s ON b.scheme_id = s.id
      LEFT JOIN hods h ON b.hod_id = h.id
      ${whereClause}
      ORDER BY b.id DESC
      LIMIT ? OFFSET ?`;

    let rows;
    try {
      const [rowsRes] = await db.query(sql, params.concat([chunkSize, offset]));
      rows = rowsRes;
    } catch (err) {
      if (err && err.code === 'ER_BAD_FIELD_ERROR' && /b\.amount/.test(err.sqlMessage || '')) {
        const fallbackSql = sql.replace(/b\.amount/, 'NULL as amount');
        const [rowsRes2] = await db.query(fallbackSql, params.concat([chunkSize, offset]));
        rows = rowsRes2;
      } else {
        throw err;
      }
    }

    for (const r of rows) {
      // simple CSV escaping
      const created = r.created_at ? r.created_at.toISOString() : '';
      const amt = r.amount != null ? r.amount : '';
      const dobVal = r.dob ? (r.dob instanceof Date ? r.dob.toISOString().split('T')[0] : String(r.dob)) : '';
      const line = `${r.id},"${(r.beneficiary_name || '').replace(/"/g, '""')}","${(r.district||'')}","${(r.mandal||'')}","${(r.village||'')}","${(r.scheme||'')}","${(r.hod_name||'')}","${(r.aadhaar||'')}","${(r.mobile||'')}","${(r.gender||'')}","${dobVal}","${amt}","${created}"\n`;
      res.write(line);
    }
  }

  res.end();
}

async function importBeneficiaries(filePath, districtId, uploadedBy) {
  // Create job only; processing will be handled by background worker (Bull)
  const fileName = filePath.split(/[\\/]/).pop();
  const [jobRes] = await db.query('INSERT INTO beneficiary_import_jobs (file_name, district_id, uploaded_by, status, total_rows) VALUES (?, ?, ?, "pending", 0)', [fileName, districtId, uploadedBy]);
  const jobId = jobRes.insertId;
  return { jobId };
}

async function summaryBeneficiaries(filters = {}) {
  const where = [];
  const params = [];
  if (filters.districtId) { where.push('b.district_id = ?'); params.push(filters.districtId); }
  if (filters.mandalId) { where.push('b.mandal_id = ?'); params.push(filters.mandalId); }
  if (filters.villageName) { where.push('EXISTS (SELECT 1 FROM villages vv WHERE vv.id = b.village_id AND LOWER(vv.name) = ?)'); params.push(String(filters.villageName).toLowerCase()); }
  const whereClause = where.length ? ('WHERE ' + where.join(' AND ')) : '';

  let total = 0;
  try {
    const [totalRes] = await db.query(`SELECT COUNT(1) as total FROM beneficiaries b ${whereClause}`, params);
    total = totalRes[0].total || 0;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      throw new Error('Database not seeded: missing beneficiaries/villages table. Run the provided SQL migration to add beneficiaries and villages tables.');
    }
    throw err;
  }

  const [topSchemes] = await db.query(`SELECT s.id, s.scheme_name, COUNT(1) as cnt FROM beneficiaries b LEFT JOIN schemes s ON b.scheme_id = s.id ${whereClause} GROUP BY s.id ORDER BY cnt DESC LIMIT 5`, params);

  const [recent] = await db.query(`SELECT b.id, b.beneficiary_name, b.created_at FROM beneficiaries b ${whereClause} ORDER BY b.created_at DESC LIMIT 5`, params);

  return { totalBeneficiaries: total, topSchemes, recent };
}

module.exports = {
  searchBeneficiaries,
  exportBeneficiaries,
  importBeneficiaries,
  summaryBeneficiaries,
  hashAadhaar
};
