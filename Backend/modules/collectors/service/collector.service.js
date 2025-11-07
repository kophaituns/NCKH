// modules/collectors/service/collector.service.js
// Placeholder for survey collectors (distribution methods: email, link, QR code)
const { Survey } = require('../../../src/models');

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
   * Create collector (placeholder)
   */
  async createCollector(surveyId, collectorData, user) {
    const survey = await Survey.findByPk(surveyId);
    
    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied');
    }

    // Placeholder response
    return {
      message: 'Collector creation not yet implemented',
      collector_type: collectorData.type,
      survey_id: surveyId
    };
  }
}

module.exports = new CollectorService();
