// src/routes/template.routes.js
const express = require('express');
const { authenticate, isTeacherOrAdmin } = require('../middleware/auth.middleware');
const templateController = require('../controllers/template.controller');

const router = express.Router();

// Create a new survey template (teachers and admins only)
router.post('/', authenticate, isTeacherOrAdmin, templateController.createTemplate);

// Get all survey templates
router.get('/', authenticate, isTeacherOrAdmin, templateController.getAllTemplates);

// Get a template by ID
router.get('/:id', authenticate, isTeacherOrAdmin, templateController.getTemplateById);

// Update a template
router.put('/:id', authenticate, isTeacherOrAdmin, templateController.updateTemplate);

// Delete a template
router.delete('/:id', authenticate, isTeacherOrAdmin, templateController.deleteTemplate);

// Get question types
router.get('/question-types', authenticate, templateController.getQuestionTypes);

module.exports = router;
