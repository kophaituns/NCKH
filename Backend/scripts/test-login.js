const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'llm_survey_db'
  });

  console.log(`Connecting to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT}...`);

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
