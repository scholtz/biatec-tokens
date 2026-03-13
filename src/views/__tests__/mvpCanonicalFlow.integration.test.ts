/**
 * Integration Tests: MVP Canonical Flow
 *
 * Validates the complete MVP canonical flow contract with deterministic
 * state simulations. These tests do NOT use waitForTimeout() — all state
 * transitions are synchronous or use localStorage helpers.
 *
 * Maps to Acceptance Criteria:
 *   AC #1  Canonical route is /launch/guided; /create/wizard redirects only
 *   AC #2  Session bootstrap validates contract fields before proceeding
 *   AC #3  Guest nav has no wallet/network-centric labels
 *   AC #4  Guided launch steps advance and block correctly
 *   AC #5  Draft injection is structurally valid for E2E fixture use
 *   AC #6  Error states propagate user-facing messages, not raw exceptions
 *   AC #7  Session expiry is detectable and distinguishable from no-session
 *   AC #8  All helpers are deterministic — same input, same output
 *
 * Business value:
 * These integration tests provide CI-stable proof that the MVP canonical flow
 * helpers work correctly as a unit across auth/session, route, and nav concerns,
 * without requiring a running browser or server.
 *
 * Issue: MVP confidence hardening – guided launch canonical flow and auth-realistic E2E
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildTestSession,
  buildExpiredSession,
  validateSessionContract,
  readAndValidateSession,
  writeValidatedSession,
  clearSession,
  hasLiveSession,
  MVP_SESSION_STORAGE_KEY,
  CANONICAL_LAUNCH_ROUTE,
  LEGACY_WIZARD_ROUTE,
  GUIDED_LAUNCH_STEPS,
  GUIDED_LAUNCH_STEP_COUNT,
  getStepIndex,
  canAdvanceFromStep,
  areRequiredStepsComplete,
  isCanonicalLaunchRoute,
  isLegacyWizardRoute,
  containsForbiddenGuestNavText,
  findForbiddenGuestNavPatterns,
  buildMinimalDraft,
  buildDraftAtStep,
  serialiseDraft,
  MVP_GUIDED_LAUNCH_DRAFT_KEY,
} from '../../utils/mvpCanonicalFlow';
import { isAuthRequired, isGuestAccessible } from '../../utils/authFirstHardening';
import { getLaunchErrorMessage } from '../../utils/launchErrorMessages';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearLocalStorage(): void {
  localStorage.clear();
}

/** Simulates what the router guard does when checking auth for a route. */
function simulateAuthGuard(path: string): { allowed: boolean; redirectTo?: string } {
  if (!isAuthRequired(path)) return { allowed: true };
  // Dashboard is special – public empty state
  if (path === '/dashboard') return { allowed: true };

  const session = readAndValidateSession();
  if (!session.valid || !session.session?.isConnected) {
    return { allowed: false, redirectTo: '/?showAuth=true' };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// AC #1: Canonical route enforcement
// ---------------------------------------------------------------------------

describe('AC #1: Canonical route is /launch/guided', () => {
  it('should classify /launch/guided as the canonical launch route', () => {
    expect(isCanonicalLaunchRoute(CANONICAL_LAUNCH_ROUTE)).toBe(true);
  });

  it('should classify /create/wizard as the legacy route', () => {
    expect(isLegacyWizardRoute(LEGACY_WIZARD_ROUTE)).toBe(true);
  });

  it('should not treat /launch/guided as a legacy route', () => {
    expect(isLegacyWizardRoute(CANONICAL_LAUNCH_ROUTE)).toBe(false);
  });

  it('should not treat /create/wizard as canonical', () => {
    expect(isCanonicalLaunchRoute(LEGACY_WIZARD_ROUTE)).toBe(false);
  });

  it('should require auth for the canonical launch route', () => {
    expect(isAuthRequired(CANONICAL_LAUNCH_ROUTE)).toBe(true);
  });

  it('should require auth for /create', () => {
    expect(isAuthRequired('/create')).toBe(true);
  });

  it('should allow guest access to /', () => {
    expect(isGuestAccessible('/')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #2: Session bootstrap validates contract fields
// ---------------------------------------------------------------------------

describe('AC #2: Session bootstrap validates contract fields', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('should accept a well-formed test session', () => {
    const session = buildTestSession();
    const result = validateSessionContract(session);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should write and read back a session preserving all fields', () => {
    const session = buildTestSession({ email: 'roundtrip@biatec.io' });
    writeValidatedSession(session);
    const result = readAndValidateSession();
    expect(result.valid).toBe(true);
    expect(result.session?.email).toBe('roundtrip@biatec.io');
    expect(result.session?.isConnected).toBe(true);
  });

  it('should not store a session that fails contract validation', () => {
    const bad = { address: '', email: 'not-valid', isConnected: 'yes' } as any;
    const wrote = writeValidatedSession(bad);
    expect(wrote).toBe(false);
    expect(localStorage.getItem(MVP_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('should detect a missing session as invalid', () => {
    const result = readAndValidateSession();
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('no session');
  });

  it('should detect a corrupted session JSON as invalid', () => {
    localStorage.setItem(MVP_SESSION_STORAGE_KEY, '{"broken":');
    const result = readAndValidateSession();
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('JSON parse error');
  });

  it('should distinguish expired session from no session', () => {
    writeValidatedSession(buildExpiredSession());
    const live = hasLiveSession();
    expect(live).toBe(false);
    const result = readAndValidateSession();
    expect(result.valid).toBe(true);  // session is structurally valid
    expect(result.session?.isConnected).toBe(false);  // but expired
  });

  it('should return true for hasLiveSession with a connected session', () => {
    writeValidatedSession(buildTestSession({ isConnected: true }));
    expect(hasLiveSession()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #3: Auth guard integration — session-based route protection
// ---------------------------------------------------------------------------

describe('AC #3: Auth guard uses session contract for route protection', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('should block unauthenticated user from /launch/guided', () => {
    const guard = simulateAuthGuard('/launch/guided');
    expect(guard.allowed).toBe(false);
    expect(guard.redirectTo).toContain('showAuth=true');
  });

  it('should block unauthenticated user from /create', () => {
    const guard = simulateAuthGuard('/create');
    expect(guard.allowed).toBe(false);
  });

  it('should allow authenticated user to reach /launch/guided', () => {
    writeValidatedSession(buildTestSession());
    const guard = simulateAuthGuard('/launch/guided');
    expect(guard.allowed).toBe(true);
  });

  it('should block user with expired session from /launch/guided', () => {
    writeValidatedSession(buildExpiredSession());
    const guard = simulateAuthGuard('/launch/guided');
    expect(guard.allowed).toBe(false);
  });

  it('should allow any user (guest or auth) to reach /', () => {
    const guard = simulateAuthGuard('/');
    expect(guard.allowed).toBe(true);
  });

  it('should allow guest to reach /marketplace', () => {
    const guard = simulateAuthGuard('/marketplace');
    expect(guard.allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #4: Guest nav has no wallet/network-centric labels
// ---------------------------------------------------------------------------

describe('AC #4: Guest nav is free of wallet/network-centric labels', () => {
  const guestNavTexts = [
    'Home Dashboard Marketplace Sign In',
    'Create Token Dashboard Cockpit Sign In',
    'Biatec Tokens Home Marketplace Sign In',
  ];

  const forbiddenNavTexts = [
    'Connect Wallet',
    'Not connected to Algorand Mainnet',
    'WalletConnect Pera Defly',
    'MetaMask — install plugin',
    'Wallet: 0x123',
    'Disconnect wallet',
    'Testnet selected',
  ];

  guestNavTexts.forEach((text) => {
    it(`should accept guest nav text: "${text.substring(0, 50)}"`, () => {
      expect(containsForbiddenGuestNavText(text)).toBe(false);
    });
  });

  forbiddenNavTexts.forEach((text) => {
    it(`should reject forbidden nav text: "${text.substring(0, 50)}"`, () => {
      expect(containsForbiddenGuestNavText(text)).toBe(true);
    });
  });

  it('should identify all forbidden patterns in a multi-violation string', () => {
    const violating = 'Connect Wallet - Algorand Mainnet - WalletConnect';
    const violations = findForbiddenGuestNavPatterns(violating);
    expect(violations.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// AC #5: Guided launch step ordering and advancement logic
// ---------------------------------------------------------------------------

describe('AC #5: Guided launch step ordering and advancement', () => {
  it('should have 7 canonical steps', () => {
    expect(GUIDED_LAUNCH_STEP_COUNT).toBe(7);
  });

  it('should order steps correctly', () => {
    expect(GUIDED_LAUNCH_STEPS[0]).toBe('organization');
    expect(GUIDED_LAUNCH_STEPS[1]).toBe('intent');
    expect(GUIDED_LAUNCH_STEPS[2]).toBe('compliance');
    expect(GUIDED_LAUNCH_STEPS[3]).toBe('whitelist');
    expect(GUIDED_LAUNCH_STEPS[4]).toBe('template');
    expect(GUIDED_LAUNCH_STEPS[5]).toBe('economics');
    expect(GUIDED_LAUNCH_STEPS[6]).toBe('review');
  });

  it('should block advancement from step 0 when not complete', () => {
    expect(canAdvanceFromStep(0, [])).toBe(false);
  });

  it('should allow advancement from step 0 when complete', () => {
    expect(canAdvanceFromStep(0, [0])).toBe(true);
  });

  it('should block advancement from last step even when complete', () => {
    expect(canAdvanceFromStep(6, [0, 1, 2, 3, 4, 5, 6])).toBe(false);
  });

  it('should report all required steps complete when economics is skipped', () => {
    expect(areRequiredStepsComplete([0, 1, 2, 3, 4, 6])).toBe(true);
  });

  it('should report incomplete when review step is missing', () => {
    expect(areRequiredStepsComplete([0, 1, 2, 3, 4, 5])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #6: Draft injection is structurally valid
// ---------------------------------------------------------------------------

describe('AC #6: Draft fixtures are structurally valid', () => {
  it('should build a minimal draft with correct defaults', () => {
    const draft = buildMinimalDraft();
    expect(draft.version).toBe('1.0');
    expect(draft.form.currentStep).toBe(0);
    expect(draft.form.completedSteps).toEqual([]);
    expect(draft.stepStatuses).toHaveLength(7);
  });

  it('should build a draft at step 3 with steps 0,1,2 complete', () => {
    const draft = buildDraftAtStep(3);
    expect(draft.form.currentStep).toBe(3);
    expect(draft.form.completedSteps).toEqual([0, 1, 2]);
    expect(draft.stepStatuses[0].isComplete).toBe(true);
    expect(draft.stepStatuses[3].isComplete).toBe(false);
  });

  it('should serialise to valid JSON that can be stored in localStorage', () => {
    const draft = buildDraftAtStep(2);
    const json = serialiseDraft(draft);
    expect(() => JSON.parse(json)).not.toThrow();
    // Simulate localStorage write/read round-trip
    localStorage.setItem(MVP_GUIDED_LAUNCH_DRAFT_KEY, json);
    const read = localStorage.getItem(MVP_GUIDED_LAUNCH_DRAFT_KEY);
    const parsed = JSON.parse(read!);
    expect(parsed.form.currentStep).toBe(2);
  });

  it('should produce draft with submissionError for error banner tests', () => {
    const draft = buildMinimalDraft({ submissionError: 'SUBMISSION_FAILED' });
    expect(draft.form.submissionError).toBe('SUBMISSION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// AC #7: Error messages are user-facing, not technical exception strings
// ---------------------------------------------------------------------------

describe('AC #7: Error messages are user-centered, not raw exception strings', () => {
  const technicalCodes: Array<import('../../utils/launchErrorMessages').LaunchErrorCode> = [
    'SUBMISSION_FAILED',
    'NETWORK_UNAVAILABLE',
    'AUTH_REQUIRED',
    'SESSION_EXPIRED',
    'STEP_LOAD_FAILED',
    'UNKNOWN',
  ];

  technicalCodes.forEach((code) => {
    it(`should return a non-empty, human-readable message for error code ${code}`, () => {
      const msg = getLaunchErrorMessage(code);
      expect(msg).toBeTruthy();
      expect(msg.title).toBeTruthy();
      expect(msg.title.length).toBeGreaterThan(5);
      expect(msg.description).toBeTruthy();
      expect(msg.action).toBeTruthy();
    });
  });

  it('should not expose SUBMISSION_FAILED raw code in title or description', () => {
    const msg = getLaunchErrorMessage('SUBMISSION_FAILED');
    expect(msg.title).not.toContain('SUBMISSION_FAILED');
    expect(msg.description).not.toContain('SUBMISSION_FAILED');
  });

  it('should not expose NETWORK_UNAVAILABLE raw code in title or description', () => {
    const msg = getLaunchErrorMessage('NETWORK_UNAVAILABLE');
    expect(msg.title).not.toContain('NETWORK_UNAVAILABLE');
    expect(msg.description).not.toContain('NETWORK_UNAVAILABLE');
  });

  it('should mark SUBMISSION_FAILED as recoverable', () => {
    expect(getLaunchErrorMessage('SUBMISSION_FAILED').recoverable).toBe(true);
  });

  it('should include a next-action hint for SESSION_EXPIRED', () => {
    const msg = getLaunchErrorMessage('SESSION_EXPIRED');
    expect(msg.action).toBeTruthy();
    expect(msg.action.length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// AC #8: Session expiry is detectable and handled distinctly
// ---------------------------------------------------------------------------

describe('AC #8: Session expiry distinguishable from missing session', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('no session: hasLiveSession returns false, readAndValidate returns invalid with no-session error', () => {
    const hasLive = hasLiveSession();
    const result = readAndValidateSession();
    expect(hasLive).toBe(false);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('no session');
  });

  it('expired session: hasLiveSession returns false, readAndValidate returns valid structure', () => {
    writeValidatedSession(buildExpiredSession());
    const hasLive = hasLiveSession();
    const result = readAndValidateSession();
    expect(hasLive).toBe(false);
    expect(result.valid).toBe(true); // structurally valid
    expect(result.session?.isConnected).toBe(false);
  });

  it('live session: hasLiveSession returns true', () => {
    writeValidatedSession(buildTestSession());
    expect(hasLiveSession()).toBe(true);
  });

  it('cleared session: reverts to no-session state', () => {
    writeValidatedSession(buildTestSession());
    clearSession();
    expect(hasLiveSession()).toBe(false);
    const result = readAndValidateSession();
    expect(result.valid).toBe(false);
  });
});
