// src/routes/user.routes.js
const express = require('express');
const { authenticate, isAdmin, isTeacherOrAdmin } = require('../middleware/auth.middleware');
const router = express.Router();

// Import user controller
const userController = require('../controllers/user.controller');

// Protected routes
router.get('/', authenticate, isTeacherOrAdmin, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

// Routes for filtering users by role
router.get('/role/teachers', authenticate, isTeacherOrAdmin, userController.getTeachers);
router.get('/role/students', authenticate, isTeacherOrAdmin, userController.getStudents);

module.exports = router;
