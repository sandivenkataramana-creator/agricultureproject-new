const svc = require('../services/beneficiaryService');

(async function(){
  try{
    const res = await svc.searchBeneficiaries({districtId:2, mandalId:64, page:0, size:50});
    console.log('search result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Error:', e.message, e);
  } finally {
    process.exit(0);
  }
})();