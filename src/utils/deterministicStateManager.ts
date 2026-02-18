/**
 * Deterministic State Manager
 * 
 * Provides deterministic, user-facing state patterns for auth-first token workflows.
 * Ensures clear feedback, consistent terminology, and explicit next actions across
 * the token creation and compliance lifecycle.
 * 
 * Business Value: Reduces user confusion, increases completion confidence, and
 * lowers support burden by making every state transition predictable and actionable.
 */

export type DeterministicStateType =
  | 'loading'
  | 'empty'
  | 'success'
  | 'partial-failure'
  | 'retryable-failure'
  | 'fatal-error';

export interface DeterministicState {
  type: DeterministicStateType;
  timestamp: string;
  message: string;
  userGuidance: string;
  technicalDetails?: string;
  canRetry: boolean;
  retryStrategy?: RetryStrategy;
  nextAction?: string;
  context?: Record<string, unknown>;
}

export interface RetryStrategy {
  maxAttempts: number;
  currentAttempt: number;
  backoffMs: number;
  canRetryNow: boolean;
  retryAfterMs?: number;
}

export interface StateTransition {
  from: DeterministicStateType;
  to: DeterministicStateType;
  timestamp: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a loading state with clear user guidance
 */
export function createLoadingState(
  message: string,
  context?: Record<string, unknown>
): DeterministicState {
  return {
    type: 'loading',
    timestamp: new Date().toISOString(),
    message,
    userGuidance: 'Please wait while we process your request...',
    canRetry: false,
    context,
  };
}

/**
 * Create an empty state for zero-data scenarios
 */
export function createEmptyState(
  message: string,
  nextAction: string,
  context?: Record<string, unknown>
): DeterministicState {
  return {
    type: 'empty',
    timestamp: new Date().toISOString(),
    message,
    userGuidance: 'No data available yet.',
    canRetry: false,
    nextAction,
    context,
  };
}

/**
 * Create a success state with confirmation message
 */
export function createSuccessState(
  message: string,
  nextAction?: string,
  context?: Record<string, unknown>
): DeterministicState {
  return {
    type: 'success',
    timestamp: new Date().toISOString(),
    message,
    userGuidance: 'Operation completed successfully.',
    canRetry: false,
    nextAction,
    context,
  };
}

/**
 * Create a partial-failure state where some operations succeeded
 */
export function createPartialFailureState(
  message: string,
  userGuidance: string,
  nextAction: string,
  context?: Record<string, unknown>
): DeterministicState {
  return {
    type: 'partial-failure',
    timestamp: new Date().toISOString(),
    message,
    userGuidance,
    canRetry: true,
    nextAction,
    context,
  };
}

/**
 * Create a retryable-failure state with retry strategy
 */
export function createRetryableFailureState(
  message: string,
  userGuidance: string,
  retryStrategy: RetryStrategy,
  technicalDetails?: string,
  context?: Record<string, unknown>
): DeterministicState {
  return {
    type: 'retryable-failure',
    timestamp: new Date().toISOString(),
    message,
    userGuidance,
    technicalDetails,
    canRetry: true,
    retryStrategy,
    nextAction: retryStrategy.canRetryNow
      ? 'Click "Retry" to try again'
      : `Wait ${Math.ceil((retryStrategy.retryAfterMs || 0) / 1000)}s before retrying`,
    context,
  };
}

/**
 * Create a fatal-error state for unrecoverable failures
 */
export function createFatalErrorState(
  message: string,
  userGuidance: string,
  technicalDetails?: string,
  context?: Record<string, unknown>
): DeterministicState {
  return {
    type: 'fatal-error',
    timestamp: new Date().toISOString(),
    message,
    userGuidance,
    technicalDetails,
    canRetry: false,
    nextAction: 'Contact support at support@biatec.io for assistance',
    context,
  };
}

/**
 * Calculate exponential backoff for retry strategy
 */
export function calculateBackoff(attemptNumber: number, baseDelayMs: number = 1000): number {
  const maxDelayMs = 30000; // 30 seconds
  const delay = Math.min(baseDelayMs * Math.pow(2, attemptNumber - 1), maxDelayMs);
  return delay;
}

/**
 * Create a retry strategy based on current attempt
 */
export function createRetryStrategy(
  currentAttempt: number,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): RetryStrategy {
  const backoffMs = calculateBackoff(currentAttempt, baseDelayMs);
  const canRetryNow = currentAttempt <= maxAttempts;
  const retryAfterMs = canRetryNow ? backoffMs : undefined;

  return {
    maxAttempts,
    currentAttempt,
    backoffMs,
    canRetryNow,
    retryAfterMs,
  };
}

/**
 * Validate state transition is deterministic and allowed
 */
export function validateStateTransition(
  from: DeterministicStateType,
  to: DeterministicStateType
): boolean {
  const validTransitions: Record<DeterministicStateType, DeterministicStateType[]> = {
    loading: ['success', 'empty', 'partial-failure', 'retryable-failure', 'fatal-error'],
    empty: ['loading', 'success'],
    success: [], // Terminal state
    'partial-failure': ['loading', 'success', 'retryable-failure'],
    'retryable-failure': ['loading', 'success', 'fatal-error'],
    'fatal-error': [], // Terminal state
  };

  return validTransitions[from]?.includes(to) ?? false;
}

/**
 * Create a state transition record for telemetry
 */
export function createStateTransition(
  from: DeterministicStateType,
  to: DeterministicStateType,
  reason?: string,
  metadata?: Record<string, unknown>
): StateTransition {
  return {
    from,
    to,
    timestamp: new Date().toISOString(),
    reason,
    metadata,
  };
}

/**
 * Map error codes to deterministic states
 */
export function mapErrorToState(
  errorCode: string,
  errorMessage: string,
  attemptNumber: number
): DeterministicState {
  const retryableErrors = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'RATE_LIMIT',
    'SERVICE_UNAVAILABLE',
    'TEMPORARY_FAILURE',
  ];

  const fatalErrors = [
    'INVALID_CREDENTIALS',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR',
    'INSUFFICIENT_BALANCE',
  ];

  if (retryableErrors.includes(errorCode)) {
    const retryStrategy = createRetryStrategy(attemptNumber, 3, 2000);
    return createRetryableFailureState(
      errorMessage,
      getRetryableErrorGuidance(errorCode),
      retryStrategy,
      `Error code: ${errorCode}`,
      { errorCode, attemptNumber }
    );
  }

  if (fatalErrors.includes(errorCode)) {
    return createFatalErrorState(
      errorMessage,
      getFatalErrorGuidance(errorCode),
      `Error code: ${errorCode}`,
      { errorCode }
    );
  }

  // Unknown error - treat as retryable with caution
  const retryStrategy = createRetryStrategy(attemptNumber, 2, 3000);
  return createRetryableFailureState(
    errorMessage,
    'An unexpected error occurred. You can try again or contact support if the issue persists.',
    retryStrategy,
    `Error code: ${errorCode}`,
    { errorCode, attemptNumber }
  );
}

/**
 * Get user guidance for retryable errors
 */
function getRetryableErrorGuidance(errorCode: string): string {
  const guidance: Record<string, string> = {
    NETWORK_ERROR: 'Check your internet connection and try again.',
    TIMEOUT: 'The request took too long to complete. Please try again.',
    RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
    SERVICE_UNAVAILABLE: 'Our service is temporarily unavailable. Please try again in a few moments.',
    TEMPORARY_FAILURE: 'A temporary issue occurred. Please try again.',
  };

  return guidance[errorCode] || 'An error occurred. Please try again.';
}

/**
 * Get user guidance for fatal errors
 */
function getFatalErrorGuidance(errorCode: string): string {
  const guidance: Record<string, string> = {
    INVALID_CREDENTIALS: 'Your email or password is incorrect. Please check your credentials.',
    UNAUTHORIZED: 'You are not authorized to perform this action. Please sign in again.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    NOT_FOUND: 'The requested resource could not be found.',
    VALIDATION_ERROR: 'The information you provided is invalid. Please review and correct any errors.',
    INSUFFICIENT_BALANCE: 'Insufficient balance to complete this transaction. Please add funds and try again.',
  };

  return guidance[errorCode] || 'This error cannot be resolved automatically. Please contact support.';
}

/**
 * Get standardized compliance status terminology
 */
export function getComplianceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'pending-review': 'Pending Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'requires-update': 'Requires Update',
    'expired': 'Expired',
  };

  return labels[status] || status;
}

/**
 * Get badge variant for compliance status
 */
export function getComplianceStatusVariant(status: string): string {
  const variants: Record<string, string> = {
    'not-started': 'secondary',
    'in-progress': 'info',
    'pending-review': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'requires-update': 'warning',
    'expired': 'danger',
  };

  return variants[status] || 'secondary';
}
