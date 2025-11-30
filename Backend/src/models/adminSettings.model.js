// src/models/adminSettings.model.js
module.exports = (sequelize, DataTypes) => {
  const AdminSettings = sequelize.define(
    'AdminSettings',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      // General Settings
      system_name: {
        type: DataTypes.STRING(100),
        defaultValue: 'Survey System',
        comment: 'Field to configure the system display name',
      },
      system_logo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Field to update the system logo using a URL',
      },
      smtp_server: {
        type: DataTypes.JSON,
        defaultValue: null,
        comment: 'Field to configure SMTP server to send system emails',
      },
      session_timeout: {
        type: DataTypes.INTEGER,
        defaultValue: 3600, // 1 hour in seconds
        comment: 'Field to set session timeout for inactive users (in seconds)',
      },
      // Survey Limits
      max_surveys_per_creator: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: 'Field to determine the maximum number of surveys each creator can create',
      },
      max_ai_questions_per_request: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        comment: 'Field to limit the maximum number of AI-generated questions per request',
      },
      max_responses_per_survey: {
        type: DataTypes.INTEGER,
        defaultValue: 10000,
        comment: 'Field to set the maximum number of responses allowed per survey',
      },
      // Security Settings
      two_factor_auth_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Toggle to enable or disable two-factor authentication for admin accounts',
      },
      anonymous_mode_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Toggle to enable or disable anonymous mode for survey takers',
      },
      auto_lock_failed_logins: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Toggle to automatically lock user accounts after multiple failed login attempts',
      },
      max_failed_login_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        comment: 'Maximum number of failed login attempts before account lock',
      },
      account_lock_duration: {
        type: DataTypes.INTEGER,
        defaultValue: 1800, // 30 minutes in seconds
        comment: 'Duration to lock account after failed login attempts (in seconds)',
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
      tableName: 'admin_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  // Admin settings is a singleton table, so we ensure only one row exists
  AdminSettings.getSingleton = async function () {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    return settings;
  };

  return AdminSettings;
};