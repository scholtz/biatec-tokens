/**
 * Operations Error Messages Utility
 *
 * Provides deterministic user-friendly error message mapping for operations
 * pages in Biatec Tokens: token dashboard, compliance monitoring, attestation
 * management, batch processing, and lifecycle cockpit.
 *
 * Each error code maps to a structured message following the pattern:
 *   what happened → why it matters → what to do next
 *
 * This prevents raw internal error details from surfacing in the UI and gives
 * business operators clear, actionable guidance without requiring technical
 * blockchain knowledge.
 *
 * References:
 * - Issue #457: Trustworthy Operations UX v1
 * - launchErrorMessages.ts (sister utility for launch/auth flows)
 * - Roadmap: error-message quality framework, enterprise-grade UX
 */

// ---------------------------------------------------------------------------
// Error code types
// ---------------------------------------------------------------------------

/**
 * Error codes for token management operations.
 * Each code corresponds to a specific failure mode in the operations layer.
 */
export type TokenOperationErrorCode =
  | 'TOKEN_LOAD_FAILED'
  | 'TOKEN_UPDATE_FAILED'
  | 'TOKEN_DEPLOY_FAILED'
  | 'TOKEN_PAUSE_FAILED'
  | 'TOKEN_TRANSFER_FAILED'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_ACCESS_DENIED'
  | 'TOKEN_QUOTA_EXCEEDED';

/**
 * Error codes for compliance operations.
 */
export type ComplianceOperationErrorCode =
  | 'COMPLIANCE_CHECK_FAILED'
  | 'COMPLIANCE_DATA_UNAVAILABLE'
  | 'WHITELIST_SAVE_FAILED'
  | 'WHITELIST_LOAD_FAILED'
  | 'ATTESTATION_SUBMISSION_FAILED'
  | 'ATTESTATION_LOAD_FAILED'
  | 'JURISDICTION_VALIDATION_FAILED';

/**
 * Error codes for batch and bulk operations.
 */
export type BatchOperationErrorCode =
  | 'BATCH_PARTIAL_FAILURE'
  | 'BATCH_TOTAL_FAILURE'
  | 'BATCH_TIMEOUT'
  | 'BATCH_SIZE_EXCEEDED'
  | 'BATCH_VALIDATION_FAILED';

/**
 * Error codes for general operations infrastructure.
 */
export type OperationsInfraErrorCode =
  | 'BACKEND_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'PERMISSION_INSUFFICIENT'
  | 'SESSION_REQUIRED'
  | 'UNKNOWN_OPERATION_ERROR';

/**
 * Union of all operations error codes.
 */
export type OperationsErrorCode =
  | TokenOperationErrorCode
  | ComplianceOperationErrorCode
  | BatchOperationErrorCode
  | OperationsInfraErrorCode;

// ---------------------------------------------------------------------------
// Message type
// ---------------------------------------------------------------------------

/**
 * Structured user-facing error message.
 * Follows the pattern: what happened → why it matters → what to do next.
 */
export interface OperationsErrorMessage {
  /** Short title: what happened (present tense) */
  title: string;
  /** Description: why this matters to the operator */
  description: string;
  /** Actionable next step for the user */
  action: string;
  /** Whether the user can recover without contacting support */
  recoverable: boolean;
  /** Severity level for UI badge/alert styling */
  severity: 'error' | 'warning' | 'info';
  /** Suggested retry behaviour: true if retrying same action may succeed */
  canRetry: boolean;
}

// ---------------------------------------------------------------------------
// Error message registry
// ---------------------------------------------------------------------------

const TOKEN_OPERATION_MESSAGES: Record<TokenOperationErrorCode, OperationsErrorMessage> = {
  TOKEN_LOAD_FAILED: {
    title: 'Unable to load token details',
    description:
      'The token information could not be retrieved. This may be due to a temporary connection issue.',
    action: 'Refresh the page or wait a moment and try again. If the issue persists, check your connection.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  TOKEN_UPDATE_FAILED: {
    title: 'Token update could not be saved',
    description:
      'Your changes were not saved due to an unexpected error. The token has not been modified.',
    action: 'Try saving again. If the error continues, your session may have expired — sign in and retry.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  TOKEN_DEPLOY_FAILED: {
    title: 'Token deployment was not completed',
    description:
      'The deployment request was submitted but could not be confirmed. The backend may still be processing it.',
    action: 'Check the token status in a few minutes. If no status change appears, contact support with your token ID.',
    recoverable: true,
    severity: 'error',
    canRetry: false,
  },
  TOKEN_PAUSE_FAILED: {
    title: 'Token pause request failed',
    description: 'The token could not be paused at this time. It remains in its current state.',
    action: 'Wait a moment and try again. If the token needs to be paused urgently, contact support.',
    recoverable: true,
    severity: 'warning',
    canRetry: true,
  },
  TOKEN_TRANSFER_FAILED: {
    title: 'Transfer could not be completed',
    description:
      'The transfer request failed. No tokens have been moved. This may be due to a validation error or a temporary service issue.',
    action: 'Review the transfer details and ensure the recipient address is valid and whitelisted, then try again.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  TOKEN_NOT_FOUND: {
    title: 'Token not found',
    description:
      'The token you requested does not exist or may have been removed from your account.',
    action: 'Return to your token dashboard to see all available tokens.',
    recoverable: false,
    severity: 'warning',
    canRetry: false,
  },
  TOKEN_ACCESS_DENIED: {
    title: 'You do not have access to this token',
    description:
      'Your current account does not have permission to view or manage this token.',
    action: 'Sign in with an account that has the required permissions, or contact your administrator.',
    recoverable: true,
    severity: 'error',
    canRetry: false,
  },
  TOKEN_QUOTA_EXCEEDED: {
    title: 'Token limit reached for your plan',
    description:
      'Your subscription plan has reached its maximum number of active tokens.',
    action: 'Upgrade your subscription to create additional tokens, or archive existing tokens to free up capacity.',
    recoverable: true,
    severity: 'warning',
    canRetry: false,
  },
};

const COMPLIANCE_OPERATION_MESSAGES: Record<ComplianceOperationErrorCode, OperationsErrorMessage> = {
  COMPLIANCE_CHECK_FAILED: {
    title: 'Compliance check could not be completed',
    description:
      'An error occurred while running compliance validation. Results may be incomplete.',
    action: 'Refresh and run the compliance check again. If it continues to fail, check your network connection.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  COMPLIANCE_DATA_UNAVAILABLE: {
    title: 'Compliance data temporarily unavailable',
    description:
      'The compliance monitoring service is not reachable. Displayed data may be out of date.',
    action: 'Wait a few minutes and reload the compliance dashboard. Ongoing compliance status is not affected.',
    recoverable: true,
    severity: 'warning',
    canRetry: true,
  },
  WHITELIST_SAVE_FAILED: {
    title: 'Whitelist could not be saved',
    description:
      'Your whitelist changes were not saved. The existing whitelist remains active and unchanged.',
    action: 'Review the entries for formatting errors and try saving again.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  WHITELIST_LOAD_FAILED: {
    title: 'Whitelist could not be loaded',
    description: 'The whitelist data could not be retrieved from the server.',
    action: 'Refresh the page. If the problem continues, contact support.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  ATTESTATION_SUBMISSION_FAILED: {
    title: 'Attestation could not be submitted',
    description:
      'Your attestation was not recorded due to an error. No changes have been made to your compliance record.',
    action: 'Review the attestation details and submit again. Ensure all required fields are complete.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  ATTESTATION_LOAD_FAILED: {
    title: 'Attestation records could not be loaded',
    description: 'The attestation history could not be retrieved at this time.',
    action: 'Refresh the page to try again. Historical records are preserved and will reappear when the service recovers.',
    recoverable: true,
    severity: 'warning',
    canRetry: true,
  },
  JURISDICTION_VALIDATION_FAILED: {
    title: 'Jurisdiction validation failed',
    description:
      'The jurisdiction configuration could not be verified. This may affect compliance status reporting.',
    action: 'Review your jurisdiction settings in the Compliance Setup and confirm the configuration is complete.',
    recoverable: true,
    severity: 'error',
    canRetry: false,
  },
};

const BATCH_OPERATION_MESSAGES: Record<BatchOperationErrorCode, OperationsErrorMessage> = {
  BATCH_PARTIAL_FAILURE: {
    title: 'Some batch items could not be processed',
    description:
      'The batch operation completed, but a subset of items encountered errors. Successful items were processed normally.',
    action: 'Download the error report to identify which items failed, then resubmit those items individually.',
    recoverable: true,
    severity: 'warning',
    canRetry: true,
  },
  BATCH_TOTAL_FAILURE: {
    title: 'Batch operation failed completely',
    description:
      'No items in the batch could be processed. This may indicate a file format issue or a service outage.',
    action: 'Check the batch file format, then retry the entire batch. If the issue persists, contact support.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  BATCH_TIMEOUT: {
    title: 'Batch operation timed out',
    description:
      'The batch took longer than expected and was stopped to protect service stability.',
    action: 'Reduce the batch size and resubmit. Very large batches may need to be split across multiple submissions.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  BATCH_SIZE_EXCEEDED: {
    title: 'Batch is too large',
    description:
      'The submitted batch exceeds the maximum allowed size for your subscription tier.',
    action:
      'Split the batch into smaller files and resubmit. Upgrade your plan to increase batch size limits.',
    recoverable: true,
    severity: 'warning',
    canRetry: false,
  },
  BATCH_VALIDATION_FAILED: {
    title: 'Batch file contains errors',
    description:
      'One or more rows in the batch file failed validation. No items were processed.',
    action: 'Download the validation report to identify row-level errors, correct them, and resubmit.',
    recoverable: true,
    severity: 'error',
    canRetry: false,
  },
};

const OPERATIONS_INFRA_MESSAGES: Record<OperationsInfraErrorCode, OperationsErrorMessage> = {
  BACKEND_UNAVAILABLE: {
    title: 'Service temporarily unavailable',
    description:
      'The Biatec Tokens backend service is not responding. This is a temporary condition.',
    action: 'Wait a few minutes and refresh the page. If the outage continues, check the status page.',
    recoverable: true,
    severity: 'error',
    canRetry: true,
  },
  RATE_LIMITED: {
    title: 'Too many requests — please slow down',
    description:
      'Your account has sent too many requests in a short period. Further requests are temporarily paused.',
    action: 'Wait a minute and try your action again. If you are running bulk operations, reduce request frequency.',
    recoverable: true,
    severity: 'warning',
    canRetry: true,
  },
  PERMISSION_INSUFFICIENT: {
    title: 'You do not have permission for this action',
    description:
      'Your account role does not allow this operation. This protects sensitive token and compliance data.',
    action: 'Contact your account administrator to request the required permissions.',
    recoverable: true,
    severity: 'error',
    canRetry: false,
  },
  SESSION_REQUIRED: {
    title: 'Sign in required',
    description:
      'Your session has ended or is no longer valid. Operations require an active authenticated session.',
    action: 'Sign in with your email and password to continue. Your work has been preserved where possible.',
    recoverable: true,
    severity: 'info',
    canRetry: false,
  },
  UNKNOWN_OPERATION_ERROR: {
    title: 'An unexpected error occurred',
    description:
      'An error was encountered that was not expected. The operation may or may not have completed.',
    action:
      'Check the current state of the resource and try again. If uncertain, contact support with the time and action performed.',
    recoverable: false,
    severity: 'error',
    canRetry: true,
  },
};

/**
 * Master error message registry combining all operation domains.
 */
const OPERATIONS_ERROR_REGISTRY: Record<OperationsErrorCode, OperationsErrorMessage> = {
  ...TOKEN_OPERATION_MESSAGES,
  ...COMPLIANCE_OPERATION_MESSAGES,
  ...BATCH_OPERATION_MESSAGES,
  ...OPERATIONS_INFRA_MESSAGES,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the user-friendly error message for the given operations error code.
 * Always returns a valid message; falls back to UNKNOWN_OPERATION_ERROR when
 * the code is not recognised.
 *
 * @param code - Operations error code
 * @returns Structured user-facing error message
 *
 * @example
 * const msg = getOperationsErrorMessage('TOKEN_NOT_FOUND');
 * // { title: 'Token not found', description: '...', action: '...', ... }
 */
export function getOperationsErrorMessage(code: OperationsErrorCode): OperationsErrorMessage {
  return OPERATIONS_ERROR_REGISTRY[code] ?? OPERATIONS_ERROR_REGISTRY.UNKNOWN_OPERATION_ERROR;
}

/**
 * Classifies a raw error or HTTP status code into an OperationsErrorCode.
 * Used to translate API/network failures into user-facing messages without
 * leaking technical details.
 *
 * @param error - Raw error object or HTTP status code
 * @returns Appropriate OperationsErrorCode
 *
 * @example
 * const code = classifyOperationsError(403);
 * // 'TOKEN_ACCESS_DENIED'
 */
export function classifyOperationsError(error: unknown): OperationsErrorCode {
  // Numeric HTTP status code
  if (typeof error === 'number') {
    if (error === 401 || error === 403) return 'TOKEN_ACCESS_DENIED';
    if (error === 404) return 'TOKEN_NOT_FOUND';
    if (error === 429) return 'RATE_LIMITED';
    if (error === 503 || error === 502) return 'BACKEND_UNAVAILABLE';
    return 'UNKNOWN_OPERATION_ERROR';
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('unauthorized') || msg.includes('unauthenticated')) return 'SESSION_REQUIRED';
    if (msg.includes('forbidden') || msg.includes('access denied')) return 'TOKEN_ACCESS_DENIED';
    if (msg.includes('not found')) return 'TOKEN_NOT_FOUND';
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('offline')) return 'BACKEND_UNAVAILABLE';
    if (msg.includes('timeout')) return 'BATCH_TIMEOUT';
    if (msg.includes('quota') || msg.includes('limit exceeded')) return 'TOKEN_QUOTA_EXCEEDED';
    if (msg.includes('rate limit') || msg.includes('too many')) return 'RATE_LIMITED';
    if (msg.includes('permission')) return 'PERMISSION_INSUFFICIENT';
    if (msg.includes('validation') || msg.includes('invalid')) return 'BATCH_VALIDATION_FAILED';
    if (msg.includes('partial')) return 'BATCH_PARTIAL_FAILURE';
    if (msg.includes('deploy')) return 'TOKEN_DEPLOY_FAILED';
    if (msg.includes('compliance')) return 'COMPLIANCE_CHECK_FAILED';
    if (msg.includes('attestation')) return 'ATTESTATION_SUBMISSION_FAILED';
    if (msg.includes('whitelist')) return 'WHITELIST_SAVE_FAILED';
  }

  return 'UNKNOWN_OPERATION_ERROR';
}

/**
 * Returns all defined OperationsErrorCode values.
 * Useful for automated audits and test coverage validation.
 */
export function getAllOperationsErrorCodes(): OperationsErrorCode[] {
  return Object.keys(OPERATIONS_ERROR_REGISTRY) as OperationsErrorCode[];
}
