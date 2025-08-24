// backend/routes/websites.js
const express = require('express');
const router = express.Router();
const Website = require('../models/website');
const User = require('../models/user');
const Keyword = require('../models/keyword');
const authenticateToken = require('../middleware/authMiddleware');
const { checkKeywordRank } = require('../services/rankChecker');

router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden. Admins only.' });
    }
    try {
      const { name, url } = req.body;
      if (!name || !url) {
        return res.status(400).json({ error: 'Name and URL are required.' });
      }
      const newWebsite = await Website.create({ name, url });
      res.status(201).json(newWebsite);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'URL already exists.' });
      }
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Something went wrong.' });
    }
  });
  
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Admins only.' });
  }
  try {
    const websites = await Website.findAll();
    res.json(websites);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
  
router.post('/:websiteId/assign', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Admins only.' });
  }
  try {
    const { userId } = req.body;
    const { websiteId } = req.params;
    const website = await Website.findByPk(websiteId);
    const user = await User.findByPk(userId);
    if (!website || !user) {
      return res.status(404).json({ error: 'Website or User not found.' });
    }
    await website.addUser(user);
    res.json({ message: `User ${user.username} has been granted access to ${website.name}.` });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
  
router.post('/:websiteId/keywords', authenticateToken, async (req, res) => {
  try {
    const { websiteId } = req.params;
    const website = await Website.findByPk(websiteId);
    if (!website) {
      return res.status(404).json({ error: 'Website not found.' });
    }
    const hasAccess = req.user.role === 'admin' || await website.hasUser(req.user.id);
    if (!hasAccess || req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Access forbidden.' });
    }
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Keyword text is required.' });
    }
    const keyword = await Keyword.create({ text: text, WebsiteId: websiteId });
    res.status(201).json(keyword);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'This keyword already exists for this website.' });
    }
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
  
router.get('/:websiteId/keywords', authenticateToken, async (req, res) => {
  try {
    const { websiteId } = req.params;
    const website = await Website.findByPk(websiteId);
    if (!website) {
      return res.status(404).json({ error: 'Website not found.' });
    }
    const hasAccess = req.user.role === 'admin' || await website.hasUser(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access forbidden.' });
    }
    const keywords = await Keyword.findAll({ where: { WebsiteId: websiteId } });
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.post('/:websiteId/keywords/:keywordId/check-rank', authenticateToken, async (req, res) => {
  try {
    const { websiteId, keywordId } = req.params;
    
    const keyword = await Keyword.findOne({
      where: { id: keywordId, WebsiteId: websiteId },
      include: Website
    });
    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found for this website.' });
    }
    const hasAccess = req.user.role === 'admin' || await keyword.Website.hasUser(req.user.id);
    if (!hasAccess || req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Access forbidden.' });
    }
    const result = await checkKeywordRank(keyword);
    if (result.status === 'success') {
      res.json({ message: 'Rank checked successfully!', data: result.data });
    } else {
      res.json({ message: result.message });
    }
  } catch (error) {
    if (error.message.includes('No available API keys')) {
        return res.status(503).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Something went wrong during the rank check process.' });
  }
});

module.exports = router;