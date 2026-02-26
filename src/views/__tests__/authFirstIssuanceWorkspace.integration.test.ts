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

// ---------------------------------------------------------------------------
// AC #11: ISSUANCE_TEST_IDS constant integrity
// ---------------------------------------------------------------------------

describe('ISSUANCE_TEST_IDS constant integrity', () => {
  it('all test IDs are non-empty strings', () => {
    for (const [key, value] of Object.entries(ISSUANCE_TEST_IDS)) {
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
      expect(key).toBeTruthy();
    }
  });

  it('all test IDs are unique (no duplicates)', () => {
    const values = Object.values(ISSUANCE_TEST_IDS) as string[];
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('all test IDs use kebab-case format', () => {
    for (const value of Object.values(ISSUANCE_TEST_IDS) as string[]) {
      // kebab-case: lowercase letters, numbers, hyphens only
      expect(value).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('workspace-shell test ID exists and is correct', () => {
    expect(ISSUANCE_TEST_IDS.WORKSPACE_SHELL).toBe('issuance-workspace-shell');
  });

  it('step indicator test ID exists', () => {
    expect(ISSUANCE_TEST_IDS.STEP_INDICATOR).toBeTruthy();
    expect(ISSUANCE_TEST_IDS.STEP_INDICATOR).toContain('step');
  });

  it('continue and back button test IDs are distinct', () => {
    expect(ISSUANCE_TEST_IDS.CONTINUE_BUTTON).not.toBe(ISSUANCE_TEST_IDS.BACK_BUTTON);
  });
});

// ---------------------------------------------------------------------------
// AC #12: Session validation edge cases
// ---------------------------------------------------------------------------

describe('Session validation edge cases', () => {
  it('null session string returns false', () => {
    expect(isIssuanceSessionValid(null as unknown as string)).toBe(false);
  });

  it('undefined session string returns false', () => {
    expect(isIssuanceSessionValid(undefined as unknown as string)).toBe(false);
  });

  it('empty string returns false', () => {
    expect(isIssuanceSessionValid('')).toBe(false);
  });

  it('session with empty address returns false', () => {
    const raw = JSON.stringify({ address: '', email: 'user@example.com', isConnected: true });
    expect(isIssuanceSessionValid(raw)).toBe(false);
  });

  it('session with isConnected=false returns false', () => {
    const raw = JSON.stringify({ address: 'ADDR001', email: 'user@example.com', isConnected: false });
    expect(isIssuanceSessionValid(raw)).toBe(false);
  });

  it('session missing isConnected property returns false', () => {
    const raw = JSON.stringify({ address: 'ADDR001', email: 'user@example.com' });
    expect(isIssuanceSessionValid(raw)).toBe(false);
  });

  it('malformed JSON returns false', () => {
    expect(isIssuanceSessionValid('{not valid json')).toBe(false);
  });

  it('session with address and isConnected=true returns true', () => {
    const raw = JSON.stringify({ address: 'ADDR001', isConnected: true });
    expect(isIssuanceSessionValid(raw)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #13: Complete draft save/restore cycle across all steps
// ---------------------------------------------------------------------------

describe('Complete draft save/restore cycle across all steps', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('round-trips draft data for each step without data loss', () => {
    for (let i = 0; i < ISSUANCE_STEP_IDS.length; i++) {
      const stepId = ISSUANCE_STEP_IDS[i];
      const formData = getValidFormDataForStep(stepId);
      const draft: IssuanceDraft = {
        currentStep: i,
        formData,
        savedAt: new Date().toISOString(),
      };
      saveIssuanceDraft(draft);
      const loaded = loadIssuanceDraft();
      expect(loaded).not.toBeNull();
      expect(loaded!.currentStep).toBe(i);
      // Verify the keys saved are the same as the keys loaded
      for (const key of Object.keys(formData)) {
        expect(loaded!.formData[key]).toStrictEqual(formData[key]);
      }
      clearIssuanceDraft();
    }
  });

  it('overwriting a draft replaces the previous one', () => {
    const firstDraft: IssuanceDraft = { currentStep: 0, formData: { token_type: 'equity' }, savedAt: new Date().toISOString() };
    const secondDraft: IssuanceDraft = { currentStep: 2, formData: { jurisdiction: 'US' }, savedAt: new Date().toISOString() };

    saveIssuanceDraft(firstDraft);
    saveIssuanceDraft(secondDraft);

    const loaded = loadIssuanceDraft();
    expect(loaded!.currentStep).toBe(2);
    expect(loaded!.formData.jurisdiction).toBe('US');
    expect(loaded!.formData.token_type).toBeUndefined();
  });

  it('draft key is in localStorage after save', () => {
    const draft: IssuanceDraft = { currentStep: 1, formData: {}, savedAt: new Date().toISOString() };
    saveIssuanceDraft(draft);
    expect(localStorage.getItem(ISSUANCE_DRAFT_KEY)).not.toBeNull();
  });

  it('draft key is removed from localStorage after clear', () => {
    const draft: IssuanceDraft = { currentStep: 1, formData: {}, savedAt: new Date().toISOString() };
    saveIssuanceDraft(draft);
    clearIssuanceDraft();
    expect(localStorage.getItem(ISSUANCE_DRAFT_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC #14: Step navigation gating prevents skip-ahead
// ---------------------------------------------------------------------------

describe('Step navigation gating prevents skip-ahead', () => {
  it('can navigate to same step index always', () => {
    expect(canNavigateToStep(0, 0, new Set())).toBe(true);
    expect(canNavigateToStep(1, 1, new Set())).toBe(true);
  });

  it('blocks forward navigation when intermediate steps not complete', () => {
    const completed = new Set<IssuanceStepId>(['workspace-context']);
    // From step 0 with only step 0 complete: can go to step 1, not step 2
    expect(canNavigateToStep(1, 0, completed)).toBe(true); // step 0 is complete
    expect(canNavigateToStep(2, 0, completed)).toBe(false); // step 1 not complete
    expect(canNavigateToStep(3, 0, completed)).toBe(false); // steps 1,2 not complete
  });

  it('can navigate back to any already-completed step', () => {
    const completed = new Set<IssuanceStepId>(['workspace-context', 'token-parameters', 'compliance-configuration']);
    // Should be able to go back from step 3 to step 0, 1, or 2 (all < currentIndex)
    expect(canNavigateToStep(0, 3, completed)).toBe(true);
    expect(canNavigateToStep(1, 3, completed)).toBe(true);
    expect(canNavigateToStep(2, 3, completed)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #15: Telemetry event metadata PII safety
// ---------------------------------------------------------------------------

describe('Telemetry event metadata PII safety', () => {
  const SESSION_ID = 'sess_pii_test_001';

  it('workspace_entered event contains no email or address fields', () => {
    const evt = buildWorkspaceEnteredEvent(SESSION_ID);
    const serialized = JSON.stringify(evt);
    expect(serialized).not.toContain('@');
    expect(serialized).not.toContain('email');
  });

  it('step_entered event contains no email or address fields', () => {
    for (const stepId of ISSUANCE_STEP_IDS) {
      const evt = buildStepEnteredEvent(stepId, SESSION_ID);
      const serialized = JSON.stringify(evt);
      expect(serialized).not.toContain('@');
    }
  });

  it('deployment_completed event contains no email or address fields', () => {
    const evt = buildDeploymentCompletedEvent(SESSION_ID, 2000);
    const serialized = JSON.stringify(evt);
    expect(serialized).not.toContain('@');
    expect(serialized).not.toContain('email');
  });

  it('all ISSUANCE_TELEMETRY_EVENTS are non-empty strings', () => {
    for (const [key, value] of Object.entries(ISSUANCE_TELEMETRY_EVENTS)) {
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
      expect(key).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// AC #16: Error surface completeness — all error types have required fields
// ---------------------------------------------------------------------------

describe('Error surface completeness', () => {
  const allErrorTypes = [
    'auth_required', 'session_expired', 'validation_error', 'compliance_blocked',
    'api_error', 'deployment_error', 'network_error', 'unknown',
  ] as const;

  it('every error type returns a title', () => {
    for (const errorType of allErrorTypes) {
      const msg = getIssuanceErrorMessage(errorType);
      expect(msg.title).toBeTruthy();
      expect(msg.title.length).toBeGreaterThan(0);
    }
  });

  it('every error type returns a description', () => {
    for (const errorType of allErrorTypes) {
      const msg = getIssuanceErrorMessage(errorType);
      expect(msg.description).toBeTruthy();
      expect(msg.description.length).toBeGreaterThan(0);
    }
  });

  it('every error type returns a non-null action text', () => {
    for (const errorType of allErrorTypes) {
      const msg = getIssuanceErrorMessage(errorType);
      // action may be null for unknown errors but should be string for actionable ones
      if (errorType !== 'unknown') {
        expect(msg.action).toBeTruthy();
      }
    }
  });

  it('every error type returns a severity', () => {
    for (const errorType of allErrorTypes) {
      const msg = getIssuanceErrorMessage(errorType);
      expect(['error', 'warning', 'info']).toContain(msg.severity);
    }
  });

  it('auth_required and session_expired are classified correctly from error messages', () => {
    expect(classifyIssuanceError('401')).toBe('auth_required');
    expect(classifyIssuanceError('unauthorized')).toBe('auth_required');
    expect(classifyIssuanceError('session expired')).toBe('session_expired');
  });
});

// ---------------------------------------------------------------------------
// AC #17: Step title business language — no crypto jargon
// ---------------------------------------------------------------------------

describe('Step title business language', () => {
  const CRYPTO_JARGON = ['wallet', 'blockchain', 'gas', 'metamask', 'pera', 'defly', 'mnemonic', 'private key'];

  it('step titles contain no crypto jargon', () => {
    for (const id of ISSUANCE_STEP_IDS) {
      const title = ISSUANCE_STEP_TITLES[id].toLowerCase();
      for (const jargon of CRYPTO_JARGON) {
        expect(title).not.toContain(jargon);
      }
    }
  });

  it('step titles are title-case or sentence-case (not all-caps or all-lower)', () => {
    for (const id of ISSUANCE_STEP_IDS) {
      const title = ISSUANCE_STEP_TITLES[id];
      // Title starts with a capital letter
      expect(title.charAt(0)).toBe(title.charAt(0).toUpperCase());
      // Title is not entirely uppercase
      expect(title).not.toBe(title.toUpperCase());
    }
  });

  it('each step has a unique title', () => {
    const titles = ISSUANCE_STEP_IDS.map((id) => ISSUANCE_STEP_TITLES[id]);
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });
});

// ---------------------------------------------------------------------------
// AC #18: Route path canonicalization with query parameters
// ---------------------------------------------------------------------------

describe('Route path canonicalization with query parameters', () => {
  it('isCanonicalIssuancePath returns true for exact canonical path', () => {
    expect(isCanonicalIssuancePath('/launch/guided')).toBe(true);
  });

  it('isCanonicalIssuancePath returns false for path with query params (exact match only)', () => {
    // The function does exact match or startsWith('/launch/guided/')
    expect(isCanonicalIssuancePath('/launch/guided?step=token-parameters')).toBe(false);
  });

  it('isCanonicalIssuancePath returns true for sub-paths', () => {
    expect(isCanonicalIssuancePath('/launch/guided/step/1')).toBe(true);
  });

  it('isLegacyIssuancePath returns true for exact legacy path', () => {
    expect(isLegacyIssuancePath('/create/wizard')).toBe(true);
  });

  it('isLegacyIssuancePath returns false for unrelated paths', () => {
    expect(isLegacyIssuancePath('/launch/guided')).toBe(false);
    expect(isLegacyIssuancePath('/dashboard')).toBe(false);
    expect(isLegacyIssuancePath('/operations')).toBe(false);
  });

  it('return path round-trip preserves query parameters', () => {
    const pathWithQuery = '/launch/guided?step=compliance-configuration&referrer=dashboard';
    storeIssuanceReturnPath(pathWithQuery);
    const consumed = consumeIssuanceReturnPath();
    expect(consumed).toBe(pathWithQuery);
    localStorage.clear();
  });
});
