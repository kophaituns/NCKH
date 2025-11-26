// modules/users/repository/user.repository.js
const { User } = require('../../../src/models');
const { Op } = require('sequelize');

class UserRepository {
  /**
   * Find all users with optional filters
   */
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 100, search, role } = options;
      const offset = (page - 1) * limit;

      const where = {};
      
      // Add search filter
      if (search) {
        where[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { full_name: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add role filter
      if (role) {
        where.role = role;
      }

      const { rows: users, count: total } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email },
        attributes: { exclude: ['password'] }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    try {
      const user = await User.findOne({
        where: { username },
        attributes: { exclude: ['password'] }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new user
   */
  async create(userData) {
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id, userData) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      await user.update(userData);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      await user.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats() {
    try {
      const stats = await User.findAll({
        attributes: [
          'role',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        group: ['role']
      });

      // Transform to object format
      const roleStats = {
        admin: 0,
        creator: 0,
        user: 0
      };

      stats.forEach(stat => {
        roleStats[stat.role] = parseInt(stat.get('count'));
      });

      return roleStats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({
        where: {
          last_login: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      const roleStats = await this.getRoleStats();

      return {
        totalUsers,
        activeUsers,
        ...roleStats
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserRepository();
