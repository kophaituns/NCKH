const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize('llm_survey_db', 'root', 'rootpassword', {
  host: '127.0.0.1',
  port: 3307,
  dialect: 'mysql',
  logging: false
});

// Define model same as backend
const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'workspace_invitation',
        'workspace_member_added',
        'survey_response',
        'survey_shared',
        'collector_created',
        'response_completed'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    related_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    related_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    tableName: 'notifications',
    timestamps: true,
    underscored: true
  }
);

async function checkSequelize() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get unread notifications for user 6 (same as API would)
    const notifications = await Notification.findAll({
      where: {
        user_id: 6,
        is_read: false
      },
      order: [['created_at', 'DESC']],
      limit: 20
    });

    console.log('\n📋 Sequelize query result (user 6):');
    console.log(JSON.stringify(notifications, null, 2));

    if (notifications.length > 0) {
      console.log('\n🔍 First notification raw:');
      const first = notifications[0];
      console.log('  Type:', typeof first);
      console.log('  Keys:', Object.keys(first.dataValues));
      console.log('  data field:', first.dataValues.data);
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSequelize();
