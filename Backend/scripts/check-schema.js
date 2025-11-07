const mysql = require('mysql2/promise');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Tuanpham@781',
    database: 'NCKH'
  });
  
  const [columns] = await connection.execute(
    'DESCRIBE questions'
  );
  
  console.log('\n📋 Questions table schema:');
  console.table(columns);
  
  await connection.end();
}

checkSchema().catch(console.error);
