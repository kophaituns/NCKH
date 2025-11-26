// src/server.js
// Server entry point - starts the Express app
require('dotenv').config();
<<<<<<< HEAD
const http = require('http');
const app = require('./app');
const logger = require('./utils/logger');
const { initializeSocket } = require('./config/socket.config');
=======
const app = require('./app');
const logger = require('./utils/logger');
>>>>>>> linh2

// Validate required environment variables with defaults
const requiredEnvVars = {
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: '',
  DB_NAME: 'allmtags_survey_db',
  JWT_SECRET: 'unsafe-dev-secret-please-change-in-production',
  PORT: '5000',
  FRONTEND_URL: 'http://localhost:3000',
  NODE_ENV: 'development'
};

const missingCritical = [];
Object.keys(requiredEnvVars).forEach(varName => {
  if (!process.env[varName]) {
    const defaultValue = requiredEnvVars[varName];
    if (['JWT_SECRET', 'DB_PASSWORD'].includes(varName) && process.env.NODE_ENV === 'production') {
      missingCritical.push(varName);
    } else {
      process.env[varName] = defaultValue;
      logger.warn(`⚠️  ${varName} not set, using default: ${varName === 'DB_PASSWORD' ? '(empty)' : defaultValue}`);
    }
  }
});

if (missingCritical.length > 0) {
  logger.error(`❌ Missing critical environment variables in production: ${missingCritical.join(', ')}`);
  logger.error('Please set these in your .env file. See .env.example for reference.');
  process.exit(1);
}

const PORT = process.env.PORT;

<<<<<<< HEAD
// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Make io accessible globally for use in controllers/services
app.set('io', io);

const server = httpServer.listen(PORT, async () => {
=======
const server = app.listen(PORT, async () => {
>>>>>>> linh2
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  try {
    const { sequelize } = require('./models');
    if (sequelize) {
      await sequelize.authenticate();
      logger.info('✅ Database connection established successfully.');
      
      // Check for pending migrations
      const queryInterface = sequelize.getQueryInterface();
      const tables = await queryInterface.showAllTables();
      if (tables.length === 0) {
        logger.warn('⚠️  Database appears empty. Run migrations: npm run migrate');
      }
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.error('Please check your database configuration.');
  }
  
  logger.info(`\n📚 API Endpoints:`);
  logger.info(`   Health: http://localhost:${PORT}/api/modules/health`);
  logger.info(`   Auth: http://localhost:${PORT}/api/modules/auth/*`);
  logger.info(`   Users: http://localhost:${PORT}/api/modules/users/*`);
  logger.info(`   Templates: http://localhost:${PORT}/api/modules/templates/*`);
  logger.info(`   Surveys: http://localhost:${PORT}/api/modules/surveys/*`);
  logger.info(`   Collectors: http://localhost:${PORT}/api/modules/collectors/*`);
  logger.info(`   Responses: http://localhost:${PORT}/api/modules/responses/*`);
  logger.info(`   Analytics: http://localhost:${PORT}/api/modules/analytics/*`);
<<<<<<< HEAD
  if (io) {
    logger.info(`\n🔌 WebSocket: ws://localhost:${PORT}/socket.io`);
  }
=======
  logger.info(`   Chat: http://localhost:${PORT}/api/modules/chat/*`);
  logger.info(`   LLM: http://localhost:${PORT}/api/modules/llm/*`);
>>>>>>> linh2
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
