// modules/responses/controller/response.controller.js
const responseService = require('../service/response.service');
const logger = require('../../../src/utils/logger');

class ResponseController {
  /**
   * Submit survey response
   */
  async submitResponse(req, res) {
    try {
      const { survey_id, answers } = req.body;

      // Validation
      if (!survey_id || !answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Survey ID and answers array are required'
        });
      }

      const response = await responseService.submitResponse(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Response submitted successfully',
        data: { response }
      });
    } catch (error) {
      logger.error('Submit response error:', error);

      if (error.message.includes('not found') || error.message.includes('not active')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('already responded')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error submitting response'
      });
    }
  }

  /**
   * Get response by ID
   */
  async getResponseById(req, res) {
    try {
      const { id } = req.params;

      const response = await responseService.getResponseById(id, req.user);

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { response }
      });
    } catch (error) {
      logger.error('Get response error:', error);

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching response'
      });
    }
  }

  /**
   * Get all responses for a survey
   */
  async getResponsesBySurvey(req, res) {
    try {
      const { survey_id } = req.params;
      const { page, limit } = req.query;

      const result = await responseService.getResponsesBySurvey(
        survey_id,
        req.user,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get survey responses error:', error);

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
        message: error.message || 'Error fetching responses'
      });
    }
  }

  /**
   * Get user's own responses
   */
  async getUserResponses(req, res) {
    try {
      const { page, limit } = req.query;

      const result = await responseService.getUserResponses(req.user, { page, limit });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get user responses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching user responses'
      });
    }
  }

  /**
   * Delete response
   */
  async deleteResponse(req, res) {
    try {
      const { id } = req.params;

      await responseService.deleteResponse(id, req.user);

      res.status(200).json({
        success: true,
        message: 'Response deleted successfully'
      });
    } catch (error) {
      logger.error('Delete response error:', error);

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
        message: error.message || 'Error deleting response'
      });
    }
  }
}

module.exports = new ResponseController();
