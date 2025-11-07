// src/modules/auth-rbac/service/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { username, email, password, full_name, role = 'user' } = userData;

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      full_name,
      role
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    return {
      user: userResponse,
      ...tokens
    };
  }

  /**
   * Login user
   */
  async login(identifier, password) {
    // Find user by username or email
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    return {
      user: userResponse,
      ...tokens
    };
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    return { token, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      const user = await User.findByPk(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.toJSON();
  }
}

module.exports = new AuthService();
