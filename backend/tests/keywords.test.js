// backend/tests/keywords.test.js
const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');

let adminToken, viewerToken, testWebsite, viewerUser;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  await request(app).post('/api/users/register').send({ username: 'admin_kw', password: 'password' });
  const adminLogin = await request(app).post('/api/users/login').send({ username: 'admin_kw', password: 'password' });
  adminToken = adminLogin.body.token;

  const viewerRegister = await request(app).post('/api/users/register').send({ username: 'viewer_kw', password: 'password' });
  viewerUser = viewerRegister.body.user;
  const viewerLogin = await request(app).post('/api/users/login').send({ username: 'viewer_kw', password: 'password' });
  viewerToken = viewerLogin.body.token;

  const websiteRes = await request(app).post('/api/websites').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Keyword Test Site', url: 'https://kwtest.com' });
  testWebsite = websiteRes.body;

  await request(app).post(`/api/websites/${testWebsite.id}/assign`).set('Authorization', `Bearer ${adminToken}`).send({ userId: viewerUser.id });
});

describe('Keyword API Endpoints', () => {
  it('should FORBID a viewer from adding a keyword', async () => {
    const res = await request(app)
      .post(`/api/websites/${testWebsite.id}/keywords`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ text: 'forbidden keyword' });
    expect(res.statusCode).toEqual(403);
  });

  it('should ALLOW an admin to add a keyword to a website', async () => {
    const res = await request(app)
      .post(`/api/websites/${testWebsite.id}/keywords`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: 'my first keyword' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.text).toBe('my first keyword');
  });

  it('should ALLOW an assigned viewer to view keywords for a website', async () => {
    const res = await request(app)
      .get(`/api/websites/${testWebsite.id}/keywords`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].text).toBe('my first keyword');
  });
});

afterAll(async () => {
  await sequelize.close();
});