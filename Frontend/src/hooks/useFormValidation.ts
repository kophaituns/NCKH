import { useState, useCallback } from 'react';
import { ValidationService, FieldValidation, ValidationResult } from '../services/validationService';

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
  setFieldValue: (name: keyof T, value: string) => void;
  resetForm: () => void;
  isValid: boolean;
}

export function useFormValidation<T extends Record<string, string>>({
  initialValues,
  validations,
}: UseFormValidationProps<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string[]>>(() => {
    const initialErrors: Partial<Record<keyof T, string[]>> = {};
    Object.keys(initialValues).forEach((key) => {
      initialErrors[key as keyof T] = [];
    });
    return initialErrors as Record<keyof T, string[]>;
  });
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(() => {
    const initialTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(initialValues).forEach((key) => {
      initialTouched[key as keyof T] = false;
    });
    return initialTouched as Record<keyof T, boolean>;
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
      [name]: value,
    }));
    
    if (touched[name as keyof T]) {
      validateField(name as keyof T);
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    validateField(name as keyof T);
  }, [validateField]);

  const validateForm = useCallback((): boolean => {
    const validationResults: Record<keyof T, ValidationResult> = {} as Record<
      keyof T,
      ValidationResult
    >;

    Object.keys(values).forEach((key) => {
      const fieldKey = key as keyof T;
      validationResults[fieldKey] = ValidationService.validateField(
        values[fieldKey],
        validations[fieldKey]
      );
    });

    const newErrors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
    Object.keys(validationResults).forEach((key) => {
      const fieldKey = key as keyof T;
      newErrors[fieldKey] = validationResults[fieldKey].errors;
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      )
    );

    return ValidationService.isFormValid(validationResults);
  }, [values, validations]);

  const setFieldValue = useCallback((name: keyof T, value: string) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors(
      Object.keys(initialValues).reduce(
        (acc, key) => ({ ...acc, [key]: [] }),
        {} as Record<keyof T, string[]>
      )
    );
    setTouched(
      Object.keys(initialValues).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {} as Record<keyof T, boolean>
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