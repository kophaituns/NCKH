// src/modules/llm/routes/llm.routes.js
const express = require('express');
const router = express.Router();
const llmController = require('../controller/llm.controller');
const { authenticate, isTeacherOrAdmin } = require('../../../middleware/auth.middleware');

// Generate a survey based on a prompt
router.post('/generate-survey', authenticate, isTeacherOrAdmin, llmController.generateSurvey);

// Analyze survey responses
router.post('/analyze-responses', authenticate, isTeacherOrAdmin, llmController.analyzeSurveyResponses);

// Get all saved LLM prompts
router.get('/prompts', authenticate, isTeacherOrAdmin, llmController.getLlmPrompts);

// Create a new LLM prompt
router.post('/prompts', authenticate, isTeacherOrAdmin, llmController.createLlmPrompt);

// Get prompt by ID
router.get('/prompts/:id', authenticate, isTeacherOrAdmin, llmController.getPromptById);

// Update prompt
router.put('/prompts/:id', authenticate, isTeacherOrAdmin, llmController.updatePrompt);

// Delete prompt
router.delete('/prompts/:id', authenticate, isTeacherOrAdmin, llmController.deletePrompt);

// Get analysis results for a survey
router.get('/analysis/:survey_id', authenticate, isTeacherOrAdmin, llmController.getAnalysisResults);

// AI Question Generation Routes
// Generate questions using AI
router.post('/generate-questions', authenticate, isTeacherOrAdmin, llmController.generateQuestions);

// Predict category for keyword
router.post('/predict-category', authenticate, isTeacherOrAdmin, llmController.predictCategory);

// Get available categories
router.get('/categories', authenticate, isTeacherOrAdmin, llmController.getCategories);

// Check Hugging Face API health
router.get('/health', authenticate, isTeacherOrAdmin, llmController.checkHuggingFaceHealth);

module.exports = router;
