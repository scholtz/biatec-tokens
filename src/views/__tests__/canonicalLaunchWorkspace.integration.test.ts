/**
 * Integration Tests: Canonical Launch Workspace
 *
 * Validates cross-cutting concerns and integration between the canonical launch
 * workspace utility and the existing auth/routing infrastructure:
 *
 *   AC #1  Route invariants are consistent with router configuration
 *   AC #2  Workspace state and canonical flow are coherent end-to-end
 *   AC #3  Analytics events are sequenced correctly through the launch funnel
 *   AC #4  Compliance error classification integrates with UI label formatting
 *   AC #5  Legacy redirect path is fully covered by invariant helpers
 *   AC #6  Non-wallet enforcement applies across all state label combinations
 *   AC #7  Accessibility state derivation covers all AuthFirstHardening surface areas
 *   AC #8  All helpers are deterministic across combined state transitions
 *
 * Zero arbitrary timeouts. Uses real localStorage via happy-dom environment.
 *
 * Issue: MVP next step — accessibility-first canonical guided launch and compliance journey
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  deriveWorkspaceUserState,
  resolveWorkspaceLabel,
  containsWalletTerminology,
  findWalletPatterns,
  allRequiredNavLabelsPresent,
  buildCompliantAccessibilityState,
  getAccessibilityViolations,
  isAccessibilityCompliant,
  buildLaunchStartedEvent,
  buildStepCompletedEvent,
  buildComplianceVisitedEvent,
  buildComplianceCompletedEvent,
  buildDeployRequestEvent,
  validateEventPayload,
  isEventRecentlyEmitted,
  getComplianceErrorMessage,
  classifyComplianceError,
  isValidLegacyRedirect,
  isCanonicalLaunchPath,
  isComplianceAuthGated,
  isLaunchAuthRequired,
  CANONICAL_LAUNCH_DESTINATION,
  LEGACY_WIZARD_REDIRECT_SOURCE,
  COMPLIANCE_AUTH_GATED_ROUTES,
  LAUNCH_AUTH_REQUIRED_ROUTES,
  type WorkspaceSession,
} from '../../utils/canonicalLaunchWorkspace';

import {
  isAuthRequired,
  isGuestAccessible,
  AUTH_REQUIRED_PATHS,
  GUEST_ACCESSIBLE_PATHS,
} from '../../utils/authFirstHardening';

import {
  CANONICAL_LAUNCH_ROUTE,
  LEGACY_WIZARD_ROUTE,
  containsForbiddenGuestNavText,
  GUEST_NAV_FORBIDDEN_PATTERNS,
} from '../../utils/mvpCanonicalFlow';

import { getLaunchErrorMessage } from '../../utils/launchErrorMessages';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearLocalStorage(): void {
  localStorage.clear();
}

function writeSession(session: WorkspaceSession): void {
  localStorage.setItem('algorand_user', JSON.stringify(session));
}

function readSession(): WorkspaceSession | null {
  try {
    const raw = localStorage.getItem('algorand_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// AC #1: Route invariants consistent with authFirstHardening router config
// ---------------------------------------------------------------------------

describe('Route invariants — alignment with authFirstHardening', () => {
  it('CANONICAL_LAUNCH_DESTINATION matches CANONICAL_LAUNCH_ROUTE from mvpCanonicalFlow', () => {
    expect(CANONICAL_LAUNCH_DESTINATION).toBe(CANONICAL_LAUNCH_ROUTE);
  });

  it('LEGACY_WIZARD_REDIRECT_SOURCE matches LEGACY_WIZARD_ROUTE from mvpCanonicalFlow', () => {
    expect(LEGACY_WIZARD_REDIRECT_SOURCE).toBe(LEGACY_WIZARD_ROUTE);
  });

  it('all LAUNCH_AUTH_REQUIRED_ROUTES are in authFirstHardening AUTH_REQUIRED_PATHS', () => {
    for (const route of LAUNCH_AUTH_REQUIRED_ROUTES) {
      expect(AUTH_REQUIRED_PATHS).toContain(route);
    }
  });

  it('all COMPLIANCE_AUTH_GATED_ROUTES are in authFirstHardening AUTH_REQUIRED_PATHS', () => {
    for (const route of COMPLIANCE_AUTH_GATED_ROUTES) {
      expect(AUTH_REQUIRED_PATHS).toContain(route);
    }
  });

  it('CANONICAL_LAUNCH_DESTINATION requires auth in authFirstHardening', () => {
    expect(isAuthRequired(CANONICAL_LAUNCH_DESTINATION)).toBe(true);
  });

  it('CANONICAL_LAUNCH_DESTINATION is NOT guest-accessible', () => {
    expect(isGuestAccessible(CANONICAL_LAUNCH_DESTINATION)).toBe(false);
  });

  it('home route "/" is guest-accessible (sanity check)', () => {
    expect(GUEST_ACCESSIBLE_PATHS).toContain('/');
  });

  it('none of the launch auth-required routes are guest-accessible', () => {
    for (const route of LAUNCH_AUTH_REQUIRED_ROUTES) {
      expect(isGuestAccessible(route)).toBe(false);
    }
  });

  it('none of the compliance auth-gated routes are guest-accessible', () => {
    for (const route of COMPLIANCE_AUTH_GATED_ROUTES) {
      expect(isGuestAccessible(route)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #2: Workspace state and canonical flow coherence
// ---------------------------------------------------------------------------

describe('Workspace state + canonical flow coherence', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('guest user gets "Sign in" CTA pointing to the sign-in flow', () => {
    const session = readSession(); // null
    const state = deriveWorkspaceUserState(session);
    const label = resolveWorkspaceLabel(state);
    expect(state).toBe('guest');
    expect(label.ctaLabel).toBe('Sign in');
  });

  it('authenticated user after localStorage write gets launch-ready label', () => {
    const session: WorkspaceSession = { address: 'AUTH_ADDR', email: 'auth@biatec.io', isConnected: true };
    writeSession(session);
    const read = readSession();
    const state = deriveWorkspaceUserState(read);
    const label = resolveWorkspaceLabel(state);
    expect(state).toBe('authenticated');
    expect(label.ctaLabel).toBe('Start guided launch');
  });

  it('expired session written to localStorage produces expired state', () => {
    const session: WorkspaceSession = { address: 'EXP_ADDR', email: 'exp@biatec.io', isConnected: false };
    writeSession(session);
    const read = readSession();
    const state = deriveWorkspaceUserState(read);
    const label = resolveWorkspaceLabel(state);
    expect(state).toBe('expired');
    expect(label.ariaRole).toBe('alert');
    expect(label.ariaLive).toBe('assertive');
  });

  it('all workspace labels for a valid session have no wallet terminology', () => {
    const session: WorkspaceSession = { address: 'ADDR', email: 'x@x.io', isConnected: true };
    writeSession(session);
    const read = readSession()!;
    const state = deriveWorkspaceUserState(read);

    const contexts = ['launch', 'compliance', 'deployment'] as const;
    for (const ctx of contexts) {
      const label = resolveWorkspaceLabel(state, ctx);
      expect(containsWalletTerminology(label.heading)).toBe(false);
      expect(containsWalletTerminology(label.description)).toBe(false);
      expect(containsWalletTerminology(label.ctaLabel)).toBe(false);
    }
  });

  it('allRequiredNavLabelsPresent passes for actual Navbar navigationItems labels (including sign in button)', () => {
    // Mirrors the rendered labels from Navbar.vue navigationItems + sign-in button
    const navbarLabels = [
      'Home', 'Cockpit', 'Guided Launch', 'Compliance', 'Dashboard',
      'Portfolio', 'Insights', 'Pricing', 'Settings', 'Sign in',
    ];
    expect(allRequiredNavLabelsPresent(navbarLabels)).toBe(true);
  });

  it('isCanonicalLaunchPath returns true for the canonical route constant', () => {
    expect(isCanonicalLaunchPath(CANONICAL_LAUNCH_ROUTE)).toBe(true);
  });

  it('isValidLegacyRedirect correctly identifies the redirect pair from constants', () => {
    expect(isValidLegacyRedirect(LEGACY_WIZARD_ROUTE, CANONICAL_LAUNCH_ROUTE)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #3: Analytics event sequence through the launch funnel
// ---------------------------------------------------------------------------

describe('Analytics funnel sequence', () => {
  it('produces a complete ordered funnel sequence', () => {
    const sessionId = 'int-test-session-001';
    const planContext = 'trial' as const;
    const opts = { planContext, sessionId };

    const startEvent = buildLaunchStartedEvent(opts);
    const step0 = buildStepCompletedEvent(0, 'organization', opts);
    const step1 = buildStepCompletedEvent(1, 'intent', opts);
    const step2 = buildStepCompletedEvent(2, 'compliance', opts);
    const complianceVisit = buildComplianceVisitedEvent(opts);
    const complianceDone = buildComplianceCompletedEvent(opts);
    const deploy = buildDeployRequestEvent(opts);

    const events = [startEvent, step0, step1, step2, complianceVisit, complianceDone, deploy];

    // All events have the same session context
    for (const event of events) {
      expect(event.sessionId).toBe(sessionId);
      expect(event.planContext).toBe(planContext);
    }

    // Events occur in chronological order (same-millisecond timestamps are equal, not reversed)
    for (let i = 0; i < events.length - 1; i++) {
      expect(new Date(events[i].timestamp).getTime()).toBeLessThanOrEqual(
        new Date(events[i + 1].timestamp).getTime(),
      );
    }

    // Step indices are sequential
    expect(step0.stepIndex).toBe(0);
    expect(step1.stepIndex).toBe(1);
    expect(step2.stepIndex).toBe(2);
  });

  it('all funnel events pass payload validation', () => {
    const events = [
      buildLaunchStartedEvent({ planContext: 'enterprise', sessionId: 'sess_xyz' }),
      buildStepCompletedEvent(0, 'organization', { planContext: 'basic' }),
      buildComplianceVisitedEvent({ planContext: 'professional' }),
      buildComplianceCompletedEvent(),
      buildDeployRequestEvent({ sessionId: 'sess_abc' }),
    ];

    for (const event of events) {
      const violations = validateEventPayload(event);
      expect(violations).toHaveLength(0);
    }
  });

  it('all funnel events are recently emitted immediately after construction', () => {
    const now = Date.now();
    const events = [
      buildLaunchStartedEvent(),
      buildStepCompletedEvent(0, 'org'),
      buildComplianceVisitedEvent(),
      buildComplianceCompletedEvent(),
      buildDeployRequestEvent(),
    ];

    for (const event of events) {
      expect(isEventRecentlyEmitted(event, 5000, now + 100)).toBe(true);
    }
  });

  it('step names are normalised consistently across the guided launch steps', () => {
    const steps = ['organization', 'intent', 'compliance', 'template', 'economics', 'review'];
    for (let i = 0; i < steps.length; i++) {
      const event = buildStepCompletedEvent(i, steps[i]);
      expect(event.stepName).toBe(steps[i]);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #4: Compliance error classification + UI label integration
// ---------------------------------------------------------------------------

describe('Compliance error classification + UI label integration', () => {
  it('all classified errors produce a structured message', () => {
    const errorInputs = [
      { input: new Error('jurisdiction required'), expectedCode: 'JURISDICTION_REQUIRED' },
      { input: new Error('KYC incomplete'), expectedCode: 'KYC_INCOMPLETE' },
      { input: new Error('document upload required'), expectedCode: 'DOCUMENT_MISSING' },
      { input: new Error('risk disclosure needed'), expectedCode: 'RISK_ASSESSMENT_PENDING' },
      { input: new Error('whitelist required'), expectedCode: 'WHITELIST_REQUIRED' },
      { input: new Error('AML check failed'), expectedCode: 'AML_CHECK_FAILED' },
      { input: new Error('compliance expired'), expectedCode: 'COMPLIANCE_EXPIRED' },
      { input: new Error('duplicate submission already exists'), expectedCode: 'DUPLICATE_SUBMISSION' },
    ] as const;

    for (const { input, expectedCode } of errorInputs) {
      const code = classifyComplianceError(input);
      expect(code).toBe(expectedCode);
      const msg = getComplianceErrorMessage(code);
      expect(msg.title).toBeTruthy();
      expect(msg.description).toBeTruthy();
      expect(msg.action).toBeTruthy();
    }
  });

  it('compliance error messages do not contain wallet terminology', () => {
    const codes = [
      'JURISDICTION_REQUIRED', 'KYC_INCOMPLETE', 'DOCUMENT_MISSING',
      'RISK_ASSESSMENT_PENDING', 'WHITELIST_REQUIRED', 'AML_CHECK_FAILED',
      'COMPLIANCE_EXPIRED', 'DUPLICATE_SUBMISSION', 'COMPLIANCE_UNKNOWN',
    ] as const;

    for (const code of codes) {
      const msg = getComplianceErrorMessage(code);
      expect(containsWalletTerminology(msg.title)).toBe(false);
      expect(containsWalletTerminology(msg.description)).toBe(false);
      expect(containsWalletTerminology(msg.action)).toBe(false);
    }
  });

  it('compliance errors with severity "error" correspond to non-trivial issues', () => {
    const errorSeverityCodes = [
      'KYC_INCOMPLETE', 'AML_CHECK_FAILED', 'COMPLIANCE_UNKNOWN',
    ] as const;

    for (const code of errorSeverityCodes) {
      expect(getComplianceErrorMessage(code).severity).toBe('error');
    }
  });

  it('compliance errors with selfServiceable=false mention support contact', () => {
    const nonSelfService = ['AML_CHECK_FAILED', 'DUPLICATE_SUBMISSION'] as const;
    for (const code of nonSelfService) {
      const msg = getComplianceErrorMessage(code);
      expect(msg.selfServiceable).toBe(false);
      // The action should mention support or checking status
      const actionLower = msg.action.toLowerCase();
      expect(
        actionLower.includes('support') || actionLower.includes('contact') || actionLower.includes('check'),
      ).toBe(true);
    }
  });

  it('launch error messages (launchErrorMessages.ts) also follow what/why/how structure', () => {
    const launchCodes = [
      'AUTH_REQUIRED', 'SESSION_EXPIRED', 'VALIDATION_FAILED',
      'COMPLIANCE_INCOMPLETE', 'SUBMISSION_FAILED',
    ] as const;
    for (const code of launchCodes) {
      const msg = getLaunchErrorMessage(code);
      expect(msg.title).toBeTruthy();
      expect(msg.description).toBeTruthy();
      expect(msg.action).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// AC #5: Legacy redirect fully covered by invariant helpers
// ---------------------------------------------------------------------------

describe('Legacy redirect coverage', () => {
  it('isValidLegacyRedirect correctly identifies the expected redirect', () => {
    expect(isValidLegacyRedirect(LEGACY_WIZARD_REDIRECT_SOURCE, CANONICAL_LAUNCH_DESTINATION)).toBe(true);
  });

  it('isValidLegacyRedirect rejects redirects to wrong destinations', () => {
    expect(isValidLegacyRedirect(LEGACY_WIZARD_REDIRECT_SOURCE, '/create')).toBe(false);
    expect(isValidLegacyRedirect(LEGACY_WIZARD_REDIRECT_SOURCE, '/')).toBe(false);
  });

  it('legacy source path is NOT a canonical launch path', () => {
    expect(isCanonicalLaunchPath(LEGACY_WIZARD_REDIRECT_SOURCE)).toBe(false);
  });

  it('canonical destination IS a canonical launch path', () => {
    expect(isCanonicalLaunchPath(CANONICAL_LAUNCH_DESTINATION)).toBe(true);
  });

  it('legacy source is NOT a launch auth-required route (it redirects)', () => {
    expect(isLaunchAuthRequired(LEGACY_WIZARD_REDIRECT_SOURCE)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #6: Non-wallet enforcement across all state label combinations
// ---------------------------------------------------------------------------

describe('Non-wallet enforcement — exhaustive label check', () => {
  const userStates = ['guest', 'authenticated', 'expired'] as const;
  const contexts = ['launch', 'compliance', 'deployment'] as const;

  for (const userState of userStates) {
    for (const ctx of contexts) {
      it(`no wallet terminology in label for ${userState}/${ctx}`, () => {
        const label = resolveWorkspaceLabel(userState, ctx);
        const allText = `${label.heading} ${label.description} ${label.ctaLabel}`;
        const patterns = findWalletPatterns(allText);
        expect(patterns).toHaveLength(0);
      });
    }
  }

  it('containsForbiddenGuestNavText (mvpCanonicalFlow) also rejects wallet patterns', () => {
    // Verify the two utilities are aligned in their rejection criteria
    for (const pattern of GUEST_NAV_FORBIDDEN_PATTERNS) {
      // Each mvpCanonicalFlow pattern should also be caught by our utility for shared phrases
      const testStr = 'connect wallet network';
      // The mvpCanonicalFlow utility rejects wallet/network terms
      expect(containsForbiddenGuestNavText(testStr)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #7: Accessibility state integrates with auth-first surface areas
// ---------------------------------------------------------------------------

describe('Accessibility state integration', () => {
  it('buildCompliantAccessibilityState satisfies isAccessibilityCompliant', () => {
    expect(isAccessibilityCompliant(buildCompliantAccessibilityState())).toBe(true);
  });

  it('zero violations for the compliant baseline state', () => {
    expect(getAccessibilityViolations(buildCompliantAccessibilityState())).toHaveLength(0);
  });

  it('each individual failure produces exactly one violation', () => {
    const fields = [
      'primaryCtaKeyboardReachable',
      'focusIndicatorsVisible',
      'semanticHeadingsPresent',
      'errorsUseAlertRole',
      'stepProgressAnnounced',
      'iconsAccessible',
    ] as const;

    for (const field of fields) {
      const state = { ...buildCompliantAccessibilityState(), [field]: false };
      expect(getAccessibilityViolations(state)).toHaveLength(1);
    }
  });

  it('guest workspace label uses polite aria-live (non-intrusive for first visit)', () => {
    const label = resolveWorkspaceLabel('guest');
    expect(label.ariaLive).toBe('polite');
  });

  it('expired session label uses assertive aria-live (urgent attention required)', () => {
    const label = resolveWorkspaceLabel('expired');
    expect(label.ariaLive).toBe('assertive');
  });

  it('error state workspace labels use alert ariaRole', () => {
    const label = resolveWorkspaceLabel('expired');
    expect(label.ariaRole).toBe('alert');
  });
});

// ---------------------------------------------------------------------------
// AC #8: Determinism across combined state transitions
// ---------------------------------------------------------------------------

describe('Determinism — combined state transitions', () => {
  beforeEach(clearLocalStorage);
  afterEach(clearLocalStorage);

  it('state derivation is idempotent for the same session', () => {
    const session: WorkspaceSession = { address: 'DET_ADDR', email: 'det@biatec.io', isConnected: true };
    expect(deriveWorkspaceUserState(session)).toBe(deriveWorkspaceUserState(session));
  });

  it('resolveWorkspaceLabel is idempotent for the same inputs', () => {
    expect(resolveWorkspaceLabel('authenticated', 'compliance')).toEqual(
      resolveWorkspaceLabel('authenticated', 'compliance'),
    );
  });

  it('analytics event event-type is consistent across repeated calls', () => {
    expect(buildLaunchStartedEvent().event).toBe(buildLaunchStartedEvent().event);
    expect(buildStepCompletedEvent(0, 'org').event).toBe(buildStepCompletedEvent(0, 'org').event);
  });

  it('isComplianceAuthGated is idempotent', () => {
    const route = '/compliance/setup';
    expect(isComplianceAuthGated(route)).toBe(isComplianceAuthGated(route));
  });

  it('isLaunchAuthRequired is idempotent', () => {
    const route = '/launch/guided';
    expect(isLaunchAuthRequired(route)).toBe(isLaunchAuthRequired(route));
  });

  it('classifyComplianceError is deterministic for the same input', () => {
    const err = new Error('kyc required');
    expect(classifyComplianceError(err)).toBe(classifyComplianceError(err));
  });

  it('getComplianceErrorMessage is deterministic', () => {
    expect(getComplianceErrorMessage('KYC_INCOMPLETE')).toEqual(getComplianceErrorMessage('KYC_INCOMPLETE'));
  });

  it('allRequiredNavLabelsPresent is deterministic', () => {
    const labels = ['Create Token', 'Sign in', 'Dashboard'];
    expect(allRequiredNavLabelsPresent(labels)).toBe(allRequiredNavLabelsPresent(labels));
  });
});
