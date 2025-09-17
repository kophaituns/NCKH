// src/routes/survey.routes.js
const express = require('express');
const { authenticate, isTeacherOrAdmin } = require('../middleware/auth.middleware');
const surveyController = require('../controllers/survey.controller');

const router = express.Router();

// Create a new survey (teachers and admins only)
router.post('/', authenticate, isTeacherOrAdmin, surveyController.createSurvey);

// Get all surveys (filtered by user role and permissions)
router.get('/', authenticate, surveyController.getAllSurveys);

// Get a survey by ID
router.get('/:id', authenticate, surveyController.getSurveyById);

// Update a survey (teachers can only update their own surveys)
router.put('/:id', authenticate, isTeacherOrAdmin, surveyController.updateSurvey);

// Delete a survey (teachers can only delete their own surveys)
router.delete('/:id', authenticate, isTeacherOrAdmin, surveyController.deleteSurvey);

// Update survey status (e.g., from draft to active)
router.patch('/:id/status', authenticate, isTeacherOrAdmin, surveyController.updateSurveyStatus);

module.exports = router;
