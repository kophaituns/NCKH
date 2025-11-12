const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'llm_survey_db'
  });
  
  const [users] = await connection.execute(
    'SELECT id, email, password FROM users WHERE email = ?',
    ['teacher@example.com']
  );
  
  if (users.length === 0) {
    console.log('❌ User not found');
    return;
  }
  
  const user = users[0];
  console.log('\n📋 User info:');
  console.log('Email:', user.email);
  console.log('Password hash:', user.password.substring(0, 30) + '...');
  
  // Test password
  const testPassword = 'test123';
  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log(`\n🔐 Testing password "${testPassword}":`, isValid ? '✅ VALID' : '❌ INVALID');
  
  await connection.end();
}

checkPassword().catch(console.error);
