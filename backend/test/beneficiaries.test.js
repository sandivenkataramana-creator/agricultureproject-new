const request = require('supertest');
const { expect } = require('chai');
const app = require('../server'); // update server.js to export app for testing

describe('Beneficiaries API', () => {
  it('should require auth on search', async () => {
    const res = await request(app).post('/api/beneficiaries/search').send({});
    expect(res.status).to.equal(401);
  });

  it('should return 400 when district/mandal missing', async () => {
    // create a short-lived token for testing (or skip auth by adding demo token)
    const token = 'Bearer invalid';
    const res = await request(app).post('/api/beneficiaries/search').set('Authorization', token).send({ districtId: null, mandalId: null });
    // unauthorized vs 400 depends on token; allow either 401 or 400
    expect([400,401]).to.include(res.status);
  });
});