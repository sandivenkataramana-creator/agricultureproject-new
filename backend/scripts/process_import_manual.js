const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const db = require('../config/database');
(async function(){
  try{
    const jobId = Number(process.argv[2]||3);
    const [jobs] = await db.query('SELECT * FROM beneficiary_import_jobs WHERE id = ?', [jobId]);
    if (!jobs.length) { console.error('Job not found'); process.exit(1); }
    const job = jobs[0];
    const filePath = path.join(__dirname, '..', 'uploads', job.file_name);
    console.log('Processing file', filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    const headers = [];
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) { row.eachCell((cell, colNumber) => headers[colNumber] = String(cell.text || '').trim()); }
      else {
        const obj = {};
        row.eachCell((cell, colNumber) => { const h = headers[colNumber]||`col${colNumber}`; obj[h]=cell.text; });
        rows.push(obj);
      }
    });

    // Validate single district
    const districts = new Set(); rows.forEach(r => { if (r.District) districts.add(String(r.District).trim()); });
    if (districts.size > 1) { console.error('Multiple districts in file'); process.exit(1); }

    // mandal/village maps
    const [mandals] = await db.query('SELECT id,name FROM mandals WHERE district_id = ?', [job.district_id]);
    const mandalMap = new Map(mandals.map(m=>[m.name.toLowerCase(), m.id]));
    const [villages] = await db.query('SELECT id,name,mandal_id FROM villages WHERE mandal_id IN (SELECT id FROM mandals WHERE district_id = ?)', [job.district_id]);
    const villageMap = new Map(villages.map(v=>[v.name.toLowerCase(), v.id]));

    let processed = 0, failed = 0;
    for (let i=0;i<rows.length;i++){
      const row=rows[i];
      const name = row['Beneficiary Name']||row['beneficiary_name']||row['name'];
      const mandal = (row['Mandal']||'').toString().trim();
      if (!name || !mandal) { failed++; await db.query('INSERT INTO beneficiary_import_errors (job_id, row_number, error_message, row_data) VALUES (?, ?, ?, ?)', [jobId, i+2, 'Missing required fields', JSON.stringify(row)]); continue; }
      const mandalId = mandalMap.get(mandal.toLowerCase()); if (!mandalId) { failed++; await db.query('INSERT INTO beneficiary_import_errors (job_id, row_number, error_message, row_data) VALUES (?, ?, ?, ?)', [jobId, i+2, 'Invalid mandal', JSON.stringify(row)]); continue; }
      const village = (row['Village']||'').toString().trim(); let villageId=null; if (village) { villageId=villageMap.get(village.toLowerCase()); if (!villageId){ failed++; await db.query('INSERT INTO beneficiary_import_errors (job_id, row_number, error_message, row_data) VALUES (?, ?, ?, ?)', [jobId, i+2, 'Invalid village', JSON.stringify(row)]); continue; }}
      const schemeName=(row['Scheme']||'').toString().trim(); let schemeId=null; let schemeHodId=null; if (schemeName){ const [sch]=await db.query('SELECT id, hod_id FROM schemes WHERE LOWER(name)=?', [schemeName.toLowerCase()]); if (sch.length){ schemeId=sch[0].id; schemeHodId=sch[0].hod_id||null; } else { const [ins]=await db.query('INSERT INTO schemes (name) VALUES (?)', [schemeName]); schemeId=ins.insertId; }}
      const aadhaarRaw = row['Aadhaar']||row['aadhaar']||row['Aadhar']; const aadhaar = aadhaarRaw ? String(aadhaarRaw).replace(/\D/g,'') : null;
      const mobileRaw = row['Mobile']||row['mobile']||row['phone']; const mobile = mobileRaw ? String(mobileRaw).trim() : null;
      const gender = (row['Gender']||'').toString().trim()||null;
      const dobRaw = row['DOB']||row['dob']||row['Date of Birth']||''; const dob = dobRaw ? (new Date(dobRaw)).toISOString().split('T')[0] : null;
      const amountRaw = row['Amount']||row['amount']||row['Amt']; const amount = (amountRaw !== undefined && amountRaw !== null && String(amountRaw).trim()!=='') ? Number(String(amountRaw).replace(/[^0-9.-]/g,'')) : null;

      try{
        await db.query('INSERT INTO beneficiaries (beneficiary_name, aadhaar, mobile, gender, dob, hod_id, district_id, mandal_id, village_id, scheme_id, amount) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [name, aadhaar, mobile, gender, dob, schemeHodId, job.district_id, mandalId, villageId, schemeId, amount]);
        processed++;
      } catch (err) {
        console.error('Insert error', err.message);
        failed++;
        await db.query('INSERT INTO beneficiary_import_errors (job_id, row_number, error_message, row_data) VALUES (?, ?, ?, ?)', [jobId, i+2, err.message, JSON.stringify(row)]);
      }
    }

    await db.query('UPDATE beneficiary_import_jobs SET status=?, processed_rows=?, failed_rows=?, total_rows=? WHERE id=?', ['completed', processed, failed, rows.length, jobId]);
    console.log('Manual processing completed. processed', processed, 'failed', failed);

  } catch (e) { console.error('Manual processor error', e); process.exit(1); } finally { process.exit(0); }
})();