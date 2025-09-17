// src/config/database.js
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Cấu hình kết nối MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Cấu hình bổ sung cho MySQL
    dialectOptions: {
      connectTimeout: 60000, // thời gian kết nối tối đa (ms)
    }
  }
);

// Test kết nối
sequelize
  .authenticate()
  .then(() => {
    logger.info('Kết nối MySQL thành công');
  })
  .catch((err) => {
    logger.error('Lỗi kết nối MySQL:', err);
  });

module.exports = sequelize;

module.exports = sequelize;
