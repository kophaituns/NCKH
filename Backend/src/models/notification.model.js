// src/models/notification.model.js
module.exports = (sequelize, DataTypes) => {
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
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
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
        allowNull: true,
        comment: 'workspace, survey, response, etc.'
      },
      related_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the related object'
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
        allowNull: true,
        comment: 'Additional data for notification actions (e.g., token for invitations)'
      }
    },
    {
      tableName: 'notifications',
      timestamps: true,
      underscored: true
    }
  );

  return Notification;
};
