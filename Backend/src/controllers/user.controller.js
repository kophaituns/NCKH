// src/controllers/user.controller.js
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all users (paginated)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get users
    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    return res.status(200).json({
      error: false,
      data: {
        users,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching users'
    });
  }
};

/**
 * Get user by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the requesting user has permission to view this user
    if (req.user.role === 'student' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to view this user'
      });
    }

    // Find user
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      error: false,
      data: { user }
    });
  } catch (error) {
    logger.error(`Error fetching user with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching user'
    });
  }
};

/**
 * Update user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, faculty, class_name, student_id, role } = req.body;

    // Check if the requesting user has permission to update this user
    if (req.user.role === 'student' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to update this user'
      });
    }

    // If not admin, prevent role changes
    if (req.user.role !== 'admin' && role) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to change user roles'
      });
    }

    // Find user
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Update user fields
    const updateData = {
      ...(email && { email }),
      ...(full_name && { full_name }),
      ...(faculty && { faculty }),
      ...(class_name && { class_name }),
      ...(student_id && { student_id }),
      ...(role && req.user.role === 'admin' && { role })
    };

    await user.update(updateData);

    return res.status(200).json({
      error: false,
      message: 'User updated successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          student_id: user.student_id,
          faculty: user.faculty,
          class_name: user.class_name
        }
      }
    });
  } catch (error) {
    logger.error(`Error updating user with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while updating user'
    });
  }
};

/**
 * Delete user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Delete user
    await user.destroy();

    return res.status(200).json({
      error: false,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting user with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while deleting user'
    });
  }
};

/**
 * Get all teachers
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getTeachers = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get teachers
    const { count, rows: teachers } = await User.findAndCountAll({
      where: { role: 'teacher' },
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    return res.status(200).json({
      error: false,
      data: {
        teachers,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching teachers:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching teachers'
    });
  }
};

/**
 * Get all students
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getStudents = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filter options
    const { faculty, class_name } = req.query;
    const whereClause = { role: 'student' };
    
    if (faculty) whereClause.faculty = faculty;
    if (class_name) whereClause.class_name = class_name;

    // Get students
    const { count, rows: students } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    return res.status(200).json({
      error: false,
      data: {
        students,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching students:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching students'
    });
  }
};
