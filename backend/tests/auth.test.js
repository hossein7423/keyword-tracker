// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');

// در اینجا دیگر کاربری از قبل نمی‌سازیم
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('Auth API Endpoints', () => {
  
  // این تست حالا اولین تستی است که با دیتابیس خالی تعامل دارد
  it('should register a new user and create the first user as admin', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testadmin',
        password: 'password123'
      });
      
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.role).toBe('admin'); // این بار باید درست باشد
  });

  it('should not allow registering with a duplicate username', async () => {
    // برای این تست، کاربر ادمین از تست قبلی وجود دارد
    const res = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testadmin',
        password: 'password456'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Username already exists.');
  });

  it('should log in an existing user and return a token', async () => {
    // ابتدا یک کاربر عادی برای تست لاگین می‌سازیم
    await request(app)
      .post('/api/users/register')
      .send({ username: 'testuser_login', password: 'password123' });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testuser_login',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should allow an authenticated user to access their profile', async () => {
    // برای این تست هم یک کاربر جدید و توکن جدید می‌گیریم تا کاملا مستقل باشد
    await request(app)
      .post('/api/users/register')
      .send({ username: 'testuser_profile', password: 'password123' });
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ username: 'testuser_profile', password: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.username).toBe('testuser_profile');
  });
});

afterAll(async () => {
  await sequelize.close();
});