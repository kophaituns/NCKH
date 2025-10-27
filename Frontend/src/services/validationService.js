// Validation service
export const emailRules = { 
  required: true, 
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
};

// Validation functions return error message or null
export const required = (value) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return 'This field is required';
  }
  return null;
};

export const minLength = (value) => {
  const min = 6; // Default minimum length
  if (!value || value.length < min) {
    return `Must be at least ${min} characters`;
  }
  return null;
};

export const customRules = (value) => {
  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    return 'Please enter a valid email address';
  }
  return null;
};

