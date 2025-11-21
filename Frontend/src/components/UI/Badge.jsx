// src/components/UI/Badge.jsx
import React from 'react';
import styles from './Badge.module.scss';

const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  className = '',
  ...props 
}) => {
  return (
    <span 
      className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;