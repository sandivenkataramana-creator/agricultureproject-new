const fetch = require('node-fetch');

async function testDashboardStats() {
  try {
    console.log('Testing dashboard stats endpoint...');
    const response = await fetch('http://localhost:5000/api/dashboard/stats');
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDashboardStats();
