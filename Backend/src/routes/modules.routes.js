// src/routes/modules.routes.js
// Router for modular architecture
const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const modules = require('../modules');

// Mount module routes
router.use('/health', modules.health.routes);
=======
const modules = require('../../modules');

// Mount module routes
// Only mount modules that exist and are properly exported
>>>>>>> linh2
router.use('/auth', modules.authRbac.routes);
router.use('/users', modules.users.routes);
router.use('/surveys', modules.surveys.routes);
router.use('/responses', modules.responses.routes);
router.use('/templates', modules.templates.routes);
router.use('/analytics', modules.analytics.routes);
router.use('/export', modules.export.routes);
router.use('/collectors', modules.collectors.routes);
<<<<<<< HEAD
router.use('/notifications', modules.notifications.routes);
router.use('/workspaces', modules.workspaces.routes);
router.use('/llm', modules.llm.routes);
router.use('/chat', modules.chat.routes);
=======
router.use('/chat', modules.chat.routes);
router.use('/llm', modules.llm.routes);

// Health check endpoint (simple inline route)
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API modules are running',
    timestamp: new Date().toISOString()
  });
});

// TODO: Add these routes when modules are implemented
// router.use('/users', modules.users.routes);
// router.use('/llm', modules.llm.routes);
>>>>>>> linh2

module.exports = router;
