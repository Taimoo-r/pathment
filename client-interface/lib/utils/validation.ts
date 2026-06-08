// Validation utilities for forms
import { extractApiErrorMessage } from './api-error';

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

// Single source of truth for password rules — MUST match the server's Joi rule
// in server/src/validations/authValidation.js (special = ANY non-alphanumeric).
export const passwordRules: { label: string; test: (p: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'A lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { label: 'An uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'A number (0–9)', test: (p) => /[0-9]/.test(p) },
  { label: 'A special character (e.g. ! @ # $ % & *)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const PASSWORD_HINT =
  'Use 8+ characters with an uppercase letter, a lowercase letter, a number, and a special character (e.g. ! @ # $ % & *).';

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors = passwordRules.filter((r) => !r.test(password)).map((r) => `Password needs: ${r.label.toLowerCase()}`);
  return { valid: errors.length === 0, errors };
};

export const validateUrl = (url: string): boolean => {
  return urlRegex.test(url);
};

export const validateRequired = (value: string | undefined | null): boolean => {
  return value !== undefined && value !== null && value.trim().length > 0;
};

/**
 * Phone validation. Empty is allowed (the field is optional everywhere we use
 * it); a non-empty value must look like a real phone — digits with optional
 * +, spaces, dashes, dots, parens — and carry 7–15 actual digits. Rejects free
 * text like "this si number".
 */
export const validatePhone = (phone: string | undefined | null): boolean => {
  const v = (phone || '').trim();
  if (!v) return true;
  if (!/^[+(]?[\d\s().+-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

/**
 * One-stop validation for the shared profile/settings fields. Returns the first
 * human-readable error, or null if all valid. Used by every role's
 * Settings → Profile save so the rules are identical everywhere.
 */
export const validateProfileFields = (p: {
  phone?: string; linkedinUrl?: string; githubUrl?: string; portfolioUrl?: string;
}): string | null => {
  if (!validatePhone(p.phone)) return 'Enter a valid phone number (digits, spaces, + and - only).';
  const urls: [string, string | undefined][] = [
    ['LinkedIn', p.linkedinUrl], ['GitHub', p.githubUrl], ['Portfolio', p.portfolioUrl],
  ];
  for (const [label, val] of urls) {
    if (val && val.trim() && !validateUrl(val.trim())) return `Enter a valid ${label} URL (e.g. https://…).`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Extracts and formats field-level validation errors from an API error response.
 * Returns a bullet-point string if the response contains an `errors` array,
 * otherwise falls back to the generic `message` field.
 *
 * @example
 * // "• End date must be after start date\n• maxEnrollments must be a number"
 * getValidationErrors(error)
 */
export const getValidationErrors = (error: any): string => {
  const errors = error?.response?.data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.map((e: { field: string; message: string }) => `\u2022 ${e.message}`).join('\n');
  }
  return extractApiErrorMessage(error, 'Something went wrong');
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  return new Date(startDate) < new Date(endDate);
};
