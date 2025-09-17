// src/routes/llm.routes.js
const express = require('express');
const { authenticate, isTeacherOrAdmin } = require('../middleware/auth.middleware');
const llmController = require('../controllers/llm.controller');

const router = express.Router();

// Generate a survey based on a prompt
router.post('/generate-survey', authenticate, isTeacherOrAdmin, llmController.generateSurvey);

// Analyze survey responses
router.post('/analyze-responses', authenticate, isTeacherOrAdmin, llmController.analyzeSurveyResponses);

// Get all saved LLM prompts
router.get('/prompts', authenticate, isTeacherOrAdmin, llmController.getLlmPrompts);

// Create a new LLM prompt
router.post('/prompts', authenticate, isTeacherOrAdmin, llmController.createLlmPrompt);

// Get analysis results for a survey
router.get('/analysis/:survey_id', authenticate, isTeacherOrAdmin, llmController.getAnalysisResults);

module.exports = router;
