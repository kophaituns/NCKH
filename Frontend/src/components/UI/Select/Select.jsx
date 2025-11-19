// src/components/UI/Select/Select.jsx
import React from 'react';
import styles from './Select.module.scss';

const Select = ({ 
  value,
  onChange,
  placeholder = 'Chọn một tùy chọn',
  children,
  className = '',
  error = false,
  disabled = false,
  ...props 
}) => {
  const selectClasses = [
    styles.select,
    error && styles.error,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value, e);
    }
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className={selectClasses}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
};

export default Select;