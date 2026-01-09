let Queue = null;
try {
  Queue = require('bull');
} catch (err) {
  console.warn('Warning: bull not installed - import queue will be disabled. Run `npm install` to enable background imports.');
}
const path = require('path');
const db = require('../config/database');
const { hashAadhaar } = require('../services/beneficiaryService');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let importQueue;
if (Queue) {
  try {
    importQueue = new Queue('beneficiary-import', REDIS_URL);
  } catch (err) {
    console.error('Warning: could not initialize import queue', err.message);
    importQueue = { add: async () => { throw new Error('Import queue unavailable'); } };
  }
} else {
  importQueue = { add: async () => { throw new Error('Import queue unavailable'); } };
}

if (importQueue && typeof importQueue.process === 'function') {
  importQueue.process(async (job) => {
  const { jobId, filePath, districtId, uploadedBy } = job.data;
  console.log('Processing import job', jobId, filePath);

  try {
    await db.query('UPDATE beneficiary_import_jobs SET status = ? WHERE id = ?', ['processing', jobId]);

    // Try to parse XLSX using 'xlsx' first, fall back to 'exceljs' if not present
    let rows = null;
    try {
      const xlsx = require('xlsx');
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    } catch (err) {
      // fallback to exceljs
      try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];
        const headers = [];
        rows = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            row.eachCell((cell, colNumber) => {
              headers[colNumber] = String(cell.text || cell.value || '').trim();
            });
          } else {
            const obj = {};
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber] || `col${colNumber}`;
              obj[header] = (cell.text !== undefined && cell.text !== null) ? cell.text : cell.value;
            });
            rows.push(obj);
          }
        });
      } catch (err2) {
        const msg = 'No Excel parser available (install xlsx or exceljs)';
        console.error(msg);
        await db.query('UPDATE beneficiary_import_jobs SET status = ?, errors = ? WHERE id = ?', ['failed', msg, jobId]);
        return Promise.resolve();
      }
    }

    // Validate single district in file
    const districts = new Set();
    rows.forEach((r) => { if (r.District) districts.add(String(r.District).trim()); });
    if (districts.size > 1) {
      const msg = 'Multiple districts found in import file';
      await db.query('UPDATE beneficiary_import_jobs SET status = ?, errors = ? WHERE id = ?', ['failed', msg, jobId]);
      return Promise.resolve();
    }

    // Validate mandal/village mapping
    const [mandals] = await db.query('SELECT id, name FROM mandals WHERE district_id = ?', [districtId]);
    const mandalMap = new Map(mandals.map(m => [m.name.toLowerCase(), m.id]));

    const [villages] = await db.query('SELECT id, name, mandal_id FROM villages WHERE mandal_id IN (SELECT id FROM mandals WHERE district_id = ?)', [districtId]);
    const villageMap = new Map(villages.map(v => [v.name.toLowerCase(), v.id]));

    const BATCH = 1000;
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const inserts = [];

      for (let rIdx = 0; rIdx < batch.length; rIdx++) {
        const row = batch[rIdx];
        const rowNumber = i + rIdx + 2;

        const name = row['Beneficiary Name'] || row['beneficiary_name'] || row['name'];
        const aadhaarRaw = row['Aadhaar'] || row['aadhaar'];
        const mobileRaw = row['Mobile'] || row['mobile'] || row['phone'];
        const mandal = (row['Mandal'] || '').toString().trim();
        const village = (row['Village'] || '').toString().trim();
        const schemeName = (row['Scheme'] || row['scheme'] || '').toString().trim();

        if (!name || !mandal) {
          failed++;
          await db.query('INSERT INTO beneficiary_import_errors (job_id, row_number, error_message, row_data) VALUES (?, ?, ?, ?)', [jobId, rowNumber, 'Missing required fields (name/mandal)', JSON.stringify(row)]);
          continue;
        }

        const mandalId = mandalMap.get(mandal.toLowerCase());
        if (!mandalId) {
          failed++;
          await db.query('INSERT INTO beneficiary_import_errors (job_id, row_number, error_message, row_data) VALUES (?, ?, ?, ?)', [jobId, rowNumber, 'Invalid mandal for district', JSON.stringify(row)]);
          continue;
        }

        let villageId = null;
        if (village) {
          villageId = villageMap.get(village.toLowerCase());
          if (!villageId) {
            failed++;
            await db.query('INSERT INTO beneficiary_import_errors (job_id, row_number, error_message, row_data) VALUES (?, ?, ?, ?)', [jobId, rowNumber, 'Invalid village for mandal', JSON.stringify(row)]);
            continue;
          }
        }

        // find or create scheme
        let schemeId = null;
        let schemeHodId = null;
        if (schemeName) {
          const [sch] = await db.query('SELECT id, hod_id FROM schemes WHERE LOWER(name) = ?', [schemeName.toLowerCase()]);
          if (sch.length) { schemeId = sch[0].id; schemeHodId = sch[0].hod_id || null; }
          else {
            const [ins] = await db.query('INSERT INTO schemes (name) VALUES (?)', [schemeName]);
            schemeId = ins.insertId;
            schemeHodId = null;
          }
        }

        // Store raw Aadhaar as requested (sanitized digits only)
        const aadhaar = aadhaarRaw ? String(aadhaarRaw).replace(/\D/g, '') : null;
        const mobile = mobileRaw ? String(mobileRaw).trim() : null;
        const gender = (row['Gender'] || row['gender'] || '').toString().trim() || null;
        const dobRaw = row['DOB'] || row['dob'] || row['Date of Birth'] || '';
        const dob = dobRaw ? (new Date(dobRaw)).toISOString().split('T')[0] : null;
        const amountRaw = row['Amount'] || row['amount'] || row['Amt'];
        const amount = (amountRaw !== undefined && amountRaw !== null && String(amountRaw).trim() !== '') ? Number(String(amountRaw).replace(/[^0-9.-]/g, '')) : null;

        // columns: beneficiary_name, aadhaar, mobile, gender, dob, hod_id, district_id, mandal_id, village_id, scheme_id, amount
        inserts.push([name, aadhaar, mobile, gender, dob, schemeHodId, districtId, mandalId, villageId, schemeId, amount]);
      }

      if (inserts.length > 0) {
        const placeholders = inserts.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',');
        const flat = inserts.flat();
        try {
          await db.query(`INSERT INTO beneficiaries (beneficiary_name, aadhaar, mobile, gender, dob, hod_id, district_id, mandal_id, village_id, scheme_id, amount) VALUES ${placeholders}`, flat);
          processed += inserts.length;
        } catch (err) {
          // If amount column missing, retry insert without amount
          if (err && err.code === 'ER_BAD_FIELD_ERROR' && /amount/.test(err.sqlMessage || '')) {
            const placeholders2 = inserts.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',');
            // map inserts to remove the last element (amount) from each row
            const flat2 = inserts.map(row => row.slice(0, 10)).flat();
            await db.query(`INSERT INTO beneficiaries (beneficiary_name, aadhaar, mobile, gender, dob, hod_id, district_id, mandal_id, village_id, scheme_id) VALUES ${placeholders2}`, flat2);
            processed += inserts.length;
          } else {
            throw err;
          }
        }
      }

      await db.query('UPDATE beneficiary_import_jobs SET processed_rows = processed_rows + ?, failed_rows = failed_rows + ?, total_rows = total_rows + ? WHERE id = ?', [processed, failed, batch.length, jobId]);
    }

    await db.query('UPDATE beneficiary_import_jobs SET status = ?, processed_rows = ?, failed_rows = ?, total_rows = ? WHERE id = ?', ['completed', processed, failed, rows.length, jobId]);

    return Promise.resolve();
  } catch (err) {
    console.error('Import processing error', err);
    await db.query('UPDATE beneficiary_import_jobs SET status = ?, errors = ? WHERE id = ?', ['failed', err.message, jobId]);
    return Promise.resolve();
  }
  });
}

module.exports = importQueue;