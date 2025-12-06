// src/modules/users/service/user.service.js
const { User } = require('../../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt'); // Nếu project dùng bcryptjs thì đổi lại require('bcryptjs')

class UserService {
  /**
   * Create new user (for admin panel)
   */
  async createUser(data) {
    const { username, email, password, full_name, role = 'user' } = data;

    // Basic validation
    if (!username || !email || !password || !full_name) {
      const err = new Error('Missing required fields');
      err.statusCode = 400;
      throw err;
    }

    // Check duplicate username or email
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existing) {
      const err = new Error('Username or Email already exists');
      err.statusCode = 400;
      throw err;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure role is valid
    const allowedRoles = ['admin', 'creator', 'user'];
    const finalRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      full_name,
      role: finalRole
    });

    const plainUser = user.get({ plain: true });
    delete plainUser.password;

    return plainUser;
  }

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
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    const user = await User.findByPk(userId);

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const fieldsToUpdate = {};

    if (updateData.email && updateData.email !== user.email) {
      // Check duplicate email when changing
      const existingEmail = await User.findOne({
        where: {
          email: updateData.email,
          id: { [Op.ne]: userId }
        }
      });
      if (existingEmail) {
        const err = new Error('Email already in use');
        err.statusCode = 400;
        throw err;
      }
      fieldsToUpdate.email = updateData.email;
    }

    if (updateData.full_name) fieldsToUpdate.full_name = updateData.full_name;

    if (updateData.role) {
      const allowedRoles = ['admin', 'creator', 'user'];
      if (!allowedRoles.includes(updateData.role)) {
        const err = new Error('Invalid role');
        err.statusCode = 400;
        throw err;
      }
      fieldsToUpdate.role = updateData.role;
    }

    await user.update(fieldsToUpdate);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    await user.destroy();
    return true;
  }
    /**
   * Get settings for a user (notifications & privacy)
   */
  async getSettings(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      email_notifications_enabled: !!user.email_notifications_enabled,
      email_reminders_enabled: !!user.email_reminders_enabled,
      save_survey_history: !!user.save_survey_history,
      anonymous_survey_responses: !!user.anonymous_survey_responses,
    };
  }

  /**
   * Update settings for a user
   */
  async updateSettings(userId, settings) {
    const user = await User.findByPk(userId);

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const allowedFields = [
      'email_notifications_enabled',
      'email_reminders_enabled',
      'save_survey_history',
      'anonymous_survey_responses',
    ];

    for (const field of allowedFields) {
      if (typeof settings[field] !== 'undefined') {
        user[field] = !!settings[field];
      }
    }

    await user.save();

    return this.getSettings(userId);
  }

  /**
   * Delete personal data of a user (for Privacy feature)
   * NOTE: This will delete user row and all cascaded data (ON DELETE CASCADE).
   */
  async deletePersonalData(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
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
    return requestingUser.id === parseInt(targetUserId, 10);
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
    return requestingUser.id === parseInt(targetUserId, 10);
  }

  /**
   * Check if user can change roles
   */
  canChangeRole(requestingUser) {
    return requestingUser.role === 'admin';
  }
}

module.exports = new UserService();
