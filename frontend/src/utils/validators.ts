import { VALIDATION_RULES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateRequired = (value: any): string | null => {
  if (value === null || value === undefined || value === '') {
    return VALIDATION_RULES.REQUIRED;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return VALIDATION_RULES.EMAIL;
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null;
  
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return VALIDATION_RULES.PHONE;
  }
  return null;
};

export const validateMinLength = (value: string, min: number): string | null => {
  if (!value) return null;
  
  if (value.length < min) {
    return VALIDATION_RULES.MIN_LENGTH(min);
  }
  return null;
};

export const validateMaxLength = (value: string, max: number): string | null => {
  if (!value) return null;
  
  if (value.length > max) {
    return VALIDATION_RULES.MAX_LENGTH(max);
  }
  return null;
};

export const validatePositiveNumber = (value: number | string): string | null => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || num < 0) {
    return VALIDATION_RULES.POSITIVE_NUMBER;
  }
  return null;
};

export const validateFutureDate = (date: string | Date): string | null => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  if (dateObj <= today) {
    return VALIDATION_RULES.FUTURE_DATE;
  }
  return null;
};

export const validatePastDate = (date: string | Date): string | null => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  if (dateObj >= today) {
    return VALIDATION_RULES.PAST_DATE;
  }
  return null;
};

export const validateForm = (data: Record<string, any>, rules: Record<string, any[]>): ValidationResult => {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    for (const rule of fieldRules) {
      let error: string | null = null;
      
      if (typeof rule === 'function') {
        error = rule(value);
      } else if (typeof rule === 'object') {
        switch (rule.type) {
          case 'required':
            error = validateRequired(value);
            break;
          case 'email':
            error = validateEmail(value);
            break;
          case 'phone':
            error = validatePhone(value);
            break;
          case 'minLength':
            error = validateMinLength(value, rule.value);
            break;
          case 'maxLength':
            error = validateMaxLength(value, rule.value);
            break;
          case 'positiveNumber':
            error = validatePositiveNumber(value);
            break;
          case 'futureDate':
            error = validateFutureDate(value);
            break;
          case 'pastDate':
            error = validatePastDate(value);
            break;
        }
      }
      
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Common validation rule sets
export const COMMON_VALIDATIONS = {
  REQUIRED: [{ type: 'required' }],
  EMAIL: [{ type: 'email' }],
  PHONE: [{ type: 'phone' }],
  PASSWORD: [
    { type: 'required' },
    { type: 'minLength', value: 8 },
  ],
  POSITIVE_NUMBER: [
    { type: 'required' },
    { type: 'positiveNumber' },
  ],
  NAME: [
    { type: 'required' },
    { type: 'minLength', value: 2 },
    { type: 'maxLength', value: 50 },
  ],
  DESCRIPTION: [
    { type: 'maxLength', value: 500 },
  ],
};