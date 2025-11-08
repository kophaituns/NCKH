// modules/surveys/routes/survey.routes.js
const express = require('express');
const router = express.Router();
const surveyController = require('../controller/survey.controller');
const { authenticate, isCreatorOrAdmin } = require('../../auth-rbac/middleware/auth.middleware');

/**
 * @route   GET /api/surveys
 * @desc    Get all surveys (with pagination and filters)
 * @access  Private
 */
router.get('/', authenticate, surveyController.getAllSurveys);

/**
 * @route   GET /api/surveys/:id
 * @desc    Get survey by ID
 * @access  Private
 */
router.get('/:id', authenticate, surveyController.getSurveyById);

/**
 * @route   GET /api/surveys/:id/stats
 * @desc    Get survey statistics
 * @access  Private
 */
router.get('/:id/stats', authenticate, surveyController.getSurveyStats);

/**
 * @route   POST /api/modules/surveys
 * @desc    Create new survey
 * @access  Private (Creator/Admin only)
 */
router.post('/', authenticate, isCreatorOrAdmin, surveyController.createSurvey);

/**
 * @route   PUT /api/modules/surveys/:id
 * @desc    Update survey
 * @access  Private (Creator/Admin only)
 */
router.put('/:id', authenticate, isCreatorOrAdmin, surveyController.updateSurvey);

/**
 * @route   PATCH /api/modules/surveys/:id/status
 * @desc    Update survey status (publish, close, etc.)
 * @access  Private (Creator/Admin only)
 */
router.patch('/:id/status', authenticate, isCreatorOrAdmin, surveyController.updateSurveyStatus);

/**
 * @route   DELETE /api/modules/surveys/:id
 * @desc    Delete survey
 * @access  Private (Creator/Admin only)
 */
router.delete('/:id', authenticate, isCreatorOrAdmin, surveyController.deleteSurvey);

module.exports = router;
