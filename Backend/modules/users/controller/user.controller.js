// modules/users/controller/user.controller.js
const userService = require('../service/user.service');
const logger = require('../../../src/utils/logger');

class UserController {
  /**
   * Get all users
   */
  async getAllUsers(req, res) {
    try {
      const { page, limit, search, role } = req.query;
      const users = await userService.getAllUsers({ page, limit, search, role });
      
      res.status(200).json({
        success: true,
        data: users,
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting all users:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to retrieve user'
      });
    }
  }

  /**
   * Create new user
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      const newUser = await userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully'
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to create user'
      });
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const updatedUser = await userService.updateUser(id, userData);
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to update user'
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const updatedUser = await userService.updateUserRole(id, role);
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User role updated successfully'
      });
    } catch (error) {
      logger.error('Error updating user role:', error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to update user role'
      });
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(req, res) {
    try {
      const stats = await userService.getRoleStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Role statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting role stats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to retrieve role statistics'
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting user stats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to retrieve user statistics'
      });
    }
  }
}

module.exports = new UserController();
