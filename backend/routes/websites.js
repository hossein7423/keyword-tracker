// backend/routes/websites.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
// مدل‌ها
const Website = require('../models/website');
const User = require('../models/user');
const Keyword = require('../models/keyword');
const RankHistory = require('../models/rankHistory');
// میدل‌ور و سرویس
const authenticateToken = require('../middleware/authMiddleware');
const { checkKeywordRank } = require('../services/rankChecker');

// تنظیمات Multer برای آپلود فایل در حافظه
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /api/websites - افزودن وب‌سایت جدید
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
  
// GET /api/websites - دریافت لیست تمام وب‌سایت‌ها
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

// GET /api/websites/:websiteId - دریافت اطلاعات یک وب‌سایت خاص
router.get('/:websiteId', authenticateToken, async (req, res) => {
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
    res.json(website);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
  
// POST /api/websites/:websiteId/assign - اختصاص دسترسی به کاربر
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

// DELETE /api/websites/:websiteId/assign/:userId - لغو دسترسی کاربر
router.delete('/:websiteId/assign/:userId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden. Admins only.' });
    }
    try {
      const { websiteId, userId } = req.params;
      const website = await Website.findByPk(websiteId);
      const user = await User.findByPk(userId);
      if (!website || !user) {
        return res.status(404).json({ error: 'Website or User not found.' });
      }
      await website.removeUser(user);
      res.json({ message: `Access for user ${user.username} to ${website.name} has been revoked.` });
    } catch (error) {
      res.status(500).json({ error: 'Something went wrong.' });
    }
});
  
// POST /api/websites/:websiteId/keywords - افزودن کلیدواژه
router.post('/:websiteId/keywords', authenticateToken, async (req, res) => {
  try {
    const { websiteId } = req.params;
    const website = await Website.findByPk(websiteId);
    if (!website) { return res.status(404).json({ error: 'Website not found.' }); }
    const hasAccess = req.user.role === 'admin' || await website.hasUser(req.user.id);
    if (!hasAccess || req.user.role === 'viewer') { return res.status(403).json({ error: 'Access forbidden.' }); }
    const { text } = req.body;
    if (!text) { return res.status(400).json({ error: 'Keyword text is required.' }); }
    const keyword = await Keyword.create({ text: text, WebsiteId: websiteId });
    res.status(201).json(keyword);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'This keyword already exists for this website.' });
    }
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
  
// GET /api/websites/:websiteId/keywords - دریافت لیست کلیدواژه‌ها
router.get('/:websiteId/keywords', authenticateToken, async (req, res) => {
  try {
    const { websiteId } = req.params;
    const website = await Website.findByPk(websiteId);
    if (!website) { return res.status(404).json({ error: 'Website not found.' }); }
    const hasAccess = req.user.role === 'admin' || await website.hasUser(req.user.id);
    if (!hasAccess) { return res.status(403).json({ error: 'Access forbidden.' }); }
    const keywords = await Keyword.findAll({
      where: { WebsiteId: websiteId },
      include: [{ model: RankHistory, limit: 1, order: [['checkDate', 'DESC']] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// DELETE /api/websites/:websiteId/keywords/:keywordId - حذف کلیدواژه
router.delete('/:websiteId/keywords/:keywordId', authenticateToken, async (req, res) => {
  try {
    const { websiteId, keywordId } = req.params;
    const website = await Website.findByPk(websiteId);
    if (!website) { return res.status(404).json({ error: 'Website not found.' }); }
    const hasAccess = req.user.role === 'admin' || await website.hasUser(req.user.id);
    if (!hasAccess || req.user.role === 'viewer') { return res.status(403).json({ error: 'Access forbidden.' }); }
    const result = await Keyword.destroy({ where: { id: keywordId, WebsiteId: websiteId } });
    if (result === 0) { return res.status(404).json({ error: 'Keyword not found.' }); }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// POST /api/websites/:websiteId/keywords/:keywordId/check-rank - بررسی دستی جایگاه
router.post('/:websiteId/keywords/:keywordId/check-rank', authenticateToken, async (req, res) => {
  try {
    const { websiteId, keywordId } = req.params;
    const keyword = await Keyword.findOne({ where: { id: keywordId, WebsiteId: websiteId }, include: Website });
    if (!keyword) { return res.status(404).json({ error: 'Keyword not found for this website.' }); }
    const hasAccess = req.user.role === 'admin' || await keyword.Website.hasUser(req.user.id);
    if (!hasAccess || req.user.role === 'viewer') { return res.status(403).json({ error: 'Access forbidden.' }); }
    const result = await checkKeywordRank(keyword);
    if (result.status === 'success') {
      res.json({ message: 'Rank checked successfully!', data: result.data });
    } else {
      res.json({ message: result.message });
    }
  } catch (error) {
    if (error.message.includes('No available API keys')) { return res.status(503).json({ error: error.message }); }
    console.error(error);
    res.status(500).json({ error: 'Something went wrong during the rank check process.' });
  }
});

// GET /api/websites/:websiteId/keywords/:keywordId/history - دریافت تاریخچه رتبه
router.get('/:websiteId/keywords/:keywordId/history', authenticateToken, async (req, res) => {
  try {
    const { websiteId, keywordId } = req.params;
    const website = await Website.findByPk(websiteId);
    if (!website) { return res.status(404).json({ error: 'Website not found.' }); }
    const hasAccess = req.user.role === 'admin' || await website.hasUser(req.user.id);
    if (!hasAccess) { return res.status(403).json({ error: 'Access forbidden.' }); }
    const history = await RankHistory.findAll({
      where: { KeywordId: keywordId },
      order: [['checkDate', 'ASC']]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// **مسیر POST جدید برای آپلود فایل اکسل کلیدواژه‌ها**
router.post('/:websiteId/keywords/upload', authenticateToken, upload.single('keywordsFile'), async (req, res) => {
  try {
    const { websiteId } = req.params;
    const website = await Website.findByPk(websiteId);
    if (!website) { return res.status(404).json({ error: 'Website not found.' }); }
    const hasAccess = req.user.role === 'admin' || await website.hasUser(req.user.id);
    if (!hasAccess || req.user.role === 'viewer') { return res.status(403).json({ error: 'Access forbidden.' }); }
    if (!req.file) { return res.status(400).json({ error: 'No file uploaded.' }); }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const keywordsToInsert = data
      .flat()
      .map(text => String(text).trim())
      .filter(text => text.length > 0)
      .map(text => ({ text, WebsiteId: websiteId }));

    if (keywordsToInsert.length === 0) {
      return res.status(400).json({ error: 'No keywords found in the file.' });
    }
    const result = await Keyword.bulkCreate(keywordsToInsert, { ignoreDuplicates: true });
    res.json({ message: `${result.length} new keywords were added successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the file.' });
  }
});

module.exports = router;