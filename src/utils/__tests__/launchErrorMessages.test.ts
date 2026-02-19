/**
 * Unit tests for launchErrorMessages utility
 *
 * Validates that:
 * 1. Every error code maps to an actionable, user-friendly message
 * 2. Messages follow the pattern: what happened → why it matters → what to do next
 * 3. classifyLaunchError correctly identifies error classes from raw errors
 * 4. Fallback to UNKNOWN is safe and recoverable
 */

import { describe, it, expect } from 'vitest';
import {
  getLaunchErrorMessage,
  classifyLaunchError,
  type LaunchErrorCode,
} from '../launchErrorMessages';

describe('launchErrorMessages', () => {
  describe('getLaunchErrorMessage', () => {
    const allCodes: LaunchErrorCode[] = [
      'AUTH_REQUIRED',
      'SESSION_EXPIRED',
      'VALIDATION_FAILED',
      'COMPLIANCE_INCOMPLETE',
      'NETWORK_UNAVAILABLE',
      'SAVE_FAILED',
      'STEP_LOAD_FAILED',
      'SUBMISSION_FAILED',
      'RATE_LIMITED',
      'UNKNOWN',
    ];

    it('should return a message for every defined error code', () => {
      for (const code of allCodes) {
        const msg = getLaunchErrorMessage(code);
        expect(msg).toBeDefined();
        expect(msg.title).toBeTruthy();
        expect(msg.description).toBeTruthy();
        expect(msg.action).toBeTruthy();
      }
    });

    it('should include a non-empty title for every error code', () => {
      for (const code of allCodes) {
        const msg = getLaunchErrorMessage(code);
        expect(msg.title.length).toBeGreaterThan(0);
      }
    });

    it('should include actionable next-step text for every error code', () => {
      for (const code of allCodes) {
        const msg = getLaunchErrorMessage(code);
        // Action should be present and suggest something the user can do
        expect(msg.action.length).toBeGreaterThan(10);
      }
    });

    it('should mark all current launch errors as recoverable', () => {
      for (const code of allCodes) {
        const msg = getLaunchErrorMessage(code);
        expect(msg.recoverable).toBe(true);
      }
    });

    it('should assign a valid severity level to each error', () => {
      const validSeverities = ['error', 'warning', 'info'];
      for (const code of allCodes) {
        const msg = getLaunchErrorMessage(code);
        expect(validSeverities).toContain(msg.severity);
      }
    });

    it('AUTH_REQUIRED should use info severity (not blocking, just redirecting)', () => {
      const msg = getLaunchErrorMessage('AUTH_REQUIRED');
      expect(msg.severity).toBe('info');
    });

    it('SESSION_EXPIRED should use warning severity', () => {
      const msg = getLaunchErrorMessage('SESSION_EXPIRED');
      expect(msg.severity).toBe('warning');
    });

    it('NETWORK_UNAVAILABLE should use error severity', () => {
      const msg = getLaunchErrorMessage('NETWORK_UNAVAILABLE');
      expect(msg.severity).toBe('error');
    });

    it('AUTH_REQUIRED message should mention sign-in', () => {
      const msg = getLaunchErrorMessage('AUTH_REQUIRED');
      expect(msg.action.toLowerCase()).toMatch(/sign\s+in/);
    });

    it('SESSION_EXPIRED message should mention signing in again', () => {
      const msg = getLaunchErrorMessage('SESSION_EXPIRED');
      expect(msg.action.toLowerCase()).toMatch(/sign\s+in/);
    });

    it('VALIDATION_FAILED message should mention correcting fields', () => {
      const msg = getLaunchErrorMessage('VALIDATION_FAILED');
      expect(msg.action.toLowerCase()).toMatch(/field|correct|error/);
    });

    it('COMPLIANCE_INCOMPLETE message should mention compliance checklist', () => {
      const msg = getLaunchErrorMessage('COMPLIANCE_INCOMPLETE');
      expect(msg.action.toLowerCase()).toMatch(/compliance/);
    });

    it('NETWORK_UNAVAILABLE message should mention checking connection', () => {
      const msg = getLaunchErrorMessage('NETWORK_UNAVAILABLE');
      expect(msg.action.toLowerCase()).toMatch(/connection|internet/);
    });

    it('UNKNOWN fallback should include support contact info', () => {
      const msg = getLaunchErrorMessage('UNKNOWN');
      // Should give users a way to get help when cause is unknown
      expect(msg.action.toLowerCase()).toMatch(/support|contact|try again/);
    });

    it('SESSION_EXPIRED message should mention draft preserved', () => {
      const msg = getLaunchErrorMessage('SESSION_EXPIRED');
      expect(msg.action.toLowerCase()).toMatch(/draft/);
    });

    it('RATE_LIMITED message should mention waiting before retrying', () => {
      const msg = getLaunchErrorMessage('RATE_LIMITED');
      expect(msg.action.toLowerCase()).toMatch(/wait|minute/);
    });
  });

  describe('classifyLaunchError', () => {
    it('should classify auth-related errors', () => {
      expect(classifyLaunchError(new Error('Unauthenticated request'))).toBe('AUTH_REQUIRED');
      expect(classifyLaunchError(new Error('unauthorized access'))).toBe('AUTH_REQUIRED');
      expect(classifyLaunchError('auth error')).toBe('AUTH_REQUIRED');
    });

    it('should classify session expiry errors', () => {
      expect(classifyLaunchError(new Error('Session expired'))).toBe('SESSION_EXPIRED');
      expect(classifyLaunchError(new Error('token expired'))).toBe('SESSION_EXPIRED');
      expect(classifyLaunchError('session timed out')).toBe('SESSION_EXPIRED');
    });

    it('should classify validation errors', () => {
      expect(classifyLaunchError(new Error('Validation failed for field'))).toBe('VALIDATION_FAILED');
      expect(classifyLaunchError(new Error('Invalid input provided'))).toBe('VALIDATION_FAILED');
      expect(classifyLaunchError('required field missing')).toBe('VALIDATION_FAILED');
    });

    it('should classify compliance errors', () => {
      expect(classifyLaunchError(new Error('Compliance checklist incomplete'))).toBe(
        'COMPLIANCE_INCOMPLETE',
      );
      expect(classifyLaunchError(new Error('KYC verification required'))).toBe(
        'COMPLIANCE_INCOMPLETE',
      );
    });

    it('should classify network errors', () => {
      expect(classifyLaunchError(new Error('Network error occurred'))).toBe('NETWORK_UNAVAILABLE');
      expect(classifyLaunchError(new Error('Failed to fetch'))).toBe('NETWORK_UNAVAILABLE');
      expect(classifyLaunchError('offline')).toBe('NETWORK_UNAVAILABLE');
    });

    it('should classify draft save errors', () => {
      expect(classifyLaunchError(new Error('Failed to save draft'))).toBe('SAVE_FAILED');
      expect(classifyLaunchError(new Error('Storage quota exceeded'))).toBe('SAVE_FAILED');
    });

    it('should classify rate limit errors', () => {
      expect(classifyLaunchError(new Error('Rate limit exceeded'))).toBe('RATE_LIMITED');
      expect(classifyLaunchError(new Error('Too many requests'))).toBe('RATE_LIMITED');
    });

    it('should classify submission errors', () => {
      expect(classifyLaunchError(new Error('Submission failed'))).toBe('SUBMISSION_FAILED');
      expect(classifyLaunchError(new Error('Token launch failed'))).toBe('SUBMISSION_FAILED');
    });

    it('should fall back to UNKNOWN for unrecognized errors', () => {
      expect(classifyLaunchError(new Error('Some completely unrelated error'))).toBe('UNKNOWN');
      expect(classifyLaunchError('unexpected exception')).toBe('UNKNOWN');
      expect(classifyLaunchError(null)).toBe('UNKNOWN');
      expect(classifyLaunchError(undefined)).toBe('UNKNOWN');
      expect(classifyLaunchError(42)).toBe('UNKNOWN');
    });

    it('should be case-insensitive in error matching', () => {
      expect(classifyLaunchError(new Error('AUTH REQUIRED'))).toBe('AUTH_REQUIRED');
      expect(classifyLaunchError(new Error('SESSION EXPIRED'))).toBe('SESSION_EXPIRED');
      expect(classifyLaunchError(new Error('NETWORK ERROR'))).toBe('NETWORK_UNAVAILABLE');
    });

    it('getLaunchErrorMessage with classifyLaunchError should always return a valid message', () => {
      const errors = [
        new Error('auth failed'),
        new Error('session expired'),
        new Error('network error'),
        new Error('random unknown error'),
        null,
        undefined,
        42,
      ];

      for (const err of errors) {
        const code = classifyLaunchError(err);
        const msg = getLaunchErrorMessage(code);
        expect(msg.title).toBeTruthy();
        expect(msg.action).toBeTruthy();
        expect(msg.recoverable).toBeDefined();
      }
    });
  });
});
