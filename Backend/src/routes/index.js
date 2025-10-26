// src/routes/index.js
// Central router aggregating all module routes
const { Router } = require('express');
const router = Router();

// Import existing route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const surveyRoutes = require('./survey.routes');
const questionRoutes = require('./question.routes');
const responseRoutes = require('./response.routes');
const analysisRoutes = require('./analysis.routes');
const llmRoutes = require('./llm.routes');
const testRoutes = require('./test.routes');

// TODO: Migrate routes to modular structure (modules/*/routes.js) when refactoring
// Currently mounting existing route files directly

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/surveys', surveyRoutes);
router.use('/questions', questionRoutes);
router.use('/responses', responseRoutes);
router.use('/analysis', analysisRoutes);
router.use('/llm', llmRoutes);
router.use('/test', testRoutes);

module.exports = router;
