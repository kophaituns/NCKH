// src/modules/settings/routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const userSettingsRoutes = require('./userSettings.routes');
const adminSettingsRoutes = require('./adminSettings.routes');

// Mount routes
router.use('/user', userSettingsRoutes);
router.use('/admin', adminSettingsRoutes);

module.exports = router;