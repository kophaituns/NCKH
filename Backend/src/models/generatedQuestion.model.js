// src/models/generatedQuestion.model.js
module.exports = (sequelize, DataTypes) => {
  const GeneratedQuestion = sequelize.define(
    'GeneratedQuestion',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      question_type: {
        type: DataTypes.ENUM('text', 'multiple_choice', 'yes_no', 'rating', 'checkbox', 'dropdown', 'likert_scale'),
        allowNull: false,
        defaultValue: 'text'
      },
      options: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Question options for choice-based questions'
      },
      keyword: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Keyword used for generation'
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Category used for generation'
      },
      source_model: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'trained_model',
        comment: 'AI model used for generation'
      },
      generated_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this question has been used in a survey'
      },
      use_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of times this question has been used'
      },
      quality_score: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Quality score if available'
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
      tableName: 'generated_questions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['keyword'] },
        { fields: ['category'] },
        { fields: ['generated_by'] },
        { fields: ['question_type'] },
        { fields: ['created_at'] }
      ]
    }
  );

  return GeneratedQuestion;
};