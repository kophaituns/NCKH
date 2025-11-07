// src/app.js
// Express app configuration with middleware and route mounting
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration with environment-based origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Authorization'] // Expose Authorization header for JWT refresh
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger
app.use(morgan('dev'));

// Basic health check endpoint (legacy)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Mount modular routes at /api/modules
const moduleRoutes = require('./routes/modules.routes');
app.use('/api/modules', moduleRoutes);

// LEGACY ROUTES - DEPRECATED
// These routes are placeholders and should be removed after full migration to modular architecture
// Questions functionality is now handled by /api/modules/templates/:id/questions
// Test account creation is now handled by seed-demo-data.js script
// Uncomment only if needed for backward compatibility during transition period
/*
const questionRoutes = require('./routes/question.routes');
const testRoutes = require('./routes/test.routes');
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/test', testRoutes);
*/

// Root route for compatibility
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ALLMTAGS Survey API',
    version: '1.0.0',
    endpoints: {
      health: '/api/modules/health',
      modules: '/api/modules/*',
      documentation: 'See README.md for full API documentation'
    }
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

module.exports = app;
