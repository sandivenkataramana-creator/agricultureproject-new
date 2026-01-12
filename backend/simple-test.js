const http = require('http');

async function test() {
  console.log('Testing endpoint in 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));

  const req = http.get('http://localhost:5000/api/dashboard/stats', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Data:', data);
      try {
        console.log('Parsed:', JSON.stringify(JSON.parse(data), null, 2));
      } catch(e) {
        console.log('Parse error:', e.message);
      }
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
  
  req.setTimeout(5000, () => {
    req.destroy();
    console.error('Timeout');
    process.exit(1);
  });
}

test();
