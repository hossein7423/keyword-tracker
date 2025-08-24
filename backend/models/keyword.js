// backend/models/keyword.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Keyword = sequelize.define('Keyword', {
  text: { type: DataTypes.STRING, allowNull: false },
  lastCheckedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [{ unique: true, fields: ['text', 'WebsiteId'] }]
});

module.exports = Keyword;