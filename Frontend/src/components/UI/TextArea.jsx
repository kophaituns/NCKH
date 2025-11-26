// src/components/UI/TextArea.jsx
import React from 'react';
import styles from './TextArea.module.scss';

const TextArea = ({ 
  value, 
  onChange, 
  placeholder, 
  rows = 4, 
  disabled = false, 
  error = false,
  className = '',
  ...props 
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`${styles.textarea} ${error ? styles.error : ''} ${className}`}
      {...props}
    />
  );
};

export default TextArea;