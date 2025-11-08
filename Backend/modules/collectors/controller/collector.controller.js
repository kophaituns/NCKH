// modules/collectors/controller/collector.controller.js
const collectorService = require('../service/collector.service');
const logger = require('../../../src/utils/logger');

class CollectorController {
  /**
   * Get collectors for survey
   */
  async getCollectorsBySurvey(req, res) {
    try {
      const { survey_id } = req.params;

      const collectors = await collectorService.getCollectorsBySurvey(survey_id, req.user);

      res.status(200).json({
        success: true,
        data: collectors
      });
    } catch (error) {
      logger.error('Get collectors error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching collectors'
      });
    }
  }

  /**
   * Create collector
   */
  async createCollector(req, res) {
    try {
      const { survey_id } = req.params;

      const collector = await collectorService.createCollector(survey_id, req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Collector created successfully',
        data: {
          collector_id: collector.id,
          token: collector.token,
          collector
        }
      });
    } catch (error) {
      logger.error('Create collector error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error creating collector'
      });
    }
  }
}

module.exports = new CollectorController();
