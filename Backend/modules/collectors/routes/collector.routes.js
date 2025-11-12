// modules/collectors/routes/collector.routes.js
const express = require('express');
const router = express.Router();
const collectorController = require('../controller/collector.controller');
const { authenticate, isCreatorOrAdmin } = require('../../auth-rbac/middleware/auth.middleware');

/**
 * @route   POST /api/modules/collectors
 * @desc    Create collector for survey
 * @access  Private (Creator/Admin only)
 */
router.post('/', authenticate, isCreatorOrAdmin, collectorController.createCollector);

/**
 * @route   GET /api/modules/collectors/survey/:surveyId
 * @desc    Get collectors for a survey
 * @access  Private (Creator/Admin only)
 */
router.get('/survey/:surveyId', authenticate, isCreatorOrAdmin, collectorController.getCollectorsBySurvey);

module.exports = router;
