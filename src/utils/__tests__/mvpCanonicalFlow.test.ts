/**
 * Unit Tests: MVP Canonical Flow Utility
 *
 * Validates the complete MVP canonical flow contract:
 *   AC #1  Canonical route constants are correct
 *   AC #2  Session contract validation rejects malformed data
 *   AC #3  Auth bootstrap helpers write/read validated sessions
 *   AC #4  Route readiness helpers classify paths correctly
 *   AC #5  Guided launch step helpers enforce ordering constraints
 *   AC #6  Navigation invariants detect forbidden guest-nav text
 *   AC #7  Draft builder produces structurally valid fixtures
 *   AC #8  All helpers are pure (deterministic, side-effect-free except where noted)
 *
 * These are synchronous unit tests — zero waitForTimeout, zero async I/O.
 *
 * Issue: MVP confidence hardening – guided launch canonical flow and auth-realistic E2E
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  // Session contract
  buildTestSession,
  buildExpiredSession,
  validateSessionContract,
  readAndValidateSession,
  writeValidatedSession,
  clearSession,
  hasLiveSession,
  MVP_SESSION_STORAGE_KEY,
  MVP_GUIDED_LAUNCH_DRAFT_KEY,
  // Canonical flow constants
  CANONICAL_LAUNCH_ROUTE,
  LEGACY_WIZARD_ROUTE,
  GUIDED_LAUNCH_STEPS,
  GUIDED_LAUNCH_STEP_COUNT,
  // Step helpers
  getStepIndex,
  isValidStepIndex,
  canAdvanceFromStep,
  areRequiredStepsComplete,
  // Route readiness
  isCanonicalLaunchRoute,
  isLegacyWizardRoute,
  ROUTE_READY_ANCHORS,
  // Navigation state
  GUEST_NAV_VISIBLE_LABELS,
  GUEST_NAV_FORBIDDEN_PATTERNS,
  containsForbiddenGuestNavText,
  findForbiddenGuestNavPatterns,
  // Draft helpers
  buildMinimalDraft,
  buildDraftAtStep,
  getStepTitle,
  serialiseDraft,
} from '../mvpCanonicalFlow';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearLocalStorage(): void {
  localStorage.clear();
}

// ---------------------------------------------------------------------------
// Session contract constants
// ---------------------------------------------------------------------------

describe('MVP_SESSION_STORAGE_KEY', () => {
  it('should equal algorand_user', () => {
    expect(MVP_SESSION_STORAGE_KEY).toBe('algorand_user');
  });
});

describe('MVP_GUIDED_LAUNCH_DRAFT_KEY', () => {
  it('should equal biatec_guided_launch_draft', () => {
    expect(MVP_GUIDED_LAUNCH_DRAFT_KEY).toBe('biatec_guided_launch_draft');
  });
});

// ---------------------------------------------------------------------------
// Session contract — buildTestSession
// ---------------------------------------------------------------------------

describe('buildTestSession', () => {
  it('should return a valid session with defaults', () => {
    const session = buildTestSession();
    expect(session.address).toBe('MVP_TEST_ADDRESS');
    expect(session.email).toBe('mvp-test@biatec.io');
    expect(session.isConnected).toBe(true);
  });

  it('should apply overrides', () => {
    const session = buildTestSession({ email: 'custom@test.com', address: 'CUSTOM_ADDR' });
    expect(session.email).toBe('custom@test.com');
    expect(session.address).toBe('CUSTOM_ADDR');
    expect(session.isConnected).toBe(true);
  });

  it('should allow isConnected override to false', () => {
    const session = buildTestSession({ isConnected: false });
    expect(session.isConnected).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Session contract — buildExpiredSession
// ---------------------------------------------------------------------------

describe('buildExpiredSession', () => {
  it('should return a session with isConnected = false', () => {
    const session = buildExpiredSession();
    expect(session.isConnected).toBe(false);
    expect(session.address).toBeTruthy();
    expect(session.email).toBeTruthy();
  });

  it('should apply overrides on top of expired defaults', () => {
    const session = buildExpiredSession({ email: 'expired@test.com' });
    expect(session.isConnected).toBe(false);
    expect(session.email).toBe('expired@test.com');
  });
});

// ---------------------------------------------------------------------------
// Session contract — validateSessionContract
// ---------------------------------------------------------------------------

describe('validateSessionContract', () => {
  it('should validate a well-formed session', () => {
    const result = validateSessionContract({ address: 'ADDR', email: 'a@b.com', isConnected: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.session).toBeTruthy();
    expect(result.session?.isConnected).toBe(true);
  });

  it('should reject null', () => {
    const result = validateSessionContract(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.session).toBeNull();
  });

  it('should reject undefined', () => {
    const result = validateSessionContract(undefined);
    expect(result.valid).toBe(false);
  });

  it('should reject non-object', () => {
    const result = validateSessionContract('not-an-object');
    expect(result.valid).toBe(false);
  });

  it('should reject missing address', () => {
    const result = validateSessionContract({ email: 'a@b.com', isConnected: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('address'))).toBe(true);
  });

  it('should reject empty address', () => {
    const result = validateSessionContract({ address: '', email: 'a@b.com', isConnected: true });
    expect(result.valid).toBe(false);
  });

  it('should reject address that is not a string', () => {
    const result = validateSessionContract({ address: 123, email: 'a@b.com', isConnected: true });
    expect(result.valid).toBe(false);
  });

  it('should reject missing email', () => {
    const result = validateSessionContract({ address: 'ADDR', isConnected: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('email'))).toBe(true);
  });

  it('should reject email without @', () => {
    const result = validateSessionContract({ address: 'ADDR', email: 'not-an-email', isConnected: true });
    expect(result.valid).toBe(false);
  });

  it('should reject missing isConnected', () => {
    const result = validateSessionContract({ address: 'ADDR', email: 'a@b.com' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('isConnected'))).toBe(true);
  });

  it('should reject isConnected as string', () => {
    const result = validateSessionContract({ address: 'ADDR', email: 'a@b.com', isConnected: 'true' });
    expect(result.valid).toBe(false);
  });

  it('should accept isConnected = false', () => {
    const result = validateSessionContract({ address: 'ADDR', email: 'a@b.com', isConnected: false });
    expect(result.valid).toBe(true);
    expect(result.session?.isConnected).toBe(false);
  });

  it('should accumulate multiple errors', () => {
    const result = validateSessionContract({ address: '', email: 'bad', isConnected: 'yes' });
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Session contract — localStorage helpers
// ---------------------------------------------------------------------------

describe('readAndValidateSession', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('should return invalid when storage is empty', () => {
    const result = readAndValidateSession();
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('no session in storage');
  });

  it('should return invalid when storage has malformed JSON', () => {
    localStorage.setItem(MVP_SESSION_STORAGE_KEY, '{broken json');
    const result = readAndValidateSession();
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('JSON parse error');
  });

  it('should return valid for a well-formed session', () => {
    const session = buildTestSession();
    localStorage.setItem(MVP_SESSION_STORAGE_KEY, JSON.stringify(session));
    const result = readAndValidateSession();
    expect(result.valid).toBe(true);
    expect(result.session?.email).toBe(session.email);
  });

  it('should return invalid for a session with wrong shape', () => {
    localStorage.setItem(MVP_SESSION_STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    const result = readAndValidateSession();
    expect(result.valid).toBe(false);
  });
});

describe('writeValidatedSession', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('should write a valid session and return true', () => {
    const session = buildTestSession();
    const wrote = writeValidatedSession(session);
    expect(wrote).toBe(true);
    const stored = localStorage.getItem(MVP_SESSION_STORAGE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.email).toBe(session.email);
  });

  it('should return false and not write for an invalid session', () => {
    const invalid = { address: '', email: 'bad', isConnected: false } as any;
    const wrote = writeValidatedSession(invalid);
    expect(wrote).toBe(false);
    expect(localStorage.getItem(MVP_SESSION_STORAGE_KEY)).toBeNull();
  });
});

describe('clearSession', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('should remove the session from localStorage', () => {
    writeValidatedSession(buildTestSession());
    expect(localStorage.getItem(MVP_SESSION_STORAGE_KEY)).toBeTruthy();
    clearSession();
    expect(localStorage.getItem(MVP_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('should be a no-op when session is not present', () => {
    expect(() => clearSession()).not.toThrow();
  });
});

describe('hasLiveSession', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('should return false when no session exists', () => {
    expect(hasLiveSession()).toBe(false);
  });

  it('should return true for a valid connected session', () => {
    writeValidatedSession(buildTestSession({ isConnected: true }));
    expect(hasLiveSession()).toBe(true);
  });

  it('should return false for an expired session', () => {
    writeValidatedSession(buildExpiredSession());
    expect(hasLiveSession()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Canonical flow constants
// ---------------------------------------------------------------------------

describe('CANONICAL_LAUNCH_ROUTE', () => {
  it('should be /launch/guided', () => {
    expect(CANONICAL_LAUNCH_ROUTE).toBe('/launch/guided');
  });
});

describe('LEGACY_WIZARD_ROUTE', () => {
  it('should be /create/wizard', () => {
    expect(LEGACY_WIZARD_ROUTE).toBe('/create/wizard');
  });
});

describe('GUIDED_LAUNCH_STEPS', () => {
  it('should have 6 steps', () => {
    expect(GUIDED_LAUNCH_STEPS).toHaveLength(6);
    expect(GUIDED_LAUNCH_STEP_COUNT).toBe(6);
  });

  it('should start with organization', () => {
    expect(GUIDED_LAUNCH_STEPS[0]).toBe('organization');
  });

  it('should end with review', () => {
    expect(GUIDED_LAUNCH_STEPS[GUIDED_LAUNCH_STEP_COUNT - 1]).toBe('review');
  });

  it('should include all required step IDs', () => {
    const ids = Array.from(GUIDED_LAUNCH_STEPS);
    expect(ids).toContain('organization');
    expect(ids).toContain('intent');
    expect(ids).toContain('compliance');
    expect(ids).toContain('template');
    expect(ids).toContain('economics');
    expect(ids).toContain('review');
  });
});

// ---------------------------------------------------------------------------
// Step helpers
// ---------------------------------------------------------------------------

describe('getStepIndex', () => {
  it('should return 0 for organization', () => {
    expect(getStepIndex('organization')).toBe(0);
  });

  it('should return 5 for review', () => {
    expect(getStepIndex('review')).toBe(5);
  });

  it('should return 4 for economics (optional step)', () => {
    expect(getStepIndex('economics')).toBe(4);
  });
});

describe('isValidStepIndex', () => {
  it('should return true for valid indices', () => {
    for (let i = 0; i < GUIDED_LAUNCH_STEP_COUNT; i++) {
      expect(isValidStepIndex(i)).toBe(true);
    }
  });

  it('should return false for -1', () => {
    expect(isValidStepIndex(-1)).toBe(false);
  });

  it('should return false for index equal to step count', () => {
    expect(isValidStepIndex(GUIDED_LAUNCH_STEP_COUNT)).toBe(false);
  });
});

describe('canAdvanceFromStep', () => {
  it('should return true when current step is in completedSteps and not last', () => {
    expect(canAdvanceFromStep(0, [0])).toBe(true);
  });

  it('should return false when current step is not in completedSteps', () => {
    expect(canAdvanceFromStep(0, [])).toBe(false);
  });

  it('should return false from the last step index', () => {
    const lastIndex = GUIDED_LAUNCH_STEP_COUNT - 1;
    expect(canAdvanceFromStep(lastIndex, [0, 1, 2, 3, 4, 5])).toBe(false);
  });

  it('should return false for an invalid step index', () => {
    expect(canAdvanceFromStep(-1, [0])).toBe(false);
  });
});

describe('areRequiredStepsComplete', () => {
  it('should return true when all required steps are complete', () => {
    // economics (index 4) is optional; skip it
    expect(areRequiredStepsComplete([0, 1, 2, 3, 5])).toBe(true);
  });

  it('should return true when all steps including economics are complete', () => {
    expect(areRequiredStepsComplete([0, 1, 2, 3, 4, 5])).toBe(true);
  });

  it('should return false when a required step is missing', () => {
    expect(areRequiredStepsComplete([0, 1, 2, 3])).toBe(false); // review (5) missing
  });

  it('should return false when empty', () => {
    expect(areRequiredStepsComplete([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Route readiness
// ---------------------------------------------------------------------------

describe('isCanonicalLaunchRoute', () => {
  it('should return true for /launch/guided', () => {
    expect(isCanonicalLaunchRoute('/launch/guided')).toBe(true);
  });

  it('should return true for /launch/guided/', () => {
    expect(isCanonicalLaunchRoute('/launch/guided/')).toBe(true);
  });

  it('should return true for /launch/guided?step=2', () => {
    expect(isCanonicalLaunchRoute('/launch/guided?step=2')).toBe(true);
  });

  it('should return false for /create/wizard', () => {
    expect(isCanonicalLaunchRoute('/create/wizard')).toBe(false);
  });

  it('should return false for /', () => {
    expect(isCanonicalLaunchRoute('/')).toBe(false);
  });
});

describe('isLegacyWizardRoute', () => {
  it('should return true for /create/wizard', () => {
    expect(isLegacyWizardRoute('/create/wizard')).toBe(true);
  });

  it('should return true for /create/wizard/', () => {
    expect(isLegacyWizardRoute('/create/wizard/')).toBe(true);
  });

  it('should return false for /launch/guided', () => {
    expect(isLegacyWizardRoute('/launch/guided')).toBe(false);
  });
});

describe('ROUTE_READY_ANCHORS', () => {
  it('should define GUIDED_LAUNCH_TITLE', () => {
    expect(ROUTE_READY_ANCHORS.GUIDED_LAUNCH_TITLE).toBeTruthy();
  });

  it('should define NAV_BAR', () => {
    expect(ROUTE_READY_ANCHORS.NAV_BAR).toBeTruthy();
  });

  it('should define SIGN_IN_BUTTON', () => {
    expect(ROUTE_READY_ANCHORS.SIGN_IN_BUTTON).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Navigation state contracts
// ---------------------------------------------------------------------------

describe('GUEST_NAV_VISIBLE_LABELS', () => {
  it('should include Home', () => {
    expect(GUEST_NAV_VISIBLE_LABELS).toContain('Home');
  });
});

describe('GUEST_NAV_FORBIDDEN_PATTERNS', () => {
  it('should include wallet pattern', () => {
    const hasWallet = GUEST_NAV_FORBIDDEN_PATTERNS.some((p) => p.test('wallet'));
    expect(hasWallet).toBe(true);
  });

  it('should include connected pattern', () => {
    const hasConnected = GUEST_NAV_FORBIDDEN_PATTERNS.some((p) => p.test('connected'));
    expect(hasConnected).toBe(true);
  });
});

describe('containsForbiddenGuestNavText', () => {
  it('should return false for clean nav text', () => {
    expect(containsForbiddenGuestNavText('Home Dashboard Marketplace Sign In')).toBe(false);
  });

  it('should return true for text containing wallet', () => {
    expect(containsForbiddenGuestNavText('Connect Wallet')).toBe(true);
  });

  it('should return true for text containing Not connected', () => {
    expect(containsForbiddenGuestNavText('Not connected to network')).toBe(true);
  });

  it('should return true for text containing MetaMask', () => {
    expect(containsForbiddenGuestNavText('Install MetaMask')).toBe(true);
  });

  it('should return true for text containing Algorand Mainnet', () => {
    expect(containsForbiddenGuestNavText('Algorand Mainnet')).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(containsForbiddenGuestNavText('WALLETCONNECT')).toBe(true);
  });
});

describe('findForbiddenGuestNavPatterns', () => {
  it('should return empty array for clean text', () => {
    expect(findForbiddenGuestNavPatterns('Home Sign In')).toHaveLength(0);
  });

  it('should return matching patterns for forbidden text', () => {
    const matches = findForbiddenGuestNavPatterns('Connect Wallet - Testnet');
    expect(matches.length).toBeGreaterThanOrEqual(2); // wallet + testnet
  });
});

// ---------------------------------------------------------------------------
// Draft helpers
// ---------------------------------------------------------------------------

describe('getStepTitle', () => {
  it('should return Organization Profile for organization', () => {
    expect(getStepTitle('organization')).toBe('Organization Profile');
  });

  it('should return Review & Submit for review', () => {
    expect(getStepTitle('review')).toBe('Review & Submit');
  });

  it('should return Economics Settings for economics', () => {
    expect(getStepTitle('economics')).toBe('Economics Settings');
  });
});

describe('buildMinimalDraft', () => {
  it('should build a draft at step 0 with no completed steps', () => {
    const draft = buildMinimalDraft();
    expect(draft.form.currentStep).toBe(0);
    expect(draft.form.completedSteps).toHaveLength(0);
    expect(draft.form.isSubmitted).toBe(false);
    expect(draft.version).toBe('1.0');
  });

  it('should have the correct number of step statuses', () => {
    const draft = buildMinimalDraft();
    expect(draft.stepStatuses).toHaveLength(GUIDED_LAUNCH_STEP_COUNT);
  });

  it('should mark economics step as optional', () => {
    const draft = buildMinimalDraft();
    const economicsStatus = draft.stepStatuses.find((s) => s.id === 'economics');
    expect(economicsStatus?.isOptional).toBe(true);
  });

  it('should apply form overrides', () => {
    const draft = buildMinimalDraft({ currentStep: 3, completedSteps: [0, 1, 2] });
    expect(draft.form.currentStep).toBe(3);
    expect(draft.form.completedSteps).toHaveLength(3);
  });

  it('should mark completed steps in stepStatuses', () => {
    const draft = buildMinimalDraft({ completedSteps: [0, 1] });
    expect(draft.stepStatuses[0].isComplete).toBe(true);
    expect(draft.stepStatuses[1].isComplete).toBe(true);
    expect(draft.stepStatuses[2].isComplete).toBe(false);
  });
});

describe('buildDraftAtStep', () => {
  it('should build draft positioned at step 2 with steps 0,1 complete', () => {
    const draft = buildDraftAtStep(2);
    expect(draft.form.currentStep).toBe(2);
    expect(draft.form.completedSteps).toEqual([0, 1]);
  });

  it('should build draft at step 0 with no completed steps', () => {
    const draft = buildDraftAtStep(0);
    expect(draft.form.completedSteps).toHaveLength(0);
  });

  it('should apply additional form overrides', () => {
    const draft = buildDraftAtStep(1, { organizationProfile: {
      organizationName: 'Test Corp',
      organizationType: 'company',
      jurisdiction: 'US',
      contactName: 'Alice',
      contactEmail: 'alice@test.com',
      role: 'business_owner',
    }});
    expect(draft.form.organizationProfile?.organizationName).toBe('Test Corp');
  });
});

describe('serialiseDraft', () => {
  it('should produce valid JSON', () => {
    const draft = buildMinimalDraft();
    const json = serialiseDraft(draft);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should round-trip through JSON.parse', () => {
    const draft = buildDraftAtStep(3);
    const parsed = JSON.parse(serialiseDraft(draft));
    expect(parsed.form.currentStep).toBe(3);
  });
});
