/**
 * Compliance Delivery Slice
 *
 * Provides a deterministic, testable model for the MVP compliance delivery
 * pipeline: the ordered sequence of steps a business operator completes to
 * authenticate, satisfy compliance requirements, and receive a deployed token.
 *
 * Roadmap alignment:
 *   - Email/Password Authentication (70%) — auth step guard
 *   - ARC76 Account Management (35%)     — account-verified step guard
 *   - Backend Token Deployment (45%)     — deployment-requested step guard
 *   - Compliance Reporting (40%)         — compliance-verified step guard
 *
 * Design goals:
 *   - Pure functions with no side effects
 *   - Deterministic: same inputs always produce the same result
 *   - Zero wallet/blockchain jargon in user-facing outputs
 *   - Composable with router guards, auth store, and E2E fixtures
 *   - Telemetry events for every step transition (observability requirement)
 *
 * Related files:
 *   - src/utils/complianceStatus.ts          (individual status display metadata)
 *   - src/utils/deterministicStateManager.ts (loading/success/failure UI states)
 *   - src/utils/provisioningStateManager.ts  (account provisioning sub-states)
 *   - src/utils/launchReadiness.ts           (pre-launch readiness checks)
 *   - src/utils/arc76SessionContract.ts      (session contract validation)
 *   - src/router/index.ts                    (router guard implementation)
 *
 * Issue: MVP next-step — deterministic auth/compliance delivery slice with full test evidence
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/**
 * Ordered steps in the compliance delivery pipeline.
 *
 * Steps must be completed in order; later steps cannot be reached without
 * completing all prior required steps.
 *
 * Step ordering:
 *   1. auth_required        — user must sign in with email/password
 *   2. account_provisioning — ARC76 account is being set up backend-side
 *   3. org_profile          — organisation profile submitted
 *   4. compliance_check     — compliance documents under review
 *   5. compliance_verified  — compliance check passed
 *   6. deployment_requested — token deployment submitted to backend
 *   7. delivered            — token successfully deployed and live
 */
export type ComplianceDeliveryStep =
  | 'auth_required'
  | 'account_provisioning'
  | 'org_profile'
  | 'compliance_check'
  | 'compliance_verified'
  | 'deployment_requested'
  | 'delivered';

/**
 * Ordered list of steps — used to compute position and validate transitions.
 */
export const DELIVERY_STEP_ORDER: ComplianceDeliveryStep[] = [
  'auth_required',
  'account_provisioning',
  'org_profile',
  'compliance_check',
  'compliance_verified',
  'deployment_requested',
  'delivered',
];

// ---------------------------------------------------------------------------
// State types
// ---------------------------------------------------------------------------

/**
 * Current state of the compliance delivery pipeline for one user/session.
 */
export interface ComplianceDeliveryState {
  /** The current (highest completed or in-progress) step. */
  step: ComplianceDeliveryStep;
  /**
   * Timestamp of the last step transition (ISO 8601).
   * Useful for audit trails and detecting stale sessions.
   */
  lastTransitionAt: string;
  /**
   * Human-readable label for the current step (business language, no jargon).
   */
  label: string;
  /**
   * Plain-language guidance for what the user should do next.
   */
  userGuidance: string;
  /**
   * Whether the pipeline can advance to the next step from the current state.
   */
  canAdvance: boolean;
  /**
   * Whether the pipeline is in a terminal state (delivered or unrecoverable failure).
   */
  isTerminal: boolean;
  /**
   * Optional context bag for structured logging or telemetry.
   */
  context?: Record<string, unknown>;
}

/**
 * Inputs required to compute the current delivery step.
 */
export interface DeliveryStepInputs {
  /** True when a valid, connected session exists in the auth store. */
  isAuthenticated: boolean;
  /** True when the ARC76 account has been provisioned backend-side. */
  isAccountProvisioned: boolean;
  /** True when the user has submitted their organisation profile. */
  hasOrgProfile: boolean;
  /** True when compliance documents have been submitted for review. */
  complianceSubmitted: boolean;
  /** True when the compliance check has passed. */
  complianceApproved: boolean;
  /** True when token deployment has been submitted to the backend. */
  deploymentRequested: boolean;
  /** True when the backend has confirmed successful token deployment. */
  deploymentConfirmed: boolean;
}

/**
 * Structured telemetry event emitted on each step transition.
 */
export interface DeliveryStepEvent {
  eventName: string;
  step: ComplianceDeliveryStep;
  previousStep: ComplianceDeliveryStep | null;
  timestamp: string;
  /** Stable numeric index (0-based) in the step order — useful for funnels. */
  stepIndex: number;
  meta?: Record<string, unknown>;
}

/**
 * Result of validating a proposed step transition.
 */
export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Step labels and guidance
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<ComplianceDeliveryStep, string> = {
  auth_required: 'Sign In Required',
  account_provisioning: 'Setting Up Your Account',
  org_profile: 'Organisation Profile',
  compliance_check: 'Compliance Review',
  compliance_verified: 'Compliance Approved',
  deployment_requested: 'Token Deployment Submitted',
  delivered: 'Token Delivered',
};

const STEP_GUIDANCE: Record<ComplianceDeliveryStep, string> = {
  auth_required:
    'Sign in with your email and password to continue. Our platform handles all technical complexity on your behalf.',
  account_provisioning:
    'Your account is being prepared. This typically takes less than a minute. Please wait.',
  org_profile:
    'Complete your organisation profile so we can personalise your compliance requirements.',
  compliance_check:
    'Your compliance documents are under review. We will notify you when the review is complete.',
  compliance_verified:
    'Compliance approved. You can now request token deployment.',
  deployment_requested:
    'Your token deployment request has been submitted. Our backend will process it and notify you.',
  delivered:
    'Your token has been successfully deployed. You can view it on your dashboard.',
};

// ---------------------------------------------------------------------------
// Core pure functions
// ---------------------------------------------------------------------------

/**
 * Compute the current compliance delivery step from structured inputs.
 *
 * The function walks the pipeline in order and returns the first step whose
 * prerequisite condition is NOT yet satisfied. If all conditions are satisfied
 * the step is `delivered`.
 */
export function computeDeliveryStep(inputs: DeliveryStepInputs): ComplianceDeliveryStep {
  if (!inputs.isAuthenticated) return 'auth_required';
  if (!inputs.isAccountProvisioned) return 'account_provisioning';
  if (!inputs.hasOrgProfile) return 'org_profile';
  if (!inputs.complianceSubmitted || !inputs.complianceApproved) return 'compliance_check';
  // Note: 'compliance_check' covers both "not yet submitted" and "submitted but under review".
  // The compliance setup workspace shows contextual sub-state UI based on complianceSubmitted.
  if (!inputs.deploymentRequested) return 'compliance_verified';
  if (!inputs.deploymentConfirmed) return 'deployment_requested';
  return 'delivered';
}

/**
 * Get the human-readable label for a step.
 */
export function getStepLabel(step: ComplianceDeliveryStep): string {
  return STEP_LABELS[step];
}

/**
 * Get the user-facing guidance for a step.
 */
export function getStepUserGuidance(step: ComplianceDeliveryStep): string {
  return STEP_GUIDANCE[step];
}

/**
 * Get the zero-based index of a step in the pipeline order.
 * Returns -1 if the step is not found (should never happen with typed inputs).
 */
export function getStepIndex(step: ComplianceDeliveryStep): number {
  return DELIVERY_STEP_ORDER.indexOf(step);
}

/**
 * Validate whether a transition from `from` to `to` is permitted.
 *
 * Rules:
 *   - Forward transitions are always valid (step index increases).
 *   - Backward transitions are invalid (pipeline is monotonically advancing).
 *   - Staying on the same step is invalid (no-op transitions are rejected).
 *
 * This function is used to detect unexpected state regressions in the pipeline,
 * e.g. if the auth store loses its session after compliance was already approved.
 */
export function validateStepTransition(
  from: ComplianceDeliveryStep,
  to: ComplianceDeliveryStep,
): TransitionValidationResult {
  const fromIndex = getStepIndex(from);
  const toIndex = getStepIndex(to);

  if (fromIndex === toIndex) {
    return { valid: false, reason: `No-op transition rejected: both sides are '${from}'` };
  }
  if (toIndex < fromIndex) {
    return {
      valid: false,
      reason: `Backward transition rejected: '${from}' → '${to}' is a regression`,
    };
  }
  return { valid: true };
}

/**
 * Build a structured telemetry event for a step transition.
 *
 * Events are emitted by UI components and store actions so operators can
 * trace exactly where users drop off in the compliance delivery pipeline.
 *
 * Event naming convention: `compliance_delivery.<step>` (snake_case, stable).
 */
export function buildDeliveryStepEvent(
  step: ComplianceDeliveryStep,
  previousStep: ComplianceDeliveryStep | null,
  meta?: Record<string, unknown>,
): DeliveryStepEvent {
  return {
    eventName: `compliance_delivery.${step}`,
    step,
    previousStep,
    timestamp: new Date().toISOString(),
    stepIndex: getStepIndex(step),
    meta,
  };
}

/**
 * Derive a full `ComplianceDeliveryState` from structured inputs.
 *
 * This is the primary entry point for components and stores. It combines
 * `computeDeliveryStep` with label/guidance resolution and terminal/advance flags.
 */
export function deriveDeliveryState(
  inputs: DeliveryStepInputs,
  context?: Record<string, unknown>,
): ComplianceDeliveryState {
  const step = computeDeliveryStep(inputs);
  const lastStep = DELIVERY_STEP_ORDER[DELIVERY_STEP_ORDER.length - 1];
  const isTerminal = step === lastStep;
  // canAdvance uses requiresUserAction() for consistency with step classification helpers.
  // Steps awaiting backend processing (account_provisioning, compliance_check,
  // deployment_requested) and the terminal 'delivered' step set canAdvance to false.
  const canAdvance = !isTerminal && requiresUserAction(step);

  return {
    step,
    lastTransitionAt: new Date().toISOString(),
    label: getStepLabel(step),
    userGuidance: getStepUserGuidance(step),
    canAdvance,
    isTerminal,
    context,
  };
}

// ---------------------------------------------------------------------------
// Completion and progress helpers
// ---------------------------------------------------------------------------

/**
 * Compute progress as a percentage (0–100) based on current step position.
 */
export function computeDeliveryProgress(step: ComplianceDeliveryStep): number {
  const index = getStepIndex(step);
  const total = DELIVERY_STEP_ORDER.length - 1; // 0-indexed to 100%
  return Math.round((index / total) * 100);
}

/**
 * Returns true if the delivery pipeline has reached the `delivered` terminal step.
 */
export function isDelivered(step: ComplianceDeliveryStep): boolean {
  return step === 'delivered';
}

/**
 * Returns true if the step requires the user to wait for backend processing
 * (i.e. no user action is available until the backend responds).
 */
export function isAwaitingBackend(step: ComplianceDeliveryStep): boolean {
  return step === 'account_provisioning' || step === 'compliance_check' || step === 'deployment_requested';
}

/**
 * Returns true if the user can take an immediate action to advance the pipeline.
 */
export function requiresUserAction(step: ComplianceDeliveryStep): boolean {
  return step === 'auth_required' || step === 'org_profile' || step === 'compliance_verified';
}

// ---------------------------------------------------------------------------
// Guard helpers (composable with router guards)
// ---------------------------------------------------------------------------

/**
 * Returns true if the given step allows access to the compliance setup workspace.
 *
 * The compliance setup workspace requires at minimum an authenticated, provisioned
 * account with an org profile. Steps before `compliance_check` are not permitted.
 */
export function canAccessComplianceWorkspace(step: ComplianceDeliveryStep): boolean {
  const allowedFrom: ComplianceDeliveryStep[] = [
    'compliance_check',
    'compliance_verified',
    'deployment_requested',
    'delivered',
  ];
  return allowedFrom.includes(step);
}

/**
 * Returns true if the given step allows access to the token deployment request flow.
 *
 * Deployment is only available after compliance is approved (`compliance_verified`
 * or later terminal states).
 */
export function canRequestDeployment(step: ComplianceDeliveryStep): boolean {
  const allowedFrom: ComplianceDeliveryStep[] = [
    'compliance_verified',
    'deployment_requested',
    'delivered',
  ];
  return allowedFrom.includes(step);
}

/**
 * Returns the canonical redirect target for a step that does not allow access
 * to the requested route.
 *
 * Used by router guards to send users to the correct next step instead of
 * showing a generic 403 page.
 */
export function getStepRedirectTarget(step: ComplianceDeliveryStep): string {
  switch (step) {
    case 'auth_required':
      return '/?showAuth=true';
    case 'account_provisioning':
      return '/launch/guided';
    case 'org_profile':
      return '/launch/guided';
    case 'compliance_check':
      return '/compliance/setup';
    case 'compliance_verified':
      return '/compliance/setup';
    case 'deployment_requested':
      return '/launch/guided';
    case 'delivered':
      return '/dashboard';
  }
}
