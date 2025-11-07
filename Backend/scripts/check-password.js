const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function checkPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Tuanpham@781',
    database: 'NCKH'
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
