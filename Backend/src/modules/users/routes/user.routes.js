// src/modules/users/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const { authenticate, isTeacherOrAdmin, isAdmin } = require('../../../middleware/auth.middleware');

// Admin: create user
router.post('/', authenticate, isAdmin, userController.createUser);

// Current user settings (đặt TRƯỚC các route có :id)
router.get('/me/settings', authenticate, userController.getMySettings);
router.put('/me/settings', authenticate, userController.updateMySettings);
router.post('/me/delete-personal-data', authenticate, userController.deletePersonalData);

// Protected routes
router.get('/', authenticate, isTeacherOrAdmin, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

module.exports = router;
