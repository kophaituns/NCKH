// generate-password-hashes.js - Generate bcrypt hashes for passwords
const bcrypt = require('bcrypt');

async function generateHashes() {
  const password = 'test123';
  const users = ['admin', 'creator1', 'user1', 'user2', 'user3', 'user4', 'user5'];
  
  console.log('-- Generated SQL to fix user passwords');
  console.log('-- Password for all users: test123\n');
  
  for (const username of users) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`UPDATE users SET password = '${hash}' WHERE username = '${username}';`);
  }
  
  console.log('\n-- Run these UPDATE statements in your MySQL client');
}

generateHashes();
