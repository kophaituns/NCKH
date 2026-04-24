// src/modules/analytics/routes/landing.routes.js
const express = require('express');
const router = express.Router();
const landingController = require('../controller/landing.controller');

/**
 * @route   GET /api/public/landing
 * @desc    Get public stats and featured templates for landing page
 * @access  Public
 */
router.get('/', landingController.getLandingData);

module.exports = router;
