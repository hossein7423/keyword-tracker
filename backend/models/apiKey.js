// backend/models/apiKey.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const ApiKey = sequelize.define('ApiKey', {
  serviceName: { type: DataTypes.STRING, allowNull: false },
  keyValue: { type: DataTypes.STRING, allowNull: false, unique: true },
  monthlyLimit: { type: DataTypes.INTEGER, allowNull: false },
  usedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = ApiKey;