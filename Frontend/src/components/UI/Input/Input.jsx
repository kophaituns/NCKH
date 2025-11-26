// src/components/UI/Input/Input.jsx
import React from 'react';
import styles from './Input.module.scss';

const Input = ({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  error = false,
  disabled = false,
  ...props 
}) => {
  const inputClasses = [
    styles.input,
    error && styles.error,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={inputClasses}
      disabled={disabled}
      {...props}
    />
  );
};

export default Input;