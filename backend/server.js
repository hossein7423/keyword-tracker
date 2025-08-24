// backend/server.js
const app = require('./app');
const sequelize = require('./database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    await sequelize.sync(); 
    console.log('All models were synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });
    
    // زمان‌بند فقط زمانی فعال می‌شود که در محیط تست نباشیم
    if (process.env.NODE_ENV !== 'test') {
      require('./scheduler');
    }

  } catch (error)
  {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();