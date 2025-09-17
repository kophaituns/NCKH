// src/index.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const surveyRoutes = require('./routes/survey.routes');
const questionRoutes = require('./routes/question.routes');
const responseRoutes = require('./routes/response.routes');
const analysisRoutes = require('./routes/analysis.routes');
const llmRoutes = require('./routes/llm.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: [
    'http://localhost:3001', // React dev server (Frontend)
    'http://127.0.0.1:3001', // Alternative localhost format
    'http://localhost:3000', // Fallback for other dev environments
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// API Routes
const testRoutes = require('./routes/test.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/test', testRoutes); // Test routes for development

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the LLM Survey API',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start the server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
});

module.exports = app; // For testing purposes
