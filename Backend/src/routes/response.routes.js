// src/routes/response.routes.js
const express = require('express');
const { authenticate, isTeacherOrAdmin } = require('../middleware/auth.middleware');
const responseController = require('../controllers/response.controller');

const router = express.Router();

// Submit a survey response
router.post('/', authenticate, responseController.submitResponse);

// Get responses for a survey (admin and survey creators only)
router.get('/survey/:survey_id', authenticate, isTeacherOrAdmin, responseController.getResponsesBySurvey);

// Get response details including answers
router.get('/:response_id', authenticate, responseController.getResponseDetails);

// Get response summary statistics for a survey
router.get('/summary/:survey_id', authenticate, isTeacherOrAdmin, responseController.getResponseSummary);

module.exports = router;
