// src/models/question.model.js
module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define(
    'Question',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      template_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'template_id',
      },
      survey_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'survey_id',
      },
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      question_type: {
        type: DataTypes.ENUM('text', 'multiple_choice', 'yes_no', 'rating', 'date', 'email'),
        allowNull: false,
        defaultValue: 'text'
      },
      question_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_required',
      },
      required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      question_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'question_order',
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'display_order',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'questions',
      timestamps: false,
      underscored: true,
    }
  );

  return Question;
};
