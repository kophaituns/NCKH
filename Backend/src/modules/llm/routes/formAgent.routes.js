/**
 * Form Agent Routes
 * Endpoints for AI form metadata prediction and question generation
 */

const express = require('express');
const router = express.Router();
const formAgentService = require('../service/formAgent.service');

/**
 * POST /api/llm/form-agent/predict
 * Predict survey metadata based on keyword
 */
router.post('/predict', async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Keyword is required'
      });
    }

    const result = await formAgentService.predictMetadata(keyword);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: result.error
      });
    }

    return res.json({
      success: true,
      data: result.data,
      message: 'Metadata prediction successful'
    });
  } catch (error) {
    console.error('Form Agent predict error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to predict metadata',
      code: 'FORM_AGENT_PREDICT_ERROR'
    });
  }
});

/**
 * POST /api/llm/form-agent/generate
 * Generate questions based on parameters
 * Body: {
 *   keyword: string (required) - survey topic
 *   numQuestions: number (optional, default: 5) - number of questions
 *   category: string (optional, default: 'general') - question category
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const { keyword, numQuestions, category } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Keyword is required'
      });
    }

    const result = await formAgentService.generateQuestions({
      keyword,
      numQuestions: numQuestions || 5,
      category: category || 'general'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: result.error
      });
    }

    return res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
      message: 'Questions generated successfully'
    });
  } catch (error) {
    console.error('Form Agent generate error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to generate questions',
      code: 'FORM_AGENT_GENERATE_ERROR'
    });
  }
});

/**
 * GET /api/llm/form-agent/health
 * Check AI service health
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await formAgentService.healthCheck();
    
    return res.json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unavailable',
        service: 'Form Agent API',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Form Agent health check error:', error);
    return res.status(503).json({
      success: false,
      data: null,
      error: 'AI service health check failed'
    });
  }
});

module.exports = router;
