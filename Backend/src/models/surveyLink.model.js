// src/models/surveyLink.model.js
module.exports = (sequelize, DataTypes) => {
  const SurveyLink = sequelize.define(
    'SurveyLink',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      survey_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'id'
        }
      },
      token: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      access_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      max_responses: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: 'survey_links',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  SurveyLink.associate = function(models) {
    SurveyLink.belongsTo(models.Survey, {
      foreignKey: 'survey_id',
      as: 'survey'
    });
    
    SurveyLink.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  return SurveyLink;
};