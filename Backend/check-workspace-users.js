// check-users.js
require('dotenv').config();
const sequelize = require('./src/config/database');
const { User } = require('./src/models');

async function checkUsers() {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role'],
      limit: 10
    });
    
    console.log('Users in database:');
    users.forEach(u => {
      console.log(`  - ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUsers();
