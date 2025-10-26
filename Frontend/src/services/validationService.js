export 

export 

export 

export const emailRules: ValidationRule[] = [
  {
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address'
  }
];

export const passwordRules: ValidationRule[] = [
  {
    test: (value) => value.length >= 8,
    message: 'Password must be at least 8 characters long'
  },
  {
    test: (value) => /[A-Z]/.test(value),
    message: 'Password must contain at least one uppercase letter'
  },
  {
    test: (value) => /[a-z]/.test(value),
    message: 'Password must contain at least one lowercase letter'
  },
  {
    test: (value) => /[0-9]/.test(value),
    message: 'Password must contain at least one number'
  },
  {
    test: (value) => /[!@#$%^&*]/.test(value),
    message: 'Password must contain at least one special character (!@#$%^&*)'
  }
];

export const usernameRules: ValidationRule[] = [
  {
    test: (value) => value.length >= 3,
    message: 'Username must be at least 3 characters long'
  },
  {
    test: (value) => /^[a-zA-Z0-9_]+$/.test(value),
    message: 'Username can only contain letters, numbers, and underscores'
  }
];

export class ValidationService {
  static validateField(value, validation): ValidationResult {
    const errors: string[] = [];

    // Required check
    if (validation.required && !value.trim()) {
      errors.push('This field is required');
      return { isValid, errors };
    }

    // Min length check
    if (validation.minLength && value.length < validation.minLength) {
      errors.push(`Minimum length is ${validation.minLength} characters`);
    }

    // Max length check
    if (validation.maxLength && value.length > validation.maxLength) {
      errors.push(`Maximum length is ${validation.maxLength} characters`);
    }

    // Pattern check
    if (validation.pattern && !validation.pattern.test(value)) {
      errors.push('Invalid format');
    }

    // Custom rules check
    if (validation.customRules) {
      validation.customRules.forEach(rule => {
        if (!rule.test(value)) {
          errors.push(rule.message);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateForm(values, validations): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    Object.keys(validations).forEach(field => {
      results[field] = this.validateField(values[field], validations[field]);
    });

    return results;
  }

  static isFormValid(validationResults): boolean {
    return Object.values(validationResults).every(result => result.isValid);
  }
}