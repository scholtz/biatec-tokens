/**
 * Auth-First Issuance Workspace Utility
 *
 * Provides deterministic, testable helpers for the canonical auth-first
 * token issuance workspace. Replaces fragile wizard-era flow assumptions
 * with a structured, step-based finite state machine that is safe to test
 * and easy to support.
 *
 * Covers:
 * - Issuance step definitions: ordered, named, with validation requirements
 * - Step-state derivation: complete / active / locked / error per step
 * - Form validation helpers: required-field mapping per step
 * - Route guard helpers: return-path storage, auth check, redirect detection
 * - Telemetry event builders: stable milestone event names and metadata shapes
 * - Non-wallet label enforcement: API surface rejects wallet/network terminology
 * - Deployment status helpers: pending / success / failure state derivation
 * - Error surface helpers: actionable, user-readable messages per error class
 * - Accessibility helpers: ARIA labels for stepper and form controls
 *
 * Design goals:
 * - Pure functions with no side effects (localStorage helpers clearly marked)
 * - Deterministic: same inputs → same outputs, always
 * - Zero dependency on wallet/blockchain/network jargon in user-facing output
 * - Composable with router guards, E2E fixture setup, and Pinia stores
 * - Incremental: additive over existing utilities, no breaking imports
 *
 * Related files:
 * - src/utils/canonicalLaunchWorkspace.ts  (workspace state derivation)
 * - src/utils/confidenceHardening.ts       (route canonicalization)
 * - src/utils/mvpCanonicalFlow.ts          (session contract helpers)
 * - src/utils/authFirstHardening.ts        (route classification + nav invariants)
 * - src/utils/launchErrorMessages.ts       (user-facing launch error messages)
 * - src/router/index.ts                    (router guard implementation)
 *
 * Issue: MVP — Build canonical auth-first token issuance workspace and remove wizard dependency
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Issuance step definitions
// ---------------------------------------------------------------------------

/**
 * Ordered step identifiers for the canonical issuance workspace.
 * Each step has a stable ID used for navigation, telemetry, and test anchors.
 */
export const ISSUANCE_STEP_IDS = [
  'workspace-context',
  'token-parameters',
  'compliance-configuration',
  'deployment-review',
  'deployment-status',
] as const;

export type IssuanceStepId = typeof ISSUANCE_STEP_IDS[number];

/**
 * Human-readable title for each issuance step.
 * All titles use business-language — no blockchain/wallet terminology.
 */
export const ISSUANCE_STEP_TITLES: Record<IssuanceStepId, string> = {
  'workspace-context':        'Workspace & Token Type',
  'token-parameters':         'Token Parameters',
  'compliance-configuration': 'Compliance Configuration',
  'deployment-review':        'Review & Confirm',
  'deployment-status':        'Deployment Status',
};

/**
 * Short description shown beneath each step title in the stepper.
 */
export const ISSUANCE_STEP_DESCRIPTIONS: Record<IssuanceStepId, string> = {
  'workspace-context':        'Select the token type and issuance context for your deployment.',
  'token-parameters':         'Configure supply, name, symbol, and core issuance parameters.',
  'compliance-configuration': 'Set compliance attestations, jurisdiction, and transfer restrictions.',
  'deployment-review':        'Review all settings before submitting your deployment request.',
  'deployment-status':        'Track the status of your deployment and take next actions.',
};

/**
 * `data-testid` attribute values for critical workspace elements.
 * Used by E2E tests and accessibility tooling for deterministic selection.
 */
export const ISSUANCE_TEST_IDS = {
  WORKSPACE_SHELL:          'issuance-workspace-shell',
  STEP_INDICATOR:           'issuance-step-indicator',
  STEP_BUTTON_PREFIX:       'issuance-step-btn-',      // append step index
  STEP_CONTENT_PREFIX:      'issuance-step-content-',  // append stepId
  PROGRESS_BAR:             'issuance-progress-bar',
  PROGRESS_PERCENTAGE:      'issuance-progress-pct',
  SAVE_DRAFT_BUTTON:        'issuance-save-draft',
  CONTINUE_BUTTON:          'issuance-continue',
  BACK_BUTTON:              'issuance-back',
  SUBMIT_BUTTON:            'issuance-submit',
  ERROR_BANNER:             'issuance-error-banner',
  SUCCESS_BANNER:           'issuance-success-banner',
  DEPLOYMENT_STATUS_PANEL:  'issuance-deployment-status',
  AUTH_REQUIRED_NOTICE:     'issuance-auth-required',
  LOADING_INDICATOR:        'issuance-loading',
  VALIDATION_SUMMARY:       'issuance-validation-summary',
} as const;

// ---------------------------------------------------------------------------
// Step state
// ---------------------------------------------------------------------------

/**
 * Status of a single issuance step.
 */
export type IssuanceStepStatus =
  | 'locked'    // Prerequisites not met; cannot navigate to this step
  | 'active'    // Currently displayed step
  | 'complete'  // User has fulfilled all required fields
  | 'error'     // Validation or API error on this step
  | 'pending';  // Step is reachable but not yet visited

/**
 * Derived display state for a single issuance step.
 */
export interface IssuanceStepState {
  id: IssuanceStepId;
  index: number;
  title: string;
  description: string;
  status: IssuanceStepStatus;
  /** True when the user can click to navigate to this step */
  canNavigate: boolean;
  /** ARIA label for the step button */
  ariaLabel: string;
  /** `data-testid` for the step button */
  testId: string;
}

/**
 * Form field validation map: lists required fields per step and whether each is satisfied.
 */
export interface StepValidationResult {
  stepId: IssuanceStepId;
  isValid: boolean;
  missingFields: string[];
  errorMessages: string[];
}

// ---------------------------------------------------------------------------
// Step state derivation
// ---------------------------------------------------------------------------

/**
 * Derive the display status for a step given context.
 *
 * Rules:
 * - Steps beyond `currentIndex` that have no saved data are 'locked' if the
 *   previous step is not complete, otherwise 'pending'.
 * - The step at `currentIndex` is 'active'.
 * - Steps before `currentIndex` are 'complete' if their validation passes, otherwise 'error'.
 *
 * @param stepIndex        Index of the step being evaluated (0-based)
 * @param currentIndex     Currently active step index
 * @param completedSteps   Set of step IDs that have passed validation
 * @param errorSteps       Set of step IDs that have a validation/API error
 */
export function deriveStepStatus(
  stepIndex: number,
  currentIndex: number,
  completedSteps: ReadonlySet<IssuanceStepId>,
  errorSteps: ReadonlySet<IssuanceStepId>,
): IssuanceStepStatus {
  const stepId = ISSUANCE_STEP_IDS[stepIndex];
  if (stepIndex === currentIndex) return 'active';
  if (errorSteps.has(stepId)) return 'error';
  if (completedSteps.has(stepId)) return 'complete';
  // Steps before current that haven't been validated are treated as complete
  // (they were already visited and the user advanced past them)
  if (stepIndex < currentIndex) return 'complete';
  return 'pending';
}

/**
 * Returns true when the user is allowed to navigate to a given step.
 *
 * Navigation rules:
 * - Can always navigate to the current step.
 * - Can navigate backwards to any visited step (index < currentIndex).
 * - Can navigate forwards only if all intermediate steps are complete.
 */
export function canNavigateToStep(
  targetIndex: number,
  currentIndex: number,
  completedSteps: ReadonlySet<IssuanceStepId>,
): boolean {
  if (targetIndex === currentIndex) return true;
  if (targetIndex < currentIndex) return true;
  // Forward navigation: every step between current and target must be complete
  for (let i = currentIndex; i < targetIndex; i++) {
    if (!completedSteps.has(ISSUANCE_STEP_IDS[i])) return false;
  }
  return true;
}

/**
 * Builds the full array of `IssuanceStepState` objects for the stepper UI.
 */
export function buildStepStates(
  currentIndex: number,
  completedSteps: ReadonlySet<IssuanceStepId>,
  errorSteps: ReadonlySet<IssuanceStepId>,
): IssuanceStepState[] {
  return ISSUANCE_STEP_IDS.map((id, index) => {
    const status = deriveStepStatus(index, currentIndex, completedSteps, errorSteps);
    const canNav = canNavigateToStep(index, currentIndex, completedSteps);
    const title = ISSUANCE_STEP_TITLES[id];
    return {
      id,
      index,
      title,
      description: ISSUANCE_STEP_DESCRIPTIONS[id],
      status,
      canNavigate: canNav,
      ariaLabel: `Step ${index + 1}: ${title}${status === 'complete' ? ' (completed)' : status === 'error' ? ' (has errors)' : status === 'active' ? ' (current)' : ''}`,
      testId: `${ISSUANCE_TEST_IDS.STEP_BUTTON_PREFIX}${index}`,
    };
  });
}

// ---------------------------------------------------------------------------
// Progress calculation
// ---------------------------------------------------------------------------

/**
 * Returns the percentage of steps completed (0–100, integer).
 * The deployment-status step is not included in the completion count —
 * progress reaches 100% on reaching deployment-status.
 */
export function calculateIssuanceProgress(
  completedSteps: ReadonlySet<IssuanceStepId>,
): number {
  const totalSteps = ISSUANCE_STEP_IDS.length;
  // Count completed steps
  let completed = completedSteps.size;
  // Cap at the step before deployment-status for percentage purposes
  completed = Math.min(completed, totalSteps - 1);
  return Math.round((completed / (totalSteps - 1)) * 100);
}

// ---------------------------------------------------------------------------
// Form validation helpers
// ---------------------------------------------------------------------------

/**
 * Required field names for each issuance step.
 * Field names use snake_case matching API parameter names.
 */
export const REQUIRED_FIELDS_PER_STEP: Record<IssuanceStepId, ReadonlyArray<string>> = {
  'workspace-context': [
    'token_type',
    'issuer_context',
  ],
  'token-parameters': [
    'token_name',
    'token_symbol',
    'total_supply',
    'network',
  ],
  'compliance-configuration': [
    'jurisdiction',
    'transfer_restrictions_acknowledged',
  ],
  'deployment-review': [],   // Review step: no additional required fields
  'deployment-status': [],   // Status step: read-only
};

/**
 * Validates the required fields for a single issuance step.
 *
 * @param stepId      The step to validate
 * @param formData    Key-value map of form field values (string, number, boolean)
 * @returns StepValidationResult
 */
export function validateIssuanceStep(
  stepId: IssuanceStepId,
  formData: Record<string, unknown>,
): StepValidationResult {
  const required = REQUIRED_FIELDS_PER_STEP[stepId];
  const missingFields: string[] = [];

  for (const field of required) {
    const value = formData[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    } else if (typeof value === 'boolean' && value === false && field.endsWith('_acknowledged')) {
      // Acknowledgement checkboxes must be explicitly true
      missingFields.push(field);
    }
  }

  const errorMessages = missingFields.map((f) => buildMissingFieldMessage(f));

  return {
    stepId,
    isValid: missingFields.length === 0,
    missingFields,
    errorMessages,
  };
}

/**
 * Returns a user-readable message for a missing required field.
 * Uses business-language labels, not internal field names.
 */
export function buildMissingFieldMessage(fieldName: string): string {
  const labels: Record<string, string> = {
    token_type:                         'Please select a token type.',
    issuer_context:                     'Please provide the issuance context.',
    token_name:                         'Token name is required.',
    token_symbol:                       'Token symbol is required.',
    total_supply:                       'Total supply is required.',
    network:                            'Please select a deployment network.',
    jurisdiction:                       'Jurisdiction is required for compliance.',
    transfer_restrictions_acknowledged: 'Please acknowledge the transfer restriction policy.',
  };
  return labels[fieldName] ?? `${fieldName.replace(/_/g, ' ')} is required.`;
}

// ---------------------------------------------------------------------------
// Route guard helpers
// ---------------------------------------------------------------------------

/** Storage key for the post-auth return path */
export const ISSUANCE_RETURN_PATH_KEY = 'issuance_return_path';

/** Canonical issuance workspace route */
export const CANONICAL_ISSUANCE_ROUTE = '/launch/guided';

/** Legacy wizard route that must redirect to canonical issuance */
export const LEGACY_ISSUANCE_ROUTE = '/create/wizard';

/**
 * Stores the intended issuance destination so it can be restored after login.
 * Side-effecting: writes to localStorage.
 *
 * @param path - The full path (including query string) to return to after auth
 */
export function storeIssuanceReturnPath(path: string): void {
  try {
    localStorage.setItem(ISSUANCE_RETURN_PATH_KEY, path);
  } catch {
    // localStorage unavailable (SSR, private mode) — silently ignore
  }
}

/**
 * Retrieves and clears the stored issuance return path.
 * Side-effecting: reads from and removes item from localStorage.
 *
 * @returns The stored path, or null if none was saved
 */
export function consumeIssuanceReturnPath(): string | null {
  try {
    const path = localStorage.getItem(ISSUANCE_RETURN_PATH_KEY);
    if (path) localStorage.removeItem(ISSUANCE_RETURN_PATH_KEY);
    return path;
  } catch {
    return null;
  }
}

/**
 * Returns true when the given path is the canonical issuance entry point.
 */
export function isCanonicalIssuancePath(path: string): boolean {
  return path === CANONICAL_ISSUANCE_ROUTE || path.startsWith(`${CANONICAL_ISSUANCE_ROUTE}/`);
}

/**
 * Returns true when the given path is the legacy wizard route that must be redirected.
 */
export function isLegacyIssuancePath(path: string): boolean {
  return path === LEGACY_ISSUANCE_ROUTE || path.startsWith(`${LEGACY_ISSUANCE_ROUTE}/`);
}

/**
 * Checks whether a raw localStorage value represents an authenticated session.
 * Does NOT parse JSON — just checks presence and basic structure to keep this
 * helper safe for guard contexts that can't import heavy store logic.
 */
export function isIssuanceSessionValid(rawSession: string | null): boolean {
  if (!rawSession) return false;
  try {
    const parsed = JSON.parse(rawSession);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.address === 'string' &&
      parsed.address.length > 0 &&
      typeof parsed.isConnected === 'boolean' &&
      parsed.isConnected === true
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Telemetry / analytics event builders
// ---------------------------------------------------------------------------

/**
 * Stable event names for issuance workspace milestones.
 * Names follow the product analytics convention: `domain_subject_verb`.
 */
export const ISSUANCE_TELEMETRY_EVENTS = {
  WORKSPACE_ENTERED:       'issuance_workspace_entered',
  STEP_ENTERED:            'issuance_step_entered',
  STEP_VALIDATED:          'issuance_step_validated',
  VALIDATION_FAILED:       'issuance_validation_failed',
  DRAFT_SAVED:             'issuance_draft_saved',
  DRAFT_RESTORED:          'issuance_draft_restored',
  REVIEW_SUBMITTED:        'issuance_review_submitted',
  DEPLOYMENT_STARTED:      'issuance_deployment_started',
  DEPLOYMENT_COMPLETED:    'issuance_deployment_completed',
  DEPLOYMENT_FAILED:       'issuance_deployment_failed',
  COMPLIANCE_VISITED:      'issuance_compliance_visited',
  COMPLIANCE_FAILED:       'issuance_compliance_failed',
  COMPLIANCE_REMEDIATED:   'issuance_compliance_remediated',
  AUTH_REDIRECT_TRIGGERED: 'issuance_auth_redirect_triggered',
  AUTH_RETURN_COMPLETED:   'issuance_auth_return_completed',
} as const;

export type IssuanceTelemetryEvent = typeof ISSUANCE_TELEMETRY_EVENTS[keyof typeof ISSUANCE_TELEMETRY_EVENTS];

/**
 * Base payload shape shared by all issuance telemetry events.
 * No PII fields. No wallet/network identifiers.
 */
export interface IssuanceTelemetryPayload {
  event: IssuanceTelemetryEvent;
  stepId?: IssuanceStepId;
  stepIndex?: number;
  sessionId: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Builds a `workspace_entered` telemetry event.
 */
export function buildWorkspaceEnteredEvent(sessionId: string): IssuanceTelemetryPayload {
  return {
    event: ISSUANCE_TELEMETRY_EVENTS.WORKSPACE_ENTERED,
    sessionId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds a `step_entered` telemetry event.
 */
export function buildStepEnteredEvent(
  stepId: IssuanceStepId,
  sessionId: string,
): IssuanceTelemetryPayload {
  return {
    event: ISSUANCE_TELEMETRY_EVENTS.STEP_ENTERED,
    stepId,
    stepIndex: ISSUANCE_STEP_IDS.indexOf(stepId),
    sessionId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds a `validation_failed` telemetry event.
 */
export function buildValidationFailedEvent(
  stepId: IssuanceStepId,
  missingFields: ReadonlyArray<string>,
  sessionId: string,
): IssuanceTelemetryPayload {
  return {
    event: ISSUANCE_TELEMETRY_EVENTS.VALIDATION_FAILED,
    stepId,
    stepIndex: ISSUANCE_STEP_IDS.indexOf(stepId),
    sessionId,
    timestamp: new Date().toISOString(),
    metadata: {
      missingFieldCount: missingFields.length,
    },
  };
}

/**
 * Builds a `review_submitted` telemetry event.
 */
export function buildReviewSubmittedEvent(sessionId: string): IssuanceTelemetryPayload {
  return {
    event: ISSUANCE_TELEMETRY_EVENTS.REVIEW_SUBMITTED,
    stepId: 'deployment-review',
    stepIndex: ISSUANCE_STEP_IDS.indexOf('deployment-review'),
    sessionId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds a `deployment_started` telemetry event.
 */
export function buildDeploymentStartedEvent(sessionId: string): IssuanceTelemetryPayload {
  return {
    event: ISSUANCE_TELEMETRY_EVENTS.DEPLOYMENT_STARTED,
    stepId: 'deployment-status',
    stepIndex: ISSUANCE_STEP_IDS.indexOf('deployment-status'),
    sessionId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds a `deployment_completed` telemetry event.
 */
export function buildDeploymentCompletedEvent(
  sessionId: string,
  durationMs: number,
): IssuanceTelemetryPayload {
  return {
    event: ISSUANCE_TELEMETRY_EVENTS.DEPLOYMENT_COMPLETED,
    stepId: 'deployment-status',
    stepIndex: ISSUANCE_STEP_IDS.indexOf('deployment-status'),
    sessionId,
    timestamp: new Date().toISOString(),
    metadata: { durationMs },
  };
}

/**
 * Builds a `deployment_failed` telemetry event.
 */
export function buildDeploymentFailedEvent(
  sessionId: string,
  errorCode: string,
): IssuanceTelemetryPayload {
  return {
    event: ISSUANCE_TELEMETRY_EVENTS.DEPLOYMENT_FAILED,
    stepId: 'deployment-status',
    stepIndex: ISSUANCE_STEP_IDS.indexOf('deployment-status'),
    sessionId,
    timestamp: new Date().toISOString(),
    metadata: { errorCode },
  };
}

/**
 * Builds an `auth_redirect_triggered` telemetry event.
 */
export function buildAuthRedirectEvent(
  returnPath: string,
  sessionId: string,
): IssuanceTelemetryPayload {
  return {
    event: ISSUANCE_TELEMETRY_EVENTS.AUTH_REDIRECT_TRIGGERED,
    sessionId,
    timestamp: new Date().toISOString(),
    metadata: { returnPath },
  };
}

/**
 * Validates that a telemetry payload does not contain PII or wallet fields.
 * Returns a list of violations (empty = valid).
 */
export function validateTelemetryPayload(payload: IssuanceTelemetryPayload): string[] {
  const violations: string[] = [];
  if (!payload.event) violations.push('event name is missing');
  if (!payload.sessionId) violations.push('sessionId is missing');
  if (!payload.timestamp) violations.push('timestamp is missing');
  // Block PII fields
  const forbidden = ['email', 'address', 'wallet', 'privateKey', 'mnemonic'];
  if (payload.metadata) {
    for (const key of forbidden) {
      if (key in payload.metadata) violations.push(`metadata must not include "${key}"`);
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Deployment status helpers
// ---------------------------------------------------------------------------

/**
 * Possible deployment status values returned by the backend.
 */
export type DeploymentStatus =
  | 'not_started'
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'cancelled';

/**
 * Derived UI state for the deployment status panel.
 */
export interface DeploymentStatusState {
  status: DeploymentStatus;
  /** Headline shown in the status panel */
  headline: string;
  /** Supporting description for the current status */
  description: string;
  /** Whether the user can retry the deployment */
  canRetry: boolean;
  /** Whether the user can safely navigate away */
  canExit: boolean;
  /** Progress percentage for status indicator (0–100) */
  progressPct: number;
  /** ARIA live region politeness */
  ariaLive: 'polite' | 'assertive' | 'off';
}

/**
 * Derives the UI state for the deployment status panel.
 */
export function deriveDeploymentStatusState(status: DeploymentStatus): DeploymentStatusState {
  switch (status) {
    case 'not_started':
      return {
        status,
        headline: 'Ready to deploy',
        description: 'Your token issuance request is ready to submit. Review the settings and confirm when ready.',
        canRetry: false,
        canExit: true,
        progressPct: 0,
        ariaLive: 'polite',
      };
    case 'pending':
      return {
        status,
        headline: 'Deployment queued',
        description: 'Your deployment request has been received and is queued for processing.',
        canRetry: false,
        canExit: true,
        progressPct: 20,
        ariaLive: 'polite',
      };
    case 'in_progress':
      return {
        status,
        headline: 'Deployment in progress',
        description: 'Your token is being deployed. This may take a few minutes — you will be notified when complete.',
        canRetry: false,
        canExit: true,
        progressPct: 60,
        ariaLive: 'polite',
      };
    case 'success':
      return {
        status,
        headline: 'Token deployed successfully',
        description: 'Your token has been issued and is ready for use. Check the dashboard for details and next steps.',
        canRetry: false,
        canExit: true,
        progressPct: 100,
        ariaLive: 'polite',
      };
    case 'failed':
      return {
        status,
        headline: 'Deployment failed',
        description: 'There was a problem deploying your token. Review the error details below and try again, or contact support if the issue persists.',
        canRetry: true,
        canExit: true,
        progressPct: 0,
        ariaLive: 'assertive',
      };
    case 'cancelled':
      return {
        status,
        headline: 'Deployment cancelled',
        description: 'The deployment request was cancelled. You can start a new deployment from the workspace.',
        canRetry: true,
        canExit: true,
        progressPct: 0,
        ariaLive: 'polite',
      };
  }
}

// ---------------------------------------------------------------------------
// Error surface helpers
// ---------------------------------------------------------------------------

/**
 * Error classes recognised by the issuance workspace error surface.
 */
export type IssuanceErrorClass =
  | 'auth_required'
  | 'session_expired'
  | 'validation_error'
  | 'compliance_blocked'
  | 'api_error'
  | 'deployment_error'
  | 'network_error'
  | 'unknown';

/**
 * Actionable error message shown in the workspace error banner.
 * All messages follow the what/why/how structure.
 */
export interface IssuanceErrorMessage {
  /** Short headline answering "What happened?" */
  title: string;
  /** Supporting description answering "Why did this happen?" */
  description: string;
  /** Actionable guidance answering "What should I do?" */
  action: string;
  /** Severity affects banner styling */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Returns the actionable error message for a given error class.
 * Every message is non-technical and uses business language.
 */
export function getIssuanceErrorMessage(errorClass: IssuanceErrorClass): IssuanceErrorMessage {
  switch (errorClass) {
    case 'auth_required':
      return {
        title: 'Sign in required',
        description: 'You must be signed in to access the issuance workspace.',
        action: 'Sign in to continue. Your progress will be saved.',
        severity: 'warning',
      };
    case 'session_expired':
      return {
        title: 'Your session has ended',
        description: 'Your session expired after a period of inactivity.',
        action: 'Sign in again to continue where you left off.',
        severity: 'warning',
      };
    case 'validation_error':
      return {
        title: 'Please complete required fields',
        description: 'Some required fields are missing or incorrect.',
        action: 'Review the highlighted fields and provide the required information.',
        severity: 'error',
      };
    case 'compliance_blocked':
      return {
        title: 'Compliance setup incomplete',
        description: 'Your issuance request cannot proceed until compliance prerequisites are met.',
        action: 'Complete the compliance configuration and acknowledge all required policies.',
        severity: 'error',
      };
    case 'api_error':
      return {
        title: 'Service temporarily unavailable',
        description: 'The issuance service returned an error.',
        action: 'Wait a moment and try again. If the problem continues, contact support.',
        severity: 'error',
      };
    case 'deployment_error':
      return {
        title: 'Deployment request failed',
        description: 'The platform could not process your deployment request.',
        action: 'Check your issuance settings and try again. Contact support if the error persists.',
        severity: 'error',
      };
    case 'network_error':
      return {
        title: 'Connection problem',
        description: 'The request could not reach the issuance service.',
        action: 'Check your internet connection and try again.',
        severity: 'error',
      };
    case 'unknown':
    default:
      return {
        title: 'Something went wrong',
        description: 'An unexpected error occurred.',
        action: 'Refresh the page and try again. Contact support if the error persists.',
        severity: 'error',
      };
  }
}

/**
 * Classifies a raw error (from API or internal logic) into a known IssuanceErrorClass.
 * Keeps classification logic centralised so that components do not need to
 * interpret raw error shapes.
 *
 * @param error - Raw error object from a catch block or API response
 */
export function classifyIssuanceError(error: unknown): IssuanceErrorClass {
  if (!error) return 'unknown';
  if (typeof error === 'string') {
    const lower = error.toLowerCase();
    if (lower.includes('auth') || lower.includes('unauthori') || lower.includes('401')) return 'auth_required';
    if (lower.includes('session') || lower.includes('expired')) return 'session_expired';
    if (lower.includes('compliance') || lower.includes('policy') || lower.includes('restrict')) return 'compliance_blocked';
    if (lower.includes('validation') || lower.includes('invalid') || lower.includes('required')) return 'validation_error';
    if (lower.includes('deploy')) return 'deployment_error';
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('connection')) return 'network_error';
    if (lower.includes('service') || lower.includes('500') || lower.includes('503')) return 'api_error';
    return 'unknown';
  }
  if (typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const status = typeof e['status'] === 'number' ? e['status'] : 0;
    if (status === 401 || status === 403) return 'auth_required';
    if (status >= 500) return 'api_error';
    const msg = typeof e['message'] === 'string' ? e['message'] : '';
    return classifyIssuanceError(msg);
  }
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Non-wallet label enforcement
// ---------------------------------------------------------------------------

/**
 * Patterns that must never appear in issuance workspace user-facing text.
 * These are wallet-era artifacts that violate the non-crypto-native product requirement.
 */
export const FORBIDDEN_ISSUANCE_LABELS: ReadonlyArray<RegExp> = [
  /connect\s+wallet/i,
  /wallet\s+connect/i,
  /not\s+connected/i,
  /wallet\s+required/i,
  /no\s+wallet/i,
  /network\s+required/i,
  /select\s+network\b/i,
  /switch\s+network/i,
  /metamask/i,
  /pera\s+wallet/i,
  /defly/i,
  /walletconnect/i,
  /sign\s+transaction/i,
  /approve\s+in\s+wallet/i,
];

/**
 * Returns true when the given text contains wallet-era terminology
 * that must not appear in the issuance workspace.
 */
export function containsIssuanceForbiddenLabel(text: string): boolean {
  return FORBIDDEN_ISSUANCE_LABELS.some((pattern) => pattern.test(text));
}

/**
 * Returns an array of matched forbidden patterns found in the text.
 */
export function findIssuanceForbiddenLabels(text: string): string[] {
  return FORBIDDEN_ISSUANCE_LABELS
    .filter((pattern) => pattern.test(text))
    .map((p) => p.source);
}

// ---------------------------------------------------------------------------
// Accessibility helpers
// ---------------------------------------------------------------------------

/**
 * Returns the ARIA label for the step indicator region.
 */
export function getStepIndicatorAriaLabel(currentIndex: number, totalSteps: number): string {
  return `Issuance progress: step ${currentIndex + 1} of ${totalSteps}`;
}

/**
 * Returns the ARIA label for the progress bar.
 */
export function getProgressBarAriaLabel(percentage: number): string {
  return `Issuance workspace progress: ${percentage}%`;
}

/**
 * Returns the ARIA label for the continue button based on current step.
 */
export function getContinueButtonAriaLabel(currentIndex: number): string {
  const totalSteps = ISSUANCE_STEP_IDS.length;
  if (currentIndex >= totalSteps - 2) return 'Submit deployment request';
  const nextStep = ISSUANCE_STEP_TITLES[ISSUANCE_STEP_IDS[currentIndex + 1]];
  return `Continue to ${nextStep}`;
}

/**
 * Returns the ARIA label for the back button based on current step.
 */
export function getBackButtonAriaLabel(currentIndex: number): string {
  if (currentIndex === 0) return 'Return to workspace overview';
  const prevStep = ISSUANCE_STEP_TITLES[ISSUANCE_STEP_IDS[currentIndex - 1]];
  return `Back to ${prevStep}`;
}

// ---------------------------------------------------------------------------
// Draft persistence helpers
// ---------------------------------------------------------------------------

/** Storage key for the issuance workspace draft */
export const ISSUANCE_DRAFT_KEY = 'issuance_workspace_draft';

export interface IssuanceDraft {
  currentStep: number;
  formData: Record<string, unknown>;
  savedAt: string;
}

/**
 * Serializes and stores an issuance draft to localStorage.
 * Side-effecting.
 */
export function saveIssuanceDraft(draft: IssuanceDraft): boolean {
  try {
    localStorage.setItem(ISSUANCE_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads an issuance draft from localStorage.
 * Returns null if no draft exists or if the stored value is invalid.
 * Side-effecting (read).
 */
export function loadIssuanceDraft(): IssuanceDraft | null {
  try {
    const raw = localStorage.getItem(ISSUANCE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IssuanceDraft;
    if (typeof parsed.currentStep !== 'number') return null;
    if (typeof parsed.formData !== 'object' || parsed.formData === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Removes the stored issuance draft from localStorage.
 * Side-effecting.
 */
export function clearIssuanceDraft(): void {
  try {
    localStorage.removeItem(ISSUANCE_DRAFT_KEY);
  } catch {
    // ignore
  }
}
