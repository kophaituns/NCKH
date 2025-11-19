// src/components/UI/Button/Button.jsx
import React from 'react';
import styles from './Button.module.scss';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', // primary, secondary, outline, danger
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className={styles.spinner}>
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : children}
    </button>
  );
};

export default Button;