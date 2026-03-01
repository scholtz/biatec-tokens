/**
 * Unit Tests: Compliance Delivery Slice
 *
 * Validates the full compliance delivery pipeline model:
 *   AC #1  computeDeliveryStep returns the correct step for all input combinations
 *   AC #2  Step labels use business language — no wallet/blockchain jargon
 *   AC #3  User guidance text is present and non-empty for every step
 *   AC #4  validateStepTransition correctly identifies valid/invalid transitions
 *   AC #5  buildDeliveryStepEvent produces correctly shaped telemetry events
 *   AC #6  deriveDeliveryState combines step, label, guidance, and flags correctly
 *   AC #7  computeDeliveryProgress returns 0–100 monotonically
 *   AC #8  Guard helpers (canAccessComplianceWorkspace, canRequestDeployment) gate correctly
 *   AC #9  getStepRedirectTarget returns canonical routes
 *   AC #10 isDelivered, isAwaitingBackend, requiresUserAction classify steps correctly
 *   AC #11 All helpers are deterministic — same inputs always produce the same output
 *   AC #12 DELIVERY_STEP_ORDER covers all ComplianceDeliveryStep values
 *
 * Zero arbitrary timeouts. Zero async I/O. Pure synchronous unit tests.
 *
 * Issue: MVP next-step — deterministic auth/compliance delivery slice
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DELIVERY_STEP_ORDER,
  computeDeliveryStep,
  getStepLabel,
  getStepUserGuidance,
  getStepIndex,
  validateStepTransition,
  buildDeliveryStepEvent,
  deriveDeliveryState,
  computeDeliveryProgress,
  isDelivered,
  isAwaitingBackend,
  requiresUserAction,
  canAccessComplianceWorkspace,
  canRequestDeployment,
  getStepRedirectTarget,
  type ComplianceDeliveryStep,
  type DeliveryStepInputs,
} from '../complianceDeliverySlice';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const FULLY_SATISFIED_INPUTS: DeliveryStepInputs = {
  isAuthenticated: true,
  isAccountProvisioned: true,
  hasOrgProfile: true,
  complianceSubmitted: true,
  complianceApproved: true,
  deploymentRequested: true,
  deploymentConfirmed: true,
};

const EMPTY_INPUTS: DeliveryStepInputs = {
  isAuthenticated: false,
  isAccountProvisioned: false,
  hasOrgProfile: false,
  complianceSubmitted: false,
  complianceApproved: false,
  deploymentRequested: false,
  deploymentConfirmed: false,
};

// ---------------------------------------------------------------------------
// AC #12: Step order coverage
// ---------------------------------------------------------------------------

describe('DELIVERY_STEP_ORDER', () => {
  it('should contain all 7 pipeline steps', () => {
    expect(DELIVERY_STEP_ORDER).toHaveLength(7);
  });

  it('should start with auth_required', () => {
    expect(DELIVERY_STEP_ORDER[0]).toBe('auth_required');
  });

  it('should end with delivered', () => {
    expect(DELIVERY_STEP_ORDER[DELIVERY_STEP_ORDER.length - 1]).toBe('delivered');
  });

  it('should have no duplicate entries', () => {
    const unique = new Set(DELIVERY_STEP_ORDER);
    expect(unique.size).toBe(DELIVERY_STEP_ORDER.length);
  });
});

// ---------------------------------------------------------------------------
// AC #1: computeDeliveryStep
// ---------------------------------------------------------------------------

describe('computeDeliveryStep', () => {
  it('returns auth_required when not authenticated', () => {
    expect(computeDeliveryStep(EMPTY_INPUTS)).toBe('auth_required');
  });

  it('returns account_provisioning when authenticated but account not provisioned', () => {
    expect(
      computeDeliveryStep({ ...EMPTY_INPUTS, isAuthenticated: true }),
    ).toBe('account_provisioning');
  });

  it('returns org_profile when account provisioned but no org profile', () => {
    expect(
      computeDeliveryStep({ ...EMPTY_INPUTS, isAuthenticated: true, isAccountProvisioned: true }),
    ).toBe('org_profile');
  });

  it('returns compliance_check when org profile done but compliance not submitted', () => {
    expect(
      computeDeliveryStep({
        ...EMPTY_INPUTS,
        isAuthenticated: true,
        isAccountProvisioned: true,
        hasOrgProfile: true,
      }),
    ).toBe('compliance_check');
  });

  it('returns compliance_check when compliance submitted but not approved', () => {
    expect(
      computeDeliveryStep({
        ...EMPTY_INPUTS,
        isAuthenticated: true,
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: false,
      }),
    ).toBe('compliance_check');
  });

  it('returns compliance_verified when compliance approved but deployment not requested', () => {
    expect(
      computeDeliveryStep({
        ...EMPTY_INPUTS,
        isAuthenticated: true,
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
      }),
    ).toBe('compliance_verified');
  });

  it('returns deployment_requested when deployment requested but not confirmed', () => {
    expect(
      computeDeliveryStep({
        ...EMPTY_INPUTS,
        isAuthenticated: true,
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
        deploymentRequested: true,
      }),
    ).toBe('deployment_requested');
  });

  it('returns delivered when all inputs are satisfied', () => {
    expect(computeDeliveryStep(FULLY_SATISFIED_INPUTS)).toBe('delivered');
  });

  it('is deterministic — same inputs always return the same step', () => {
    const inputs = { ...EMPTY_INPUTS, isAuthenticated: true, isAccountProvisioned: true };
    expect(computeDeliveryStep(inputs)).toBe(computeDeliveryStep(inputs));
  });
});

// ---------------------------------------------------------------------------
// AC #2 + AC #3: Step labels and guidance
// ---------------------------------------------------------------------------

describe('getStepLabel', () => {
  it('returns a non-empty label for every step', () => {
    for (const step of DELIVERY_STEP_ORDER) {
      const label = getStepLabel(step);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('returns business-language labels — no wallet/blockchain jargon', () => {
    const FORBIDDEN = /wallet|blockchain|crypto|web3|metamask|pera|defly/i;
    for (const step of DELIVERY_STEP_ORDER) {
      expect(getStepLabel(step)).not.toMatch(FORBIDDEN);
    }
  });

  it('returns Sign In Required for auth_required step', () => {
    expect(getStepLabel('auth_required')).toBe('Sign In Required');
  });

  it('returns Token Delivered for delivered step', () => {
    expect(getStepLabel('delivered')).toBe('Token Delivered');
  });
});

describe('getStepUserGuidance', () => {
  it('returns non-empty guidance for every step', () => {
    for (const step of DELIVERY_STEP_ORDER) {
      const guidance = getStepUserGuidance(step);
      expect(guidance.length).toBeGreaterThan(0);
    }
  });

  it('guidance text contains no wallet/blockchain jargon', () => {
    const FORBIDDEN = /wallet|blockchain|web3|metamask|pera|defly/i;
    for (const step of DELIVERY_STEP_ORDER) {
      expect(getStepUserGuidance(step)).not.toMatch(FORBIDDEN);
    }
  });

  it('auth_required guidance mentions email and password', () => {
    const guidance = getStepUserGuidance('auth_required');
    expect(guidance).toMatch(/email/i);
    expect(guidance).toMatch(/password/i);
  });

  it('delivered guidance mentions dashboard', () => {
    const guidance = getStepUserGuidance('delivered');
    expect(guidance).toMatch(/dashboard/i);
  });
});

// ---------------------------------------------------------------------------
// getStepIndex
// ---------------------------------------------------------------------------

describe('getStepIndex', () => {
  it('returns 0 for auth_required', () => {
    expect(getStepIndex('auth_required')).toBe(0);
  });

  it('returns 6 for delivered', () => {
    expect(getStepIndex('delivered')).toBe(6);
  });

  it('returns monotonically increasing indices for the step order', () => {
    const indices = DELIVERY_STEP_ORDER.map(getStepIndex);
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #4: validateStepTransition
// ---------------------------------------------------------------------------

describe('validateStepTransition', () => {
  it('accepts valid forward transitions', () => {
    expect(validateStepTransition('auth_required', 'account_provisioning').valid).toBe(true);
    expect(validateStepTransition('account_provisioning', 'org_profile').valid).toBe(true);
    expect(validateStepTransition('compliance_verified', 'deployment_requested').valid).toBe(true);
    expect(validateStepTransition('deployment_requested', 'delivered').valid).toBe(true);
  });

  it('accepts multi-step forward transitions (e.g. skipping over)', () => {
    expect(validateStepTransition('auth_required', 'compliance_check').valid).toBe(true);
  });

  it('rejects no-op transitions (same step)', () => {
    for (const step of DELIVERY_STEP_ORDER) {
      const result = validateStepTransition(step, step);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/no-op/i);
    }
  });

  it('rejects backward transitions with a regression reason', () => {
    const result = validateStepTransition('compliance_check', 'auth_required');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/regression/i);
  });

  it('provides descriptive reason for backward transitions', () => {
    const result = validateStepTransition('delivered', 'org_profile');
    expect(result.reason).toContain('delivered');
    expect(result.reason).toContain('org_profile');
  });
});

// ---------------------------------------------------------------------------
// AC #5: buildDeliveryStepEvent
// ---------------------------------------------------------------------------

describe('buildDeliveryStepEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
  });

  it('produces event with correct step name', () => {
    const event = buildDeliveryStepEvent('org_profile', 'auth_required');
    expect(event.step).toBe('org_profile');
  });

  it('produces eventName in compliance_delivery.<step> format', () => {
    const event = buildDeliveryStepEvent('compliance_verified', 'compliance_check');
    expect(event.eventName).toBe('compliance_delivery.compliance_verified');
  });

  it('records previousStep correctly', () => {
    const event = buildDeliveryStepEvent('org_profile', 'account_provisioning');
    expect(event.previousStep).toBe('account_provisioning');
  });

  it('handles null previousStep (initial pipeline entry)', () => {
    const event = buildDeliveryStepEvent('auth_required', null);
    expect(event.previousStep).toBeNull();
  });

  it('uses current ISO timestamp', () => {
    const event = buildDeliveryStepEvent('delivered', 'deployment_requested');
    expect(event.timestamp).toBe('2025-01-15T10:00:00.000Z');
  });

  it('records step index correctly', () => {
    const event = buildDeliveryStepEvent('delivered', 'deployment_requested');
    expect(event.stepIndex).toBe(6);
  });

  it('passes meta through to the event', () => {
    const meta = { userId: 'u-123', orgId: 'o-456' };
    const event = buildDeliveryStepEvent('org_profile', 'auth_required', meta);
    expect(event.meta).toEqual(meta);
  });

  it('is deterministic — called twice produces equivalent events', () => {
    const event1 = buildDeliveryStepEvent('compliance_check', 'org_profile');
    const event2 = buildDeliveryStepEvent('compliance_check', 'org_profile');
    expect(event1.eventName).toBe(event2.eventName);
    expect(event1.step).toBe(event2.step);
    expect(event1.stepIndex).toBe(event2.stepIndex);
  });
});

// ---------------------------------------------------------------------------
// AC #6: deriveDeliveryState
// ---------------------------------------------------------------------------

describe('deriveDeliveryState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T08:00:00.000Z'));
  });

  it('sets step from computeDeliveryStep', () => {
    const state = deriveDeliveryState(EMPTY_INPUTS);
    expect(state.step).toBe('auth_required');
  });

  it('sets label from getStepLabel', () => {
    const state = deriveDeliveryState(EMPTY_INPUTS);
    expect(state.label).toBe('Sign In Required');
  });

  it('sets userGuidance from getStepUserGuidance', () => {
    const state = deriveDeliveryState(EMPTY_INPUTS);
    expect(state.userGuidance).toBe(getStepUserGuidance('auth_required'));
  });

  it('sets isTerminal to false for non-terminal steps', () => {
    const state = deriveDeliveryState(EMPTY_INPUTS);
    expect(state.isTerminal).toBe(false);
  });

  it('sets isTerminal to true for delivered step', () => {
    const state = deriveDeliveryState(FULLY_SATISFIED_INPUTS);
    expect(state.isTerminal).toBe(true);
  });

  it('sets lastTransitionAt to current ISO timestamp', () => {
    const state = deriveDeliveryState(EMPTY_INPUTS);
    expect(state.lastTransitionAt).toBe('2025-06-01T08:00:00.000Z');
  });

  it('passes context through', () => {
    const ctx = { sessionId: 'sess-789' };
    const state = deriveDeliveryState(EMPTY_INPUTS, ctx);
    expect(state.context).toEqual(ctx);
  });

  it('canAdvance is true for auth_required (user must sign in)', () => {
    const state = deriveDeliveryState(EMPTY_INPUTS);
    expect(state.canAdvance).toBe(true);
  });

  it('canAdvance is false for account_provisioning (awaiting backend)', () => {
    const state = deriveDeliveryState({
      ...EMPTY_INPUTS,
      isAuthenticated: true,
    });
    expect(state.canAdvance).toBe(false);
  });

  it('canAdvance is false for compliance_check (awaiting backend)', () => {
    const state = deriveDeliveryState({
      ...FULLY_SATISFIED_INPUTS,
      complianceApproved: false,
      deploymentRequested: false,
      deploymentConfirmed: false,
    });
    expect(state.canAdvance).toBe(false);
  });

  it('canAdvance is false for delivered (terminal)', () => {
    const state = deriveDeliveryState(FULLY_SATISFIED_INPUTS);
    expect(state.canAdvance).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #7: computeDeliveryProgress
// ---------------------------------------------------------------------------

describe('computeDeliveryProgress', () => {
  it('returns 0 for auth_required (first step)', () => {
    expect(computeDeliveryProgress('auth_required')).toBe(0);
  });

  it('returns 100 for delivered (last step)', () => {
    expect(computeDeliveryProgress('delivered')).toBe(100);
  });

  it('returns a value between 0 and 100 for intermediate steps', () => {
    for (const step of DELIVERY_STEP_ORDER) {
      const progress = computeDeliveryProgress(step);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    }
  });

  it('progress is monotonically increasing across step order', () => {
    const progresses = DELIVERY_STEP_ORDER.map(computeDeliveryProgress);
    for (let i = 1; i < progresses.length; i++) {
      expect(progresses[i]).toBeGreaterThan(progresses[i - 1]);
    }
  });

  it('returns an integer (no floating point drift)', () => {
    for (const step of DELIVERY_STEP_ORDER) {
      expect(Number.isInteger(computeDeliveryProgress(step))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #10: Step classification helpers
// ---------------------------------------------------------------------------

describe('isDelivered', () => {
  it('returns true only for delivered step', () => {
    expect(isDelivered('delivered')).toBe(true);
  });

  it('returns false for all other steps', () => {
    const others = DELIVERY_STEP_ORDER.filter((s) => s !== 'delivered');
    for (const step of others) {
      expect(isDelivered(step)).toBe(false);
    }
  });
});

describe('isAwaitingBackend', () => {
  it('returns true for account_provisioning', () => {
    expect(isAwaitingBackend('account_provisioning')).toBe(true);
  });

  it('returns true for compliance_check', () => {
    expect(isAwaitingBackend('compliance_check')).toBe(true);
  });

  it('returns true for deployment_requested', () => {
    expect(isAwaitingBackend('deployment_requested')).toBe(true);
  });

  it('returns false for user-action steps', () => {
    expect(isAwaitingBackend('auth_required')).toBe(false);
    expect(isAwaitingBackend('org_profile')).toBe(false);
    expect(isAwaitingBackend('compliance_verified')).toBe(false);
    expect(isAwaitingBackend('delivered')).toBe(false);
  });
});

describe('requiresUserAction', () => {
  it('returns true for auth_required', () => {
    expect(requiresUserAction('auth_required')).toBe(true);
  });

  it('returns true for org_profile', () => {
    expect(requiresUserAction('org_profile')).toBe(true);
  });

  it('returns true for compliance_verified', () => {
    expect(requiresUserAction('compliance_verified')).toBe(true);
  });

  it('returns false for backend-waiting steps', () => {
    expect(requiresUserAction('account_provisioning')).toBe(false);
    expect(requiresUserAction('compliance_check')).toBe(false);
    expect(requiresUserAction('deployment_requested')).toBe(false);
    expect(requiresUserAction('delivered')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #8: Guard helpers
// ---------------------------------------------------------------------------

describe('canAccessComplianceWorkspace', () => {
  it('allows access from compliance_check', () => {
    expect(canAccessComplianceWorkspace('compliance_check')).toBe(true);
  });

  it('allows access from compliance_verified', () => {
    expect(canAccessComplianceWorkspace('compliance_verified')).toBe(true);
  });

  it('allows access from deployment_requested', () => {
    expect(canAccessComplianceWorkspace('deployment_requested')).toBe(true);
  });

  it('allows access from delivered', () => {
    expect(canAccessComplianceWorkspace('delivered')).toBe(true);
  });

  it('blocks access for early pipeline steps', () => {
    expect(canAccessComplianceWorkspace('auth_required')).toBe(false);
    expect(canAccessComplianceWorkspace('account_provisioning')).toBe(false);
    expect(canAccessComplianceWorkspace('org_profile')).toBe(false);
  });
});

describe('canRequestDeployment', () => {
  it('allows deployment from compliance_verified', () => {
    expect(canRequestDeployment('compliance_verified')).toBe(true);
  });

  it('allows deployment from deployment_requested (idempotent re-request)', () => {
    expect(canRequestDeployment('deployment_requested')).toBe(true);
  });

  it('allows deployment from delivered', () => {
    expect(canRequestDeployment('delivered')).toBe(true);
  });

  it('blocks deployment before compliance is verified', () => {
    expect(canRequestDeployment('auth_required')).toBe(false);
    expect(canRequestDeployment('account_provisioning')).toBe(false);
    expect(canRequestDeployment('org_profile')).toBe(false);
    expect(canRequestDeployment('compliance_check')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #9: getStepRedirectTarget
// ---------------------------------------------------------------------------

describe('getStepRedirectTarget', () => {
  it('redirects auth_required to home with showAuth param', () => {
    expect(getStepRedirectTarget('auth_required')).toBe('/?showAuth=true');
  });

  it('redirects account_provisioning to guided launch', () => {
    expect(getStepRedirectTarget('account_provisioning')).toBe('/launch/guided');
  });

  it('redirects org_profile to guided launch', () => {
    expect(getStepRedirectTarget('org_profile')).toBe('/launch/guided');
  });

  it('redirects compliance_check to compliance setup workspace', () => {
    expect(getStepRedirectTarget('compliance_check')).toBe('/compliance/setup');
  });

  it('redirects compliance_verified to compliance setup workspace', () => {
    expect(getStepRedirectTarget('compliance_verified')).toBe('/compliance/setup');
  });

  it('redirects deployment_requested to guided launch', () => {
    expect(getStepRedirectTarget('deployment_requested')).toBe('/launch/guided');
  });

  it('redirects delivered to dashboard', () => {
    expect(getStepRedirectTarget('delivered')).toBe('/dashboard');
  });

  it('all redirect targets are canonical routes (start with /)', () => {
    for (const step of DELIVERY_STEP_ORDER) {
      const target = getStepRedirectTarget(step);
      expect(target.startsWith('/')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #11: Determinism regression guard
// ---------------------------------------------------------------------------

describe('Determinism — same inputs always produce the same output', () => {
  it('computeDeliveryStep is deterministic across multiple calls', () => {
    const inputs: DeliveryStepInputs = {
      isAuthenticated: true,
      isAccountProvisioned: true,
      hasOrgProfile: false,
      complianceSubmitted: false,
      complianceApproved: false,
      deploymentRequested: false,
      deploymentConfirmed: false,
    };
    const results = Array.from({ length: 5 }, () => computeDeliveryStep(inputs));
    expect(new Set(results).size).toBe(1);
  });

  it('validateStepTransition is deterministic across multiple calls', () => {
    const results = Array.from({ length: 5 }, () =>
      validateStepTransition('org_profile', 'compliance_check'),
    );
    const validValues = results.map((r) => r.valid);
    expect(new Set(validValues).size).toBe(1);
  });

  it('computeDeliveryProgress is deterministic', () => {
    const results = Array.from({ length: 5 }, () => computeDeliveryProgress('compliance_check'));
    expect(new Set(results).size).toBe(1);
  });
});
