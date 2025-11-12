// modules/collectors/service/collector.service.js
const { Survey, SurveyCollector, SurveyResponse } = require('../../../src/models');
const { Sequelize } = require('sequelize');

class CollectorService {
  /**
   * Get collectors for a survey with response counts
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

    // Get collectors with response counts
    const collectors = await SurveyCollector.findAll({
      where: { survey_id: surveyId },
      attributes: [
        'id',
        'survey_id',
        'collector_type',
        'token',
        'name',
        'is_active',
        'allow_multiple_responses',
        'created_at',
        'updated_at',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM survey_responses
            WHERE survey_responses.collector_id = SurveyCollector.id
          )`),
          'responsesCount'
        ]
      ],
      order: [['created_at', 'DESC']]
    });

    // Format response
    return collectors.map(collector => ({
      id: collector.id,
      surveyId: collector.survey_id,
      token: collector.token,
      type: collector.collector_type,
      name: collector.name,
      isActive: collector.is_active,
      allowMultipleResponses: collector.allow_multiple_responses,
      publicUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/${collector.token}`,
      createdAt: collector.created_at,
      responsesCount: parseInt(collector.getDataValue('responsesCount')) || 0
    }));
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

    // Validate survey is published/active
    if (survey.status !== 'active') {
      throw new Error('Survey must be active to create collectors');
    }

    // Generate unique token
    const token = require('crypto').randomBytes(16).toString('hex');

    // Map type to collector_type (handle both weblink and web_link)
    let collectorType = collectorData.type || 'web_link';
    if (collectorType === 'weblink') {
      collectorType = 'web_link';
    }

    const collector = await SurveyCollector.create({
      survey_id: surveyId,
      collector_type: collectorType,
      token: token,
      name: collectorData.name || `Web Link - ${new Date().toLocaleDateString()}`,
      is_active: true,
      allow_multiple_responses: collectorData.allow_multiple_responses || false,
      response_count: 0,
      created_by: user.id
    });

    return collector;
  }
}

module.exports = new CollectorService();
