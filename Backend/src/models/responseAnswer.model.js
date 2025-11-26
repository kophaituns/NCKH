// src/models/responseAnswer.model.js
module.exports = (sequelize, DataTypes) => {
  const ResponseAnswer = sequelize.define(
    'ResponseAnswer',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      response_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'response_id',
      },
      question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'question_id',
      },
      answer_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      selected_option_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'response_answers',
      timestamps: true,
      underscored: true,
    }
  );

  ResponseAnswer.associate = function(models) {
    ResponseAnswer.belongsTo(models.SurveyResponse, {
      foreignKey: 'response_id',
      as: 'response'
    });
    
    ResponseAnswer.belongsTo(models.Question, {
      foreignKey: 'question_id',
      as: 'question'
    });

    ResponseAnswer.belongsTo(models.QuestionOption, {
      foreignKey: 'selected_option_id',
      as: 'selectedOption'
    });
  };

  return ResponseAnswer;
};