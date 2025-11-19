// modules/analytics/service/analytics.service.js
const { Survey, SurveyResponse, Answer, Question, QuestionOption, User } = require('../../../src/models');
const { Op } = require('sequelize');
const sequelize = require('../../../src/config/database');

class AnalyticsService {
  /**
   * Get survey summary statistics
   */
  async getSurveySummary(surveyId, user) {
    // Verify survey exists and user has access
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    // Only survey creator or admin can view analytics
    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied. Only survey creator can view analytics.');
    }

    // Get total responses
    const totalResponses = await SurveyResponse.count({
      where: { survey_id: surveyId }
    });

    // Get response rate by date
    const responsesByDate = await SurveyResponse.findAll({
      where: { survey_id: surveyId },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Get unique respondents
    const uniqueRespondents = await SurveyResponse.count({
      where: { survey_id: surveyId },
      distinct: true,
      col: 'respondent_id'
    });

    return {
      survey_id: surveyId,
      survey_title: survey.title,
      total_responses: totalResponses,
      unique_respondents: uniqueRespondents,
      responses_by_date: responsesByDate,
      survey_status: survey.status,
      start_date: survey.start_date,
      end_date: survey.end_date
    };
  }

  /**
   * Get question-level analytics
   */
  async getQuestionAnalytics(surveyId, user) {
    // Verify access
    const survey = await Survey.findByPk(surveyId, {
      include: [
        {
          model: require('../../../src/models').SurveyTemplate,
          as: 'template',
          include: [
            {
              model: Question,
              include: [
                {
                  model: QuestionOption
                }
              ]
            }
          ]
        }
      ]
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied');
    }

    const questions = survey.template.Questions;
    const analytics = [];

    for (const question of questions) {
      // Get total answers for this question
      const totalAnswers = await Answer.count({
        include: [
          {
            model: SurveyResponse,
            where: { survey_id: surveyId }
          }
        ],
        where: { question_id: question.id }
      });

      // Get answer distribution for multiple choice questions
      let answerDistribution = [];
      if (question.QuestionOptions && question.QuestionOptions.length > 0) {
        answerDistribution = await Answer.findAll({
          attributes: [
            'option_id',
            [sequelize.fn('COUNT', sequelize.col('Answer.id')), 'count']
          ],
          include: [
            {
              model: SurveyResponse,
              attributes: [],
              where: { survey_id: surveyId }
            },
            {
              model: QuestionOption,
              attributes: ['option_text']
            }
          ],
          where: {
            question_id: question.id,
            option_id: { [Op.not]: null }
          },
          group: ['option_id', 'QuestionOption.id'],
          raw: true
        });
      }

      // Get text answers for open-ended questions
      let textAnswers = [];
      if (question.question_type_id === 1) { // Assuming type 1 is text
        textAnswers = await Answer.findAll({
          attributes: ['answer_text', 'created_at'],
          include: [
            {
              model: SurveyResponse,
              attributes: ['respondent_id'],
              where: { survey_id: surveyId }
            }
          ],
          where: {
            question_id: question.id,
            answer_text: { [Op.not]: null }
          },
          limit: 100 // Limit text responses to avoid huge payloads
        });
      }

      analytics.push({
        question_id: question.id,
        question_text: question.question_text,
        question_type_id: question.question_type_id,
        total_answers: totalAnswers,
        answer_distribution: answerDistribution,
        text_answers: textAnswers.map(a => ({
          text: a.answer_text,
          created_at: a.created_at
        }))
      });
    }

    return {
      survey_id: surveyId,
      survey_title: survey.title,
      questions: analytics
    };
  }

  /**
   * Get response details (all responses with answers)
   */
  async getResponseDetails(surveyId, user, options = {}) {
    // Verify access
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied');
    }

    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await SurveyResponse.findAndCountAll({
      where: { survey_id: surveyId },
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: Answer,
          include: [
            {
              model: Question,
              attributes: ['id', 'question_text', 'question_type_id']
            },
            {
              model: QuestionOption,
              attributes: ['id', 'option_text']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return {
      survey_id: surveyId,
      total_responses: count,
      responses: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get basic statistics (creator/general dashboard)
   */
  async getDashboardStats(user) {
    let where = {};
    if (user.role !== 'admin') {
      where.created_by = user.id;
    }

    const totalSurveys = await Survey.count({ where });
    const activeSurveys = await Survey.count({ where: { ...where, status: 'active' } });
    const draftSurveys = await Survey.count({ where: { ...where, status: 'draft' } });

    // Get total responses for user's surveys
    const surveyIds = await Survey.findAll({
      where,
      attributes: ['id'],
      raw: true
    });

    const totalResponses = await SurveyResponse.count({
      where: {
        survey_id: { [Op.in]: surveyIds.map(s => s.id) }
      }
    });

    return {
      total_surveys: totalSurveys,
      active_surveys: activeSurveys,
      draft_surveys: draftSurveys,
      total_responses: totalResponses
    };
  }

  /**
   * Get **admin** dashboard statistics
   * (Total Users, Total Surveys, Total Responses, Active Surveys, role stats, charts)
   */
  async getAdminDashboardStats(user) {
    // Chỉ cho admin xem dashboard này
    if (!user || user.role !== 'admin') {
      throw new Error('Access denied. Admin only.');
    }

    // Đếm tổng
    const [totalUsers, totalSurveys, totalResponses, activeSurveys] = await Promise.all([
      User.count(),
      Survey.count(),
      SurveyResponse.count(),
      Survey.count({ where: { status: 'active' } })
    ]);

    // Thống kê user theo role
    const roleRows = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const roleStats = { admin: 0, creator: 0, user: 0 };
    roleRows.forEach(r => {
      const role = r.role;
      const count = Number(r.count) || 0;
      if (roleStats[role] !== undefined) {
        roleStats[role] = count;
      }
    });

    // Responses per survey (top 10)
    const responsesRows = await SurveyResponse.findAll({
      attributes: [
        'survey_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'response_count']
      ],
      group: ['survey_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    const surveyIds = responsesRows.map(r => r.survey_id);
    const surveyTitles = await Survey.findAll({
      where: { id: { [Op.in]: surveyIds } },
      attributes: ['id', 'title'],
      raw: true
    });
    const surveyMap = {};
    surveyTitles.forEach(s => { surveyMap[s.id] = s.title; });

    const responsesPerSurvey = {
      labels: responsesRows.map(r => surveyMap[r.survey_id] || `Survey ${r.survey_id}`),
      data: responsesRows.map(r => Number(r.response_count) || 0)
    };

    // Activity: số responses theo ngày (tối đa 30 ngày)
    const activityRows = await SurveyResponse.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      limit: 30,
      raw: true
    });

    const surveyActivity = {
      labels: activityRows.map(r => r.date),
      data: activityRows.map(r => Number(r.count) || 0)
    };

    return {
      totals: {
        totalUsers,
        totalSurveys,
        totalResponses,
        activeSurveys
      },
      roleStats,
      responsesPerSurvey,
      surveyActivity
    };
  }
}

module.exports = new AnalyticsService();
