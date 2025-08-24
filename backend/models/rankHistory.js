// backend/models/rankHistory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const RankHistory = sequelize.define('RankHistory', {
  rank: { type: DataTypes.INTEGER, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  checkDate: { type: DataTypes.DATEONLY, allowNull: false }
});

module.exports = RankHistory;