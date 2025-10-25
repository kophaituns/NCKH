// src/routes/auth.routes.js
const express = require('express');
const { register, login, getProfile, logout, changePassword, refreshToken } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (require authentication)
router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
