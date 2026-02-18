/**
 * Unit tests for provisioning state manager
 * Tests state transitions, error mapping, and retry logic
 */

import { describe, it, expect } from 'vitest';
import {
  getProvisioningState,
  mapProvisioningError,
  isValidStateTransition,
  getNextExpectedStates,
  shouldRetryProvisioning,
  getRetryDelay,
} from '../provisioningStateManager';
import type { AccountProvisioningStatus } from '../../types/accountProvisioning';

describe('provisioningStateManager', () => {
  describe('getProvisioningState', () => {
    it('should return correct state for not_started', () => {
      const state = getProvisioningState('not_started');
      expect(state.status).toBe('not_started');
      expect(state.message).toContain('not started');
      expect(state.canRetry).toBe(false);
      expect(state.nextAction).toBeDefined();
    });

    it('should return correct state for provisioning', () => {
      const state = getProvisioningState('provisioning');
      expect(state.status).toBe('provisioning');
      expect(state.message).toContain('Setting up');
      expect(state.canRetry).toBe(false);
      expect(state.estimatedWaitTime).toBe(30);
    });

    it('should return correct state for active', () => {
      const state = getProvisioningState('active');
      expect(state.status).toBe('active');
      expect(state.message).toContain('ready');
      expect(state.canRetry).toBe(false);
      expect(state.nextAction).toBeUndefined();
    });

    it('should return correct state for failed', () => {
      const state = getProvisioningState('failed');
      expect(state.status).toBe('failed');
      expect(state.message).toContain('failed');
      expect(state.canRetry).toBe(true);
      expect(state.nextAction).toBeDefined();
    });

    it('should return correct state for suspended', () => {
      const state = getProvisioningState('suspended');
      expect(state.status).toBe('suspended');
      expect(state.message).toContain('suspended');
      expect(state.canRetry).toBe(false);
      expect(state.nextAction).toContain('support');
    });

    it('should handle unknown status gracefully', () => {
      const state = getProvisioningState('invalid_status' as AccountProvisioningStatus);
      expect(state.status).toBe('not_started');
      expect(state.canRetry).toBe(true);
    });
  });

  describe('mapProvisioningError', () => {
    it('should map INVALID_INPUT error correctly', () => {
      const error = mapProvisioningError('INVALID_INPUT');
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.recoverable).toBe(true);
      expect(error.userMessage).toContain('invalid');
      expect(error.remediation).toBeDefined();
    });

    it('should map ACCOUNT_NOT_READY error correctly', () => {
      const error = mapProvisioningError('ACCOUNT_NOT_READY');
      expect(error.code).toBe('ACCOUNT_NOT_READY');
      expect(error.recoverable).toBe(false);
      expect(error.userMessage).toContain('issue');
      expect(error.remediation).toContain('support');
    });

    it('should map PROVISIONING_TIMEOUT error correctly', () => {
      const error = mapProvisioningError('PROVISIONING_TIMEOUT');
      expect(error.code).toBe('PROVISIONING_TIMEOUT');
      expect(error.recoverable).toBe(true);
      expect(error.userMessage).toContain('longer than expected');
      expect(error.remediation).toContain('try signing in again');
    });

    it('should map NETWORK_ERROR error correctly', () => {
      const error = mapProvisioningError('NETWORK_ERROR');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.recoverable).toBe(true);
      expect(error.userMessage).toContain('connect to the server');
      expect(error.remediation).toContain('internet connection');
    });

    it('should map RATE_LIMIT_EXCEEDED error correctly', () => {
      const error = mapProvisioningError('RATE_LIMIT_EXCEEDED');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.recoverable).toBe(true);
      expect(error.userMessage).toContain('Too many');
      expect(error.remediation).toContain('wait');
    });

    it('should map DUPLICATE_ACCOUNT error correctly', () => {
      const error = mapProvisioningError('DUPLICATE_ACCOUNT');
      expect(error.code).toBe('DUPLICATE_ACCOUNT');
      expect(error.recoverable).toBe(true);
      expect(error.userMessage).toContain('already exists');
      expect(error.remediation).toContain('signing in');
    });

    it('should map unknown error to UNKNOWN_ERROR', () => {
      const error = mapProvisioningError('SOME_RANDOM_ERROR');
      expect(error.code).toBe('SOME_RANDOM_ERROR');
      expect(error.recoverable).toBe(true);
      expect(error.userMessage).toContain('unexpected');
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      const error = mapProvisioningError('UNKNOWN_ERROR', customMessage);
      expect(error.message).toBe(customMessage);
    });

    it('should always include remediation guidance', () => {
      const errorCodes = [
        'INVALID_INPUT',
        'ACCOUNT_NOT_READY',
        'PROVISIONING_TIMEOUT',
        'NETWORK_ERROR',
        'RATE_LIMIT_EXCEEDED',
        'DUPLICATE_ACCOUNT',
        'UNKNOWN_ERROR',
      ];

      errorCodes.forEach(code => {
        const error = mapProvisioningError(code);
        expect(error.remediation).toBeDefined();
        expect(error.remediation.length).toBeGreaterThan(10);
      });
    });
  });

  describe('isValidStateTransition', () => {
    it('should allow not_started -> provisioning', () => {
      expect(isValidStateTransition('not_started', 'provisioning')).toBe(true);
    });

    it('should allow provisioning -> active', () => {
      expect(isValidStateTransition('provisioning', 'active')).toBe(true);
    });

    it('should allow provisioning -> failed', () => {
      expect(isValidStateTransition('provisioning', 'failed')).toBe(true);
    });

    it('should allow failed -> provisioning (retry)', () => {
      expect(isValidStateTransition('failed', 'provisioning')).toBe(true);
    });

    it('should allow failed -> not_started (reset)', () => {
      expect(isValidStateTransition('failed', 'not_started')).toBe(true);
    });

    it('should allow active -> suspended', () => {
      expect(isValidStateTransition('active', 'suspended')).toBe(true);
    });

    it('should allow suspended -> active (reactivation)', () => {
      expect(isValidStateTransition('suspended', 'active')).toBe(true);
    });

    it('should reject not_started -> active (skipping provisioning)', () => {
      expect(isValidStateTransition('not_started', 'active')).toBe(false);
    });

    it('should reject not_started -> failed', () => {
      expect(isValidStateTransition('not_started', 'failed')).toBe(false);
    });

    it('should reject active -> provisioning (backwards)', () => {
      expect(isValidStateTransition('active', 'provisioning')).toBe(false);
    });

    it('should reject active -> failed (backwards)', () => {
      expect(isValidStateTransition('active', 'failed')).toBe(false);
    });

    it('should reject provisioning -> suspended', () => {
      expect(isValidStateTransition('provisioning', 'suspended')).toBe(false);
    });

    it('should reject failed -> active (must re-provision)', () => {
      expect(isValidStateTransition('failed', 'active')).toBe(false);
    });

    it('should reject invalid from states', () => {
      expect(isValidStateTransition('invalid' as AccountProvisioningStatus, 'active')).toBe(false);
    });

    it('should reject invalid to states', () => {
      expect(isValidStateTransition('not_started', 'invalid' as AccountProvisioningStatus)).toBe(false);
    });
  });

  describe('getNextExpectedStates', () => {
    it('should return provisioning for not_started', () => {
      const next = getNextExpectedStates('not_started');
      expect(next).toEqual(['provisioning']);
    });

    it('should return active or failed for provisioning', () => {
      const next = getNextExpectedStates('provisioning');
      expect(next).toContain('active');
      expect(next).toContain('failed');
      expect(next).toHaveLength(2);
    });

    it('should return empty array for active (terminal state)', () => {
      const next = getNextExpectedStates('active');
      expect(next).toEqual([]);
    });

    it('should return provisioning for failed (retry)', () => {
      const next = getNextExpectedStates('failed');
      expect(next).toEqual(['provisioning']);
    });

    it('should return empty array for suspended (needs admin)', () => {
      const next = getNextExpectedStates('suspended');
      expect(next).toEqual([]);
    });

    it('should return empty array for unknown status', () => {
      const next = getNextExpectedStates('unknown' as AccountProvisioningStatus);
      expect(next).toEqual([]);
    });
  });

  describe('shouldRetryProvisioning', () => {
    it('should retry PROVISIONING_TIMEOUT errors', () => {
      expect(shouldRetryProvisioning('PROVISIONING_TIMEOUT', 0)).toBe(true);
      expect(shouldRetryProvisioning('PROVISIONING_TIMEOUT', 1)).toBe(true);
      expect(shouldRetryProvisioning('PROVISIONING_TIMEOUT', 2)).toBe(true);
    });

    it('should retry NETWORK_ERROR errors', () => {
      expect(shouldRetryProvisioning('NETWORK_ERROR', 0)).toBe(true);
      expect(shouldRetryProvisioning('NETWORK_ERROR', 1)).toBe(true);
      expect(shouldRetryProvisioning('NETWORK_ERROR', 2)).toBe(true);
    });

    it('should retry RATE_LIMIT_EXCEEDED errors', () => {
      expect(shouldRetryProvisioning('RATE_LIMIT_EXCEEDED', 0)).toBe(true);
      expect(shouldRetryProvisioning('RATE_LIMIT_EXCEEDED', 1)).toBe(true);
      expect(shouldRetryProvisioning('RATE_LIMIT_EXCEEDED', 2)).toBe(true);
    });

    it('should not retry after max attempts', () => {
      expect(shouldRetryProvisioning('PROVISIONING_TIMEOUT', 3)).toBe(false);
      expect(shouldRetryProvisioning('NETWORK_ERROR', 4)).toBe(false);
      expect(shouldRetryProvisioning('RATE_LIMIT_EXCEEDED', 5)).toBe(false);
    });

    it('should not retry non-retryable errors', () => {
      expect(shouldRetryProvisioning('INVALID_INPUT', 0)).toBe(false);
      expect(shouldRetryProvisioning('ACCOUNT_NOT_READY', 0)).toBe(false);
      expect(shouldRetryProvisioning('DUPLICATE_ACCOUNT', 0)).toBe(false);
      expect(shouldRetryProvisioning('UNKNOWN_ERROR', 0)).toBe(false);
    });

    it('should handle edge case: retry count exactly at limit', () => {
      expect(shouldRetryProvisioning('PROVISIONING_TIMEOUT', 3)).toBe(false);
    });

    it('should handle edge case: negative retry count', () => {
      expect(shouldRetryProvisioning('PROVISIONING_TIMEOUT', -1)).toBe(true);
    });
  });

  describe('getRetryDelay', () => {
    it('should return base delay for first retry (attempt 0)', () => {
      const delay = getRetryDelay(0);
      expect(delay).toBe(2000); // 2 seconds
    });

    it('should use exponential backoff for subsequent retries', () => {
      expect(getRetryDelay(1)).toBe(4000); // 2s * 2^1 = 4s
      expect(getRetryDelay(2)).toBe(8000); // 2s * 2^2 = 8s
      expect(getRetryDelay(3)).toBe(16000); // 2s * 2^3 = 16s
    });

    it('should cap delay at max delay (30 seconds)', () => {
      expect(getRetryDelay(10)).toBe(30000);
      expect(getRetryDelay(20)).toBe(30000);
      expect(getRetryDelay(100)).toBe(30000);
    });

    it('should handle edge case: attempt 4 exactly at cap threshold', () => {
      const delay = getRetryDelay(4);
      // 2s * 2^4 = 32s, but capped at 30s
      expect(delay).toBe(30000);
    });

    it('should handle edge case: negative attempt count', () => {
      const delay = getRetryDelay(-1);
      // 2s * 2^-1 = 1s
      expect(delay).toBe(1000);
    });

    it('should increase delay monotonically for valid attempts', () => {
      const delays = [0, 1, 2, 3].map(attempt => getRetryDelay(attempt));
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
      }
    });
  });

  describe('Integration: Error handling flow', () => {
    it('should provide complete error recovery flow', () => {
      // Simulate provisioning timeout error
      const error = mapProvisioningError('PROVISIONING_TIMEOUT');
      expect(error.recoverable).toBe(true);

      // Check if should retry
      const shouldRetry = shouldRetryProvisioning(error.code, 0);
      expect(shouldRetry).toBe(true);

      // Get retry delay
      const delay = getRetryDelay(0);
      expect(delay).toBeGreaterThan(0);

      // Check state transition is valid
      const canTransition = isValidStateTransition('failed', 'provisioning');
      expect(canTransition).toBe(true);
    });

    it('should prevent retry for non-recoverable errors', () => {
      const error = mapProvisioningError('ACCOUNT_NOT_READY');
      expect(error.recoverable).toBe(false);

      const shouldRetry = shouldRetryProvisioning(error.code, 0);
      expect(shouldRetry).toBe(false);
    });

    it('should handle max retry attempts correctly', () => {
      const error = mapProvisioningError('NETWORK_ERROR');
      expect(error.recoverable).toBe(true);

      // Should retry attempts 0, 1, 2
      expect(shouldRetryProvisioning(error.code, 0)).toBe(true);
      expect(shouldRetryProvisioning(error.code, 1)).toBe(true);
      expect(shouldRetryProvisioning(error.code, 2)).toBe(true);

      // Should not retry attempt 3 (max reached)
      expect(shouldRetryProvisioning(error.code, 3)).toBe(false);
    });
  });

  describe('Integration: State transition flow', () => {
    it('should follow valid provisioning flow: not_started -> provisioning -> active', () => {
      expect(isValidStateTransition('not_started', 'provisioning')).toBe(true);
      expect(isValidStateTransition('provisioning', 'active')).toBe(true);
      
      const activeState = getProvisioningState('active');
      expect(activeState.canRetry).toBe(false);
      expect(getNextExpectedStates('active')).toEqual([]);
    });

    it('should follow valid failure flow: provisioning -> failed -> provisioning', () => {
      expect(isValidStateTransition('provisioning', 'failed')).toBe(true);
      
      const failedState = getProvisioningState('failed');
      expect(failedState.canRetry).toBe(true);
      
      expect(isValidStateTransition('failed', 'provisioning')).toBe(true);
    });

    it('should prevent invalid shortcuts', () => {
      // Cannot skip provisioning step
      expect(isValidStateTransition('not_started', 'active')).toBe(false);
      
      // Cannot go directly from failed to active
      expect(isValidStateTransition('failed', 'active')).toBe(false);
      
      // Cannot go backwards from active
      expect(isValidStateTransition('active', 'provisioning')).toBe(false);
    });
  });
});
