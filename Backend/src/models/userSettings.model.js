// src/models/userSettings.model.js
module.exports = (sequelize, DataTypes) => {
  const UserSettings = sequelize.define(
    'UserSettings',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      // Notification Settings
      email_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Toggle to enable or disable email notifications when new surveys are posted',
      },
      email_reminders: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Toggle to enable or disable email reminders for uncompleted surveys',
      },
      // Privacy Settings
      save_survey_history: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Toggle to enable or disable saving user survey history',
      },
      anonymous_responses: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Toggle to enable or disable anonymous survey responses',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['user_id'],
        },
      ],
    }
  );

  UserSettings.associate = function (models) {
    UserSettings.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return UserSettings;
};