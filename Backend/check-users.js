const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('llm_survey_db', 'root', 'rootpassword', {
  host: '127.0.0.1',
  port: 3307,
  dialect: 'mysql',
  logging: false
});

async function checkUsers() {
  try {
    await sequelize.authenticate();

    // Get users
    const users = await sequelize.query(
      `SELECT id, email, full_name FROM users LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log('📋 Users in database:');
    users.forEach(u => console.log(`  ID ${u.id}: ${u.email} (${u.full_name})`));

    // Also check which user has unread notifications
    const userNotifs = await sequelize.query(
      `SELECT DISTINCT user_id FROM notifications WHERE type = 'workspace_invitation' LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log('\n👤 Users with workspace_invitation notifications:');
    console.log(userNotifs.map(n => n.user_id));

    if (users.length > 0) {
      const testUserId = users[0].id;
      console.log(`\n✅ Using user ID: ${testUserId}`);
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
