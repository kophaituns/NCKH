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
const SurveyInvite = require('./surveyInvite.model')(sequelize, DataTypes);
const Answer = require('./answer.model')(sequelize, DataTypes);
const AnalysisResult = require('./analysisResult.model')(sequelize, DataTypes);
const Notification = require('./notification.model')(sequelize, DataTypes);
const Workspace = require('./workspace.model')(sequelize, DataTypes);
const WorkspaceMember = require('./workspaceMember.model')(sequelize, DataTypes);
const WorkspaceUser = require('./workspaceUser.model')(sequelize, DataTypes);
const WorkspaceInvitation = require('./workspaceInvitation.model')(sequelize, DataTypes);
const SystemSetting = require('./systemSetting.model')(sequelize, DataTypes);
const GeneratedQuestion = require('./generatedQuestion.model')(sequelize, DataTypes);
const SurveyFeedback = require('./surveyFeedback.model')(sequelize, DataTypes);
const KnowledgeSource = require('./knowledgeSource.model')(sequelize, DataTypes);

// Define associations
User.hasMany(SurveyTemplate, { foreignKey: 'created_by' });
SurveyTemplate.belongsTo(User, { foreignKey: 'created_by' });

// ... (existing associations) ...

SurveyTemplate.hasMany(Question, { foreignKey: 'template_id', as: 'Questions' });
Question.belongsTo(SurveyTemplate, { foreignKey: 'template_id', as: 'template' });

QuestionType.hasMany(Question, { foreignKey: 'question_type_id' });
Question.belongsTo(QuestionType, { foreignKey: 'question_type_id', as: 'QuestionType' });

Question.hasMany(QuestionOption, { foreignKey: 'question_id', as: 'QuestionOptions' });
QuestionOption.belongsTo(Question, { foreignKey: 'question_id' });

SurveyTemplate.hasMany(Survey, { foreignKey: 'template_id', as: 'surveys' });
Survey.belongsTo(SurveyTemplate, { foreignKey: 'template_id', as: 'template' });

// Survey can have Questions directly (not just through template)
Survey.hasMany(Question, { foreignKey: 'template_id', sourceKey: 'template_id', as: 'Questions' });

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

// Feedback associations
Survey.hasMany(SurveyFeedback, { foreignKey: 'survey_id', as: 'feedbacks' });
SurveyFeedback.belongsTo(Survey, { foreignKey: 'survey_id' });

SurveyResponse.hasOne(SurveyFeedback, { foreignKey: 'response_id', as: 'feedback' });
SurveyFeedback.belongsTo(SurveyResponse, { foreignKey: 'response_id' });

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

// WorkspaceUser associations (new access control model)
Workspace.hasMany(WorkspaceUser, { foreignKey: 'workspace_id', as: 'workspaceUsers' });
WorkspaceUser.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

User.hasMany(WorkspaceUser, { foreignKey: 'user_id', as: 'workspaceUsers' });
WorkspaceUser.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Workspace.hasMany(Survey, { foreignKey: 'workspace_id', as: 'surveys' });
Survey.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

// KnowledgeSource associations
Workspace.hasMany(KnowledgeSource, { foreignKey: 'workspace_id', as: 'knowledgeSources' });
KnowledgeSource.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

// Survey Access associations (simplified)
Survey.hasMany(SurveyInvite, { foreignKey: 'survey_id', as: 'invites' });
SurveyInvite.belongsTo(Survey, { foreignKey: 'survey_id', as: 'survey' });

User.hasMany(SurveyInvite, { foreignKey: 'created_by', as: 'sentInvites' });
SurveyInvite.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

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
  SurveyInvite,
  Answer,
  AnalysisResult,
  Notification,
  Workspace,
  WorkspaceMember,
  WorkspaceUser,
  WorkspaceInvitation,
  SystemSetting,
  GeneratedQuestion,
  SurveyFeedback,
  KnowledgeSource
};
