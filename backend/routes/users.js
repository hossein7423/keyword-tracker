// backend/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// مدل‌ها
const User = require('../models/user');
const Website = require('../models/website');

// میدل‌ور
const authenticateToken = require('../middleware/authMiddleware');

// مسیر POST برای ثبت نام کاربر جدید
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password are required.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userCount = await User.count();
        const role = userCount === 0 ? 'admin' : 'viewer';
        const newUser = await User.create({
          username: username,
          password: hashedPassword,
          role: role
        });
        res.status(201).json({
          message: 'User created successfully!',
          user: { id: newUser.id, username: newUser.username, role: newUser.role }
        });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({ error: 'Username already exists.' });
        }
        res.status(500).json({ error: 'Something went wrong.' });
      }
});

// مسیر POST برای ورود کاربر
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password are required.' });
        }
        const user = await User.findOne({ where: { username: username } });
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const payload = { id: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Logged in successfully!', token: token });
      } catch (error) {
        res.status(500).json({ error: 'Something went wrong.' });
      }
});

// مسیر حفاظت‌شده برای گرفتن اطلاعات پروفایل کاربر
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
          attributes: ['id', 'username', 'role']
        });
        if (!user) {
          return res.status(404).json({ error: 'User not found.' });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: 'Something went wrong.' });
      }
});

// مسیر GET برای گرفتن لیست تمام کاربران (فقط ادمین)
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Admins only.' });
  }
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'role'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// مسیر GET برای گرفتن لیست وب‌سایت‌هایی که کاربر فعلی به آن‌ها دسترسی دارد
router.get('/my-websites', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: {
        model: Website,
        through: { attributes: [] }
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user.Websites);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;