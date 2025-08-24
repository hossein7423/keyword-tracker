// backend/services/rankChecker.js
const axios = require('axios');
const { Op } = require('sequelize');
const sequelize = require('../database');
const serpServices = require('../config/serpServices'); // فایل کانفیگ را می‌خواند

// مدل‌های مورد نیاز
const ApiKey = require('../models/apiKey');
const RankHistory = require('../models/rankHistory');
const Website = require('../models/website');

async function checkKeywordRank(keyword) {
  // ۱. پیدا کردن یک کلید API معتبر
  const apiKey = await ApiKey.findOne({
    where: {
      isActive: true,
      usedCount: { [Op.lt]: sequelize.col('monthlyLimit') }
    }
  });

  if (!apiKey) {
    throw new Error('No available API keys with remaining quota.');
  }

  // ۲. پیدا کردن کانفیگ سرویس بر اساس نام ذخیره شده در دیتابیس
  const serviceConfig = serpServices[apiKey.serviceName];
  if (!serviceConfig) {
    throw new Error(`Configuration for service "${apiKey.serviceName}" not found.`);
  }

  // ۳. ساخت پارامترها با استفاده از تابع mapParams از فایل کانفیگ
  const params = serviceConfig.mapParams(apiKey.keyValue, keyword.text);

  // ۴. ارسال درخواست به baseURL صحیح از فایل کانفیگ
  const { data } = await axios.get(serviceConfig.baseURL, { params });
  
  // به‌روزرسانی شمارنده مصرف کلید API
  await apiKey.increment('usedCount');

  // اطمینان از وجود اطلاعات وب‌سایت
  if (!keyword.Website) {
    keyword.Website = await Website.findByPk(keyword.WebsiteId);
  }
  const websiteDomain = new URL(keyword.Website.url).hostname.replace('www.', '');
  let rankData = null;
  
  if (data.organic_results) {
    for (const result of data.organic_results) {
      if (result.domain && result.domain.includes(websiteDomain)) {
        rankData = { rank: result.position, url: result.link };
        break;
      }
    }
  }

  // به‌روزرسانی تاریخ آخرین بررسی کلیدواژه
  await keyword.update({ lastCheckedAt: new Date() });

  // ذخیره نتیجه در تاریخچه
  if (rankData) {
    const newRankHistory = await RankHistory.create({
      rank: rankData.rank,
      url: rankData.url,
      checkDate: new Date(),
      KeywordId: keyword.id
    });
    return { status: 'success', data: newRankHistory };
  } else {
    const notFoundHistory = await RankHistory.create({
        rank: 0, // رتبه صفر به معنی پیدا نشدن
        url: 'N/A',
        checkDate: new Date(),
        KeywordId: keyword.id
      });
    return { status: 'not_found', message: 'Domain not found in the top results.', data: notFoundHistory };
  }
}

module.exports = { checkKeywordRank };