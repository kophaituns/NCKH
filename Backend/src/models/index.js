// src/models/index.js
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Import models
const User = require('./user.model')(sequelize, DataTypes);
const SurveyTemplate = require('./surveyTemplate.model')(sequelize, DataTypes);
const QuestionType = require('./questionType.model')(sequelize, DataTypes);
const Question = require('./question.model')(sequelize, DataTypes);
const QuestionOption = require('./questionOption.model')(sequelize, DataTypes);
const Survey = require('./survey.model')(sequelize, DataTypes);
const SurveyCollector = require('./surveyCollector.model')(sequelize, DataTypes);
const SurveyResponse = require('./surveyResponse.model')(sequelize, DataTypes);
const Answer = require('./answer.model')(sequelize, DataTypes);
const AnalysisResult = require('./analysisResult.model')(sequelize, DataTypes);
const Visualization = require('./visualization.model')(sequelize, DataTypes);
const LlmPrompt = require('./llmPrompt.model')(sequelize, DataTypes);
const LlmInteraction = require('./llmInteraction.model')(sequelize, DataTypes);

// Define associations
User.hasMany(SurveyTemplate, { foreignKey: 'created_by' });
SurveyTemplate.belongsTo(User, { foreignKey: 'created_by' });

SurveyTemplate.hasMany(Question, { foreignKey: 'template_id' });
Question.belongsTo(SurveyTemplate, { foreignKey: 'template_id' });

QuestionType.hasMany(Question, { foreignKey: 'question_type_id' });
Question.belongsTo(QuestionType, { foreignKey: 'question_type_id' });

Question.hasMany(QuestionOption, { foreignKey: 'question_id' });
QuestionOption.belongsTo(Question, { foreignKey: 'question_id' });

SurveyTemplate.hasMany(Survey, { foreignKey: 'template_id', as: 'surveys' });
Survey.belongsTo(SurveyTemplate, { foreignKey: 'template_id', as: 'template' });

User.hasMany(Survey, { foreignKey: 'created_by', as: 'surveys' });
Survey.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Survey.hasMany(SurveyResponse, { foreignKey: 'survey_id' });
SurveyResponse.belongsTo(Survey, { foreignKey: 'survey_id' });

User.hasMany(SurveyResponse, { foreignKey: 'respondent_id' });
SurveyResponse.belongsTo(User, { foreignKey: 'respondent_id' });

SurveyResponse.hasMany(Answer, { foreignKey: 'survey_response_id' });
Answer.belongsTo(SurveyResponse, { foreignKey: 'survey_response_id' });

Question.hasMany(Answer, { foreignKey: 'question_id' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

QuestionOption.hasMany(Answer, { foreignKey: 'option_id' });
Answer.belongsTo(QuestionOption, { foreignKey: 'option_id' });

Survey.hasMany(AnalysisResult, { foreignKey: 'survey_id' });
AnalysisResult.belongsTo(Survey, { foreignKey: 'survey_id' });

Survey.hasMany(Visualization, { foreignKey: 'survey_id' });
Visualization.belongsTo(Survey, { foreignKey: 'survey_id' });

User.hasMany(LlmPrompt, { foreignKey: 'created_by' });
LlmPrompt.belongsTo(User, { foreignKey: 'created_by' });

LlmPrompt.hasMany(LlmInteraction, { foreignKey: 'prompt_id' });
LlmInteraction.belongsTo(LlmPrompt, { foreignKey: 'prompt_id' });

User.hasMany(LlmInteraction, { foreignKey: 'user_id' });
LlmInteraction.belongsTo(User, { foreignKey: 'user_id' });

// SurveyCollector associations
Survey.hasMany(SurveyCollector, { foreignKey: 'survey_id' });
SurveyCollector.belongsTo(Survey, { foreignKey: 'survey_id' });

User.hasMany(SurveyCollector, { foreignKey: 'created_by' });
SurveyCollector.belongsTo(User, { foreignKey: 'created_by' });

module.exports = {
  sequelize,
  User,
  SurveyTemplate,
  QuestionType,
  Question,
  QuestionOption,
  Survey,
  SurveyCollector,
  SurveyResponse,
  Answer,
  AnalysisResult,
  Visualization,
  LlmPrompt,
  LlmInteraction
};
