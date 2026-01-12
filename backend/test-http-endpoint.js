const http = require('http');

function testDashboardStats() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/stats',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('Request timeout');
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

console.log('Testing dashboard stats endpoint...');
setTimeout(() => {
  testDashboardStats().catch(console.error).finally(() => process.exit(0));
}, 2000);
