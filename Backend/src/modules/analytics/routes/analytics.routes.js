// src/modules/analytics/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controller/analytics.controller');
const { authenticate, isAdmin } = require('../../../middleware/auth.middleware');

// All analytics routes require authenticated user
router.use(authenticate);

/**
 * @route   GET /api/modules/analytics/survey/:surveyId/quality
 * @desc    Get quality score for a survey
 * @access  Private
 */
router.get('/survey/:surveyId/quality', analyticsController.getQualityScore);

/**
 * @route   GET /api/modules/analytics/survey/:surveyId/drop-off
 * @desc    Get drop-off analysis for a survey
 * @access  Private
 */
router.get(
  '/survey/:surveyId/drop-off',
  analyticsController.getDropOffAnalysis
);

/**
 * @route   POST /api/modules/analytics/survey/:surveyId/cross-tab
 * @desc    Get cross-tabulation analysis for a survey
 * @access  Private
 */
router.post(
  '/survey/:surveyId/cross-tab',
  analyticsController.getCrossTabAnalysis
);

/**
 * @route   GET /api/modules/analytics/admin/dashboard
 * @desc    Get admin dashboard analytics data
 * @access  Private (admin only)
 */
router.get(
  '/admin/dashboard',
  isAdmin,
  analyticsController.getAdminDashboard
);

/**
 * @route   GET /api/modules/analytics/active-surveys
 * @desc    Get list of active surveys for current user
 * @access  Private
 */
router.get('/active-surveys', analyticsController.getActiveSurveys);

/**
 * @route   GET /api/modules/analytics/survey/:surveyId/top-answers
 * @desc    Get top answers for a survey
 * @access  Private
 */
router.get(
  '/survey/:surveyId/top-answers',
  analyticsController.getSurveyTopAnswers
);

module.exports = router;
