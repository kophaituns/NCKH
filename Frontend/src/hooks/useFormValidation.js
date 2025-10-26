import { useState, useCallback } from 'react';
import { ValidationService, FieldValidation, ValidationResult } from '../services/validationService.jsx';

interface UseFormValidationProps<T> {
  initialValues: T;
  validations: Record<keyof T, FieldValidation>;
}

interface UseFormValidationReturn<T> {
  values: T;
  errors: Record<keyof T, string[]>;
  touched: Record<keyof T, boolean>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  validateField: (name: keyof T) => void;
  validateForm: () => boolean;
  setFieldValue: (name: keyof T, value) => void;
  resetForm: () => void;
  isValid: boolean;
}

export function useFormValidation<T extends Record<string, string>>({
  initialValues,
  validations,
}): UseFormValidationReturn<T> {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState>(() => {
    const initialErrors: Partial<Record<keyof T, string[]>> = {};
    Object.keys(initialValues).forEach((key) => {
      initialErrors[key T] = [];
    });
    return initialErrors;
  });
  const [touched, setTouched] = useState>(() => {
    const initialTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(initialValues).forEach((key) => {
      initialTouched[key T] = false;
    });
    return initialTouched;
  });

  const validateField = useCallback((name: keyof T) => {
    const validation = validations[name];
    const value = values[name];
    const result = ValidationService.validateField(value, validation);
    
    setErrors(prev => ({
      ...prev,
      [name]: result.errors,
    }));

    return result.isValid;
  }, [values, validations]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name],
    }));
    
    if (touched[name T]) {
      validateField(name T);
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name],
    }));
    validateField(name T);
  }, [validateField]);

  const validateForm = useCallback((): boolean => {
    const validationResults: Record<keyof T, ValidationResult> = {};

    Object.keys(values).forEach((key) => {
      const fieldKey = key T;
      validationResults[fieldKey] = ValidationService.validateField(
        values[fieldKey],
        validations[fieldKey]
      );
    });

    const newErrors: Record<keyof T, string[]> = {};
    Object.keys(validationResults).forEach((key) => {
      const fieldKey = key T;
      newErrors[fieldKey] = validationResults[fieldKey].errors;
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    );

    return ValidationService.isFormValid(validationResults);
  }, [values, validations]);

  const setFieldValue = useCallback((name: keyof T, value) => {
    setValues(prev => ({
      ...prev,
      [name],
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors(
      Object.keys(initialValues).reduce(
        (acc, key) => ({ ...acc, [key]: [] }),
        {}
      )
    );
    setTouched(
      Object.keys(initialValues).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {}
      )
    );
  }, [initialValues]);

  const isValid = Object.values(errors).every((fieldErrors) => fieldErrors.length === 0);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    setFieldValue,
    resetForm,
    isValid,
  };
}