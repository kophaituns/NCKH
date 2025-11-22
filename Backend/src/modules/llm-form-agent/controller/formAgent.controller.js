// src/modules/llm-form-agent/controller/formAgent.controller.js
const formAgentService = require('../service/formAgent.service');
const logger = require('../../../utils/logger');

class FormAgentController {
  /**
   * Predict form metadata based on keyword
   * POST /form-agent/predict
   * Body: { keyword: string }
   */
  async predictFormMetadata(req, res, next) {
    try {
      const { keyword } = req.body;

      logger.debug('predictFormMetadata endpoint called', { keyword });

      const result = await formAgentService.predictMetadata({ keyword });

      return res.status(200).json({
        success: true,
        ok: true,
        error: false,
        data: result
      });
    } catch (error) {
      logger.error('Error in predictFormMetadata', error);
      next(error);
    }
  }

  /**
   * Generate questions based on keyword and optional parameters
   * POST /form-agent/generate
   * Body: { keyword: string, numQuestions?: number, category?: string }
   */
  async generateQuestions(req, res, next) {
    try {
      const { keyword, numQuestions = 5, category = null } = req.body;

      logger.debug('generateQuestions endpoint called', {
        keyword,
        numQuestions,
        category
      });

      const result = await formAgentService.generateQuestions({
        keyword,
        numQuestions,
        category
      });

      return res.status(200).json({
        success: true,
        ok: true,
        error: false,
        data: {
          keyword: result.keyword || keyword,
          questions: result.questions || result,
          raw: result.raw || result,
          fallback: result.fallback || false
        }
      });
    } catch (error) {
      logger.error('Error in generateQuestions', error);
      next(error);
    }
  }
}

module.exports = new FormAgentController();
