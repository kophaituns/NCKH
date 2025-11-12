const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'llm_survey_db'
  });
  
  console.log(`Connected to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  
  const [columns] = await connection.execute(
    'DESCRIBE questions'
  );
  
  console.log('\n📋 Questions table schema:');
  console.table(columns);
  
  await connection.end();
}

checkSchema().catch(console.error);
