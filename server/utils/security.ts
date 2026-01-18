import { escape } from 'html-escaper';

/**
 * Sanitizes user input to prevent XSS attacks and SQL injection
 * @param input The user input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // Convert to string if not already
  const str = String(input);
  
  // Escape HTML special characters
  const escaped = escape(str);
  
  // Remove any SQL injection attempts
  const noSql = escaped.replace(/['";]/g, '');
  
  // Remove any script tags
  const noScripts = noSql.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  return noScripts.trim();
}

/**
 * Validates and sanitizes an email address
 * @param email The email address to validate
 * @returns Sanitized email address or throws error if invalid
 */
export function validateEmail(email: string): string {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address');
  }
  return sanitizeInput(email.toLowerCase());
}

/**
 * Validates and sanitizes a phone number
 * @param phone The phone number to validate
 * @returns Sanitized phone number or throws error if invalid
 */
export function validatePhone(phone: string): string {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  if (!phoneRegex.test(phone)) {
    throw new Error('Invalid phone number');
  }
  return sanitizeInput(phone.replace(/\s/g, ''));
}

/**
 * Validates a password meets minimum security requirements
 * @param password The password to validate
 * @returns true if valid, throws error if invalid
 */
export function validatePassword(password: string): boolean {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    throw new Error('Password must contain at least one special character (!@#$%^&*)');
  }
  return true;
}

/**
 * Validates and sanitizes a URL
 * @param url The URL to validate
 * @returns Sanitized URL or throws error if invalid
 */
export function validateUrl(url: string): string {
  try {
    new URL(url);
    return sanitizeInput(url);
  } catch {
    throw new Error('Invalid URL');
  }
}

/**
 * Validates and sanitizes a postal/zip code
 * @param postalCode The postal code to validate
 * @returns Sanitized postal code or throws error if invalid
 */
export function validatePostalCode(postalCode: string): string {
  // Canadian postal code format
  const caPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  // US ZIP code format
  const usZipRegex = /^\d{5}(-\d{4})?$/;
  
  if (!caPostalRegex.test(postalCode) && !usZipRegex.test(postalCode)) {
    throw new Error('Invalid postal/zip code');
  }
  return sanitizeInput(postalCode.toUpperCase());
}

/**
 * Validates and sanitizes a credit card number
 * @param cardNumber The credit card number to validate
 * @returns Last 4 digits of the card number
 */
export function validateCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    throw new Error('Invalid credit card number');
  }
  return digits.slice(-4);
}

/**
 * Validates a date is not in the past
 * @param date The date to validate
 * @returns true if valid, throws error if invalid
 */
export function validateFutureDate(date: Date): boolean {
  const now = new Date();
  if (date < now) {
    throw new Error('Date must be in the future');
  }
  return true;
}

/**
 * Validates and sanitizes numeric input
 * @param num The number to validate
 * @param min Optional minimum value
 * @param max Optional maximum value
 * @returns Sanitized number or throws error if invalid
 */
export function validateNumber(num: number | string, min?: number, max?: number): number {
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) {
    throw new Error('Invalid number');
  }
  if (min !== undefined && parsed < min) {
    throw new Error(`Number must be at least ${min}`);
  }
  if (max !== undefined && parsed > max) {
    throw new Error(`Number must be at most ${max}`);
  }
  return parsed;
} 