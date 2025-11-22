const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('llm_survey_db', 'root', 'rootpassword', {
  host: '127.0.0.1',
  port: 3307,
  dialect: 'mysql',
  logging: false
});

async function checkNotifications() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Query notifications with data field
    const notifications = await sequelize.query(
      `SELECT id, user_id, type, title, message, related_type, related_id, data, created_at 
       FROM notifications 
       WHERE type = 'workspace_invitation' 
       ORDER BY created_at DESC 
       LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log('\n📋 Recent workspace_invitation notifications:');
    console.log(JSON.stringify(notifications, null, 2));

    // Check data field specifically
    console.log('\n🔍 Data field analysis:');
    notifications.forEach((notif, idx) => {
      console.log(`[${idx}] ID: ${notif.id}`);
      console.log(`    Data field: ${notif.data ? JSON.stringify(notif.data) : 'NULL'}`);
      console.log(`    Has token: ${notif.data?.token ? 'YES ✅' : 'NO ❌'}`);
    });

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkNotifications();
