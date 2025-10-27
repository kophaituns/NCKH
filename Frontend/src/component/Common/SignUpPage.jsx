import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faUser, faEnvelope, faLock, faUserTag, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { UserRole } from '../../constants/userRoles.js';
import './SignUpPage.scss';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { register, state } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: UserRole.STUDENT,
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.full_name) newErrors.full_name = 'Full name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.full_name,
        formData.role
      );
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <div className="signup-card">
          {state.isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          )}

          <div className="signup-header">
            <div className="brand-logo">
              <FontAwesomeIcon icon={faRobot} className="brand-icon" />
              <div className="brand-text">
                Smart <span className="brand-highlight">Survey</span> AI
              </div>
            </div>
            <h2 className="signup-title">Create Account</h2>
            <p className="signup-subtitle">Join us and start creating surveys</p>
          </div>

          {state.error && (
            <div className="alert alert-danger">
              {state.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faUser} className="form-icon" />
                Username
              </label>
              <input
                type="text"
                name="username"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={state.isLoading}
              />
              {errors.username && (
                <div className="invalid-feedback">{errors.username}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faEnvelope} className="form-icon" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={state.isLoading}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faUser} className="form-icon" />
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={state.isLoading}
              />
              {errors.full_name && (
                <div className="invalid-feedback">{errors.full_name}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faLock} className="form-icon" />
                Password
              </label>
              <input
                type="password"
                name="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={state.isLoading}
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faLock} className="form-icon" />
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={state.isLoading}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faUserTag} className="form-icon" />
                Role
              </label>
              <select
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleInputChange}
                disabled={state.isLoading}
              >
                <option value={UserRole.STUDENT}>Student</option>
                <option value={UserRole.TEACHER}>Teacher</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-signup"
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <span className="spinner-small"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <FontAwesomeIcon icon={faChevronRight} className="btn-icon" />
                </>
              )}
            </button>
          </form>

          <div className="signup-footer">
            <p>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="link-button"
                disabled={state.isLoading}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
