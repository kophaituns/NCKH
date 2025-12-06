// src/modules/analytics/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controller/analytics.controller');

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
router.get('/survey/:surveyId/drop-off', analyticsController.getDropOffAnalysis);

/**
 * @route   POST /api/modules/analytics/survey/:surveyId/cross-tab
 * @desc    Get cross-tabulation analysis for a survey
 * @access  Private
 */
router.post('/survey/:surveyId/cross-tab', analyticsController.getCrossTabAnalysis);

/**
 * @route   GET /api/modules/analytics/admin/dashboard
 * @desc    Get admin dashboard analytics data
 * @access  Private
 */
router.get('/admin/dashboard', analyticsController.getAdminDashboard);

module.exports = router;