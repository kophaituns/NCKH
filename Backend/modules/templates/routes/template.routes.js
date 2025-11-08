// modules/templates/routes/template.routes.js
const express = require('express');
const router = express.Router();
const templateController = require('../controller/template.controller');
const { authenticate, isCreatorOrAdmin } = require('../../auth-rbac/middleware/auth.middleware');

/**
 * @route   GET /api/templates/question-types
 * @desc    Get all question types
 * @access  Private
 */
router.get('/question-types', authenticate, templateController.getQuestionTypes);

/**
 * @route   GET /api/templates
 * @desc    Get all templates
 * @access  Private
 */
router.get('/', authenticate, templateController.getAllTemplates);

/**
 * @route   GET /api/templates/:id
 * @desc    Get template by ID with questions
 * @access  Private
 */
router.get('/:id', authenticate, templateController.getTemplateById);

/**
 * @route   POST /api/modules/templates
 * @desc    Create new template
 * @access  Private (Creator/Admin only)
 */
router.post('/', authenticate, isCreatorOrAdmin, templateController.createTemplate);

/**
 * @route   PUT /api/templates/:id
 * @desc    Update template
 * @access  Private (Owner/Admin only)
 */
router.put('/:id', authenticate, isCreatorOrAdmin, templateController.updateTemplate);

/**
 * @route   DELETE /api/modules/templates/:id
 * @desc    Delete template
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, isCreatorOrAdmin, templateController.deleteTemplate);

/**
 * @route   POST /api/modules/templates/:id/questions
 * @desc    Add question to template
 * @access  Private (Admin only)
 */
router.post('/:id/questions', authenticate, isCreatorOrAdmin, templateController.addQuestion);

/**
 * @route   GET /api/templates/:id/questions
 * @desc    Get questions for template
 * @access  Private
 */
router.get('/:id/questions', authenticate, templateController.getQuestionsByTemplate);

module.exports = router;
