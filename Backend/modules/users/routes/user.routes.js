// modules/users/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const { authenticate, isAdmin } = require('../../auth-rbac/middleware/auth.middleware');

/**
 * @route   GET /api/modules/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, isAdmin, userController.getAllUsers);

/**
 * @route   GET /api/modules/users/role-stats
 * @desc    Get user statistics by role
 * @access  Private/Admin
 */
router.get('/role-stats', authenticate, isAdmin, userController.getRoleStats);

/**
 * @route   GET /api/modules/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin
 */
router.get('/stats', authenticate, isAdmin, userController.getUserStats);

/**
 * @route   GET /api/modules/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/:id', authenticate, isAdmin, userController.getUserById);

/**
 * @route   POST /api/modules/users
 * @desc    Create new user
 * @access  Private/Admin
 */
router.post('/', authenticate, isAdmin, userController.createUser);

/**
 * @route   PUT /api/modules/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
router.put('/:id', authenticate, isAdmin, userController.updateUser);

/**
 * @route   DELETE /api/modules/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

/**
 * @route   PATCH /api/modules/users/:id/role
 * @desc    Update user role
 * @access  Private/Admin
 */
router.patch('/:id/role', authenticate, isAdmin, userController.updateUserRole);

module.exports = router;
