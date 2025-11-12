const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'llm_survey_db'
  });
  
  const [users] = await connection.execute(
    'SELECT id, email, role FROM users LIMIT 10'
  );
  
  console.log('\n📋 Users in database:');
  console.table(users);
  
  await connection.end();
}

checkUsers().catch(console.error);
