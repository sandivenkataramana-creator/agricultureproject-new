const svc = require('../services/beneficiaryService');
(async function(){
  try{
    const buffer = [];
    const res = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      write(chunk) { buffer.push(String(chunk)); },
      end() { /* no-op */ }
    };

    await svc.exportBeneficiaries({districtId:2, mandalId:64}, res, 'csv');
    const out = buffer.join('');
    console.log('Exported length:', out.length);
    console.log(out.slice(0,500));
  } catch (e) {
    console.error('Export error', e.message, e);
  } finally {
    process.exit(0);
  }
})();