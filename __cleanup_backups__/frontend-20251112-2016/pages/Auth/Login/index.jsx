import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../../components/common/Loader/Loader';
import styles from './Login.module.scss';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, state } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.identifier || !formData.password) {
      showError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Login via AuthContext (which uses auth.service.js)
      await login({
        email: formData.identifier,
        password: formData.password
      });

      showSuccess('Login successful!');
      
      // Get redirect path from location state or default to role-based route
      const from = location.state?.from?.pathname;
      const userRole = state.user?.role;
      
      let redirectPath = '/dashboard';
      if (from && from !== '/login') {
        redirectPath = from;
      } else if (userRole === 'user') {
        redirectPath = '/surveys';
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          {/* Logo and Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="#10b981"/>
                <path d="M12 18h24M12 24h24M12 30h16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in to your ALLMTAGS account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="identifier" className={styles.label}>
                Email or Username
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Enter your email or username"
                className={styles.input}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={styles.input}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <div className={styles.formFooter}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className={styles.link}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size="small" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Don't have an account?{' '}
              <Link to="/register" className={styles.link}>
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative Background */}
        <div className={styles.background}>
          <div className={styles.circle1}></div>
          <div className={styles.circle2}></div>
          <div className={styles.circle3}></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
