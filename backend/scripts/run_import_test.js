const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const db = require('../config/database');
const svc = require('../services/beneficiaryService');
const importQueue = require('../queues/importQueue');

(async function(){
  try{
    const uploads = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploads)) fs.mkdirSync(uploads);
    const filePath = path.join(uploads, 'test_import.xlsx');

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(['Beneficiary Name','Aadhaar','Mobile','Mandal','Village','Scheme','Gender','DOB','Amount','District']);
    ws.addRow(['Test Person', '1111222233334444', '9999999999', 'Jagtial', 'Ankamma Puram', 'Raithubandhu', 'female', '1990-01-01', '1000', 'Jagtial']);
    await wb.xlsx.writeFile(filePath);
    console.log('Test import file created at', filePath);

    // Create job entry
    const { jobId } = await svc.importBeneficiaries(filePath, 2, 1);
    console.log('Job created:', jobId);

    // enqueue job
    try {
      await importQueue.add({ jobId, filePath, districtId: 2, uploadedBy: 1 });
      console.log('Job enqueued');
    } catch (e) {
      console.error('Enqueue failed', e.message || e);
    }

    // poll job status
    for (let i=0;i<30;i++){
      const [rows] = await db.query('SELECT * FROM beneficiary_import_jobs WHERE id = ?', [jobId]);
      if (rows.length) {
        console.log('Status:', rows[0].status, 'processed', rows[0].processed_rows, 'failed', rows[0].failed_rows);
        if (['completed','failed'].includes(rows[0].status)) break;
      }
      await new Promise(r=>setTimeout(r,1000));
    }

  } catch (e) {
    console.error('Import test error', e);
  } finally {
    process.exit(0);
  }
})();