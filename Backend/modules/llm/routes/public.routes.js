// modules/llm/routes/public.routes.js
const express = require('express');
const router = express.Router();
const llmController = require('../controller/llm.controller');

/**
 * @route   GET /api/modules/llm/public/:token
 * @desc    Get survey by public token
 * @access  Public
 */
router.get('/:token', llmController.getSurveyByToken);

/**
 * @route   POST /api/modules/llm/public/:token/submit
 * @desc    Submit response to survey via public link
 * @access  Public
 */
router.post('/:token/submit', llmController.submitSurveyResponse);

module.exports = router;