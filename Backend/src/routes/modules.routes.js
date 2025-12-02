// src/routes/modules.routes.js
// Router for modular architecture
const express = require('express');
const router = express.Router();
const modules = require('../modules');

// Mount module routes
router.use('/health', modules.health.routes);
router.use('/auth', modules.authRbac.routes);
router.use('/users', modules.users.routes);
router.use('/surveys', modules.surveys.routes);
router.use('/responses', modules.responses.routes);
router.use('/templates', modules.templates.routes);
router.use('/analytics', modules.analytics.routes);
router.use('/export', modules.export.routes);
router.use('/collectors', modules.collectors.routes);
router.use('/notifications', modules.notifications.routes);
router.use('/workspaces', modules.workspaces.routes);
router.use('/llm', modules.llm.routes);
router.use('/chat', modules.chat.routes);
router.use('/settings', modules.settings.routes);

module.exports = router;
