(async function(){
  let fetch = global.fetch;
  if (!fetch) {
    const nf = await import('node-fetch');
    fetch = nf.default;
  }
  try{
    // login
    const loginRes = await fetch('http://localhost:5000/api/auth/login',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'admin', password:'password123'})});
    const login = await loginRes.json();
    console.log('Login response:', login);
    if (!login || !login.token) { console.error('Login failed'); process.exit(1); }
    const token = login.token;

    // search
    const searchRes = await fetch('http://localhost:5000/api/beneficiaries/search',{method:'POST', headers:{'Content-Type':'application/json', 'Authorization': 'Bearer '+token}, body: JSON.stringify({districtId:2, mandalId:64, page:0, size:10})});
    const search = await searchRes.json();
    console.log('Search result count:', search && search.rows ? search.rows.length : 'N/A');

    // export CSV
    const exportRes = await fetch('http://localhost:5000/api/beneficiaries/export?format=csv',{method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({districtId:2, mandalId:64})});
    const text = await exportRes.text();
    console.log('Export (first 200 chars):', text.slice(0,200));

    process.exit(0);
  } catch (e) {
    console.error('Smoke test failed', e);
    process.exit(1);
  }
})();