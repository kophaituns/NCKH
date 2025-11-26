// src/components/UI/Card/Card.jsx
import React from 'react';
import styles from './Card.module.scss';

const Card = ({ 
  children, 
  className = '', 
  padding = true,
  shadow = true,
  ...props 
}) => {
  const cardClasses = [
    styles.card,
    padding && styles.padding,
    shadow && styles.shadow,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;