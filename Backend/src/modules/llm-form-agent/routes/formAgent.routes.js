// src/modules/llm-form-agent/routes/formAgent.routes.js
const express = require('express');
const router = express.Router();
const formAgentController = require('../controller/formAgent.controller');
const { authenticate, isCreatorOrAdmin } = require('../../../middleware/auth.middleware');

/**
 * POST /form-agent/predict
 * Predict form metadata (category, form type, complexity, etc.) based on keyword
 * Requires: authenticate, isCreatorOrAdmin
 */
router.post(
  '/form-agent/predict',
  authenticate,
  isCreatorOrAdmin,
  formAgentController.predictFormMetadata
);

/**
 * POST /form-agent/generate
 * Generate survey questions based on keyword and parameters
 * Requires: authenticate, isCreatorOrAdmin
 */
router.post(
  '/form-agent/generate',
  authenticate,
  isCreatorOrAdmin,
  formAgentController.generateQuestions
);

module.exports = router;
