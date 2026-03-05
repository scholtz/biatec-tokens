/**
 * Unit Tests: Journey State Contract
 *
 * Validates all helpers in src/utils/journeyStateContract.ts.
 *
 * Coverage:
 *   - Session validity: isSessionValid handles all edge cases
 *   - Precondition evaluation: checkJourneyPreconditions per stage
 *   - Stage derivation: deriveJourneyStage maps session → stage
 *   - Transition validation: isValidJourneyTransition allows correct moves
 *   - Route mapping: getStageRoute returns canonical routes
 *   - Error message quality: isWellFormedErrorMessage enforces what/why/how
 *   - Null-object: createEmptySession returns safe defaults
 *
 * All tests are synchronous and deterministic. Zero I/O, zero side effects.
 *
 * Issue: MVP frontend sign-off — deterministic launch journey, accessibility
 *        parity, and Playwright reliability hardening
 */

import { describe, it, expect } from 'vitest';
import {
  isSessionValid,
  createEmptySession,
  checkJourneyPreconditions,
  deriveJourneyStage,
  isValidJourneyTransition,
  getStageRoute,
  getJourneyErrorMessage,
  isWellFormedErrorMessage,
  type JourneySession,
} from '../journeyStateContract';

// ===========================================================================
// Session validity
// ===========================================================================

describe('isSessionValid', () => {
  it('returns true for a fully populated valid session', () => {
    const session: JourneySession = {
      address: 'VALIDADDRESS7777777777777777777777777777777777777777777777',
      email: 'user@biatec.io',
      isConnected: true,
    };
    expect(isSessionValid(session)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isSessionValid(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isSessionValid(undefined)).toBe(false);
  });

  it('returns false when isConnected is false', () => {
    const session: JourneySession = {
      address: 'SOMEADDRESS7777777777777777777777777777777777777777777777777',
      email: 'user@biatec.io',
      isConnected: false,
    };
    expect(isSessionValid(session)).toBe(false);
  });

  it('returns false when address is empty string', () => {
    const session: JourneySession = {
      address: '',
      email: 'user@biatec.io',
      isConnected: true,
    };
    expect(isSessionValid(session)).toBe(false);
  });

  it('returns false when address is whitespace only', () => {
    const session: JourneySession = {
      address: '   ',
      email: 'user@biatec.io',
      isConnected: true,
    };
    expect(isSessionValid(session)).toBe(false);
  });

  it('returns false when email is empty string', () => {
    const session: JourneySession = {
      address: 'VALIDADDRESS7777777777777777777777777777777777777777777777',
      email: '',
      isConnected: true,
    };
    expect(isSessionValid(session)).toBe(false);
  });

  it('returns false when email is whitespace only', () => {
    const session: JourneySession = {
      address: 'VALIDADDRESS7777777777777777777777777777777777777777777777',
      email: '   ',
      isConnected: true,
    };
    expect(isSessionValid(session)).toBe(false);
  });
});

// ===========================================================================
// Null-object: createEmptySession
// ===========================================================================

describe('createEmptySession', () => {
  it('returns a session with empty address and email', () => {
    const session = createEmptySession();
    expect(session.address).toBe('');
    expect(session.email).toBe('');
  });

  it('returns a session with isConnected=false', () => {
    const session = createEmptySession();
    expect(session.isConnected).toBe(false);
  });

  it('is itself invalid (isSessionValid returns false)', () => {
    expect(isSessionValid(createEmptySession())).toBe(false);
  });
});

// ===========================================================================
// Precondition evaluation: checkJourneyPreconditions
// ===========================================================================

describe('checkJourneyPreconditions', () => {
  const validSession: JourneySession = {
    address: 'VALIDADDRESS7777777777777777777777777777777777777777777777',
    email: 'user@biatec.io',
    isConnected: true,
  };

  it('unauthenticated stage: always satisfied regardless of session', () => {
    expect(checkJourneyPreconditions('unauthenticated', null).satisfied).toBe(true);
    expect(checkJourneyPreconditions('unauthenticated', undefined).satisfied).toBe(true);
    expect(checkJourneyPreconditions('unauthenticated', validSession).satisfied).toBe(true);
  });

  it('unauthenticated stage: no failure reason or recovery action', () => {
    const result = checkJourneyPreconditions('unauthenticated', null);
    expect(result.failureReason).toBeNull();
    expect(result.recoveryAction).toBeNull();
  });

  it('authenticated stage: satisfied with valid session', () => {
    expect(checkJourneyPreconditions('authenticated', validSession).satisfied).toBe(true);
  });

  it('authenticated stage: not satisfied without session', () => {
    expect(checkJourneyPreconditions('authenticated', null).satisfied).toBe(false);
  });

  it('authenticated stage: not satisfied with isConnected=false', () => {
    const expired = { ...validSession, isConnected: false };
    expect(checkJourneyPreconditions('authenticated', expired).satisfied).toBe(false);
  });

  it('setup stage: satisfied with valid session', () => {
    expect(checkJourneyPreconditions('setup', validSession).satisfied).toBe(true);
  });

  it('setup stage: not satisfied without session', () => {
    const result = checkJourneyPreconditions('setup', null);
    expect(result.satisfied).toBe(false);
    expect(result.failureReason).not.toBeNull();
    expect(result.recoveryAction).not.toBeNull();
  });

  it('compliance stage: satisfied with valid session', () => {
    expect(checkJourneyPreconditions('compliance', validSession).satisfied).toBe(true);
  });

  it('compliance stage: not satisfied without session', () => {
    expect(checkJourneyPreconditions('compliance', null).satisfied).toBe(false);
  });

  it('launch stage: satisfied with valid session', () => {
    expect(checkJourneyPreconditions('launch', validSession).satisfied).toBe(true);
  });

  it('launch stage: not satisfied without session', () => {
    expect(checkJourneyPreconditions('launch', null).satisfied).toBe(false);
  });

  it('complete stage: satisfied with valid session', () => {
    expect(checkJourneyPreconditions('complete', validSession).satisfied).toBe(true);
  });

  it('failure result contains actionable guidance text', () => {
    const result = checkJourneyPreconditions('launch', null);
    expect(result.failureReason).toBeTruthy();
    expect(result.recoveryAction).toBeTruthy();
    // Should mention signing in
    expect(result.recoveryAction?.toLowerCase()).toContain('sign in');
  });
});

// ===========================================================================
// Stage derivation: deriveJourneyStage
// ===========================================================================

describe('deriveJourneyStage', () => {
  it('returns "unauthenticated" for null session', () => {
    expect(deriveJourneyStage(null)).toBe('unauthenticated');
  });

  it('returns "unauthenticated" for undefined session', () => {
    expect(deriveJourneyStage(undefined)).toBe('unauthenticated');
  });

  it('returns "unauthenticated" for disconnected session', () => {
    const session: JourneySession = {
      address: 'ADDR777777777777777777777777777777777777777777777777777777',
      email: 'user@biatec.io',
      isConnected: false,
    };
    expect(deriveJourneyStage(session)).toBe('unauthenticated');
  });

  it('returns "authenticated" for valid connected session', () => {
    const session: JourneySession = {
      address: 'VALIDADDRESS7777777777777777777777777777777777777777777777',
      email: 'user@biatec.io',
      isConnected: true,
    };
    expect(deriveJourneyStage(session)).toBe('authenticated');
  });
});

// ===========================================================================
// Route mapping: getStageRoute
// ===========================================================================

describe('getStageRoute', () => {
  it('launch stage maps to /launch/guided', () => {
    expect(getStageRoute('launch')).toBe('/launch/guided');
  });

  it('setup stage maps to /compliance/setup', () => {
    expect(getStageRoute('setup')).toBe('/compliance/setup');
  });

  it('compliance stage maps to /compliance/setup', () => {
    expect(getStageRoute('compliance')).toBe('/compliance/setup');
  });

  it('authenticated stage maps to root /', () => {
    expect(getStageRoute('authenticated')).toBe('/');
  });

  it('complete stage maps to /dashboard', () => {
    expect(getStageRoute('complete')).toBe('/dashboard');
  });
});

// ===========================================================================
// Transition validation: isValidJourneyTransition
// ===========================================================================

describe('isValidJourneyTransition', () => {
  it('unauthenticated → authenticated is valid', () => {
    expect(isValidJourneyTransition({ from: 'unauthenticated', to: 'authenticated' })).toBe(true);
  });

  it('authenticated → launch is valid (direct jump)', () => {
    expect(isValidJourneyTransition({ from: 'authenticated', to: 'launch' })).toBe(true);
  });

  it('authenticated → setup is valid', () => {
    expect(isValidJourneyTransition({ from: 'authenticated', to: 'setup' })).toBe(true);
  });

  it('setup → compliance is valid', () => {
    expect(isValidJourneyTransition({ from: 'setup', to: 'compliance' })).toBe(true);
  });

  it('compliance → launch is valid', () => {
    expect(isValidJourneyTransition({ from: 'compliance', to: 'launch' })).toBe(true);
  });

  it('launch → complete is valid', () => {
    expect(isValidJourneyTransition({ from: 'launch', to: 'complete' })).toBe(true);
  });

  it('same stage → same stage is valid (no-op)', () => {
    expect(isValidJourneyTransition({ from: 'launch', to: 'launch' })).toBe(true);
    expect(isValidJourneyTransition({ from: 'compliance', to: 'compliance' })).toBe(true);
  });

  it('backward transition (launch → setup) is always valid', () => {
    expect(isValidJourneyTransition({ from: 'launch', to: 'setup' })).toBe(true);
  });

  it('backward transition (complete → authenticated) is always valid', () => {
    expect(isValidJourneyTransition({ from: 'complete', to: 'authenticated' })).toBe(true);
  });

  it('backward transition (compliance → unauthenticated) is always valid', () => {
    expect(isValidJourneyTransition({ from: 'compliance', to: 'unauthenticated' })).toBe(true);
  });

  it('unauthenticated → launch without auth step is invalid', () => {
    // A direct jump from unauthenticated to launch bypasses the auth requirement
    expect(isValidJourneyTransition({ from: 'unauthenticated', to: 'launch' })).toBe(false);
  });

  it('unauthenticated → complete is invalid', () => {
    expect(isValidJourneyTransition({ from: 'unauthenticated', to: 'complete' })).toBe(false);
  });

  it('unauthenticated → setup is invalid', () => {
    expect(isValidJourneyTransition({ from: 'unauthenticated', to: 'setup' })).toBe(false);
  });
});

// ===========================================================================
// Error message quality
// ===========================================================================

describe('getJourneyErrorMessage', () => {
  it('returns empty string for a satisfied precondition', () => {
    expect(getJourneyErrorMessage({ satisfied: true, failureReason: null, recoveryAction: null })).toBe('');
  });

  it('returns a non-empty message for a failed precondition', () => {
    const result = checkJourneyPreconditions('launch', null);
    const message = getJourneyErrorMessage(result);
    expect(message.length).toBeGreaterThan(0);
  });

  it('message contains the failure reason and recovery action', () => {
    const result = checkJourneyPreconditions('launch', null);
    const message = getJourneyErrorMessage(result);
    expect(message).toContain(result.failureReason!);
    expect(message).toContain(result.recoveryAction!);
  });
});

describe('isWellFormedErrorMessage', () => {
  it('returns false for an empty string', () => {
    expect(isWellFormedErrorMessage('')).toBe(false);
  });

  it('returns false for a very short message', () => {
    expect(isWellFormedErrorMessage('Error')).toBe(false);
  });

  it('returns false for a long message without sentence terminator', () => {
    expect(isWellFormedErrorMessage('Something went wrong please try again later')).toBe(false);
  });

  it('returns true for a well-formed message', () => {
    expect(isWellFormedErrorMessage('An active session is required. Please sign in.')).toBe(true);
  });

  it('returns true for a message ending with question mark', () => {
    expect(isWellFormedErrorMessage('Session expired — would you like to sign in again?')).toBe(true);
  });

  it('all journey precondition failure messages are well-formed', () => {
    const stages = ['authenticated', 'setup', 'compliance', 'launch', 'complete'] as const;
    for (const stage of stages) {
      const result = checkJourneyPreconditions(stage, null);
      const message = getJourneyErrorMessage(result);
      expect(isWellFormedErrorMessage(message)).toBe(true);
    }
  });
});
