// modules/llm/routes/llm.routes.js
const express = require('express');
const router = express.Router();
const llmController = require('../controller/llm.controller');
const { authenticate } = require('../../auth-rbac/middleware/auth.middleware');

// Apply authentication to all LLM routes
router.use(authenticate);

/**
 * @route   GET /api/modules/llm/categories
 * @desc    Get available AI model categories
 * @access  Private
 */
router.get('/categories', llmController.getCategories);

/**
 * @route   GET /api/modules/llm/prompts
 * @desc    Get LLM prompts
 * @access  Private
 */
router.get('/prompts', llmController.getPrompts);

/**
 * @route   POST /api/modules/llm/prompts
 * @desc    Create new LLM prompt
 * @access  Private
 */
router.post('/prompts', llmController.createPrompt);

/**
 * @route   GET /api/modules/llm/prompts/:id
 * @desc    Get specific LLM prompt
 * @access  Private
 */
router.get('/prompts/:id', llmController.getPrompt);

/**
 * @route   PUT /api/modules/llm/prompts/:id
 * @desc    Update LLM prompt
 * @access  Private
 */
router.put('/prompts/:id', llmController.updatePrompt);

/**
 * @route   DELETE /api/modules/llm/prompts/:id
 * @desc    Delete LLM prompt
 * @access  Private
 */
router.delete('/prompts/:id', llmController.deletePrompt);

/**
 * @route   POST /api/modules/llm/generate
 * @desc    Generate questions using AI
 * @access  Private
 */
router.post('/generate', llmController.generateQuestions);

/**
 * @route   POST /api/modules/llm/generate-questions
 * @desc    Generate questions using AI (alternative endpoint)
 * @access  Private
 */
router.post('/generate-questions', llmController.generateQuestions);

/**
 * @route   POST /api/modules/llm/predict-category
 * @desc    Predict category for given text
 * @access  Private
 */
router.post('/predict-category', llmController.predictCategory);

/**
 * @route   POST /api/modules/llm/generate-survey
 * @desc    Generate complete survey using AI
 * @access  Private
 */
router.post('/generate-survey', llmController.generateSurvey);

/**
 * @route   POST /api/modules/llm/prompts/:promptId/test
 * @desc    Test a specific prompt
 * @access  Private
 */
router.post('/prompts/:promptId/test', llmController.testPrompt);

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        module: 'llm',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;