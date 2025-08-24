// backend/routes/apiKeys.js
const express = require('express');
const router = express.Router();
const ApiKey = require('../models/apiKey');
const authenticateToken = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Admins only.' });
  }
  next();
};

router.use(authenticateToken, adminOnly);

router.get('/', async (req, res) => {
  try {
    const keys = await ApiKey.findAll({
      attributes: ['id', 'serviceName', 'monthlyLimit', 'usedCount', 'isActive', 'createdAt']
    });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { serviceName, keyValue, monthlyLimit } = req.body;
    if (!serviceName || !keyValue || !monthlyLimit) {
      return res.status(400).json({ error: 'serviceName, keyValue, and monthlyLimit are required.' });
    }
    const newKey = await ApiKey.create({ serviceName, keyValue, monthlyLimit });
    res.status(201).json(newKey);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'This API key already exists.' });
    }
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ApiKey.destroy({ where: { id: id } });
    if (result === 0) {
      return res.status(404).json({ error: 'API key not found.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;