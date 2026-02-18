import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createLoadingState,
  createEmptyState,
  createSuccessState,
  createPartialFailureState,
  createRetryableFailureState,
  createFatalErrorState,
  calculateBackoff,
  createRetryStrategy,
  validateStateTransition,
  createStateTransition,
  mapErrorToState,
  getComplianceStatusLabel,
  getComplianceStatusVariant,
  type DeterministicState,
  type RetryStrategy,
  type StateTransition,
} from '../deterministicStateManager';

describe('deterministicStateManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  describe('createLoadingState', () => {
    it('should create a loading state with correct properties', () => {
      const state = createLoadingState('Loading data...', { userId: '123' });
      
      expect(state.type).toBe('loading');
      expect(state.message).toBe('Loading data...');
      expect(state.userGuidance).toBe('Please wait while we process your request...');
      expect(state.canRetry).toBe(false);
      expect(state.timestamp).toBe('2024-01-01T00:00:00.000Z');
      expect(state.context).toEqual({ userId: '123' });
    });

    it('should create loading state without context', () => {
      const state = createLoadingState('Processing...');
      
      expect(state.type).toBe('loading');
      expect(state.context).toBeUndefined();
    });
  });

  describe('createEmptyState', () => {
    it('should create an empty state with next action', () => {
      const state = createEmptyState(
        'No tokens found',
        'Create your first token to get started'
      );
      
      expect(state.type).toBe('empty');
      expect(state.message).toBe('No tokens found');
      expect(state.nextAction).toBe('Create your first token to get started');
      expect(state.canRetry).toBe(false);
    });

    it('should include context when provided', () => {
      const state = createEmptyState(
        'No data',
        'Add data',
        { filter: 'all' }
      );
      
      expect(state.context).toEqual({ filter: 'all' });
    });
  });

  describe('createSuccessState', () => {
    it('should create a success state', () => {
      const state = createSuccessState('Token deployed successfully');
      
      expect(state.type).toBe('success');
      expect(state.message).toBe('Token deployed successfully');
      expect(state.userGuidance).toBe('Operation completed successfully.');
      expect(state.canRetry).toBe(false);
    });

    it('should include next action when provided', () => {
      const state = createSuccessState(
        'Deployment complete',
        'View your token dashboard'
      );
      
      expect(state.nextAction).toBe('View your token dashboard');
    });
  });

  describe('createPartialFailureState', () => {
    it('should create a partial failure state', () => {
      const state = createPartialFailureState(
        '2 of 3 operations completed',
        'Some operations succeeded but others failed',
        'Review failures and retry',
        { succeeded: 2, failed: 1 }
      );
      
      expect(state.type).toBe('partial-failure');
      expect(state.message).toBe('2 of 3 operations completed');
      expect(state.userGuidance).toBe('Some operations succeeded but others failed');
      expect(state.nextAction).toBe('Review failures and retry');
      expect(state.canRetry).toBe(true);
      expect(state.context).toEqual({ succeeded: 2, failed: 1 });
    });
  });

  describe('createRetryableFailureState', () => {
    it('should create a retryable failure state with retry strategy', () => {
      const retryStrategy: RetryStrategy = {
        maxAttempts: 3,
        currentAttempt: 1,
        backoffMs: 2000,
        canRetryNow: true,
        retryAfterMs: 2000,
      };
      
      const state = createRetryableFailureState(
        'Network error occurred',
        'Check your internet connection and try again',
        retryStrategy,
        'Error code: NETWORK_ERROR'
      );
      
      expect(state.type).toBe('retryable-failure');
      expect(state.message).toBe('Network error occurred');
      expect(state.canRetry).toBe(true);
      expect(state.retryStrategy).toEqual(retryStrategy);
      expect(state.technicalDetails).toBe('Error code: NETWORK_ERROR');
      expect(state.nextAction).toBe('Click "Retry" to try again');
    });

    it('should show wait time when retry not available immediately', () => {
      const retryStrategy: RetryStrategy = {
        maxAttempts: 3,
        currentAttempt: 2,
        backoffMs: 4000,
        canRetryNow: true,
        retryAfterMs: 4000,
      };
      
      const state = createRetryableFailureState(
        'Rate limit exceeded',
        'Too many requests',
        { ...retryStrategy, canRetryNow: false }
      );
      
      expect(state.nextAction).toBe('Wait 4s before retrying');
    });
  });

  describe('createFatalErrorState', () => {
    it('should create a fatal error state', () => {
      const state = createFatalErrorState(
        'Invalid credentials',
        'Your email or password is incorrect',
        'Error code: INVALID_CREDENTIALS',
        { errorCode: 'INVALID_CREDENTIALS' }
      );
      
      expect(state.type).toBe('fatal-error');
      expect(state.message).toBe('Invalid credentials');
      expect(state.userGuidance).toBe('Your email or password is incorrect');
      expect(state.canRetry).toBe(false);
      expect(state.nextAction).toBe('Contact support at support@biatec.io for assistance');
      expect(state.technicalDetails).toBe('Error code: INVALID_CREDENTIALS');
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff correctly', () => {
      expect(calculateBackoff(1, 1000)).toBe(1000);  // 1 * 2^0 = 1
      expect(calculateBackoff(2, 1000)).toBe(2000);  // 1 * 2^1 = 2
      expect(calculateBackoff(3, 1000)).toBe(4000);  // 1 * 2^2 = 4
      expect(calculateBackoff(4, 1000)).toBe(8000);  // 1 * 2^3 = 8
      expect(calculateBackoff(5, 1000)).toBe(16000); // 1 * 2^4 = 16
    });

    it('should cap backoff at maximum delay', () => {
      expect(calculateBackoff(10, 1000)).toBe(30000); // Capped at 30s
      expect(calculateBackoff(20, 5000)).toBe(30000); // Capped at 30s
    });

    it('should use default base delay when not provided', () => {
      expect(calculateBackoff(1)).toBe(1000);
      expect(calculateBackoff(2)).toBe(2000);
    });
  });

  describe('createRetryStrategy', () => {
    it('should create retry strategy with default values', () => {
      const strategy = createRetryStrategy(1);
      
      expect(strategy.currentAttempt).toBe(1);
      expect(strategy.maxAttempts).toBe(3);
      expect(strategy.backoffMs).toBe(1000);
      expect(strategy.canRetryNow).toBe(true);
      expect(strategy.retryAfterMs).toBe(1000);
    });

    it('should create retry strategy with custom values', () => {
      const strategy = createRetryStrategy(2, 5, 2000);
      
      expect(strategy.currentAttempt).toBe(2);
      expect(strategy.maxAttempts).toBe(5);
      expect(strategy.backoffMs).toBe(4000);
      expect(strategy.canRetryNow).toBe(true);
      expect(strategy.retryAfterMs).toBe(4000);
    });

    it('should indicate when max attempts exceeded', () => {
      const strategy = createRetryStrategy(4, 3);
      
      expect(strategy.canRetryNow).toBe(false);
      expect(strategy.retryAfterMs).toBeUndefined();
    });
  });

  describe('validateStateTransition', () => {
    it('should allow valid transitions from loading state', () => {
      expect(validateStateTransition('loading', 'success')).toBe(true);
      expect(validateStateTransition('loading', 'empty')).toBe(true);
      expect(validateStateTransition('loading', 'partial-failure')).toBe(true);
      expect(validateStateTransition('loading', 'retryable-failure')).toBe(true);
      expect(validateStateTransition('loading', 'fatal-error')).toBe(true);
    });

    it('should allow valid transitions from empty state', () => {
      expect(validateStateTransition('empty', 'loading')).toBe(true);
      expect(validateStateTransition('empty', 'success')).toBe(true);
    });

    it('should allow valid transitions from partial-failure state', () => {
      expect(validateStateTransition('partial-failure', 'loading')).toBe(true);
      expect(validateStateTransition('partial-failure', 'success')).toBe(true);
      expect(validateStateTransition('partial-failure', 'retryable-failure')).toBe(true);
    });

    it('should allow valid transitions from retryable-failure state', () => {
      expect(validateStateTransition('retryable-failure', 'loading')).toBe(true);
      expect(validateStateTransition('retryable-failure', 'success')).toBe(true);
      expect(validateStateTransition('retryable-failure', 'fatal-error')).toBe(true);
    });

    it('should disallow transitions from terminal states', () => {
      expect(validateStateTransition('success', 'loading')).toBe(false);
      expect(validateStateTransition('success', 'retryable-failure')).toBe(false);
      expect(validateStateTransition('fatal-error', 'loading')).toBe(false);
      expect(validateStateTransition('fatal-error', 'success')).toBe(false);
    });

    it('should disallow invalid transitions', () => {
      expect(validateStateTransition('loading', 'loading')).toBe(false);
      expect(validateStateTransition('empty', 'fatal-error')).toBe(false);
    });
  });

  describe('createStateTransition', () => {
    it('should create a state transition record', () => {
      const transition = createStateTransition(
        'loading',
        'success',
        'Data loaded successfully',
        { duration: 1500 }
      );
      
      expect(transition.from).toBe('loading');
      expect(transition.to).toBe('success');
      expect(transition.reason).toBe('Data loaded successfully');
      expect(transition.metadata).toEqual({ duration: 1500 });
      expect(transition.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should create transition without reason and metadata', () => {
      const transition = createStateTransition('empty', 'loading');
      
      expect(transition.from).toBe('empty');
      expect(transition.to).toBe('loading');
      expect(transition.reason).toBeUndefined();
      expect(transition.metadata).toBeUndefined();
    });
  });

  describe('mapErrorToState', () => {
    it('should map retryable errors to retryable-failure state', () => {
      const retryableErrors = [
        'NETWORK_ERROR',
        'TIMEOUT',
        'RATE_LIMIT',
        'SERVICE_UNAVAILABLE',
        'TEMPORARY_FAILURE',
      ];
      
      retryableErrors.forEach((errorCode) => {
        const state = mapErrorToState(errorCode, `${errorCode} occurred`, 1);
        
        expect(state.type).toBe('retryable-failure');
        expect(state.canRetry).toBe(true);
        expect(state.retryStrategy).toBeDefined();
        expect(state.technicalDetails).toContain(errorCode);
      });
    });

    it('should map fatal errors to fatal-error state', () => {
      const fatalErrors = [
        'INVALID_CREDENTIALS',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'VALIDATION_ERROR',
        'INSUFFICIENT_BALANCE',
      ];
      
      fatalErrors.forEach((errorCode) => {
        const state = mapErrorToState(errorCode, `${errorCode} occurred`, 1);
        
        expect(state.type).toBe('fatal-error');
        expect(state.canRetry).toBe(false);
        expect(state.technicalDetails).toContain(errorCode);
      });
    });

    it('should treat unknown errors as retryable with caution', () => {
      const state = mapErrorToState('UNKNOWN_ERROR', 'Unknown error', 1);
      
      expect(state.type).toBe('retryable-failure');
      expect(state.canRetry).toBe(true);
      expect(state.retryStrategy?.maxAttempts).toBe(2); // Lower max attempts for unknown
    });

    it('should include attempt number in context', () => {
      const state = mapErrorToState('NETWORK_ERROR', 'Network failed', 2);
      
      expect(state.context).toEqual({
        errorCode: 'NETWORK_ERROR',
        attemptNumber: 2,
      });
    });

    it('should provide specific guidance for network errors', () => {
      const state = mapErrorToState('NETWORK_ERROR', 'Connection lost', 1);
      
      expect(state.userGuidance).toBe('Check your internet connection and try again.');
    });

    it('should provide specific guidance for rate limit errors', () => {
      const state = mapErrorToState('RATE_LIMIT', 'Too many requests', 1);
      
      expect(state.userGuidance).toBe('Too many requests. Please wait a moment before trying again.');
    });

    it('should provide specific guidance for invalid credentials', () => {
      const state = mapErrorToState('INVALID_CREDENTIALS', 'Login failed', 1);
      
      expect(state.userGuidance).toBe('Your email or password is incorrect. Please check your credentials.');
    });
  });

  describe('getComplianceStatusLabel', () => {
    it('should return standardized labels for known statuses', () => {
      expect(getComplianceStatusLabel('not-started')).toBe('Not Started');
      expect(getComplianceStatusLabel('in-progress')).toBe('In Progress');
      expect(getComplianceStatusLabel('pending-review')).toBe('Pending Review');
      expect(getComplianceStatusLabel('approved')).toBe('Approved');
      expect(getComplianceStatusLabel('rejected')).toBe('Rejected');
      expect(getComplianceStatusLabel('requires-update')).toBe('Requires Update');
      expect(getComplianceStatusLabel('expired')).toBe('Expired');
    });

    it('should return original status for unknown values', () => {
      expect(getComplianceStatusLabel('custom-status')).toBe('custom-status');
    });
  });

  describe('getComplianceStatusVariant', () => {
    it('should return correct variants for known statuses', () => {
      expect(getComplianceStatusVariant('not-started')).toBe('secondary');
      expect(getComplianceStatusVariant('in-progress')).toBe('info');
      expect(getComplianceStatusVariant('pending-review')).toBe('warning');
      expect(getComplianceStatusVariant('approved')).toBe('success');
      expect(getComplianceStatusVariant('rejected')).toBe('danger');
      expect(getComplianceStatusVariant('requires-update')).toBe('warning');
      expect(getComplianceStatusVariant('expired')).toBe('danger');
    });

    it('should return secondary variant for unknown statuses', () => {
      expect(getComplianceStatusVariant('unknown')).toBe('secondary');
    });
  });

  describe('State consistency', () => {
    it('should ensure all states have required properties', () => {
      const states = [
        createLoadingState('Loading'),
        createEmptyState('Empty', 'Action'),
        createSuccessState('Success'),
        createPartialFailureState('Partial', 'Guide', 'Action'),
        createRetryableFailureState('Error', 'Guide', createRetryStrategy(1)),
        createFatalErrorState('Fatal', 'Guide'),
      ];
      
      states.forEach((state) => {
        expect(state.type).toBeDefined();
        expect(state.timestamp).toBeDefined();
        expect(state.message).toBeDefined();
        expect(state.userGuidance).toBeDefined();
        expect(typeof state.canRetry).toBe('boolean');
      });
    });
  });
});
