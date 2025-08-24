// backend/scheduler.js
const cron = require('node-cron');
const Keyword = require('./models/keyword');
const Website = require('./models/website');
const { checkKeywordRank } = require('./services/rankChecker');

cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled job: Checking keyword ranks...');
  try {
    const keywordsToCheck = await Keyword.findAll({
      include: Website,
      order: [
        ['lastCheckedAt', 'ASC NULLS FIRST']
      ],
      limit: 20
    });
    if (keywordsToCheck.length === 0) {
      console.log('Scheduler: No keywords to check.');
      return;
    }
    console.log(`Scheduler: Found ${keywordsToCheck.length} keywords to check.`);
    for (const keyword of keywordsToCheck) {
      try {
        await checkKeywordRank(keyword);
      } catch (error) {
        console.error(`Scheduler: Failed to check rank for keyword "${keyword.text}". Error: ${error.message}`);
        if (error.message.includes('No available API keys')) {
          console.log('Scheduler: Halting job due to lack of API keys.');
          break;
        }
      }
    }
    console.log('Scheduled job finished.');
  } catch (error) {
    console.error('An error occurred during the scheduled job:', error);
  }
});