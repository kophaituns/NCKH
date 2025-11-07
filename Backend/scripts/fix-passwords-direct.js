// Direct MySQL connection to fix passwords
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixPasswords() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...\n');
    
    // Create direct MySQL connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'NCKH'
    });
    
    console.log('✅ Connected to database!\n');
    
    // Define users with their passwords
    const usersToFix = [
      { username: 'admin', password: 'test123' },
      { username: 'creator1', password: 'test123' },
      { username: 'user1', password: 'test123' },
      { username: 'user2', password: 'test123' },
      { username: 'user3', password: 'test123' },
      { username: 'user4', password: 'test123' },
      { username: 'user5', password: 'test123' }
    ];

    console.log(`📋 Fixing passwords for ${usersToFix.length} users...\n`);

    for (const userData of usersToFix) {
      // Check if user exists
      const [users] = await connection.execute(
        'SELECT id, username, role FROM users WHERE username = ?',
        [userData.username]
      );

      if (users.length === 0) {
        console.log(`⚠️  User not found: ${userData.username}`);
        continue;
      }

      const user = users[0];

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Update user password
      await connection.execute(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, userData.username]
      );

      console.log(`✅ Fixed password for: ${userData.username} (${user.role})`);
    }

    console.log('\n✨ Password fix completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('   Username: admin');
    console.log('   Password: test123');
    console.log('\n   Username: creator1');
    console.log('   Password: test123');

  } catch (error) {
    console.error('❌ Error fixing passwords:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the fix
fixPasswords();
