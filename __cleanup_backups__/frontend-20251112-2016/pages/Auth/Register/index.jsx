import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../../components/common/Loader/Loader';
import styles from './Register.module.scss';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'user' // Default role
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      showError('Please fill in all required fields');
      return false;
    }

    if (formData.username.length < 3) {
      showError('Username must be at least 3 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.full_name,
        formData.role
      );

      showSuccess('Registration successful! Redirecting to dashboard...');
      
      // Redirect based on role
      setTimeout(() => {
        if (formData.role === 'user') {
          navigate('/surveys');
        } else {
          navigate('/dashboard');
        }
      }, 1000);
    } catch (error) {
      showError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        <div className={styles.registerCard}>
          {/* Logo and Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="#10b981"/>
                <path d="M12 18h24M12 24h24M12 30h16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>Join ALLMTAGS to create and manage surveys</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="full_name" className={styles.label}>
                  Full Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={styles.input}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="username" className={styles.label}>
                  Username <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className={styles.input}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={styles.input}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password <span className={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={styles.input}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm Password <span className={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={styles.input}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role" className={styles.label}>
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={styles.select}
                disabled={isLoading}
              >
                <option value="user">User - Take surveys</option>
                <option value="creator">Creator - Create and manage surveys</option>
              </select>
              <p className={styles.hint}>
                {formData.role === 'user' 
                  ? 'You can participate in surveys' 
                  : 'You can create, manage, and analyze surveys'}
              </p>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size="small" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Already have an account?{' '}
              <Link to="/login" className={styles.link}>
                Sign in
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

export default Register;
