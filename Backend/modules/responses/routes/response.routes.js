// modules/responses/routes/response.routes.js
const express = require('express');
const router = express.Router();
const responseController = require('../controller/response.controller');
const { authenticate, isCreatorOrAdmin } = require('../../auth-rbac/middleware/auth.middleware');

/**
 * @route   POST /api/responses
 * @desc    Submit survey response
 * @access  Private
 */
router.post('/', authenticate, responseController.submitResponse);

/**
 * @route   GET /api/responses/my-responses
 * @desc    Get user's own responses
 * @access  Private
 */
router.get('/my-responses', authenticate, responseController.getUserResponses);

/**
 * @route   GET /api/responses/:id
 * @desc    Get response by ID
 * @access  Private
 */
router.get('/:id', authenticate, responseController.getResponseById);

/**
 * @route   GET /api/responses/survey/:survey_id
 * @desc    Get all responses for a survey
 * @access  Private (Creator/Admin only)
 */
router.get('/survey/:survey_id', authenticate, responseController.getResponsesBySurvey);

/**
 * @route   DELETE /api/responses/:id
 * @desc    Delete response
 * @access  Private (Owner/Admin only)
 */
router.delete('/:id', authenticate, responseController.deleteResponse);

module.exports = router;
