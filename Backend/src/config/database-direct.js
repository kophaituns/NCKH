// src/config/database-direct.js
const sql = require('mssql');
const logger = require('../utils/logger');

// Chuỗi kết nối dành riêng cho LocalDB
const connectionString = process.env.DB_CONNECTION_STRING || 
  `server=(localdb)\\MSSQLLocalDB;database=${process.env.DB_NAME || 'NCKH'};user id=${process.env.DB_USER || 'NCKH2025'};password=${process.env.DB_PASSWORD || 'NCKH2025'};trustServerCertificate=true;`;

logger.info('Sử dụng chuỗi kết nối: ' + connectionString.replace(/password=[^;]+/, 'password=***'));

// Tạo pool kết nối
const pool = new sql.ConnectionPool(connectionString);
const poolConnect = pool.connect();

// Xử lý lỗi kết nối
poolConnect.catch(err => {
  logger.error('Lỗi kết nối SQL Server:', err);
});

// Hàm để thực hiện truy vấn SQL
async function executeQuery(query, params = []) {
  try {
    await poolConnect; // Đảm bảo pool đã được kết nối
    const request = pool.request();
    
    // Thêm tham số nếu có
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    const result = await request.query(query);
    return result;
  } catch (err) {
    logger.error('Lỗi thực thi truy vấn SQL:', err);
    throw err;
  }
}

// Hàm kiểm tra kết nối
async function testConnection() {
  try {
    await poolConnect;
    logger.info('Kết nối SQL Server thành công');
    return true;
  } catch (err) {
    logger.error('Không thể kết nối đến SQL Server:', err);
    return false;
  }
}

module.exports = {
  pool,
  executeQuery,
  testConnection
};

// Hàm kiểm tra kết nối
async function testConnection() {
  try {
    await poolConnect;
    logger.info('Kết nối SQL Server thành công');
    return true;
  } catch (err) {
    logger.error('Không thể kết nối đến SQL Server:', err);
    return false;
  }
}

module.exports = {
  pool,
  executeQuery,
  testConnection
};
