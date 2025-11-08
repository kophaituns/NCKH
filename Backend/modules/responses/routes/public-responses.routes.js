// modules/responses/routes/public-responses.routes.js
const express = require('express');
const router = express.Router();
const publicResponsesController = require('../controller/public-responses.controller');

/**
 * @route   GET /api/modules/responses/public/:token
 * @desc    Get survey by public token
 * @access  Public
 */
router.get('/:token', publicResponsesController.getSurveyByToken);

/**
 * @route   POST /api/modules/responses/public/:token
 * @desc    Submit response to survey via public token
 * @access  Public
 */
router.post('/:token', publicResponsesController.submitResponse);

module.exports = router;
