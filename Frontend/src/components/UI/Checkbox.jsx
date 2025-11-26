// src/components/UI/Checkbox.jsx
import React from 'react';
import styles from './Checkbox.module.scss';

const Checkbox = ({ 
  checked = false, 
  onChange, 
  disabled = false, 
  label = '',
  className = '',
  ...props 
}) => {
  return (
    <label className={`${styles.checkboxContainer} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
        disabled={disabled}
        className={styles.checkbox}
        {...props}
      />
      <span className={styles.checkmark}></span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
};

export default Checkbox;