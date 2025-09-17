// src/models/llmPrompt.model.js
module.exports = (sequelize, DataTypes) => {
  const LlmPrompt = sequelize.define(
    'LlmPrompt',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      prompt_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      prompt_type: {
        type: DataTypes.ENUM('survey_generation', 'analysis', 'summary', 'recommendation'),
        allowNull: false,
      },
      prompt_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      tableName: 'llm_prompts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return LlmPrompt;
};
