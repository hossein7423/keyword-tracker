// backend/database.js
const { Sequelize } = require('sequelize');

let sequelize;

// اگر در محیط تست بودیم، از دیتابیس در حافظه استفاده کن
if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // لاگ‌ها را در تست غیرفعال می‌کنیم
  });
} else {
  // در غیر این صورت، از همان فایل دیتابیس همیشگی استفاده کن
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  });
}

module.exports = sequelize;