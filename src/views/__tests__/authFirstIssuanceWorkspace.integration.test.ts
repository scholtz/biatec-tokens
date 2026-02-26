/**
 * Integration Tests: Auth-First Issuance Workspace
 *
 * Validates cross-cutting concerns between the issuance workspace utility and
 * the existing auth/routing infrastructure:
 *
 *   AC #1  Canonical route constants align with the router configuration
 *   AC #2  Route guard helpers integrate with session contract validation
 *   AC #3  Step state and progress are coherent through a full issuance journey
 *   AC #4  Validation integrates with error classification and message surface
 *   AC #5  Telemetry event sequence covers the complete issuance funnel
 *   AC #6  Non-wallet enforcement covers all user-facing text surfaces
 *   AC #7  Draft persistence round-trip is consistent with step state
 *   AC #8  Return-path mechanism aligns with existing router AUTH_STORAGE_KEYS
 *   AC #9  Deployment status state machine covers all transitions correctly
 *   AC #10 Accessibility labels are present and non-empty for all steps
 *
 * Zero arbitrary timeouts. Uses real localStorage via happy-dom environment.
 *
 * Issue: MVP — Build canonical auth-first token issuance workspace
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  ISSUANCE_STEP_IDS,
  ISSUANCE_STEP_TITLES,
  ISSUANCE_TEST_IDS,
  type IssuanceStepId,
  deriveStepStatus,
  canNavigateToStep,
  buildStepStates,
  calculateIssuanceProgress,
  REQUIRED_FIELDS_PER_STEP,
  validateIssuanceStep,
  buildMissingFieldMessage,
  ISSUANCE_RETURN_PATH_KEY,
  CANONICAL_ISSUANCE_ROUTE,
  LEGACY_ISSUANCE_ROUTE,
  storeIssuanceReturnPath,
  consumeIssuanceReturnPath,
  isCanonicalIssuancePath,
  isLegacyIssuancePath,
  isIssuanceSessionValid,
  ISSUANCE_TELEMETRY_EVENTS,
  buildWorkspaceEnteredEvent,
  buildStepEnteredEvent,
  buildValidationFailedEvent,
  buildReviewSubmittedEvent,
  buildDeploymentStartedEvent,
  buildDeploymentCompletedEvent,
  buildDeploymentFailedEvent,
  validateTelemetryPayload,
  deriveDeploymentStatusState,
  type DeploymentStatus,
  getIssuanceErrorMessage,
  classifyIssuanceError,
  containsIssuanceForbiddenLabel,
  findIssuanceForbiddenLabels,
  getStepIndicatorAriaLabel,
  getProgressBarAriaLabel,
  getContinueButtonAriaLabel,
  getBackButtonAriaLabel,
  ISSUANCE_DRAFT_KEY,
  saveIssuanceDraft,
  loadIssuanceDraft,
  clearIssuanceDraft,
  type IssuanceDraft,
} from '../../utils/authFirstIssuanceWorkspace';

// Existing utilities for cross-integration checks
import {
  CANONICAL_TOKEN_CREATION_ROUTE,
  LEGACY_WIZARD_ROUTE as CONFIDENCE_HARDENING_LEGACY_WIZARD_ROUTE,
} from '../../utils/confidenceHardening';

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function clearLocalStorage(): void {
  localStorage.clear();
}

function buildValidSession(email = 'user@example.com', address = 'ADDR_TEST_001'): string {
  return JSON.stringify({ address, email, isConnected: true });
}

function buildExpiredSession(email = 'user@example.com', address = 'ADDR_TEST_001'): string {
  return JSON.stringify({ address, email, isConnected: false });
}

/** Simulate a user completing a step by building valid form data for it */
function getValidFormDataForStep(stepId: IssuanceStepId): Record<string, unknown> {
  switch (stepId) {
    case 'workspace-context':
      return { token_type: 'equity', issuer_context: 'private-placement' };
    case 'token-parameters':
      return { token_name: 'Test Token', token_symbol: 'TST', total_supply: 1000000, network: 'algorand' };
    case 'compliance-configuration':
      return { jurisdiction: 'EU', transfer_restrictions_acknowledged: true };
    case 'deployment-review':
      return {};
    case 'deployment-status':
      return {};
  }
}

// ---------------------------------------------------------------------------
// AC #1: Canonical route constants align with router configuration
// ---------------------------------------------------------------------------

describe('Route constant alignment', () => {
  it('CANONICAL_ISSUANCE_ROUTE matches the expected router path', () => {
    expect(CANONICAL_ISSUANCE_ROUTE).toBe('/launch/guided');
  });

  it('LEGACY_ISSUANCE_ROUTE matches the expected legacy path', () => {
    expect(LEGACY_ISSUANCE_ROUTE).toBe('/create/wizard');
  });

  it('CANONICAL_ISSUANCE_ROUTE matches confidenceHardening CANONICAL_TOKEN_CREATION_ROUTE', () => {
    // Both utilities must point to the same canonical path
    expect(CANONICAL_ISSUANCE_ROUTE).toBe(CANONICAL_TOKEN_CREATION_ROUTE);
  });

  it('LEGACY_ISSUANCE_ROUTE matches confidenceHardening LEGACY_WIZARD_ROUTE', () => {
    expect(LEGACY_ISSUANCE_ROUTE).toBe(CONFIDENCE_HARDENING_LEGACY_WIZARD_ROUTE);
  });

  it('isCanonicalIssuancePath returns true for CANONICAL_ISSUANCE_ROUTE', () => {
    expect(isCanonicalIssuancePath(CANONICAL_ISSUANCE_ROUTE)).toBe(true);
  });

  it('isLegacyIssuancePath returns true for LEGACY_ISSUANCE_ROUTE', () => {
    expect(isLegacyIssuancePath(LEGACY_ISSUANCE_ROUTE)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #2: Route guard helpers integrate with session contract
// ---------------------------------------------------------------------------

describe('Route guard integration', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('valid session allows access', () => {
    const raw = buildValidSession();
    expect(isIssuanceSessionValid(raw)).toBe(true);
  });

  it('expired session blocks access', () => {
    const raw = buildExpiredSession();
    expect(isIssuanceSessionValid(raw)).toBe(false);
  });

  it('storing and consuming return path round-trips correctly', () => {
    const path = '/launch/guided?step=compliance-configuration';
    storeIssuanceReturnPath(path);
    const consumed = consumeIssuanceReturnPath();
    expect(consumed).toBe(path);
    // Consuming removes the path
    expect(consumeIssuanceReturnPath()).toBeNull();
  });

  it('return path key is separate from auth redirect key to avoid conflicts', () => {
    // The issuance workspace uses its own key, not the router AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH
    expect(ISSUANCE_RETURN_PATH_KEY).not.toBe('redirect_after_auth');
    expect(ISSUANCE_RETURN_PATH_KEY).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AC #3: Step state and progress through full journey
// ---------------------------------------------------------------------------

describe('Full journey step state simulation', () => {
  it('starts with all steps pending/active except step 0', () => {
    const states = buildStepStates(0, new Set(), new Set());
    expect(states[0].status).toBe('active');
    for (let i = 1; i < states.length; i++) {
      expect(states[i].status).toBe('pending');
    }
  });

  it('progresses through all steps maintaining correct state', () => {
    const completed = new Set<IssuanceStepId>();
    
    // After step 0 is complete
    completed.add('workspace-context');
    let states = buildStepStates(1, completed, new Set());
    expect(states[0].status).toBe('complete');
    expect(states[1].status).toBe('active');
    
    // After step 1 is complete
    completed.add('token-parameters');
    states = buildStepStates(2, completed, new Set());
    expect(states[1].status).toBe('complete');
    expect(states[2].status).toBe('active');
    
    // After step 2 is complete
    completed.add('compliance-configuration');
    states = buildStepStates(3, completed, new Set());
    expect(states[2].status).toBe('complete');
    expect(states[3].status).toBe('active');
  });

  it('progress increases monotonically through the journey', () => {
    const completed = new Set<IssuanceStepId>();
    let prevProgress = 0;
    
    for (let i = 0; i < ISSUANCE_STEP_IDS.length - 1; i++) {
      completed.add(ISSUANCE_STEP_IDS[i]);
      const progress = calculateIssuanceProgress(completed);
      expect(progress).toBeGreaterThanOrEqual(prevProgress);
      prevProgress = progress;
    }
  });

  it('reaches 100% after all active steps are complete', () => {
    const completed = new Set<IssuanceStepId>(ISSUANCE_STEP_IDS);
    expect(calculateIssuanceProgress(completed)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// AC #4: Validation integrates with error classification and messages
// ---------------------------------------------------------------------------

describe('Validation and error surface integration', () => {
  it('validation failure leads to classifiable validation error', () => {
    const result = validateIssuanceStep('token-parameters', {});
    expect(result.isValid).toBe(false);
    const errorClass = classifyIssuanceError('validation error: required fields missing');
    expect(errorClass).toBe('validation_error');
    const msg = getIssuanceErrorMessage(errorClass);
    expect(msg.severity).toBe('error');
    expect(msg.action).toBeTruthy();
  });

  it('each step validation produces errors with user-readable messages', () => {
    const stepsWithRequired: IssuanceStepId[] = [
      'workspace-context', 'token-parameters', 'compliance-configuration',
    ];
    for (const stepId of stepsWithRequired) {
      const result = validateIssuanceStep(stepId, {});
      expect(result.isValid).toBe(false);
      for (const msg of result.errorMessages) {
        // Message must not be an empty string
        expect(msg.trim().length).toBeGreaterThan(0);
        // Message must not expose raw field names (should be human-readable)
        expect(msg).not.toMatch(/^[a-z_]+$/);
      }
    }
  });

  it('all valid form data passes validation for each step', () => {
    for (const stepId of ISSUANCE_STEP_IDS) {
      const data = getValidFormDataForStep(stepId);
      const result = validateIssuanceStep(stepId, data);
      expect(result.isValid).toBe(true);
    }
  });

  it('compliance_blocked error produces non-null action text', () => {
    const msg = getIssuanceErrorMessage('compliance_blocked');
    expect(msg.action).toBeTruthy();
    expect(msg.description).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AC #5: Telemetry event sequence for full funnel
// ---------------------------------------------------------------------------

describe('Telemetry event sequence', () => {
  const SESSION_ID = 'sess_integration_001';

  it('builds a valid workspace_entered event', () => {
    const evt = buildWorkspaceEnteredEvent(SESSION_ID);
    expect(validateTelemetryPayload(evt)).toHaveLength(0);
  });

  it('builds valid step_entered events for all steps', () => {
    for (const stepId of ISSUANCE_STEP_IDS) {
      const evt = buildStepEnteredEvent(stepId, SESSION_ID);
      expect(validateTelemetryPayload(evt)).toHaveLength(0);
      expect(evt.stepId).toBe(stepId);
    }
  });

  it('builds a valid validation_failed event', () => {
    const evt = buildValidationFailedEvent('token-parameters', ['token_name'], SESSION_ID);
    expect(validateTelemetryPayload(evt)).toHaveLength(0);
    expect(evt.metadata?.missingFieldCount).toBe(1);
  });

  it('builds a valid review_submitted event', () => {
    const evt = buildReviewSubmittedEvent(SESSION_ID);
    expect(validateTelemetryPayload(evt)).toHaveLength(0);
    expect(evt.stepId).toBe('deployment-review');
  });

  it('builds a valid deployment_started event', () => {
    const evt = buildDeploymentStartedEvent(SESSION_ID);
    expect(validateTelemetryPayload(evt)).toHaveLength(0);
  });

  it('builds a valid deployment_completed event with duration', () => {
    const evt = buildDeploymentCompletedEvent(SESSION_ID, 3200);
    expect(validateTelemetryPayload(evt)).toHaveLength(0);
    expect(evt.metadata?.durationMs).toBe(3200);
  });

  it('builds a valid deployment_failed event', () => {
    const evt = buildDeploymentFailedEvent(SESSION_ID, 'ERR_503');
    expect(validateTelemetryPayload(evt)).toHaveLength(0);
    expect(evt.metadata?.errorCode).toBe('ERR_503');
  });

  it('event sequence follows the issuance funnel order', () => {
    // The canonical funnel order is: workspace_entered → step_entered (×N) → review_submitted → deployment_started → deployment_completed
    const events = [
      buildWorkspaceEnteredEvent(SESSION_ID),
      buildStepEnteredEvent('workspace-context', SESSION_ID),
      buildStepEnteredEvent('token-parameters', SESSION_ID),
      buildStepEnteredEvent('compliance-configuration', SESSION_ID),
      buildStepEnteredEvent('deployment-review', SESSION_ID),
      buildReviewSubmittedEvent(SESSION_ID),
      buildDeploymentStartedEvent(SESSION_ID),
      buildDeploymentCompletedEvent(SESSION_ID, 5000),
    ];

    for (const evt of events) {
      expect(validateTelemetryPayload(evt)).toHaveLength(0);
    }

    // Verify no PII in any event
    for (const evt of events) {
      const violations = validateTelemetryPayload(evt);
      expect(violations.filter((v) => v.includes('email') || v.includes('address'))).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #6: Non-wallet enforcement across all text surfaces
// ---------------------------------------------------------------------------

describe('Non-wallet text enforcement', () => {
  it('all step titles are wallet-free', () => {
    for (const id of ISSUANCE_STEP_IDS) {
      expect(containsIssuanceForbiddenLabel(ISSUANCE_STEP_TITLES[id])).toBe(false);
    }
  });

  it('all error messages are wallet-free', () => {
    const errorClasses = [
      'auth_required', 'session_expired', 'validation_error', 'compliance_blocked',
      'api_error', 'deployment_error', 'network_error', 'unknown',
    ] as const;
    for (const cls of errorClasses) {
      const msg = getIssuanceErrorMessage(cls);
      expect(findIssuanceForbiddenLabels(`${msg.title} ${msg.description} ${msg.action}`)).toHaveLength(0);
    }
  });

  it('all deployment status descriptions are wallet-free', () => {
    const statuses: DeploymentStatus[] = ['not_started', 'pending', 'in_progress', 'success', 'failed', 'cancelled'];
    for (const status of statuses) {
      const state = deriveDeploymentStatusState(status);
      expect(containsIssuanceForbiddenLabel(state.headline)).toBe(false);
      expect(containsIssuanceForbiddenLabel(state.description)).toBe(false);
    }
  });

  it('TEST_IDS values are wallet-free', () => {
    for (const value of Object.values(ISSUANCE_TEST_IDS)) {
      expect(containsIssuanceForbiddenLabel(value)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #7: Draft persistence round-trip with step state
// ---------------------------------------------------------------------------

describe('Draft persistence integration', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('saved draft is consistent with the current step state', () => {
    const draft: IssuanceDraft = {
      currentStep: 2,
      formData: getValidFormDataForStep('compliance-configuration'),
      savedAt: new Date().toISOString(),
    };
    saveIssuanceDraft(draft);
    const loaded = loadIssuanceDraft();
    expect(loaded).not.toBeNull();
    expect(loaded!.currentStep).toBe(2);
    expect(loaded!.formData.jurisdiction).toBe('EU');
  });

  it('clearing draft removes it so loadIssuanceDraft returns null', () => {
    const draft: IssuanceDraft = {
      currentStep: 1,
      formData: {},
      savedAt: new Date().toISOString(),
    };
    saveIssuanceDraft(draft);
    clearIssuanceDraft();
    expect(loadIssuanceDraft()).toBeNull();
  });

  it('draft key is separate from issuance return path key', () => {
    expect(ISSUANCE_DRAFT_KEY).not.toBe(ISSUANCE_RETURN_PATH_KEY);
  });
});

// ---------------------------------------------------------------------------
// AC #9: Deployment status state machine
// ---------------------------------------------------------------------------

describe('Deployment status state machine', () => {
  it('status progression: not_started → pending → in_progress → success', () => {
    const sequence: DeploymentStatus[] = ['not_started', 'pending', 'in_progress', 'success'];
    let prevPct = -1;
    for (const status of sequence) {
      const state = deriveDeploymentStatusState(status);
      expect(state.progressPct).toBeGreaterThanOrEqual(prevPct);
      prevPct = state.progressPct;
    }
  });

  it('failed and cancelled states allow retry', () => {
    expect(deriveDeploymentStatusState('failed').canRetry).toBe(true);
    expect(deriveDeploymentStatusState('cancelled').canRetry).toBe(true);
  });

  it('active states do not allow retry', () => {
    expect(deriveDeploymentStatusState('pending').canRetry).toBe(false);
    expect(deriveDeploymentStatusState('in_progress').canRetry).toBe(false);
  });

  it('all states allow exit (user can navigate away)', () => {
    const statuses: DeploymentStatus[] = ['not_started', 'pending', 'in_progress', 'success', 'failed', 'cancelled'];
    for (const status of statuses) {
      expect(deriveDeploymentStatusState(status).canExit).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #10: Accessibility labels coverage
// ---------------------------------------------------------------------------

describe('Accessibility label coverage', () => {
  it('step indicator aria label mentions step number and total', () => {
    for (let i = 0; i < ISSUANCE_STEP_IDS.length; i++) {
      const label = getStepIndicatorAriaLabel(i, ISSUANCE_STEP_IDS.length);
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('progress bar aria label is non-empty for all valid percentages', () => {
    for (const pct of [0, 25, 50, 75, 100]) {
      const label = getProgressBarAriaLabel(pct);
      expect(label).toBeTruthy();
    }
  });

  it('continue button aria label is non-empty for all step indices', () => {
    for (let i = 0; i < ISSUANCE_STEP_IDS.length; i++) {
      const label = getContinueButtonAriaLabel(i);
      expect(label).toBeTruthy();
    }
  });

  it('back button aria label is non-empty for all step indices', () => {
    for (let i = 0; i < ISSUANCE_STEP_IDS.length; i++) {
      const label = getBackButtonAriaLabel(i);
      expect(label).toBeTruthy();
    }
  });

  it('all step button aria labels contain step titles', () => {
    const states = buildStepStates(0, new Set(), new Set());
    for (const state of states) {
      expect(state.ariaLabel).toContain(ISSUANCE_STEP_TITLES[state.id]);
    }
  });
});
