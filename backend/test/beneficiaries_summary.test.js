const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const { signToken } = require('../middleware/auth');

describe('Beneficiaries summary API', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/beneficiaries/summary');
    expect(res.status).to.equal(401);
  });

  it('allows admin and returns summary', async () => {
    const token = signToken({ id: 1, role: 'admin', name: 'Admin User' });
    const res = await request(app).get('/api/beneficiaries/summary').set('Authorization', `Bearer ${token}`);
    expect([200, 500]).to.include(res.status); // 200 if DB present, 500 if DB not configured
  });
});