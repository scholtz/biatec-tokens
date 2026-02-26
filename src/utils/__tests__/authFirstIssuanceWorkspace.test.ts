/**
 * Unit Tests: Auth-First Issuance Workspace Utility
 *
 * Validates the complete issuance workspace contract:
 *   AC #1  Step state derivation is correct for all step/current-index combinations
 *   AC #2  Navigation guards allow/block correctly based on completion state
 *   AC #3  Progress calculation returns correct percentage
 *   AC #4  Form validation correctly identifies missing required fields
 *   AC #5  Route guard helpers correctly identify valid/invalid sessions
 *   AC #6  Telemetry events have stable names and valid payload shapes
 *   AC #7  Deployment status derivation covers all status values
 *   AC #8  Error classification maps raw errors to correct classes
 *   AC #9  Error messages follow the what/why/how structure
 *   AC #10 Forbidden wallet-era label detection rejects all prohibited patterns
 *   AC #11 Accessibility helpers return correct ARIA labels
 *   AC #12 Draft persistence helpers serialize/deserialize correctly
 *   AC #13 All helpers are deterministic — same input, same output
 *
 * Zero arbitrary timeouts. Zero async I/O. Pure synchronous unit tests.
 *
 * Issue: MVP — Build canonical auth-first token issuance workspace
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Step definitions
  ISSUANCE_STEP_IDS,
  ISSUANCE_STEP_TITLES,
  ISSUANCE_STEP_DESCRIPTIONS,
  ISSUANCE_TEST_IDS,
  type IssuanceStepId,
  // Step state
  deriveStepStatus,
  canNavigateToStep,
  buildStepStates,
  // Progress
  calculateIssuanceProgress,
  // Validation
  REQUIRED_FIELDS_PER_STEP,
  validateIssuanceStep,
  buildMissingFieldMessage,
  // Route guard
  ISSUANCE_RETURN_PATH_KEY,
  CANONICAL_ISSUANCE_ROUTE,
  LEGACY_ISSUANCE_ROUTE,
  storeIssuanceReturnPath,
  consumeIssuanceReturnPath,
  isCanonicalIssuancePath,
  isLegacyIssuancePath,
  isIssuanceSessionValid,
  // Telemetry
  ISSUANCE_TELEMETRY_EVENTS,
  buildWorkspaceEnteredEvent,
  buildStepEnteredEvent,
  buildValidationFailedEvent,
  buildReviewSubmittedEvent,
  buildDeploymentStartedEvent,
  buildDeploymentCompletedEvent,
  buildDeploymentFailedEvent,
  buildAuthRedirectEvent,
  validateTelemetryPayload,
  // Deployment status
  deriveDeploymentStatusState,
  type DeploymentStatus,
  // Error surface
  getIssuanceErrorMessage,
  classifyIssuanceError,
  type IssuanceErrorClass,
  // Non-wallet enforcement
  FORBIDDEN_ISSUANCE_LABELS,
  containsIssuanceForbiddenLabel,
  findIssuanceForbiddenLabels,
  // Accessibility
  getStepIndicatorAriaLabel,
  getProgressBarAriaLabel,
  getContinueButtonAriaLabel,
  getBackButtonAriaLabel,
  // Draft
  ISSUANCE_DRAFT_KEY,
  saveIssuanceDraft,
  loadIssuanceDraft,
  clearIssuanceDraft,
  type IssuanceDraft,
} from '../authFirstIssuanceWorkspace';

// ---------------------------------------------------------------------------
// AC #1: Step definitions
// ---------------------------------------------------------------------------

describe('ISSUANCE_STEP_IDS', () => {
  it('has exactly 5 steps', () => {
    expect(ISSUANCE_STEP_IDS).toHaveLength(5);
  });

  it('starts with workspace-context', () => {
    expect(ISSUANCE_STEP_IDS[0]).toBe('workspace-context');
  });

  it('ends with deployment-status', () => {
    expect(ISSUANCE_STEP_IDS[ISSUANCE_STEP_IDS.length - 1]).toBe('deployment-status');
  });

  it('has step deployment-review before deployment-status', () => {
    const reviewIdx = ISSUANCE_STEP_IDS.indexOf('deployment-review');
    const statusIdx = ISSUANCE_STEP_IDS.indexOf('deployment-status');
    expect(reviewIdx).toBe(statusIdx - 1);
  });
});

describe('ISSUANCE_STEP_TITLES', () => {
  it('has a title for every step ID', () => {
    for (const id of ISSUANCE_STEP_IDS) {
      expect(ISSUANCE_STEP_TITLES[id]).toBeTruthy();
    }
  });

  it('does not contain wallet terminology in any title', () => {
    for (const id of ISSUANCE_STEP_IDS) {
      const title = ISSUANCE_STEP_TITLES[id];
      expect(containsIssuanceForbiddenLabel(title)).toBe(false);
    }
  });
});

describe('ISSUANCE_STEP_DESCRIPTIONS', () => {
  it('has a description for every step ID', () => {
    for (const id of ISSUANCE_STEP_IDS) {
      expect(ISSUANCE_STEP_DESCRIPTIONS[id]).toBeTruthy();
    }
  });

  it('does not contain wallet terminology in any description', () => {
    for (const id of ISSUANCE_STEP_IDS) {
      const desc = ISSUANCE_STEP_DESCRIPTIONS[id];
      expect(containsIssuanceForbiddenLabel(desc)).toBe(false);
    }
  });
});

describe('ISSUANCE_TEST_IDS', () => {
  it('has all required test ID keys', () => {
    expect(ISSUANCE_TEST_IDS.WORKSPACE_SHELL).toBeTruthy();
    expect(ISSUANCE_TEST_IDS.STEP_INDICATOR).toBeTruthy();
    expect(ISSUANCE_TEST_IDS.CONTINUE_BUTTON).toBeTruthy();
    expect(ISSUANCE_TEST_IDS.BACK_BUTTON).toBeTruthy();
    expect(ISSUANCE_TEST_IDS.SUBMIT_BUTTON).toBeTruthy();
    expect(ISSUANCE_TEST_IDS.ERROR_BANNER).toBeTruthy();
    expect(ISSUANCE_TEST_IDS.LOADING_INDICATOR).toBeTruthy();
    expect(ISSUANCE_TEST_IDS.VALIDATION_SUMMARY).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AC #1: Step state derivation
// ---------------------------------------------------------------------------

describe('deriveStepStatus', () => {
  const completed = new Set<IssuanceStepId>(['workspace-context']);
  const empty = new Set<IssuanceStepId>();
  const errorSet = new Set<IssuanceStepId>(['token-parameters']);

  it('returns "active" for the current step', () => {
    expect(deriveStepStatus(0, 0, empty, empty)).toBe('active');
    expect(deriveStepStatus(2, 2, completed, empty)).toBe('active');
  });

  it('returns "error" when step has an error (and is not current)', () => {
    expect(deriveStepStatus(1, 0, empty, errorSet)).toBe('error');
  });

  it('returns "complete" for a completed step before current', () => {
    expect(deriveStepStatus(0, 1, completed, empty)).toBe('complete');
  });

  it('returns "complete" for a visited step before current even if not in completedSteps', () => {
    // Steps before currentIndex that haven't been validated are marked complete
    expect(deriveStepStatus(0, 2, empty, empty)).toBe('complete');
  });

  it('returns "pending" for a step after current that is not complete', () => {
    expect(deriveStepStatus(3, 1, completed, empty)).toBe('pending');
  });
});

describe('canNavigateToStep', () => {
  const allComplete = new Set<IssuanceStepId>(ISSUANCE_STEP_IDS);
  const empty = new Set<IssuanceStepId>();
  const firstComplete = new Set<IssuanceStepId>(['workspace-context']);

  it('can always navigate to the current step', () => {
    expect(canNavigateToStep(2, 2, empty)).toBe(true);
  });

  it('can navigate backward to any previous step', () => {
    expect(canNavigateToStep(0, 3, empty)).toBe(true);
    expect(canNavigateToStep(1, 3, empty)).toBe(true);
  });

  it('can navigate forward when all intermediate steps are complete', () => {
    expect(canNavigateToStep(4, 0, allComplete)).toBe(true);
  });

  it('cannot navigate forward when intermediate steps are incomplete', () => {
    expect(canNavigateToStep(2, 0, empty)).toBe(false);
    expect(canNavigateToStep(2, 0, firstComplete)).toBe(false);
  });

  it('can navigate one step forward when current step is complete', () => {
    expect(canNavigateToStep(1, 0, firstComplete)).toBe(true);
  });
});

describe('buildStepStates', () => {
  it('returns an array with one entry per step', () => {
    const states = buildStepStates(0, new Set(), new Set());
    expect(states).toHaveLength(ISSUANCE_STEP_IDS.length);
  });

  it('marks only the current step as active', () => {
    const states = buildStepStates(1, new Set(), new Set());
    const activeSteps = states.filter((s) => s.status === 'active');
    expect(activeSteps).toHaveLength(1);
    expect(activeSteps[0].index).toBe(1);
  });

  it('marks completed steps correctly', () => {
    const completed = new Set<IssuanceStepId>(['workspace-context']);
    const states = buildStepStates(1, completed, new Set());
    expect(states[0].status).toBe('complete');
  });

  it('each step has a testId derived from its index', () => {
    const states = buildStepStates(0, new Set(), new Set());
    for (let i = 0; i < states.length; i++) {
      expect(states[i].testId).toContain(String(i));
    }
  });

  it('each step has an ariaLabel containing its title', () => {
    const states = buildStepStates(0, new Set(), new Set());
    for (const state of states) {
      expect(state.ariaLabel).toContain(state.title);
    }
  });

  it('active step ariaLabel contains "(current)"', () => {
    const states = buildStepStates(1, new Set(), new Set());
    expect(states[1].ariaLabel).toContain('(current)');
  });

  it('completed step ariaLabel contains "(completed)"', () => {
    const completed = new Set<IssuanceStepId>(['workspace-context']);
    const states = buildStepStates(1, completed, new Set());
    expect(states[0].ariaLabel).toContain('(completed)');
  });

  it('error step ariaLabel contains "(has errors)"', () => {
    const errors = new Set<IssuanceStepId>(['workspace-context'] as IssuanceStepId[]);
    const completed = new Set<IssuanceStepId>(['workspace-context']);
    const states = buildStepStates(1, completed, errors);
    // step 0 is complete but has an error — should show error label
    expect(states[0].ariaLabel).toContain('(has errors)');
  });
});

// ---------------------------------------------------------------------------
// AC #3: Progress calculation
// ---------------------------------------------------------------------------

describe('calculateIssuanceProgress', () => {
  it('returns 0 when no steps are completed', () => {
    expect(calculateIssuanceProgress(new Set())).toBe(0);
  });

  it('returns 25 when 1 of 4 progress steps is completed', () => {
    const completed = new Set<IssuanceStepId>(['workspace-context']);
    expect(calculateIssuanceProgress(completed)).toBe(25);
  });

  it('returns 50 when 2 of 4 progress steps are completed', () => {
    const completed = new Set<IssuanceStepId>(['workspace-context', 'token-parameters']);
    expect(calculateIssuanceProgress(completed)).toBe(50);
  });

  it('returns 75 when 3 of 4 progress steps are completed', () => {
    const completed = new Set<IssuanceStepId>(['workspace-context', 'token-parameters', 'compliance-configuration']);
    expect(calculateIssuanceProgress(completed)).toBe(75);
  });

  it('returns 100 when all active steps are completed', () => {
    const completed = new Set<IssuanceStepId>(ISSUANCE_STEP_IDS);
    expect(calculateIssuanceProgress(completed)).toBe(100);
  });

  it('caps at 100 even if completedSteps has more entries than expected', () => {
    const completed = new Set<IssuanceStepId>(ISSUANCE_STEP_IDS);
    const result = calculateIssuanceProgress(completed);
    expect(result).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// AC #4: Form validation helpers
// ---------------------------------------------------------------------------

describe('REQUIRED_FIELDS_PER_STEP', () => {
  it('defines required fields for workspace-context', () => {
    expect(REQUIRED_FIELDS_PER_STEP['workspace-context'].length).toBeGreaterThan(0);
  });

  it('defines required fields for token-parameters', () => {
    expect(REQUIRED_FIELDS_PER_STEP['token-parameters'].length).toBeGreaterThan(0);
  });

  it('defines required fields for compliance-configuration', () => {
    expect(REQUIRED_FIELDS_PER_STEP['compliance-configuration'].length).toBeGreaterThan(0);
  });

  it('deployment-review has no additional required fields', () => {
    expect(REQUIRED_FIELDS_PER_STEP['deployment-review'].length).toBe(0);
  });

  it('deployment-status has no required fields', () => {
    expect(REQUIRED_FIELDS_PER_STEP['deployment-status'].length).toBe(0);
  });
});

describe('validateIssuanceStep', () => {
  it('returns isValid=true when all required fields are provided for workspace-context', () => {
    const result = validateIssuanceStep('workspace-context', {
      token_type: 'equity',
      issuer_context: 'private-placement',
    });
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('returns isValid=false when required fields are missing', () => {
    const result = validateIssuanceStep('workspace-context', {});
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('token_type');
    expect(result.missingFields).toContain('issuer_context');
  });

  it('returns error messages for each missing field', () => {
    const result = validateIssuanceStep('workspace-context', {});
    expect(result.errorMessages.length).toBe(result.missingFields.length);
  });

  it('treats empty string as missing', () => {
    const result = validateIssuanceStep('token-parameters', {
      token_name: '',
      token_symbol: 'TKN',
      total_supply: 1000,
      network: 'algorand',
    });
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('token_name');
  });

  it('treats null as missing', () => {
    const result = validateIssuanceStep('token-parameters', {
      token_name: null,
      token_symbol: 'TKN',
      total_supply: 1000,
      network: 'algorand',
    });
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('token_name');
  });

  it('treats false acknowledgement as missing', () => {
    const result = validateIssuanceStep('compliance-configuration', {
      jurisdiction: 'EU',
      transfer_restrictions_acknowledged: false,
    });
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('transfer_restrictions_acknowledged');
  });

  it('passes compliance-configuration when acknowledgement is true', () => {
    const result = validateIssuanceStep('compliance-configuration', {
      jurisdiction: 'EU',
      transfer_restrictions_acknowledged: true,
    });
    expect(result.isValid).toBe(true);
  });

  it('deployment-review always passes (no required fields)', () => {
    const result = validateIssuanceStep('deployment-review', {});
    expect(result.isValid).toBe(true);
  });

  it('deployment-status always passes (read-only)', () => {
    const result = validateIssuanceStep('deployment-status', {});
    expect(result.isValid).toBe(true);
  });
});

describe('buildMissingFieldMessage', () => {
  it('returns a known label for token_name', () => {
    expect(buildMissingFieldMessage('token_name')).toContain('Token name');
  });

  it('returns a known label for jurisdiction', () => {
    expect(buildMissingFieldMessage('jurisdiction')).toContain('Jurisdiction');
  });

  it('returns a generic fallback for unknown field names', () => {
    const msg = buildMissingFieldMessage('some_custom_field');
    expect(msg).toContain('some custom field');
    expect(msg).toContain('required');
  });
});

// ---------------------------------------------------------------------------
// AC #5: Route guard helpers
// ---------------------------------------------------------------------------

describe('isCanonicalIssuancePath', () => {
  it('returns true for /launch/guided', () => {
    expect(isCanonicalIssuancePath('/launch/guided')).toBe(true);
  });

  it('returns true for paths starting with /launch/guided/', () => {
    expect(isCanonicalIssuancePath('/launch/guided/step-2')).toBe(true);
  });

  it('returns false for legacy wizard route', () => {
    expect(isCanonicalIssuancePath('/create/wizard')).toBe(false);
  });

  it('returns false for unrelated paths', () => {
    expect(isCanonicalIssuancePath('/dashboard')).toBe(false);
  });
});

describe('isLegacyIssuancePath', () => {
  it('returns true for /create/wizard', () => {
    expect(isLegacyIssuancePath('/create/wizard')).toBe(true);
  });

  it('returns true for paths starting with /create/wizard/', () => {
    expect(isLegacyIssuancePath('/create/wizard/step-1')).toBe(true);
  });

  it('returns false for canonical route', () => {
    expect(isLegacyIssuancePath('/launch/guided')).toBe(false);
  });
});

describe('isIssuanceSessionValid', () => {
  it('returns false for null', () => {
    expect(isIssuanceSessionValid(null)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isIssuanceSessionValid('')).toBe(false);
  });

  it('returns false for invalid JSON', () => {
    expect(isIssuanceSessionValid('{invalid}')).toBe(false);
  });

  it('returns false when address is empty', () => {
    const raw = JSON.stringify({ address: '', email: 'a@b.io', isConnected: true });
    expect(isIssuanceSessionValid(raw)).toBe(false);
  });

  it('returns false when isConnected is false', () => {
    const raw = JSON.stringify({ address: 'ADDR', email: 'a@b.io', isConnected: false });
    expect(isIssuanceSessionValid(raw)).toBe(false);
  });

  it('returns true for a valid connected session', () => {
    const raw = JSON.stringify({ address: 'ADDR123', email: 'a@b.io', isConnected: true });
    expect(isIssuanceSessionValid(raw)).toBe(true);
  });

  it('returns false when isConnected is not a boolean', () => {
    const raw = JSON.stringify({ address: 'ADDR', email: 'a@b.io', isConnected: 'yes' });
    expect(isIssuanceSessionValid(raw)).toBe(false);
  });
});

describe('storeIssuanceReturnPath / consumeIssuanceReturnPath', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves the return path', () => {
    storeIssuanceReturnPath('/launch/guided?step=2');
    const result = consumeIssuanceReturnPath();
    expect(result).toBe('/launch/guided?step=2');
  });

  it('removes the path after consuming it', () => {
    storeIssuanceReturnPath('/launch/guided');
    consumeIssuanceReturnPath();
    expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBeNull();
  });

  it('returns null when no path was stored', () => {
    expect(consumeIssuanceReturnPath()).toBeNull();
  });

  it('consumeIssuanceReturnPath returns null when localStorage.getItem throws', () => {
    const getItemSpy = vi.spyOn(globalThis.localStorage, 'getItem').mockImplementationOnce(() => {
      throw new Error('SecurityError: access denied');
    });
    expect(consumeIssuanceReturnPath()).toBeNull();
    getItemSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// AC #6: Telemetry event builders
// ---------------------------------------------------------------------------

describe('ISSUANCE_TELEMETRY_EVENTS', () => {
  it('has all required event keys', () => {
    expect(ISSUANCE_TELEMETRY_EVENTS.WORKSPACE_ENTERED).toBeTruthy();
    expect(ISSUANCE_TELEMETRY_EVENTS.STEP_ENTERED).toBeTruthy();
    expect(ISSUANCE_TELEMETRY_EVENTS.VALIDATION_FAILED).toBeTruthy();
    expect(ISSUANCE_TELEMETRY_EVENTS.REVIEW_SUBMITTED).toBeTruthy();
    expect(ISSUANCE_TELEMETRY_EVENTS.DEPLOYMENT_STARTED).toBeTruthy();
    expect(ISSUANCE_TELEMETRY_EVENTS.DEPLOYMENT_COMPLETED).toBeTruthy();
    expect(ISSUANCE_TELEMETRY_EVENTS.DEPLOYMENT_FAILED).toBeTruthy();
    expect(ISSUANCE_TELEMETRY_EVENTS.AUTH_REDIRECT_TRIGGERED).toBeTruthy();
  });

  it('all event names follow the domain_subject_verb convention', () => {
    for (const name of Object.values(ISSUANCE_TELEMETRY_EVENTS)) {
      expect(name).toMatch(/^issuance_[a-z_]+$/);
    }
  });
});

describe('buildWorkspaceEnteredEvent', () => {
  it('returns event with correct event name', () => {
    const evt = buildWorkspaceEnteredEvent('sess_123');
    expect(evt.event).toBe(ISSUANCE_TELEMETRY_EVENTS.WORKSPACE_ENTERED);
  });

  it('includes sessionId and timestamp', () => {
    const evt = buildWorkspaceEnteredEvent('sess_abc');
    expect(evt.sessionId).toBe('sess_abc');
    expect(evt.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('passes payload validation', () => {
    const evt = buildWorkspaceEnteredEvent('sess_123');
    expect(validateTelemetryPayload(evt)).toHaveLength(0);
  });
});

describe('buildStepEnteredEvent', () => {
  it('returns event with step info', () => {
    const evt = buildStepEnteredEvent('token-parameters', 'sess_1');
    expect(evt.event).toBe(ISSUANCE_TELEMETRY_EVENTS.STEP_ENTERED);
    expect(evt.stepId).toBe('token-parameters');
    expect(typeof evt.stepIndex).toBe('number');
  });

  it('stepIndex matches ISSUANCE_STEP_IDS order', () => {
    const evt = buildStepEnteredEvent('compliance-configuration', 'sess_1');
    expect(evt.stepIndex).toBe(ISSUANCE_STEP_IDS.indexOf('compliance-configuration'));
  });
});

describe('buildValidationFailedEvent', () => {
  it('includes missingFieldCount in metadata', () => {
    const evt = buildValidationFailedEvent('token-parameters', ['token_name', 'total_supply'], 'sess_1');
    expect(evt.metadata?.missingFieldCount).toBe(2);
  });
});

describe('buildReviewSubmittedEvent', () => {
  it('emits event for deployment-review step', () => {
    const evt = buildReviewSubmittedEvent('sess_1');
    expect(evt.event).toBe(ISSUANCE_TELEMETRY_EVENTS.REVIEW_SUBMITTED);
    expect(evt.stepId).toBe('deployment-review');
  });
});

describe('buildDeploymentCompletedEvent', () => {
  it('includes durationMs in metadata', () => {
    const evt = buildDeploymentCompletedEvent('sess_1', 4500);
    expect(evt.metadata?.durationMs).toBe(4500);
  });
});

describe('buildDeploymentStartedEvent', () => {
  it('returns event with correct event name and step info', () => {
    const evt = buildDeploymentStartedEvent('sess_deploy');
    expect(evt.event).toBe(ISSUANCE_TELEMETRY_EVENTS.DEPLOYMENT_STARTED);
    expect(evt.stepId).toBe('deployment-status');
    expect(evt.sessionId).toBe('sess_deploy');
  });
});

describe('buildDeploymentFailedEvent', () => {
  it('includes errorCode in metadata', () => {
    const evt = buildDeploymentFailedEvent('sess_1', 'DEPLOY_ERR_001');
    expect(evt.metadata?.errorCode).toBe('DEPLOY_ERR_001');
  });
});

describe('buildAuthRedirectEvent', () => {
  it('includes returnPath in metadata', () => {
    const evt = buildAuthRedirectEvent('/launch/guided', 'sess_1');
    expect(evt.metadata?.returnPath).toBe('/launch/guided');
  });
});

describe('validateTelemetryPayload', () => {
  it('returns empty array for valid payload', () => {
    const evt = buildWorkspaceEnteredEvent('sess_1');
    expect(validateTelemetryPayload(evt)).toHaveLength(0);
  });

  it('rejects payload without event name', () => {
    // @ts-expect-error testing missing field
    const violations = validateTelemetryPayload({ sessionId: 's', timestamp: 't' });
    expect(violations.length).toBeGreaterThan(0);
  });

  it('rejects payload with email in metadata', () => {
    const evt = buildWorkspaceEnteredEvent('sess_1');
    const withPii = { ...evt, metadata: { email: 'user@example.com' } };
    expect(validateTelemetryPayload(withPii).some((v) => v.includes('email'))).toBe(true);
  });

  it('rejects payload with address in metadata', () => {
    const evt = buildWorkspaceEnteredEvent('sess_1');
    const withPii = { ...evt, metadata: { address: 'ALGOADDRXXX' } };
    expect(validateTelemetryPayload(withPii).some((v) => v.includes('address'))).toBe(true);
  });

  it('rejects payload with wallet in metadata', () => {
    const evt = buildWorkspaceEnteredEvent('sess_1');
    const withPii = { ...evt, metadata: { wallet: 'walletval' as unknown as string } };
    expect(validateTelemetryPayload(withPii).some((v) => v.includes('wallet'))).toBe(true);
  });

  it('rejects payload without sessionId', () => {
    const violations = validateTelemetryPayload({
      event: ISSUANCE_TELEMETRY_EVENTS.WORKSPACE_ENTERED,
      stepId: 'workspace-context',
      stepIndex: 0,
      sessionId: '',
      timestamp: new Date().toISOString(),
    });
    expect(violations.some((v) => v.includes('sessionId'))).toBe(true);
  });

  it('rejects payload without timestamp', () => {
    const violations = validateTelemetryPayload({
      event: ISSUANCE_TELEMETRY_EVENTS.WORKSPACE_ENTERED,
      stepId: 'workspace-context',
      stepIndex: 0,
      sessionId: 'sess_abc',
      timestamp: '',
    });
    expect(violations.some((v) => v.includes('timestamp'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #7: Deployment status derivation
// ---------------------------------------------------------------------------

const ALL_DEPLOYMENT_STATUSES: DeploymentStatus[] = [
  'not_started', 'pending', 'in_progress', 'success', 'failed', 'cancelled',
];

describe('deriveDeploymentStatusState', () => {
  it('returns a result for every known status', () => {
    for (const status of ALL_DEPLOYMENT_STATUSES) {
      const state = deriveDeploymentStatusState(status);
      expect(state.status).toBe(status);
      expect(state.headline).toBeTruthy();
      expect(state.description).toBeTruthy();
    }
  });

  it('success state has progressPct=100', () => {
    expect(deriveDeploymentStatusState('success').progressPct).toBe(100);
  });

  it('failed state has canRetry=true', () => {
    expect(deriveDeploymentStatusState('failed').canRetry).toBe(true);
  });

  it('in_progress state has canRetry=false', () => {
    expect(deriveDeploymentStatusState('in_progress').canRetry).toBe(false);
  });

  it('failed state uses assertive ariaLive', () => {
    expect(deriveDeploymentStatusState('failed').ariaLive).toBe('assertive');
  });

  it('success state uses polite ariaLive', () => {
    expect(deriveDeploymentStatusState('success').ariaLive).toBe('polite');
  });

  it('all headline texts are non-empty and under 60 chars', () => {
    for (const status of ALL_DEPLOYMENT_STATUSES) {
      const { headline } = deriveDeploymentStatusState(status);
      expect(headline.length).toBeGreaterThan(0);
      expect(headline.length).toBeLessThanOrEqual(60);
    }
  });

  it('all descriptions contain no wallet terminology', () => {
    for (const status of ALL_DEPLOYMENT_STATUSES) {
      const { description } = deriveDeploymentStatusState(status);
      expect(containsIssuanceForbiddenLabel(description)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #8 + #9: Error classification and messages
// ---------------------------------------------------------------------------

describe('classifyIssuanceError', () => {
  it('classifies null as unknown', () => {
    expect(classifyIssuanceError(null)).toBe('unknown');
  });

  it('classifies undefined as unknown', () => {
    expect(classifyIssuanceError(undefined)).toBe('unknown');
  });

  it('classifies 401 HTTP status as auth_required', () => {
    expect(classifyIssuanceError({ status: 401 })).toBe('auth_required');
  });

  it('classifies 403 HTTP status as auth_required', () => {
    expect(classifyIssuanceError({ status: 403 })).toBe('auth_required');
  });

  it('classifies 500 HTTP status as api_error', () => {
    expect(classifyIssuanceError({ status: 500 })).toBe('api_error');
  });

  it('classifies "session expired" string as session_expired', () => {
    expect(classifyIssuanceError('session expired')).toBe('session_expired');
  });

  it('classifies "compliance policy" string as compliance_blocked', () => {
    expect(classifyIssuanceError('compliance policy not met')).toBe('compliance_blocked');
  });

  it('classifies "invalid token name" string as validation_error', () => {
    expect(classifyIssuanceError('invalid token name')).toBe('validation_error');
  });

  it('classifies "deploy failed" string as deployment_error', () => {
    expect(classifyIssuanceError('deploy failed')).toBe('deployment_error');
  });

  it('classifies "network connection failed" as network_error', () => {
    expect(classifyIssuanceError('network connection failed')).toBe('network_error');
  });

  it('classifies "service unavailable" as api_error', () => {
    expect(classifyIssuanceError('service unavailable')).toBe('api_error');
  });

  it('classifies unknown string as unknown', () => {
    expect(classifyIssuanceError('something random happened')).toBe('unknown');
  });

  it('classifies object with message property by delegating to string handler', () => {
    // Object with no numeric status but a message string — should recursively classify the message
    expect(classifyIssuanceError({ message: 'session expired' })).toBe('session_expired');
    expect(classifyIssuanceError({ message: 'deploy failed' })).toBe('deployment_error');
    expect(classifyIssuanceError({ message: 'network error occurred' })).toBe('network_error');
  });

  it('classifies object with status=0 by delegating to message field', () => {
    // status 0 → no numeric status branch → falls through to message-based classification
    expect(classifyIssuanceError({ status: 0, message: 'validation failed' })).toBe('validation_error');
    expect(classifyIssuanceError({ status: 0, message: 'unknown problem' })).toBe('unknown');
  });

  it('classifies object with non-string message as unknown', () => {
    // message is not a string → empty string fallback → 'unknown'
    expect(classifyIssuanceError({ message: 42 })).toBe('unknown');
    expect(classifyIssuanceError({ message: null })).toBe('unknown');
  });

  it('classifies non-string non-object types as unknown', () => {
    // Numbers and booleans fall through to the final return 'unknown'
    expect(classifyIssuanceError(42 as unknown)).toBe('unknown');
    expect(classifyIssuanceError(true as unknown)).toBe('unknown');
    expect(classifyIssuanceError(false as unknown)).toBe('unknown');
  });

  it('classifies "401 " string as auth_required via numeric string match', () => {
    expect(classifyIssuanceError('401 ')).toBe('auth_required');
  });

  it('classifies "unauthorized" string as auth_required', () => {
    expect(classifyIssuanceError('unauthorized access')).toBe('auth_required');
  });

  it('classifies "forbidden quota" string as compliance_blocked (restricted keyword)', () => {
    // "quota" alone doesn't match any string pattern; "restrict" does → compliance_blocked
    expect(classifyIssuanceError('rate restricted')).toBe('compliance_blocked');
  });
});

const ALL_ERROR_CLASSES: IssuanceErrorClass[] = [
  'auth_required', 'session_expired', 'validation_error', 'compliance_blocked',
  'api_error', 'deployment_error', 'network_error', 'unknown',
];

describe('getIssuanceErrorMessage', () => {
  it('returns a message for every error class', () => {
    for (const cls of ALL_ERROR_CLASSES) {
      const msg = getIssuanceErrorMessage(cls);
      expect(msg.title).toBeTruthy();
      expect(msg.description).toBeTruthy();
      expect(msg.action).toBeTruthy();
    }
  });

  it('all titles are short (≤60 chars)', () => {
    for (const cls of ALL_ERROR_CLASSES) {
      const { title } = getIssuanceErrorMessage(cls);
      expect(title.length).toBeLessThanOrEqual(60);
    }
  });

  it('all messages have a valid severity', () => {
    for (const cls of ALL_ERROR_CLASSES) {
      const { severity } = getIssuanceErrorMessage(cls);
      expect(['error', 'warning', 'info']).toContain(severity);
    }
  });

  it('all message texts contain no wallet terminology', () => {
    for (const cls of ALL_ERROR_CLASSES) {
      const msg = getIssuanceErrorMessage(cls);
      expect(containsIssuanceForbiddenLabel(msg.title)).toBe(false);
      expect(containsIssuanceForbiddenLabel(msg.description)).toBe(false);
      expect(containsIssuanceForbiddenLabel(msg.action)).toBe(false);
    }
  });

  it('auth_required message has warning severity', () => {
    expect(getIssuanceErrorMessage('auth_required').severity).toBe('warning');
  });

  it('deployment_error message has error severity', () => {
    expect(getIssuanceErrorMessage('deployment_error').severity).toBe('error');
  });
});

// ---------------------------------------------------------------------------
// AC #10: Non-wallet label enforcement
// ---------------------------------------------------------------------------

describe('FORBIDDEN_ISSUANCE_LABELS', () => {
  it('contains patterns for known wallet-era terms', () => {
    expect(FORBIDDEN_ISSUANCE_LABELS.length).toBeGreaterThan(5);
  });
});

describe('containsIssuanceForbiddenLabel', () => {
  it('returns true for "connect wallet"', () => {
    expect(containsIssuanceForbiddenLabel('connect wallet')).toBe(true);
  });

  it('returns true for "WalletConnect"', () => {
    expect(containsIssuanceForbiddenLabel('WalletConnect')).toBe(true);
  });

  it('returns true for "Not connected"', () => {
    expect(containsIssuanceForbiddenLabel('Not connected')).toBe(true);
  });

  it('returns true for "MetaMask"', () => {
    expect(containsIssuanceForbiddenLabel('MetaMask')).toBe(true);
  });

  it('returns true for "sign transaction"', () => {
    expect(containsIssuanceForbiddenLabel('sign transaction')).toBe(true);
  });

  it('returns false for clean business language', () => {
    expect(containsIssuanceForbiddenLabel('Sign in to continue')).toBe(false);
    expect(containsIssuanceForbiddenLabel('Token deployment')).toBe(false);
    expect(containsIssuanceForbiddenLabel('Compliance configuration')).toBe(false);
  });
});

describe('findIssuanceForbiddenLabels', () => {
  it('returns empty array for clean text', () => {
    expect(findIssuanceForbiddenLabels('Token name')).toHaveLength(0);
  });

  it('returns matched patterns for dirty text', () => {
    const found = findIssuanceForbiddenLabels('Please connect wallet to continue');
    expect(found.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AC #11: Accessibility helpers
// ---------------------------------------------------------------------------

describe('getStepIndicatorAriaLabel', () => {
  it('contains step number and total', () => {
    const label = getStepIndicatorAriaLabel(0, 5);
    expect(label).toContain('1');
    expect(label).toContain('5');
  });
});

describe('getProgressBarAriaLabel', () => {
  it('contains the percentage value', () => {
    expect(getProgressBarAriaLabel(75)).toContain('75');
    expect(getProgressBarAriaLabel(0)).toContain('0');
    expect(getProgressBarAriaLabel(100)).toContain('100');
  });
});

describe('getContinueButtonAriaLabel', () => {
  it('returns a submit label on the review step', () => {
    const reviewIdx = ISSUANCE_STEP_IDS.indexOf('deployment-review');
    const label = getContinueButtonAriaLabel(reviewIdx);
    expect(label.toLowerCase()).toContain('submit');
  });

  it('contains "Continue to" with next step title for non-final steps', () => {
    const label = getContinueButtonAriaLabel(0);
    expect(label).toContain('Continue to');
    expect(label).toContain(ISSUANCE_STEP_TITLES[ISSUANCE_STEP_IDS[1]]);
  });
});

describe('getBackButtonAriaLabel', () => {
  it('contains "Return" for the first step', () => {
    const label = getBackButtonAriaLabel(0);
    expect(label.toLowerCase()).toContain('return');
  });

  it('contains "Back to" with previous step title for later steps', () => {
    const label = getBackButtonAriaLabel(2);
    expect(label).toContain('Back to');
    expect(label).toContain(ISSUANCE_STEP_TITLES[ISSUANCE_STEP_IDS[1]]);
  });
});

// ---------------------------------------------------------------------------
// AC #12: Draft persistence helpers
// ---------------------------------------------------------------------------

describe('saveIssuanceDraft / loadIssuanceDraft / clearIssuanceDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const sampleDraft: IssuanceDraft = {
    currentStep: 2,
    formData: { token_name: 'My Token', token_type: 'equity' },
    savedAt: new Date().toISOString(),
  };

  it('saves and loads a draft correctly', () => {
    saveIssuanceDraft(sampleDraft);
    const loaded = loadIssuanceDraft();
    expect(loaded).not.toBeNull();
    expect(loaded?.currentStep).toBe(2);
    expect(loaded?.formData.token_name).toBe('My Token');
  });

  it('returns null when no draft is stored', () => {
    expect(loadIssuanceDraft()).toBeNull();
  });

  it('clears the draft from storage', () => {
    saveIssuanceDraft(sampleDraft);
    clearIssuanceDraft();
    expect(localStorage.getItem(ISSUANCE_DRAFT_KEY)).toBeNull();
  });

  it('loadIssuanceDraft returns null after clearing', () => {
    saveIssuanceDraft(sampleDraft);
    clearIssuanceDraft();
    expect(loadIssuanceDraft()).toBeNull();
  });

  it('returns null for invalid stored JSON', () => {
    localStorage.setItem(ISSUANCE_DRAFT_KEY, '{invalid json');
    expect(loadIssuanceDraft()).toBeNull();
  });

  it('returns null when currentStep is missing in stored data', () => {
    localStorage.setItem(ISSUANCE_DRAFT_KEY, JSON.stringify({ formData: {} }));
    expect(loadIssuanceDraft()).toBeNull();
  });

  it('returns null when formData is null in stored data', () => {
    localStorage.setItem(ISSUANCE_DRAFT_KEY, JSON.stringify({ currentStep: 0, formData: null }));
    expect(loadIssuanceDraft()).toBeNull();
  });

  it('saveIssuanceDraft returns false when localStorage.setItem throws', () => {
    // Simulate a storage quota exceeded error
    const setItemSpy = vi.spyOn(globalThis.localStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    const result = saveIssuanceDraft(sampleDraft);
    expect(result).toBe(false);
    setItemSpy.mockRestore();
    // Verify normal operation still works after restore
    expect(saveIssuanceDraft(sampleDraft)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #13: Determinism — spot checks
// ---------------------------------------------------------------------------

describe('determinism checks', () => {
  it('deriveStepStatus is deterministic', () => {
    const completed = new Set<IssuanceStepId>(['workspace-context']);
    const errors = new Set<IssuanceStepId>();
    const result1 = deriveStepStatus(0, 1, completed, errors);
    const result2 = deriveStepStatus(0, 1, completed, errors);
    expect(result1).toBe(result2);
  });

  it('validateIssuanceStep is deterministic', () => {
    const data = { token_type: 'equity', issuer_context: 'private' };
    const r1 = validateIssuanceStep('workspace-context', data);
    const r2 = validateIssuanceStep('workspace-context', data);
    expect(r1.isValid).toBe(r2.isValid);
    expect(r1.missingFields).toEqual(r2.missingFields);
  });

  it('deriveDeploymentStatusState is deterministic', () => {
    const s1 = deriveDeploymentStatusState('success');
    const s2 = deriveDeploymentStatusState('success');
    expect(s1.headline).toBe(s2.headline);
    expect(s1.progressPct).toBe(s2.progressPct);
  });

  it('classifyIssuanceError is deterministic', () => {
    expect(classifyIssuanceError({ status: 401 })).toBe(classifyIssuanceError({ status: 401 }));
  });
});

// ---------------------------------------------------------------------------
// Constants sanity checks
// ---------------------------------------------------------------------------

describe('route constants', () => {
  it('CANONICAL_ISSUANCE_ROUTE is /launch/guided', () => {
    expect(CANONICAL_ISSUANCE_ROUTE).toBe('/launch/guided');
  });

  it('LEGACY_ISSUANCE_ROUTE is /create/wizard', () => {
    expect(LEGACY_ISSUANCE_ROUTE).toBe('/create/wizard');
  });
});
