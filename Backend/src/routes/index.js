// src/routes/index.js
// Central router aggregating all module routes
const { Router } = require('express');
const router = Router();

// Import modular routes
const moduleRoutes = require('./modules.routes');
const questionRoutes = require('./question.routes');
const testRoutes = require('./test.routes');

// Mount modular architecture routes
router.use('/modules', moduleRoutes);

// Mount remaining legacy routes
router.use('/questions', questionRoutes);
router.use('/test', testRoutes);

module.exports = router;
