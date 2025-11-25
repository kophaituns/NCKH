/**
 * Authentication & RBAC Service Module
 * ======================================
 * 
 * FEATURE: Secure User Authentication & Role-Based Access Control (RBAC)
 * 
 * This service provides complete authentication and authorization system:
 * - User registration with password hashing (bcrypt, 10 salt rounds)
 * - Login with JWT token generation
 * - Access token refresh mechanism
 * - Role-based authorization (admin, teacher, student)
 * - User profile management
 * 
 * Security Features:
 *   ✅ Password hashing with bcrypt (never stored in plain text)
 *   ✅ JWT tokens with expiration (24h access, 7d refresh)
 *   ✅ Unique username and email validation
 *   ✅ Token refresh mechanism without password re-entry
 *   ✅ Protected routes based on role and permissions
 * 
 * User Roles:
 *   1. admin: Full system access, manage all users and surveys
 *   2. teacher: Create surveys, view responses, manage own templates
 *   3. student: Take surveys, view own responses
 * 
 * Authentication Flow:
 *   1. User registers → bcrypt hash password → create user record
 *   2. User logs in → verify credentials → generate JWT pair
 *   3. Frontend stores token in httpOnly cookie for security
 *   4. Subsequent requests include token in Authorization header
 *   5. Middleware validates token → extract user info
 *   6. If token expires → use refreshToken to get new access token
 * 
 * Token Structure (JWT Payload):
 *   {
 *     id: user_id,
 *     username: string,
 *     role: 'admin'|'teacher'|'student',
 *     iat: issued_at_timestamp,
 *     exp: expiration_timestamp
 *   }
 * 
 * Integration Points:
 *   - Used by: All controllers via auth.middleware.js
 *   - Database: User model with password field
 *   - Environment: JWT_SECRET, JWT_EXPIRES_IN from .env
 */

// src/modules/auth-rbac/service/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models');

class AuthService {
  /**
   * FEATURE: User Registration with Secure Password Hashing
   * 
   * Purpose: Create new user account with validated credentials
   * 
   * Parameters:
   *   - userData.username: Unique username (alphanumeric recommended)
   *   - userData.email: Valid email (must be unique)
   *   - userData.password: Raw password (will be hashed)
   *   - userData.full_name: User's display name
   *   - userData.role: User role (default: 'user', can be 'admin'|'teacher'|'student')
   * 
   * Security:
   *   1. Check for duplicate username/email
   *   2. Hash password with bcrypt (10 salt rounds = ~100ms per hash)
   *   3. Store only hashed password in database
   *   4. Never return password in response
   * 
   * Returns: Object with:
   *   - user: User object (without password)
   *   - token: JWT access token (expires in 24h)
   *   - refreshToken: JWT refresh token (expires in 7d)
   * 
   * Throws: 
   *   - 'Username or email already exists' if duplicate
   *   - Database errors
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
