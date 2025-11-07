// modules/surveys/routes/survey.routes.js
const express = require('express');
const router = express.Router();
const surveyController = require('../controller/survey.controller');
const { authenticate, isTeacherOrAdmin } = require('../../auth-rbac/middleware/auth.middleware');

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
 * @route   POST /api/surveys
 * @desc    Create new survey
 * @access  Private (Teacher/Admin only)
 */
router.post('/', authenticate, isTeacherOrAdmin, surveyController.createSurvey);

/**
 * @route   PUT /api/surveys/:id
 * @desc    Update survey
 * @access  Private (Owner/Admin only)
 */
router.put('/:id', authenticate, isTeacherOrAdmin, surveyController.updateSurvey);

/**
 * @route   DELETE /api/surveys/:id
 * @desc    Delete survey
 * @access  Private (Owner/Admin only)
 */
router.delete('/:id', authenticate, isTeacherOrAdmin, surveyController.deleteSurvey);

module.exports = router;
