// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // <<-- خط جدید
const sequelize = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// مدل‌ها
const User = require('./models/user');
const Website = require('./models/website');
const Keyword = require('./models/keyword');
const ApiKey = require('./models/apiKey');
const RankHistory = require('./models/rankHistory');

// روترها
const websiteRoutes = require('./routes/websites');
const userRoutes = require('./routes/users');
const apiKeyRoutes = require('./routes/apiKeys');

const app = express();
app.use(express.json());
app.use(cors()); // <<-- خط جدید

// --- تعریف ارتباط بین مدل‌ها ---
User.belongsToMany(Website, { through: 'UserWebsites' });
Website.belongsToMany(User, { through: 'UserWebsites' });
Website.hasMany(Keyword);
Keyword.belongsTo(Website);
Keyword.hasMany(RankHistory);
RankHistory.belongsTo(Keyword);

// --- تعریف مسیرهای API ---
app.get('/', (req, res) => {
  res.json({ message: "Hello from Keyword Tracker API!" });
});

// اتصال روترها
app.use('/api/users', userRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/keys', apiKeyRoutes);

module.exports = app;