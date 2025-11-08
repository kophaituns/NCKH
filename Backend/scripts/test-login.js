const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'rootpassword',
    database: 'llm_survey_db'
  });

  const [rows] = await connection.execute(
    'SELECT email, password FROM users WHERE email = ?',
    ['creator@example.com']
  );

  if (rows.length === 0) {
    console.log('❌ User not found');
    return;
  }

  const user = rows[0];
  console.log('Email:', user.email);
  console.log('Password hash:', user.password);
  console.log('Hash length:', user.password.length);

  const password = 'test123';
  const isValid = await bcrypt.compare(password, user.password);

  console.log('\nTesting password:', password);
  console.log('Is valid?', isValid ? '✅ YES' : '❌ NO');

  await connection.end();
}

test().catch(console.error);
