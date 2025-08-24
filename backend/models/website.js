// backend/models/website.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Website = sequelize.define('Website', {
  name: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isUrl: true } }
});

module.exports = Website;