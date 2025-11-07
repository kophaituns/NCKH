const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function fixAllPasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Tuanpham@781',
    database: 'NCKH'
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
