// src/modules/analytics/controller/analytics.controller.js
const analyticsService = require('../service/analytics.service');
const logger = require('../../../utils/logger');

class AnalyticsController {
  /**
   * Get survey summary
   */
  async getSurveySummary(req, res) {
    try {
      const { survey_id } = req.params;

      const summary = await analyticsService.getSurveySummary(survey_id, req.user);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Get survey summary error:', error);

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
        message: error.message || 'Error fetching survey summary'
      });
    }
  }

  /**
   * Get question-level analytics
   */
  async getQuestionAnalytics(req, res) {
    try {
      const { survey_id } = req.params;

      const analytics = await analyticsService.getQuestionAnalytics(survey_id, req.user);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get question analytics error:', error);

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
        message: error.message || 'Error fetching question analytics'
      });
    }
  }

  /**
   * Get response details
   */
  async getResponseDetails(req, res) {
    try {
      const { survey_id } = req.params;
      const { page, limit } = req.query;

      const details = await analyticsService.getResponseDetails(
        survey_id,
        req.user,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      logger.error('Get response details error:', error);

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
        message: error.message || 'Error fetching response details'
      });
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      const stats = await analyticsService.getDashboardStats(req.user);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching dashboard statistics'
      });
    }
  }
}

module.exports = new AnalyticsController();
