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
const ResponseAnswer = require('./responseAnswer.model')(sequelize, DataTypes);
const AnalysisResult = require('./analysisResult.model')(sequelize, DataTypes);
const Visualization = require('./visualization.model')(sequelize, DataTypes);
<<<<<<< HEAD
const Notification = require('./notification.model')(sequelize, DataTypes);
const Workspace = require('./workspace.model')(sequelize, DataTypes);
const WorkspaceMember = require('./workspaceMember.model')(sequelize, DataTypes);
const WorkspaceInvitation = require('./workspaceInvitation.model')(sequelize, DataTypes);
const WorkspaceActivity = require('./workspaceActivity.model')(sequelize, DataTypes);
const ChatConversation = require('./chatConversation.model')(sequelize, DataTypes);
const ChatMessage = require('./chatMessage.model')(sequelize, DataTypes);
=======
const LlmPrompt = require('./llmPrompt.model')(sequelize, DataTypes);
const LlmInteraction = require('./llmInteraction.model')(sequelize, DataTypes);
const ChatConversation = require('./chatConversation.model')(sequelize, DataTypes);
const ChatMessage = require('./chatMessage.model')(sequelize, DataTypes);
const SurveyLink = require('./surveyLink.model')(sequelize, DataTypes);
const GeneratedQuestion = require('./generatedQuestion.model')(sequelize, DataTypes);
>>>>>>> linh2

// Define associations
User.hasMany(SurveyTemplate, { foreignKey: 'created_by' });
SurveyTemplate.belongsTo(User, { foreignKey: 'created_by' });

SurveyTemplate.hasMany(Question, { foreignKey: 'template_id', as: 'Questions' });
Question.belongsTo(SurveyTemplate, { foreignKey: 'template_id' });

QuestionType.hasMany(Question, { foreignKey: 'question_type_id' });
Question.belongsTo(QuestionType, { foreignKey: 'question_type_id', as: 'QuestionType' });

<<<<<<< HEAD
Question.hasMany(QuestionOption, { foreignKey: 'question_id', as: 'QuestionOptions' });
=======
Question.hasMany(QuestionOption, { foreignKey: 'question_id', as: 'options' });
>>>>>>> linh2
QuestionOption.belongsTo(Question, { foreignKey: 'question_id' });

SurveyTemplate.hasMany(Survey, { foreignKey: 'template_id', as: 'surveys' });
Survey.belongsTo(SurveyTemplate, { foreignKey: 'template_id', as: 'template' });

User.hasMany(Survey, { foreignKey: 'created_by', as: 'surveys' });
Survey.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
<<<<<<< HEAD
=======

// Survey-Question associations
Survey.hasMany(Question, { foreignKey: 'survey_id', as: 'questions' });
Question.belongsTo(Survey, { foreignKey: 'survey_id', as: 'survey' });
>>>>>>> linh2

Survey.hasMany(SurveyResponse, { foreignKey: 'survey_id' });
SurveyResponse.belongsTo(Survey, { foreignKey: 'survey_id' });

User.hasMany(SurveyResponse, { foreignKey: 'respondent_id' });
SurveyResponse.belongsTo(User, { foreignKey: 'respondent_id' });

SurveyResponse.hasMany(Answer, { foreignKey: 'survey_response_id' });
Answer.belongsTo(SurveyResponse, { foreignKey: 'survey_response_id' });

// ResponseAnswer associations
SurveyResponse.hasMany(ResponseAnswer, { foreignKey: 'response_id', as: 'responseAnswers' });
ResponseAnswer.belongsTo(SurveyResponse, { foreignKey: 'response_id', as: 'response' });

Question.hasMany(ResponseAnswer, { foreignKey: 'question_id' });
ResponseAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

QuestionOption.hasMany(ResponseAnswer, { foreignKey: 'selected_option_id' });
ResponseAnswer.belongsTo(QuestionOption, { foreignKey: 'selected_option_id', as: 'selectedOption' });

Question.hasMany(Answer, { foreignKey: 'question_id' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

QuestionOption.hasMany(Answer, { foreignKey: 'option_id' });
Answer.belongsTo(QuestionOption, { foreignKey: 'option_id' });

Survey.hasMany(AnalysisResult, { foreignKey: 'survey_id' });
AnalysisResult.belongsTo(Survey, { foreignKey: 'survey_id' });

Survey.hasMany(Visualization, { foreignKey: 'survey_id' });
Visualization.belongsTo(Survey, { foreignKey: 'survey_id' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// SurveyCollector associations
Survey.hasMany(SurveyCollector, { foreignKey: 'survey_id', as: 'Collectors' });
SurveyCollector.belongsTo(Survey, { foreignKey: 'survey_id', as: 'Survey' });

User.hasMany(SurveyCollector, { foreignKey: 'created_by' });
SurveyCollector.belongsTo(User, { foreignKey: 'created_by' });

SurveyCollector.hasMany(SurveyResponse, { foreignKey: 'collector_id' });
SurveyResponse.belongsTo(SurveyCollector, { foreignKey: 'collector_id' });

// Workspace associations
User.hasMany(Workspace, { foreignKey: 'owner_id', as: 'ownedWorkspaces' });
Workspace.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

Workspace.hasMany(WorkspaceMember, { foreignKey: 'workspace_id', as: 'members' });
WorkspaceMember.belongsTo(Workspace, { foreignKey: 'workspace_id' });

User.hasMany(WorkspaceMember, { foreignKey: 'user_id' });
WorkspaceMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Workspace.hasMany(WorkspaceInvitation, { foreignKey: 'workspace_id', as: 'invitations' });
WorkspaceInvitation.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

User.hasMany(WorkspaceInvitation, { foreignKey: 'inviter_id', as: 'sentInvitations' });
WorkspaceInvitation.belongsTo(User, { foreignKey: 'inviter_id', as: 'inviter' });

Workspace.hasMany(WorkspaceActivity, { foreignKey: 'workspace_id', as: 'activities' });
WorkspaceActivity.belongsTo(Workspace, { foreignKey: 'workspace_id' });

User.hasMany(WorkspaceActivity, { foreignKey: 'user_id' });
WorkspaceActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Workspace.hasMany(Survey, { foreignKey: 'workspace_id', as: 'surveys' });
Survey.belongsTo(Workspace, { foreignKey: 'workspace_id' });

// Chat associations
User.hasMany(ChatConversation, { foreignKey: 'user_id', as: 'chatConversations' });
ChatConversation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversation_id', as: 'messages' });
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversation_id', as: 'conversation' });

// SurveyCollector associations
Survey.hasMany(SurveyCollector, { foreignKey: 'survey_id', as: 'Collectors' });
SurveyCollector.belongsTo(Survey, { foreignKey: 'survey_id', as: 'Survey' });

User.hasMany(SurveyCollector, { foreignKey: 'created_by' });
SurveyCollector.belongsTo(User, { foreignKey: 'created_by' });

// Removed collector_id associations since that column doesn't exist
// SurveyCollector.hasMany(SurveyResponse, { foreignKey: 'collector_id' });
// SurveyResponse.belongsTo(SurveyCollector, { foreignKey: 'collector_id' });

// Chat associations
User.hasMany(ChatConversation, { foreignKey: 'user_id' });
ChatConversation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversation_id', as: 'messages' });
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversation_id', as: 'conversation' });

// SurveyLink associations
Survey.hasMany(SurveyLink, { foreignKey: 'survey_id', as: 'links' });
SurveyLink.belongsTo(Survey, { foreignKey: 'survey_id', as: 'survey' });

User.hasMany(SurveyLink, { foreignKey: 'created_by' });
SurveyLink.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// GeneratedQuestion associations
User.hasMany(GeneratedQuestion, { foreignKey: 'generated_by' });
GeneratedQuestion.belongsTo(User, { foreignKey: 'generated_by', as: 'generator' });

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
  ResponseAnswer,
  AnalysisResult,
  Visualization,
<<<<<<< HEAD
  Notification,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceActivity,
  ChatConversation,
  ChatMessage
=======
  LlmPrompt,
  LlmInteraction,
  ChatConversation,
  ChatMessage,
  SurveyLink,
  GeneratedQuestion
>>>>>>> linh2
};
