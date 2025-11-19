// modules/analytics/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controller/analytics.controller');
const { authenticate } = require('../../auth-rbac/middleware/auth.middleware');

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard statistics (creator/general)
 * @access  Private
 */
router.get('/dashboard', authenticate, analyticsController.getDashboardStats);

/**
 * @route   GET /api/analytics/admin/dashboard
 * @desc    Get admin dashboard statistics (totals, roles, charts)
 * @access  Private (Admin only – add role middleware if needed)
 */
router.get(
  '/admin/dashboard',
  authenticate,
  analyticsController.getAdminDashboardStats
);

/**
 * @route   GET /api/analytics/survey/:survey_id/summary
 * @desc    Get survey summary statistics
 * @access  Private (Creator/Admin only)
 */
router.get(
  '/survey/:survey_id/summary',
  authenticate,
  analyticsController.getSurveySummary
);

/**
 * @route   GET /api/analytics/survey/:survey_id/questions
 * @desc    Get question-level analytics
 * @access  Private (Creator/Admin only)
 */
router.get(
  '/survey/:survey_id/questions',
  authenticate,
  analyticsController.getQuestionAnalytics
);

/**
 * @route   GET /api/analytics/survey/:survey_id/responses
 * @desc    Get detailed responses with pagination
 * @access  Private (Creator/Admin only)
 */
router.get(
  '/survey/:survey_id/responses',
  authenticate,
  analyticsController.getResponseDetails
);

module.exports = router;
