/**
 * Launch Error Messages Utility
 *
 * Maps launch flow and auth failure classes to actionable, user-friendly error messages.
 * Follows the pattern: what happened → why it matters → what to do next.
 *
 * Used in GuidedTokenLaunch, ComplianceSetupWorkspace, and auth redirect flows.
 */

export interface LaunchErrorMessage {
  /** Short title of what happened */
  title: string;
  /** Why this matters to the user */
  description: string;
  /** Clear next action for the user */
  action: string;
  /** Whether the user can retry without support */
  recoverable: boolean;
  /** Severity level for UI styling */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Error codes for launch and auth flows.
 * Used to map server/client errors to user-facing messages.
 */
export type LaunchErrorCode =
  | 'AUTH_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'VALIDATION_FAILED'
  | 'COMPLIANCE_INCOMPLETE'
  | 'NETWORK_UNAVAILABLE'
  | 'SAVE_FAILED'
  | 'STEP_LOAD_FAILED'
  | 'SUBMISSION_FAILED'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

const errorMessages: Record<LaunchErrorCode, LaunchErrorMessage> = {
  AUTH_REQUIRED: {
    title: 'Sign in required',
    description:
      'You must be signed in to create or manage tokens. Your progress will be saved.',
    action: 'Sign in with your email and password, then return to where you left off.',
    recoverable: true,
    severity: 'info',
  },
  SESSION_EXPIRED: {
    title: 'Your session has expired',
    description:
      'For your security, sessions expire after a period of inactivity.',
    action: 'Sign in again to continue. Your draft has been saved automatically.',
    recoverable: true,
    severity: 'warning',
  },
  VALIDATION_FAILED: {
    title: 'Some fields need attention',
    description: 'One or more required fields are missing or contain invalid values.',
    action: 'Review the highlighted fields and correct the errors before continuing.',
    recoverable: true,
    severity: 'error',
  },
  COMPLIANCE_INCOMPLETE: {
    title: 'Compliance requirements not met',
    description:
      'Token deployment requires completing all compliance checkpoints for your jurisdiction.',
    action:
      'Complete the compliance readiness checklist in the Compliance step before proceeding.',
    recoverable: true,
    severity: 'warning',
  },
  NETWORK_UNAVAILABLE: {
    title: 'No internet connection',
    description: 'Your changes cannot be saved or submitted while offline.',
    action:
      'Check your internet connection and try again. Your draft is preserved locally.',
    recoverable: true,
    severity: 'error',
  },
  SAVE_FAILED: {
    title: 'Draft could not be saved',
    description: 'An error occurred while saving your progress.',
    action: 'Try saving again. If the problem persists, copy your inputs before refreshing.',
    recoverable: true,
    severity: 'error',
  },
  STEP_LOAD_FAILED: {
    title: 'This step could not load',
    description: 'An unexpected error prevented the page from rendering correctly.',
    action: 'Refresh the page to try again. Your draft data is preserved.',
    recoverable: true,
    severity: 'error',
  },
  SUBMISSION_FAILED: {
    title: 'Submission did not complete',
    description:
      'Your token launch request could not be processed. Biatec handles deployment in the backend - the request was received but encountered an error during processing.',
    action:
      'Wait a moment and try submitting again - your draft has been saved. If the error continues, contact support at support@biatec.io.',
    recoverable: true,
    severity: 'error',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Deployment service temporarily unavailable',
    description:
      'The token deployment service is temporarily unavailable. Biatec manages deployment in the backend and the service will recover automatically.',
    action:
      'Please wait a few minutes and try again. Your draft is saved and no duplicate will be created when you retry.',
    recoverable: true,
    severity: 'warning',
  },
  RATE_LIMITED: {
    title: 'Too many requests',
    description: 'You have made too many requests in a short period.',
    action: 'Wait a few minutes and try again.',
    recoverable: true,
    severity: 'warning',
  },
  UNKNOWN: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred.',
    action: 'Try again. If the problem persists, contact support at support@biatec.io.',
    recoverable: true,
    severity: 'error',
  },
};

/**
 * Returns an actionable, user-friendly error message for a given launch error code.
 *
 * @param code - The error code identifying the failure class
 * @returns A LaunchErrorMessage with title, description, action, and metadata
 */
export function getLaunchErrorMessage(code: LaunchErrorCode): LaunchErrorMessage {
  return errorMessages[code];
}

/**
 * Maps a raw Error or string to a LaunchErrorCode.
 * Inspects the message for known patterns to select the most appropriate code.
 *
 * @param error - The raw error from a failed operation
 * @returns The best matching LaunchErrorCode
 */
export function classifyLaunchError(error: unknown): LaunchErrorCode {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (msg.includes('auth') || msg.includes('unauthenticated') || msg.includes('unauthorized')) {
    return 'AUTH_REQUIRED';
  }
  if (msg.includes('session') || msg.includes('expired') || msg.includes('token expired')) {
    return 'SESSION_EXPIRED';
  }
  // Check compliance before validation - KYC/compliance errors mention "required" too
  if (msg.includes('compliance') || msg.includes('checklist') || msg.includes('kyc')) {
    return 'COMPLIANCE_INCOMPLETE';
  }
  if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required')) {
    return 'VALIDATION_FAILED';
  }
  if (msg.includes('network') || msg.includes('offline') || msg.includes('fetch')) {
    return 'NETWORK_UNAVAILABLE';
  }
  // 5xx responses and service unavailability — backend deployment service errors
  if (
    msg.includes('service unavailable') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('bad gateway') ||
    msg.includes('temporarily unavailable')
  ) {
    return 'SERVICE_UNAVAILABLE';
  }
  if (msg.includes('save') || msg.includes('draft') || msg.includes('storage')) {
    return 'SAVE_FAILED';
  }
  if (msg.includes('rate') || msg.includes('too many') || msg.includes('throttle')) {
    return 'RATE_LIMITED';
  }
  if (
    msg.includes('submit') ||
    msg.includes('submission') ||
    msg.includes('deployment') ||
    msg.includes('launch failed')
  ) {
    return 'SUBMISSION_FAILED';
  }

  return 'UNKNOWN';
}
