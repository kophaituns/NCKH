const mysql = require('mysql2/promise');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Tuanpham@781',
    database: 'NCKH'
  });
  
  const [users] = await connection.execute(
    'SELECT id, email, role FROM users LIMIT 10'
  );
  
  console.log('\n📋 Users in database:');
  console.table(users);
  
  await connection.end();
}

checkUsers().catch(console.error);
