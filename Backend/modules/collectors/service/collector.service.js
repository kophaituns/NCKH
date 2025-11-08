// modules/collectors/service/collector.service.js
// Placeholder for survey collectors (distribution methods: email, link, QR code)
const { Survey, SurveyCollector } = require('../../../src/models');

class CollectorService {
  /**
   * Get collectors for a survey (placeholder)
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

    // Placeholder: Return example collector types
    return {
      survey_id: surveyId,
      collectors: [
        {
          type: 'web_link',
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/${surveyId}`,
          status: 'active'
        },
        {
          type: 'qr_code',
          status: 'available',
          message: 'QR code generation not yet implemented'
        },
        {
          type: 'email',
          status: 'not_implemented',
          message: 'Email distribution coming soon'
        }
      ]
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
      name: collectorData.name || `Collector for ${survey.title}`,
      is_active: true,
      allow_multiple_responses: collectorData.allow_multiple_responses || false,
      response_count: 0,
      created_by: user.id
    });

    return collector;
  }
}

module.exports = new CollectorService();
