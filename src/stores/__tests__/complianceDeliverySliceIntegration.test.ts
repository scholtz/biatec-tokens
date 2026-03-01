/**
 * Integration Tests: Compliance Delivery Slice × Auth State
 *
 * Validates that the compliance delivery pipeline integrates correctly with
 * the auth session contract and route guard patterns used throughout the app.
 *
 * Covers:
 *   - ARC76 session contract → DeliveryStepInputs conversion
 *   - Router guard decision making based on delivery step
 *   - Telemetry event emission at critical pipeline boundaries
 *   - Idempotency: repeated calls with same inputs produce the same state
 *   - Ordering guarantees: states cannot regress
 *
 * Issue: MVP next-step — deterministic auth/compliance delivery slice
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeDeliveryStep,
  deriveDeliveryState,
  validateStepTransition,
  buildDeliveryStepEvent,
  getStepRedirectTarget,
  canAccessComplianceWorkspace,
  canRequestDeployment,
  isAwaitingBackend,
  requiresUserAction,
  computeDeliveryProgress,
  DELIVERY_STEP_ORDER,
  type DeliveryStepInputs,
  type ComplianceDeliveryStep,
} from '../../utils/complianceDeliverySlice';
import { validateARC76Session } from '../../utils/arc76SessionContract';

// ---------------------------------------------------------------------------
// Session-to-inputs bridge (mirrors what a store action would do)
// ---------------------------------------------------------------------------

/**
 * Convert a parsed session + compliance context into DeliveryStepInputs.
 * This is the integration point between the auth store and the delivery slice.
 */
function sessionToDeliveryInputs(
  sessionRaw: unknown,
  complianceCtx: {
    isAccountProvisioned?: boolean;
    hasOrgProfile?: boolean;
    complianceSubmitted?: boolean;
    complianceApproved?: boolean;
    deploymentRequested?: boolean;
    deploymentConfirmed?: boolean;
  } = {},
): DeliveryStepInputs {
  const validation = validateARC76Session(sessionRaw);
  const isAuthenticated = validation.valid && (sessionRaw as { isConnected?: boolean })?.isConnected === true;
  return {
    isAuthenticated,
    isAccountProvisioned: complianceCtx.isAccountProvisioned ?? false,
    hasOrgProfile: complianceCtx.hasOrgProfile ?? false,
    complianceSubmitted: complianceCtx.complianceSubmitted ?? false,
    complianceApproved: complianceCtx.complianceApproved ?? false,
    deploymentRequested: complianceCtx.deploymentRequested ?? false,
    deploymentConfirmed: complianceCtx.deploymentConfirmed ?? false,
  };
}

// ---------------------------------------------------------------------------
// Valid session fixtures
// ---------------------------------------------------------------------------

const VALID_SESSION = {
  address: 'INTG_TEST_ADDRESS_BIATEC_MVP_SLICE_001',
  email: 'operator@biatec.io',
  isConnected: true,
};

const EXPIRED_SESSION = {
  address: 'INTG_TEST_ADDRESS_BIATEC_MVP_SLICE_002',
  email: 'operator@biatec.io',
  isConnected: false,
};

const INVALID_SESSION = {
  address: '',
  email: '',
  isConnected: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Compliance Delivery Slice × ARC76 Session integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-01T12:00:00.000Z'));
  });

  describe('sessionToDeliveryInputs bridge', () => {
    it('marks isAuthenticated true for a valid, connected session', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION);
      expect(inputs.isAuthenticated).toBe(true);
    });

    it('marks isAuthenticated false for an expired session (isConnected = false)', () => {
      const inputs = sessionToDeliveryInputs(EXPIRED_SESSION);
      expect(inputs.isAuthenticated).toBe(false);
    });

    it('marks isAuthenticated false for an invalid session (empty address/email)', () => {
      const inputs = sessionToDeliveryInputs(INVALID_SESSION);
      expect(inputs.isAuthenticated).toBe(false);
    });

    it('marks isAuthenticated false for null session', () => {
      const inputs = sessionToDeliveryInputs(null);
      expect(inputs.isAuthenticated).toBe(false);
    });
  });

  describe('Full pipeline walk with valid session', () => {
    it('starts at auth_required without a session', () => {
      const inputs = sessionToDeliveryInputs(null);
      expect(computeDeliveryStep(inputs)).toBe('auth_required');
    });

    it('advances to account_provisioning after valid session, no account yet', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION);
      expect(computeDeliveryStep(inputs)).toBe('account_provisioning');
    });

    it('advances to org_profile after account is provisioned', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, { isAccountProvisioned: true });
      expect(computeDeliveryStep(inputs)).toBe('org_profile');
    });

    it('advances to compliance_check after org profile submitted', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
      });
      expect(computeDeliveryStep(inputs)).toBe('compliance_check');
    });

    it('advances to compliance_verified after compliance check passes', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
      });
      expect(computeDeliveryStep(inputs)).toBe('compliance_verified');
    });

    it('advances to deployment_requested after deployment submitted', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
        deploymentRequested: true,
      });
      expect(computeDeliveryStep(inputs)).toBe('deployment_requested');
    });

    it('reaches delivered when all pipeline conditions are satisfied', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
        deploymentRequested: true,
        deploymentConfirmed: true,
      });
      expect(computeDeliveryStep(inputs)).toBe('delivered');
    });
  });

  describe('Router guard integration', () => {
    it('routes unauthenticated user to login', () => {
      const inputs = sessionToDeliveryInputs(null);
      const step = computeDeliveryStep(inputs);
      expect(getStepRedirectTarget(step)).toBe('/?showAuth=true');
    });

    it('routes provisioning step to guided launch', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION);
      const step = computeDeliveryStep(inputs);
      expect(getStepRedirectTarget(step)).toBe('/launch/guided');
    });

    it('blocks compliance workspace access before compliance_check step', () => {
      // User has session and account but no org profile yet
      const inputs = sessionToDeliveryInputs(VALID_SESSION, { isAccountProvisioned: true });
      const step = computeDeliveryStep(inputs);
      expect(canAccessComplianceWorkspace(step)).toBe(false);
    });

    it('allows compliance workspace access at compliance_check step', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
      });
      const step = computeDeliveryStep(inputs);
      expect(canAccessComplianceWorkspace(step)).toBe(true);
    });

    it('blocks deployment before compliance is approved', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: false,
      });
      const step = computeDeliveryStep(inputs);
      expect(canRequestDeployment(step)).toBe(false);
    });

    it('allows deployment after compliance approved', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
      });
      const step = computeDeliveryStep(inputs);
      expect(canRequestDeployment(step)).toBe(true);
    });
  });

  describe('Telemetry event emission at boundaries', () => {
    it('emits compliance_delivery.auth_required event for unauthenticated entry', () => {
      const step = computeDeliveryStep(sessionToDeliveryInputs(null));
      const event = buildDeliveryStepEvent(step, null, { source: 'landing_page' });
      expect(event.eventName).toBe('compliance_delivery.auth_required');
      expect(event.previousStep).toBeNull();
      expect(event.meta?.source).toBe('landing_page');
    });

    it('emits compliance_delivery.compliance_verified event with correct step index', () => {
      const event = buildDeliveryStepEvent('compliance_verified', 'compliance_check');
      expect(event.eventName).toBe('compliance_delivery.compliance_verified');
      expect(event.stepIndex).toBe(4);
    });

    it('emits compliance_delivery.delivered event with progress at 100', () => {
      const step: ComplianceDeliveryStep = 'delivered';
      const event = buildDeliveryStepEvent(step, 'deployment_requested');
      expect(event.eventName).toBe('compliance_delivery.delivered');
      expect(computeDeliveryProgress(step)).toBe(100);
    });

    it('event timestamps are ISO 8601 format', () => {
      const event = buildDeliveryStepEvent('org_profile', 'account_provisioning');
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Idempotency: same inputs produce same delivery state', () => {
    it('deriveDeliveryState is idempotent for the same inputs', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
      });
      const state1 = deriveDeliveryState(inputs);
      const state2 = deriveDeliveryState(inputs);
      expect(state1.step).toBe(state2.step);
      expect(state1.label).toBe(state2.label);
      expect(state1.userGuidance).toBe(state2.userGuidance);
      expect(state1.isTerminal).toBe(state2.isTerminal);
      expect(state1.canAdvance).toBe(state2.canAdvance);
    });

    it('computeDeliveryStep is idempotent across 10 calls', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
      });
      const results = Array.from({ length: 10 }, () => computeDeliveryStep(inputs));
      const unique = new Set(results);
      expect(unique.size).toBe(1);
      expect(unique.has('compliance_verified')).toBe(true);
    });
  });

  describe('Ordering guarantees: no regression in pipeline', () => {
    it('rejects a compliance_check → auth_required regression', () => {
      const result = validateStepTransition('compliance_check', 'auth_required');
      expect(result.valid).toBe(false);
    });

    it('rejects a delivered → org_profile regression', () => {
      const result = validateStepTransition('delivered', 'org_profile');
      expect(result.valid).toBe(false);
    });

    it('validates entire forward chain without rejection', () => {
      for (let i = 0; i < DELIVERY_STEP_ORDER.length - 1; i++) {
        const from = DELIVERY_STEP_ORDER[i];
        const to = DELIVERY_STEP_ORDER[i + 1];
        const result = validateStepTransition(from, to);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('User action vs backend-waiting classification', () => {
    it('compliance_check is correctly identified as awaiting backend', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
      });
      const step = computeDeliveryStep(inputs);
      expect(isAwaitingBackend(step)).toBe(true);
      expect(requiresUserAction(step)).toBe(false);
    });

    it('compliance_verified requires user action (initiate deployment)', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
      });
      const step = computeDeliveryStep(inputs);
      expect(requiresUserAction(step)).toBe(true);
      expect(isAwaitingBackend(step)).toBe(false);
    });

    it('deployment_requested is correctly identified as awaiting backend', () => {
      const inputs = sessionToDeliveryInputs(VALID_SESSION, {
        isAccountProvisioned: true,
        hasOrgProfile: true,
        complianceSubmitted: true,
        complianceApproved: true,
        deploymentRequested: true,
      });
      const step = computeDeliveryStep(inputs);
      expect(isAwaitingBackend(step)).toBe(true);
    });
  });
});
