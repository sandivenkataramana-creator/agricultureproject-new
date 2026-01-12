const http = require('http');

async function test() {
  console.log('Waiting 3 seconds before testing...');
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Testing endpoint...');
  const req = http.get('http://127.0.0.1:5000/api/dashboard/stats', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', JSON.stringify(parsed, null, 2));
      } catch(e) {
        console.log('Response (raw):', data.substring(0, 200));
      }
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error('HTTP Error:', e.message);
    process.exit(1);
  });
  
  req.setTimeout(3000, () => {
    console.error('Request timeout');
    process.exit(1);
  });
}

test();
