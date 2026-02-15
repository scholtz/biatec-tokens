/**
 * Form validation utilities
 * 
 * Shared validation patterns and functions used across the application.
 */

/**
 * Email validation regex
 * Matches standard email format: local@domain.tld
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email address
 * @param email Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * Validate required field
 * @param value Field value
 * @returns true if non-empty after trimming
 */
export function isRequiredFieldValid(value: string): boolean {
  return value.trim() !== ''
}
