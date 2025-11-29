// src/modules/analytics/service/analytics.service.js
const { Survey, SurveyResponse, Answer, Question, QuestionOption, User } = require('../../../models');
const { Op } = require('sequelize');
const sequelize = require('../../../config/database');

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
        [sequelize.fn('DATE', sequelize.col('submitted_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('submitted_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('submitted_at')), 'ASC']],
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
          submitted_at: a.created_at
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
      order: [['submitted_at', 'DESC']]
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
   * Get basic statistics (placeholder for dashboard)
   */
    /**
   * Get statistics cho Admin / Creator Dashboard
   */
  async getDashboardStats(user) {
    const isAdmin = user.role === 'admin';

    // Điều kiện lọc survey:
    //  - Admin: toàn hệ thống
    //  - Khác admin: chỉ survey do user đó tạo
    const surveyWhere = {};
    if (!isAdmin) {
      surveyWhere.created_by = user.id;
    }

    // Lấy danh sách survey (id, title, status, created_at)
    const surveys = await Survey.findAll({
      where: surveyWhere,
      attributes: ['id', 'title', 'status', 'created_at'],
      raw: true,
    });

    const surveyIds = surveys.map((s) => s.id);

    const totalSurveys = surveys.length;
    const activeSurveys = surveys.filter((s) => s.status === 'active').length;
    const draftSurveys = surveys.filter((s) => s.status === 'draft').length;

    // ================== Tổng số responses & Responses per Survey ==================
    let totalResponses = 0;
    let responsesPerSurveyLabels = [];
    let responsesPerSurveyData = [];

    if (surveyIds.length > 0) {
      // Tổng responses
      totalResponses = await SurveyResponse.count({
        where: {
          survey_id: { [Op.in]: surveyIds },
        },
      });

      // Top 10 survey theo số lượng response
      const topResponses = await SurveyResponse.findAll({
        attributes: [
          'survey_id',
          [sequelize.fn('COUNT', sequelize.col('SurveyResponse.id')), 'responseCount'],
        ],
        where: {
          survey_id: { [Op.in]: surveyIds },
        },
        include: [
          {
            model: Survey,
            attributes: ['title'],
          },
        ],
        group: ['survey_id', 'Survey.id'],
        order: [[sequelize.literal('responseCount'), 'DESC']],
        limit: 10,
      });

      responsesPerSurveyLabels = topResponses.map((row) =>
        row.Survey?.title || `Survey #${row.survey_id}`,
      );
      responsesPerSurveyData = topResponses.map((row) =>
        Number(row.get('responseCount')),
      );
    }

    // ================== Survey Activity Trend (30 ngày gần nhất) ==================
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 29); // 30 ngày

    const activityRows = await Survey.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        ...surveyWhere,
        created_at: {
          [Op.gte]: fromDate,
        },
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    const activityLabels = activityRows.map((row) => row.date);
    const activityData = activityRows.map((row) => Number(row.count));

    // ================== User & Role Stats (chỉ admin) ==================
    let totalUsers = 0;
    let roleStats = { admin: 0, creator: 0, user: 0 };

    if (isAdmin) {
      const roleRows = await User.findAll({
        attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['role'],
        raw: true,
      });

      roleRows.forEach((row) => {
        const role = row.role;
        const count = Number(row.count);
        totalUsers += count;
        if (roleStats[role] !== undefined) {
          roleStats[role] = count;
        }
      });
    }

    // ================== Trả về đúng format FE ==================
    return {
      totals: {
        totalUsers,
        totalSurveys,
        totalResponses,
        activeSurveys,
        draftSurveys,
      },
      roleStats,
      responsesPerSurvey: {
        labels: responsesPerSurveyLabels,
        data: responsesPerSurveyData,
      },
      surveyActivity: {
        labels: activityLabels,
        data: activityData,
      },
    };
  }

}

module.exports = new AnalyticsService();
