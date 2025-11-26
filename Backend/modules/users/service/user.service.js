// modules/users/service/user.service.js
const userRepository = require('../repository/user.repository');
const bcrypt = require('bcrypt');

class UserService {
  /**
   * Get all users with optional filters
   */
  async getAllUsers(options = {}) {
    try {
      const users = await userRepository.findAll(options);
      return users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser) {
        const error = new Error('User with this email already exists');
        error.statusCode = 400;
        throw error;
      }

      // Check username
      if (userData.username) {
        const existingUsername = await userRepository.findByUsername(userData.username);
        if (existingUsername) {
          const error = new Error('Username already taken');
          error.statusCode = 400;
          throw error;
        }
      }

      // Hash password if provided
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const newUser = await userRepository.create(userData);
      
      // Remove password from response
      const userResponse = newUser.toJSON();
      delete userResponse.password;
      
      return userResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id, userData) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Check email uniqueness if being updated
      if (userData.email && userData.email !== user.email) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
          const error = new Error('Email already in use');
          error.statusCode = 400;
          throw error;
        }
      }

      // Check username uniqueness if being updated
      if (userData.username && userData.username !== user.username) {
        const existingUsername = await userRepository.findByUsername(userData.username);
        if (existingUsername) {
          const error = new Error('Username already taken');
          error.statusCode = 400;
          throw error;
        }
      }

      // Hash password if being updated
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const updatedUser = await userRepository.update(id, userData);
      
      // Remove password from response
      const userResponse = updatedUser.toJSON();
      delete userResponse.password;
      
      return userResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      await userRepository.delete(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(id, role) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      const validRoles = ['admin', 'creator', 'user'];
      if (!validRoles.includes(role)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
      }

      const updatedUser = await userRepository.update(id, { role });
      
      // Remove password from response
      const userResponse = updatedUser.toJSON();
      delete userResponse.password;
      
      return userResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats() {
    try {
      const stats = await userRepository.getRoleStats();
      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const stats = await userRepository.getUserStats();
      return stats;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
