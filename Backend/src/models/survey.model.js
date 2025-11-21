// src/models/survey.model.js
module.exports = (sequelize, DataTypes) => {
  const Survey = sequelize.define(
    'Survey',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      template_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      target_audience: {
        type: DataTypes.ENUM('all_users', 'specific_group', 'custom'),
        defaultValue: 'all_users',
      },
      target_value: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('draft', 'active', 'closed', 'analyzed'),
        defaultValue: 'draft',
      },
      share_settings: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('share_settings');
          return value ? JSON.parse(value) : null;
        },
        set(value) {
          this.setDataValue('share_settings', JSON.stringify(value));
        }
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
      tableName: 'surveys',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Survey;
};
