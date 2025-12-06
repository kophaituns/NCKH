// src/modules/options/routes/option.routes.js
const express = require('express');
const router = express.Router();
const optionController = require('../controller/option.controller');
const { authenticate, isTeacherOrAdmin } = require('../../../middleware/auth.middleware');

/**
 * @route   POST /api/modules/options
 * @desc    Add option to question
 * @access  Private (Creator/Admin only)
 */
router.post('/', authenticate, isTeacherOrAdmin, optionController.addOption);

/**
 * @route   PUT /api/modules/options/:id
 * @desc    Update option
 * @access  Private (Owner/Admin only)
 */
router.put('/:id', authenticate, isTeacherOrAdmin, optionController.updateOption);

/**
 * @route   DELETE /api/modules/options/:id
 * @desc    Delete option
 * @access  Private (Owner/Admin only)
 */
router.delete('/:id', authenticate, isTeacherOrAdmin, optionController.deleteOption);

module.exports = router;