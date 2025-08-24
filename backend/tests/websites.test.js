// backend/tests/websites.test.js
const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');

let adminToken;
let viewerToken;
let viewerUser;
let testWebsite;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  await request(app)
    .post('/api/users/register')
    .send({ username: 'admin_websites', password: 'password' });
  const adminLoginRes = await request(app)
    .post('/api/users/login')
    .send({ username: 'admin_websites', password: 'password' });
  adminToken = adminLoginRes.body.token;

  const viewerRes = await request(app)
    .post('/api/users/register')
    .send({ username: 'viewer_websites', password: 'password' });
  viewerUser = viewerRes.body.user;
  const viewerLoginRes = await request(app)
    .post('/api/users/login')
    .send({ username: 'viewer_websites', password: 'password' });
  viewerToken = viewerLoginRes.body.token;
});

describe('Website API Endpoints', () => {

  it('should FORBID a non-admin from creating a website', async () => {
    const res = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Forbidden Site', url: 'https://forbidden.com' });
      
    expect(res.statusCode).toEqual(403);
  });

  it('should ALLOW an admin to create a new website', async () => {
    const res = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Site', url: 'https://testsite.com' });
      
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toBe('Test Site');
    testWebsite = res.body;
  });

  it('should ALLOW an admin to get a list of all websites', async () => {
    const res = await request(app)
      .get('/api/websites')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
  
  it('should ALLOW an admin to assign a user to a website', async () => {
    const res = await request(app)
      .post(`/api/websites/${testWebsite.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: viewerUser.id });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain('has been granted access');
  });

  it('should ALLOW an assigned user to see the website in their list', async () => {
    const res = await request(app)
      .get('/api/users/my-websites')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Test Site');
  });

});

afterAll(async () => {
  await sequelize.close();
});