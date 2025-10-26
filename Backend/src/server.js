// src/server.js
// Server entry point - starts the Express app
require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Optional: test database connection if sequelize is available
  try {
    const { sequelize } = require('./models');
    if (sequelize) {
      await sequelize.authenticate();
      logger.info('Database connection established successfully.');
    }
  } catch (error) {
    logger.warn('Database connection check skipped or failed:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = server;
