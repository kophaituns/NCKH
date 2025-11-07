// src/modules/users/service/user.service.js
const { User } = require('../../../models');
const { Op } = require('sequelize');

class UserService {
  /**
   * Get all users with pagination
   */
  async getAllUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    return {
      users,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update user fields
    const fieldsToUpdate = {};
    
    if (updateData.email) fieldsToUpdate.email = updateData.email;
    if (updateData.full_name) fieldsToUpdate.full_name = updateData.full_name;
    if (updateData.faculty) fieldsToUpdate.faculty = updateData.faculty;
    if (updateData.class_name) fieldsToUpdate.class_name = updateData.class_name;
    if (updateData.student_id) fieldsToUpdate.student_id = updateData.student_id;
    if (updateData.role) fieldsToUpdate.role = updateData.role;

    await user.update(fieldsToUpdate);

    // Return user without password
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      student_id: user.student_id,
      faculty: user.faculty,
      class_name: user.class_name
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    await user.destroy();
    return true;
  }

  /**
   * Check if user has permission to view another user
   */
  canViewUser(requestingUser, targetUserId) {
    // Admin and creators can view anyone
    if (requestingUser.role === 'admin' || requestingUser.role === 'creator') {
      return true;
    }
    
    // Users can only view themselves
    return requestingUser.id === parseInt(targetUserId);
  }

  /**
   * Check if user has permission to update another user
   */
  canUpdateUser(requestingUser, targetUserId) {
    // Admin can update anyone
    if (requestingUser.role === 'admin') {
      return true;
    }
    
    // Users can only update themselves
    return requestingUser.id === parseInt(targetUserId);
  }

  /**
   * Check if user can change roles
   */
  canChangeRole(requestingUser) {
    return requestingUser.role === 'admin';
  }
}

module.exports = new UserService();
