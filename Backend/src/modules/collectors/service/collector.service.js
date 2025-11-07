// modules/collectors/service/collector.service.js
// Survey collectors - distribution methods: email, link, QR code
// src/modules/collectors/service/collector.service.js
const { Survey, SurveyCollector, SurveyResponse } = require('../../../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

class CollectorService {
  /**
   * Generate unique token for collector
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get collectors for a survey
   */
  async getCollectorsBySurvey(surveyId, user) {
    const survey = await Survey.findByPk(surveyId);
    
    if (!survey) {
      throw new Error('Survey not found');
    }

    // Check ownership
    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied');
    }

    const collectors = await SurveyCollector.findAll({
      where: { survey_id: surveyId },
      order: [['created_at', 'DESC']]
    });

    return {
      survey_id: surveyId,
      collectors: collectors.map(c => ({
        id: c.id,
        type: c.collector_type,
        name: c.name,
        token: c.token,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/collector/${c.token}`,
        is_active: c.is_active,
        allow_multiple_responses: c.allow_multiple_responses,
        response_count: c.response_count,
        created_at: c.created_at
      }))
    };
  }

  /**
   * Create collector
   */
  async createCollector(surveyId, collectorData, user) {
    const survey = await Survey.findByPk(surveyId);
    
    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied');
    }

    const {
      collector_type = 'web_link',
      name,
      allow_multiple_responses = false
    } = collectorData;

    // Generate unique token
    const token = this.generateToken();

    // Create collector
    const collector = await SurveyCollector.create({
      survey_id: surveyId,
      collector_type,
      token,
      name: name || `${collector_type} collector`,
      is_active: true,
      allow_multiple_responses,
      response_count: 0,
      created_by: user.id
    });

    return {
      id: collector.id,
      type: collector.collector_type,
      name: collector.name,
      token: collector.token,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/collector/${collector.token}`,
      is_active: collector.is_active,
      allow_multiple_responses: collector.allow_multiple_responses,
      created_at: collector.created_at
    };
  }

  /**
   * Get collector by token (for public access)
   */
  async getCollectorByToken(token) {
    const collector = await SurveyCollector.findOne({
      where: { token },
      include: [
        {
          model: Survey,
          include: [
            {
              model: require('../../../src/models').SurveyTemplate,
              as: 'template',
              include: [
                {
                  model: require('../../../models').Question,
                  include: [
                    {
                      model: require('../../../models').QuestionOption
                    },
                    {
                      model: require('../../../models').QuestionType
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!collector) {
      throw new Error('Collector not found');
    }

    if (!collector.is_active) {
      throw new Error('This collector is no longer active');
    }

    const survey = collector.Survey;

    if (survey.status !== 'active') {
      throw new Error('This survey is not currently accepting responses');
    }

    return {
      collector: {
        id: collector.id,
        type: collector.collector_type,
        name: collector.name,
        allow_multiple_responses: collector.allow_multiple_responses
      },
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        questions: survey.template.Questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.QuestionType.type_name,
          is_required: q.required,
          display_order: q.display_order,
          options: q.QuestionOptions.map(opt => ({
            id: opt.id,
            option_text: opt.option_text,
            display_order: opt.display_order
          }))
        }))
      }
    };
  }

  /**
   * Update collector
   */
  async updateCollector(collectorId, updateData, user) {
    const collector = await SurveyCollector.findByPk(collectorId, {
      include: [Survey]
    });

    if (!collector) {
      throw new Error('Collector not found');
    }

    const survey = collector.Survey;
    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied');
    }

    // Update allowed fields
    const allowedFields = ['name', 'is_active', 'allow_multiple_responses'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        collector[field] = updateData[field];
      }
    });

    await collector.save();

    return {
      id: collector.id,
      type: collector.collector_type,
      name: collector.name,
      token: collector.token,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/collector/${collector.token}`,
      is_active: collector.is_active,
      allow_multiple_responses: collector.allow_multiple_responses
    };
  }

  /**
   * Delete collector
   */
  async deleteCollector(collectorId, user) {
    const collector = await SurveyCollector.findByPk(collectorId, {
      include: [Survey]
    });

    if (!collector) {
      throw new Error('Collector not found');
    }

    const survey = collector.Survey;
    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied');
    }

    await collector.destroy();

    return { message: 'Collector deleted successfully' };
  }

  /**
   * Increment response count
   */
  async incrementResponseCount(collectorId) {
    const collector = await SurveyCollector.findByPk(collectorId);
    if (collector) {
      collector.response_count += 1;
      await collector.save();
    }
  }
}

module.exports = new CollectorService();
