const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'llm_survey_db'
  });
  
  console.log('🔐 Hashing password: test123');
  const hashedPassword = await bcrypt.hash('test123', 10);
  console.log('✅ Hash generated:', hashedPassword.substring(0, 30) + '...');
  
  console.log('\n📝 Updating ALL users...');
  const [result] = await connection.execute(
    'UPDATE users SET password = ?',
    [hashedPassword]
  );
  
  console.log(`✅ Updated ${result.affectedRows} users`);
  
  // Verify
  console.log('\n🔍 Verifying updates...');
  const [users] = await connection.execute(
    'SELECT id, email FROM users LIMIT 5'
  );
  
  for (const user of users) {
    const [rows] = await connection.execute(
      'SELECT password FROM users WHERE id = ?',
      [user.id]
    );
    const isValid = await bcrypt.compare('test123', rows[0].password);
    console.log(`   ${user.email}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  }
  
  await connection.end();
  console.log('\n✅ All done!');
}

fixAllPasswords().catch(console.error);
