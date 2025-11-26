// modules/surveys/service/survey.service.js
const { Survey, User, SurveyTemplate, SurveyResponse } = require('../../../src/models');
const { Op } = require('sequelize');

class SurveyService {
  /**
   * Get all surveys with filters and pagination
   */
  async getAllSurveys(options = {}, user) {
    const {
      page = 1,
      limit = 10,
      status,
      target_audience,
      search
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // Role-based filtering
    if (user.role !== 'admin') {
      where.created_by = user.id;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Target audience filter
    if (target_audience) {
      where.target_audience = target_audience;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Survey.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: SurveyTemplate,
          as: 'template',
          attributes: ['id', 'title', 'description']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return {
      surveys: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get survey by ID
   */
  async getSurveyById(surveyId, user) {
    const where = { id: surveyId };

    // Non-admin users can only see their own surveys
    if (user.role !== 'admin') {
      where.created_by = user.id;
    }

    const survey = await Survey.findOne({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: SurveyTemplate,
          as: 'template',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    return survey;
  }

  /**
   * Create new survey
   */
  async createSurvey(surveyData, user) {
    const {
      template_id,
      title,
      description,
      start_date,
      end_date,
      target_audience,
      target_value
    } = surveyData;

    // Verify template exists
    const template = await SurveyTemplate.findByPk(template_id);
    if (!template) {
      throw new Error('Survey template not found');
    }

    const survey = await Survey.create({
      template_id,
      title,
      description,
      start_date,
      end_date,
      target_audience: target_audience || 'all_users',
      target_value,
      created_by: user.id,
      status: 'draft'
    });

    return this.getSurveyById(survey.id, user);
  }

  /**
   * Update survey
   */
  async updateSurvey(surveyId, updateData, user) {
    const survey = await Survey.findByPk(surveyId);

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Check ownership
    if (user.role !== 'admin' && survey.created_by !== user.id) {
      throw new Error('Access denied. You do not own this survey.');
    }

    // Update allowed fields
    const allowedFields = [
      'title',
      'description',
      'start_date',
      'end_date',
      'target_audience',
      'target_value',
      'status'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        survey[field] = updateData[field];
      }
    });

    await survey.save();

    return this.getSurveyById(surveyId, user);
  }

  /**
   * Delete survey
   */
  async deleteSurvey(surveyId, user) {
    const survey = await Survey.findByPk(surveyId);

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Check ownership
    if (user.role !== 'admin' && survey.created_by !== user.id) {
      throw new Error('Access denied. You do not own this survey.');
    }

    await survey.destroy();

    return { message: 'Survey deleted successfully' };
  }

  /**
   * Get survey statistics
   */
  async getSurveyStats(surveyId, user) {
    const survey = await this.getSurveyById(surveyId, user);

    if (!survey) {
      throw new Error('Survey not found');
    }

    const responseCount = await SurveyResponse.count({
      where: { survey_id: surveyId }
    });

    return {
      survey_id: surveyId,
      title: survey.title,
      status: survey.status,
      response_count: responseCount,
      start_date: survey.start_date,
      end_date: survey.end_date,
      target_audience: survey.target_audience
    };
  }
}

module.exports = new SurveyService();
