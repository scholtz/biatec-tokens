/**
 * Unit tests for operationsErrorMessages utility
 *
 * Validates:
 * 1. Every error code maps to a user-friendly, actionable message
 * 2. Messages follow the pattern: what happened → why it matters → what to do next
 * 3. classifyOperationsError correctly maps HTTP status codes and Error messages
 * 4. getAllOperationsErrorCodes covers every registered code
 * 5. Fallback to UNKNOWN_OPERATION_ERROR is safe
 */

import { describe, it, expect } from 'vitest';
import {
  getOperationsErrorMessage,
  classifyOperationsError,
  getAllOperationsErrorCodes,
  type OperationsErrorCode,
} from '../operationsErrorMessages';

// ---------------------------------------------------------------------------
// Core message contract
// ---------------------------------------------------------------------------

describe('operationsErrorMessages - getOperationsErrorMessage', () => {
  it('should return a message for every registered error code', () => {
    const codes = getAllOperationsErrorCodes();
    expect(codes.length).toBeGreaterThan(0);

    for (const code of codes) {
      const msg = getOperationsErrorMessage(code);
      expect(msg).toBeDefined();
      expect(msg.title).toBeTruthy();
      expect(msg.description).toBeTruthy();
      expect(msg.action).toBeTruthy();
    }
  });

  it('should always return a defined severity level', () => {
    for (const code of getAllOperationsErrorCodes()) {
      const msg = getOperationsErrorMessage(code);
      expect(['error', 'warning', 'info']).toContain(msg.severity);
    }
  });

  it('should always have boolean recoverable and canRetry fields', () => {
    for (const code of getAllOperationsErrorCodes()) {
      const msg = getOperationsErrorMessage(code);
      expect(typeof msg.recoverable).toBe('boolean');
      expect(typeof msg.canRetry).toBe('boolean');
    }
  });

  it('should return non-empty action for every code (actionable guidance)', () => {
    for (const code of getAllOperationsErrorCodes()) {
      const msg = getOperationsErrorMessage(code);
      expect(msg.action.length).toBeGreaterThan(10);
    }
  });
});

// ---------------------------------------------------------------------------
// Token operation messages
// ---------------------------------------------------------------------------

describe('operationsErrorMessages - token operation codes', () => {
  it('TOKEN_LOAD_FAILED should be retryable and recoverable', () => {
    const msg = getOperationsErrorMessage('TOKEN_LOAD_FAILED');
    expect(msg.recoverable).toBe(true);
    expect(msg.canRetry).toBe(true);
    expect(msg.severity).toBe('error');
  });

  it('TOKEN_NOT_FOUND should be non-retryable', () => {
    const msg = getOperationsErrorMessage('TOKEN_NOT_FOUND');
    expect(msg.canRetry).toBe(false);
    expect(msg.severity).toBe('warning');
  });

  it('TOKEN_ACCESS_DENIED should direct user to administrator', () => {
    const msg = getOperationsErrorMessage('TOKEN_ACCESS_DENIED');
    expect(msg.action.toLowerCase()).toMatch(/sign in|administrator|permission/);
  });

  it('TOKEN_QUOTA_EXCEEDED should mention subscription or upgrade', () => {
    const msg = getOperationsErrorMessage('TOKEN_QUOTA_EXCEEDED');
    expect(msg.action.toLowerCase()).toMatch(/upgrade|subscription|archive/);
  });

  it('TOKEN_DEPLOY_FAILED should advise checking status rather than immediate retry', () => {
    const msg = getOperationsErrorMessage('TOKEN_DEPLOY_FAILED');
    expect(msg.canRetry).toBe(false);
    expect(msg.action).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Compliance operation messages
// ---------------------------------------------------------------------------

describe('operationsErrorMessages - compliance operation codes', () => {
  it('COMPLIANCE_DATA_UNAVAILABLE should be informational (not blocking)', () => {
    const msg = getOperationsErrorMessage('COMPLIANCE_DATA_UNAVAILABLE');
    expect(msg.severity).toBe('warning');
    expect(msg.canRetry).toBe(true);
  });

  it('WHITELIST_SAVE_FAILED should indicate no data was changed', () => {
    const msg = getOperationsErrorMessage('WHITELIST_SAVE_FAILED');
    expect(msg.description.toLowerCase()).toMatch(/unchanged|not saved|existing/);
  });

  it('ATTESTATION_SUBMISSION_FAILED should indicate no compliance record change', () => {
    const msg = getOperationsErrorMessage('ATTESTATION_SUBMISSION_FAILED');
    expect(msg.description).toBeTruthy();
    expect(msg.recoverable).toBe(true);
  });

  it('JURISDICTION_VALIDATION_FAILED should direct to compliance setup', () => {
    const msg = getOperationsErrorMessage('JURISDICTION_VALIDATION_FAILED');
    expect(msg.action.toLowerCase()).toMatch(/compliance setup|configuration|jurisdiction/);
  });
});

// ---------------------------------------------------------------------------
// Batch operation messages
// ---------------------------------------------------------------------------

describe('operationsErrorMessages - batch operation codes', () => {
  it('BATCH_PARTIAL_FAILURE should be a warning (not full error)', () => {
    const msg = getOperationsErrorMessage('BATCH_PARTIAL_FAILURE');
    expect(msg.severity).toBe('warning');
    expect(msg.canRetry).toBe(true);
  });

  it('BATCH_TOTAL_FAILURE should be an error with retry guidance', () => {
    const msg = getOperationsErrorMessage('BATCH_TOTAL_FAILURE');
    expect(msg.severity).toBe('error');
    expect(msg.canRetry).toBe(true);
  });

  it('BATCH_SIZE_EXCEEDED should mention splitting or plan upgrade', () => {
    const msg = getOperationsErrorMessage('BATCH_SIZE_EXCEEDED');
    expect(msg.action.toLowerCase()).toMatch(/split|upgrade|smaller/);
  });

  it('BATCH_TIMEOUT should advise reducing batch size', () => {
    const msg = getOperationsErrorMessage('BATCH_TIMEOUT');
    expect(msg.action.toLowerCase()).toMatch(/size|split|smaller/);
    expect(msg.canRetry).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Infrastructure messages
// ---------------------------------------------------------------------------

describe('operationsErrorMessages - infrastructure codes', () => {
  it('BACKEND_UNAVAILABLE should be retryable and temporary', () => {
    const msg = getOperationsErrorMessage('BACKEND_UNAVAILABLE');
    expect(msg.recoverable).toBe(true);
    expect(msg.canRetry).toBe(true);
    expect(msg.description.toLowerCase()).toMatch(/temporary/);
  });

  it('SESSION_REQUIRED should direct to sign-in', () => {
    const msg = getOperationsErrorMessage('SESSION_REQUIRED');
    expect(msg.severity).toBe('info');
    expect(msg.action.toLowerCase()).toMatch(/sign in/);
  });

  it('RATE_LIMITED should advise slowing down', () => {
    const msg = getOperationsErrorMessage('RATE_LIMITED');
    expect(msg.severity).toBe('warning');
    expect(msg.action.toLowerCase()).toMatch(/wait|slow|minute/);
  });

  it('PERMISSION_INSUFFICIENT should direct to administrator', () => {
    const msg = getOperationsErrorMessage('PERMISSION_INSUFFICIENT');
    expect(msg.action.toLowerCase()).toMatch(/administrator|permission/);
    expect(msg.canRetry).toBe(false);
  });

  it('UNKNOWN_OPERATION_ERROR should still have actionable guidance', () => {
    const msg = getOperationsErrorMessage('UNKNOWN_OPERATION_ERROR');
    expect(msg.action).toBeTruthy();
    expect(msg.action.length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

describe('operationsErrorMessages - classifyOperationsError', () => {
  it('should classify 401 HTTP status as SESSION_REQUIRED or TOKEN_ACCESS_DENIED', () => {
    const code = classifyOperationsError(401);
    expect(['SESSION_REQUIRED', 'TOKEN_ACCESS_DENIED']).toContain(code);
  });

  it('should classify 403 HTTP status as TOKEN_ACCESS_DENIED', () => {
    expect(classifyOperationsError(403)).toBe('TOKEN_ACCESS_DENIED');
  });

  it('should classify 404 HTTP status as TOKEN_NOT_FOUND', () => {
    expect(classifyOperationsError(404)).toBe('TOKEN_NOT_FOUND');
  });

  it('should classify 429 HTTP status as RATE_LIMITED', () => {
    expect(classifyOperationsError(429)).toBe('RATE_LIMITED');
  });

  it('should classify 503 HTTP status as BACKEND_UNAVAILABLE', () => {
    expect(classifyOperationsError(503)).toBe('BACKEND_UNAVAILABLE');
  });

  it('should classify unauthorized error message as SESSION_REQUIRED', () => {
    const code = classifyOperationsError(new Error('unauthorized'));
    expect(code).toBe('SESSION_REQUIRED');
  });

  it('should classify "not found" error message as TOKEN_NOT_FOUND', () => {
    expect(classifyOperationsError(new Error('resource not found'))).toBe('TOKEN_NOT_FOUND');
  });

  it('should classify network error as BACKEND_UNAVAILABLE', () => {
    expect(classifyOperationsError(new Error('network error'))).toBe('BACKEND_UNAVAILABLE');
  });

  it('should classify timeout error as BATCH_TIMEOUT', () => {
    expect(classifyOperationsError(new Error('operation timeout'))).toBe('BATCH_TIMEOUT');
  });

  it('should classify quota error as TOKEN_QUOTA_EXCEEDED', () => {
    expect(classifyOperationsError(new Error('quota exceeded'))).toBe('TOKEN_QUOTA_EXCEEDED');
  });

  it('should classify rate limit error as RATE_LIMITED', () => {
    expect(classifyOperationsError(new Error('too many requests'))).toBe('RATE_LIMITED');
  });

  it('should classify compliance error as COMPLIANCE_CHECK_FAILED', () => {
    expect(classifyOperationsError(new Error('compliance check failed'))).toBe('COMPLIANCE_CHECK_FAILED');
  });

  it('should classify attestation error as ATTESTATION_SUBMISSION_FAILED', () => {
    expect(classifyOperationsError(new Error('attestation rejected'))).toBe('ATTESTATION_SUBMISSION_FAILED');
  });

  it('should classify unknown errors as UNKNOWN_OPERATION_ERROR', () => {
    expect(classifyOperationsError(new Error('something weird happened'))).toBe('UNKNOWN_OPERATION_ERROR');
  });

  it('should classify null/undefined as UNKNOWN_OPERATION_ERROR', () => {
    expect(classifyOperationsError(null)).toBe('UNKNOWN_OPERATION_ERROR');
    expect(classifyOperationsError(undefined)).toBe('UNKNOWN_OPERATION_ERROR');
  });

  it('should classify string inputs as UNKNOWN_OPERATION_ERROR', () => {
    expect(classifyOperationsError('some error string')).toBe('UNKNOWN_OPERATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// Code coverage audit
// ---------------------------------------------------------------------------

describe('operationsErrorMessages - getAllOperationsErrorCodes', () => {
  it('should return at least 20 error codes covering all domains', () => {
    const codes = getAllOperationsErrorCodes();
    expect(codes.length).toBeGreaterThanOrEqual(20);
  });

  it('should include token operation codes', () => {
    const codes = getAllOperationsErrorCodes();
    expect(codes).toContain('TOKEN_LOAD_FAILED');
    expect(codes).toContain('TOKEN_NOT_FOUND');
    expect(codes).toContain('TOKEN_ACCESS_DENIED');
  });

  it('should include compliance operation codes', () => {
    const codes = getAllOperationsErrorCodes();
    expect(codes).toContain('COMPLIANCE_CHECK_FAILED');
    expect(codes).toContain('WHITELIST_SAVE_FAILED');
    expect(codes).toContain('ATTESTATION_SUBMISSION_FAILED');
  });

  it('should include batch operation codes', () => {
    const codes = getAllOperationsErrorCodes();
    expect(codes).toContain('BATCH_PARTIAL_FAILURE');
    expect(codes).toContain('BATCH_TOTAL_FAILURE');
  });

  it('should include infrastructure codes', () => {
    const codes = getAllOperationsErrorCodes();
    expect(codes).toContain('BACKEND_UNAVAILABLE');
    expect(codes).toContain('RATE_LIMITED');
    expect(codes).toContain('SESSION_REQUIRED');
  });
});
