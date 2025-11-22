const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');

const sequelize = new Sequelize('llm_survey_db', 'root', 'rootpassword', {
  host: '127.0.0.1',
  port: 3307,
  dialect: 'mysql',
  logging: false
});

// Define models
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  full_name: { type: DataTypes.STRING }
}, { tableName: 'users', timestamps: true, underscored: true });

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.INTEGER,
  type: DataTypes.ENUM('workspace_invitation', 'workspace_member_added', 'survey_response', 'survey_shared', 'collector_created', 'response_completed'),
  title: DataTypes.STRING,
  message: DataTypes.TEXT,
  related_type: DataTypes.STRING,
  related_id: DataTypes.INTEGER,
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: DataTypes.DATE,
  data: DataTypes.JSON
}, { tableName: 'notifications', timestamps: true, underscored: true });

async function testFullFlow() {
  try {
    await sequelize.authenticate();

    // Get user 6
    const user = await User.findOne({ where: { id: 6 } });
    if (!user) {
      console.log('❌ User 6 not found');
      return;
    }
    console.log('✅ User found:', user.email);

    // Get unread notifications for user
    const notifications = await Notification.findAll({
      where: { user_id: 6, is_read: false },
      order: [['created_at', 'DESC']],
      limit: 20
    });

    console.log(`\n✅ Found ${notifications.length} unread notifications`);

    // Simulate API response JSON
    const apiResponse = {
      ok: true,
      notifications: notifications.map(n => ({
        id: n.id,
        user_id: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        related_type: n.related_type,
        related_id: n.related_id,
        is_read: n.is_read,
        read_at: n.read_at,
        data: n.data,
        created_at: n.createdAt,
        updated_at: n.updatedAt
      }))
    };

    console.log('\n📋 What API will return (to frontend):');
    console.log(JSON.stringify(apiResponse, null, 2));

    // Check frontend rendering condition
    console.log('\n🔍 Frontend rendering check:');
    apiResponse.notifications.forEach((notif, idx) => {
      const hasType = notif.type === 'workspace_invitation';
      const hasToken = notif.data?.token;
      const willRender = hasType && hasToken;
      console.log(`[${idx}] Type check: ${hasType ? '✅' : '❌'}, Token check: ${hasToken ? '✅' : '❌'} => Button render: ${willRender ? '✅ YES' : '❌ NO'}`);
      if (notif.data) {
        console.log(`     Token value: ${notif.data.token}`);
      }
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFullFlow();
