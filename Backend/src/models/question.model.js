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
        allowNull: false,
        field: 'template_id',
      },
      survey_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Assuming it can be null based on previous errors not mentioning it, but safer to include
      },
      label: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      question_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'type_id',
      },
      required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'display_order',
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
