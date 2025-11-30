// src/modules/settings/routes/userSettings.routes.js
const express = require('express');
const router = express.Router();
const userSettingsController = require('../controller/userSettings.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

/**
 * GET /api/modules/settings/user
 * Get current user's settings
 */
router.get('/', authenticate, userSettingsController.getUserSettings);

/**
 * PUT /api/modules/settings/user/notifications
 * Update notification settings
 */
router.put('/notifications', authenticate, userSettingsController.updateNotificationSettings);

/**
 * PUT /api/modules/settings/user/privacy
 * Update privacy settings
 */
router.put('/privacy', authenticate, userSettingsController.updatePrivacySettings);

/**
 * PUT /api/modules/settings/user/change-password
 * Change user password
 */
router.put('/change-password', authenticate, userSettingsController.changePassword);

/**
 * DELETE /api/modules/settings/user/personal-data
 * Delete all personal data
 */
router.delete('/personal-data', authenticate, userSettingsController.deletePersonalData);

module.exports = router;