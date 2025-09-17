// src/routes/analysis.routes.js
const express = require('express');
const { authenticate, isTeacherOrAdmin } = require('../middleware/auth.middleware');
const analysisController = require('../controllers/analysis.controller');
const router = express.Router();

// Routes for analysis management
router.post('/survey/:surveyId', authenticate, isTeacherOrAdmin, analysisController.analyzeResponses);
router.get('/survey/:surveyId', authenticate, isTeacherOrAdmin, analysisController.getAnalysisResults);
router.post('/visualize/survey/:surveyId', authenticate, isTeacherOrAdmin, analysisController.generateVisualization);
router.get('/export/survey/:surveyId', authenticate, isTeacherOrAdmin, analysisController.exportAnalysisReport);

module.exports = router;
