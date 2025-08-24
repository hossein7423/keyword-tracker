// backend/tests/apiKeysAndRankCheck.test.js
const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const axios = require('axios');
const serpServices = require('../config/serpServices');
const ApiKey = require('../models/apiKey');

jest.mock('axios');

let adminToken, testWebsite, testKeyword;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await request(app).post('/api/users/register').send({ username: 'admin_rank', password: 'password' });
  const adminLogin = await request(app).post('/api/users/login').send({ username: 'admin_rank', password: 'password' });
  adminToken = adminLogin.body.token;

  const websiteRes = await request(app).post('/api/websites').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Rank Test Site', url: 'https://ranktest.com' });
  testWebsite = websiteRes.body;
  const keywordRes = await request(app).post(`/api/websites/${testWebsite.id}/keywords`).set('Authorization', `Bearer ${adminToken}`).send({ text: 'how to test nodejs' });
  testKeyword = keywordRes.body;
});

// قبل از هر تست، mock ها و جدول کلیدها را پاک می‌کنیم
beforeEach(async () => {
    axios.get.mockClear();
    await ApiKey.destroy({ truncate: true }); // جدول کلیدها را خالی می‌کند
});

describe('API Key Management and Rank Checking', () => {

  it('should allow an admin to add a new API key', async () => {
    const res = await request(app)
      .post('/api/keys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ serviceName: 'ScaleSERP', keyValue: 'scaleserp-key-123', monthlyLimit: 100 });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.serviceName).toBe('ScaleSERP');
  });

  it('should call the correct service URL for ScaleSERP', async () => {
    // فقط کلید مربوط به ScaleSERP را اضافه می‌کنیم
    await request(app).post('/api/keys').set('Authorization', `Bearer ${adminToken}`).send({ serviceName: 'ScaleSERP', keyValue: 'scaleserp-key-123', monthlyLimit: 100 });

    const mockResponse = { organic_results: [] };
    axios.get.mockResolvedValue({ data: mockResponse });

    await request(app)
      .post(`/api/websites/${testWebsite.id}/keywords/${testKeyword.id}/check-rank`)
      .set('Authorization', `Bearer ${adminToken}`);

    // چک می‌کنیم که axios با آدرس صحیح فراخوانی شده باشد
    expect(axios.get).toHaveBeenCalledWith(
      serpServices['ScaleSERP'].baseURL,
      expect.any(Object)
    );
  });

  it('should call the correct service URL for SerpApi', async () => {
    // فقط کلید مربوط به SerpApi را اضافه می‌کنیم
    await request(app).post('/api/keys').set('Authorization', `Bearer ${adminToken}`).send({ serviceName: 'SerpApi', keyValue: 'serpapi-key-456', monthlyLimit: 100 });

    const mockResponse = { organic_results: [] };
    axios.get.mockResolvedValue({ data: mockResponse });

    await request(app)
      .post(`/api/websites/${testWebsite.id}/keywords/${testKeyword.id}/check-rank`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(axios.get).toHaveBeenCalledWith(
      serpServices['SerpApi'].baseURL,
      expect.any(Object)
    );
  });
  
  it('should fail to check rank if no API keys are available', async () => {
    // اطمینان حاصل می‌کنیم هیچ کلیدی وجود ندارد
    await ApiKey.destroy({ truncate: true });

    const res = await request(app)
      .post(`/api/websites/${testWebsite.id}/keywords/${testKeyword.id}/check-rank`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(503);
    expect(res.body.error).toContain('No available API keys');
  });
});

afterAll(async () => {
  await sequelize.close();
});