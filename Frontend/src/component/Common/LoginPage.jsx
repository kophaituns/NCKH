import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { required, minLength, customRules } from '../../services/validationService.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faEnvelope, faLock, faChevronRight, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './LoginPage.scss';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, state, dispatch } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
  } = useFormValidation({
    initialValues: {
      email: '',
      password: '',
    },
    validations: {
      email: {
        required,
        customRules,
      },
      password: {
        required,
        minLength,
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      
      console.error('Login failed:', error);
      
      setTimeout(() => {
        dispatch({ type: 'CLEAR_ERROR' });
      }, 5000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          {state.isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          )}
          
          <div className="login-header">
            <div className="brand-logo">
              <FontAwesomeIcon icon={faRobot} className="brand-icon" />
              <div className="brand-text">
                Smart <span className="brand-highlight">Survey</span> AI
              </div>
            </div>
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to your account to continue your survey journey</p>
          </div>

          {state.error && (
            <div className="alert alert-error">
              <FontAwesomeIcon icon={faLock} />
              <span>{state.error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faEnvelope} className="form-icon" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your email address"
                className={`form-control ${touched.email && errors.email?.length > 0 ? 'is-invalid' : ''}`}
                disabled={state.isLoading}
              />
              {touched.email && errors.email?.length > 0 && (
                <div className="invalid-feedback">{errors.email[0]}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faLock} className="form-icon" />
                Password
              </label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  className={`form-control ${touched.password && errors.password?.length > 0 ? 'is-invalid' : ''}`}
                  disabled={state.isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={state.isLoading}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {touched.password && errors.password?.length > 0 && (
                <div className="invalid-feedback">{errors.password[0]}</div>
              )}
            </div>

            <div className="form-footer">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <button type="button" className="link-button">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FontAwesomeIcon icon={faChevronRight} className="btn-icon" />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="divider">
              <span>or</span>
            </div>
            
            <p className="signup-text">
              Don't have an account?{' '}
              <button 
                className="link-button link-primary"
                onClick={() => navigate('/register')}
              >
                Create one now
              </button>
            </p>
          </div>

          <div className="test-accounts">
            <h6 className="test-accounts-title"> Test Accounts Available</h6>
            <div className="test-accounts-grid">
              <div className="test-account">
                <strong className="account-role admin">Admin</strong>
                <code>admin@example.com</code>
                <code>admin123</code>
              </div>
              <div className="test-account">
                <strong className="account-role teacher">Teacher</strong>
                <code>teacher1@example.com</code>
                <code>teacher123</code>
              </div>
            </div>
            <div className="test-accounts-note">
              <small>
                <strong>Students:</strong> student1-5@example.com<br />
                <strong>Password:</strong> 123456 (for all)
              </small>
            </div>
          </div>

          <div className="back-home">
            <button
              className="link-button"
              onClick={() => navigate('/')}
            >
               Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

