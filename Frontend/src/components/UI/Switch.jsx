// src/components/UI/Switch.jsx
import React from 'react';
import styles from './Switch.module.scss';

const Switch = ({ 
  checked = false, 
  onChange, 
  disabled = false, 
  size = 'medium',
  className = '',
  ...props 
}) => {
  return (
    <label className={`${styles.switch} ${styles[size]} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
        disabled={disabled}
        className={styles.input}
        {...props}
      />
      <span className={styles.slider}></span>
    </label>
  );
};

export default Switch;