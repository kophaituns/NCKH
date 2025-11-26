// modules/collectors/controller/collector.controller.js
const collectorService = require('../service/collector.service');
const logger = require('../../../src/utils/logger');

class CollectorController {
  /**
   * Get collectors for survey
   */
  async getCollectorsBySurvey(req, res) {
    try {
      const { surveyId } = req.params;

      const collectors = await collectorService.getCollectorsBySurvey(surveyId, req.user);

      res.status(200).json({
        ok: true,
        collectors
      });
    } catch (error) {
      logger.error('Get collectors error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          ok: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          ok: false,
          message: error.message
        });
      }

      res.status(500).json({
        ok: false,
        message: error.message || 'Error fetching collectors'
      });
    }
  }

  /**
   * Create collector
   */
  async createCollector(req, res) {
    try {
      const { surveyId } = req.body;

      if (!surveyId) {
        return res.status(400).json({
          ok: false,
          message: 'Survey ID is required'
        });
      }

      const collector = await collectorService.createCollector(surveyId, req.body, req.user);

      res.status(201).json({
        ok: true,
        message: 'Collector created successfully',
        collector: {
          id: collector.id,
          surveyId: collector.survey_id,
          token: collector.token,
          publicUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/${collector.token}`,
          type: collector.collector_type,
          name: collector.name,
          isActive: collector.is_active,
          createdAt: collector.created_at,
          responsesCount: collector.response_count || 0
        }
      });
    } catch (error) {
      logger.error('Create collector error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          ok: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          ok: false,
          message: error.message
        });
      }

      if (error.message.includes('not active') || error.message.includes('not published')) {
        return res.status(400).json({
          ok: false,
          message: error.message
        });
      }

      res.status(500).json({
        ok: false,
        message: error.message || 'Error creating collector'
      });
    }
  }
}

module.exports = new CollectorController();
