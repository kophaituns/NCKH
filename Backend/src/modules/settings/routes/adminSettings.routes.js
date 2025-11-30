// src/modules/settings/routes/adminSettings.routes.js
const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controller/adminSettings.controller');
const { authenticate, isAdmin } = require('../../../middleware/auth.middleware');

/**
 * GET /api/modules/settings/admin
 * Get admin settings (admin only)
 */
router.get('/', authenticate, isAdmin, adminSettingsController.getAdminSettings);

/**
 * PUT /api/modules/settings/admin/general
 * Update general admin settings
 */
router.put('/general', authenticate, isAdmin, adminSettingsController.updateGeneralSettings);

/**
 * PUT /api/modules/settings/admin/survey-limits
 * Update survey limits settings
 */
router.put('/survey-limits', authenticate, isAdmin, adminSettingsController.updateSurveyLimits);

/**
 * PUT /api/modules/settings/admin/security
 * Update security settings
 */
router.put('/security', authenticate, isAdmin, adminSettingsController.updateSecuritySettings);

/**
 * PUT /api/modules/settings/admin
 * Update all admin settings at once
 */
router.put('/', authenticate, isAdmin, adminSettingsController.updateAllSettings);

/**
 * POST /api/modules/settings/admin/reset
 * Reset admin settings to defaults
 */
router.post('/reset', authenticate, isAdmin, adminSettingsController.resetToDefaults);

module.exports = router;