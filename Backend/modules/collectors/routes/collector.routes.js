// modules/collectors/routes/collector.routes.js
const express = require('express');
const router = express.Router();
const collectorController = require('../controller/collector.controller');
const { authenticate, isCreatorOrAdmin } = require('../../auth-rbac/middleware/auth.middleware');

/**
 * @route   GET /api/collectors/survey/:survey_id
 * @desc    Get collectors for a survey
 * @access  Private (Creator/Admin only)
 */
router.get('/survey/:survey_id', authenticate, isCreatorOrAdmin, collectorController.getCollectorsBySurvey);

/**
 * @route   POST /api/collectors/survey/:survey_id
 * @desc    Create collector for survey (placeholder)
 * @access  Private (Creator/Admin only)
 */
router.post('/survey/:survey_id', authenticate, isCreatorOrAdmin, collectorController.createCollector);

module.exports = router;
