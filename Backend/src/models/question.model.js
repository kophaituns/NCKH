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
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      question_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
