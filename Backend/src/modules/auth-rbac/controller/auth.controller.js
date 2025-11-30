// src/modules/auth-rbac/controller/auth.controller.js
const authService = require('../service/auth.service');
const logger = require('../../../utils/logger');

class AuthController {
  /**
   * Register new user
   */
  async register(req, res) {
    try {
      const { username, email, password, full_name, role } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }

      const result = await authService.register({
        username,
        email,
        password,
        full_name,
        role
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error registering user'
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { username, email, password } = req.body;

      // Accept either username or email
      const identifier = username || email;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username/email and password are required'
        });
      }

      const result = await authService.login(identifier, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid credentials'
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const tokens = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid refresh token'
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const profile = await authService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: { user: profile }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching profile'
      });
    }
  }
    /**
   * Update current user profile
   */
  async updateProfile(req, res) {
    try {
      const { full_name, bio, dateOfBirth, gender } = req.body;

      const updatedUser = await authService.updateProfile(req.user.id, {
        full_name,
        bio,
        dateOfBirth,
        gender,
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error updating profile',
      });
    }
  }


  /**
   * Logout (client-side token removal, but can be extended)
   */
  async logout(req, res) {
    try {
      // In a real system, you might blacklist the token here
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
  }
}

module.exports = new AuthController();
