/**
 * Unit Tests — BackendDeploymentContractClient
 *
 * Tests cover:
 * - All 4 endpoint methods (initiate, status, validate, audit)
 * - DeploymentErrorCode mapping to user-friendly messages
 * - Status polling with exponential backoff
 * - Idempotency key generation
 * - Terminal state detection
 * - Network error handling (graceful fallback)
 * - Idempotency replay detection
 *
 * Mock strategy: global `fetch` is replaced per test with vi.stubGlobal.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  BackendDeploymentContractClient,
  DEPLOYMENT_ERROR_MESSAGES,
  DEFAULT_POLLING_CONFIG,
  generateIdempotencyKey,
  getUserGuidance,
  computePollingDelay,
  isTerminalState,
  getBackendDeploymentContractClient,
} from '../backendDeploymentContract'
import type {
  DeploymentErrorCode,
  InitiateDeploymentResponse,
  DeploymentStatusResponse,
  ValidateDeploymentResponse,
  AuditTrailResponse,
  PollingConfig,
} from '../backendDeploymentContract'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchOk(body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
}

function makeFetchError(status: number, body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  })
}

function makeFetchNetworkError(): ReturnType<typeof vi.fn> {
  return vi.fn().mockRejectedValue(new Error('Network failure'))
}

const BASE_URL = 'http://localhost:5000'
const BEARER = 'test-bearer-token'
const DEPLOYMENT_ID = 'dep-uuid-1234'

// ---------------------------------------------------------------------------
// Error code mapping
// ---------------------------------------------------------------------------

describe('DEPLOYMENT_ERROR_MESSAGES', () => {
  it('has entries for all DeploymentErrorCode values', () => {
    const codes: DeploymentErrorCode[] = [
      'DeriveAddressMismatch',
      'SessionExpired',
      'IdempotencyConflict',
      'ValidationFailed',
      'InsufficientBalance',
      'NetworkUnavailable',
      'ContractDeploymentFailed',
      'AuditTrailUnavailable',
      'UnknownError',
    ]
    for (const code of codes) {
      expect(DEPLOYMENT_ERROR_MESSAGES[code]).toBeTruthy()
      expect(typeof DEPLOYMENT_ERROR_MESSAGES[code]).toBe('string')
    }
  })

  it('each message is non-empty and user-readable (no raw code in message)', () => {
    for (const [code, message] of Object.entries(DEPLOYMENT_ERROR_MESSAGES)) {
      expect(message.length).toBeGreaterThan(20)
      // Messages should not contain raw error codes (e.g. 'DeriveAddressMismatch')
      expect(message).not.toContain(code)
    }
  })
})

describe('getUserGuidance', () => {
  it('returns the correct message for known error codes', () => {
    expect(getUserGuidance('SessionExpired')).toBe(DEPLOYMENT_ERROR_MESSAGES.SessionExpired)
    expect(getUserGuidance('ValidationFailed')).toBe(DEPLOYMENT_ERROR_MESSAGES.ValidationFailed)
  })

  it('falls back to UnknownError for unrecognised codes', () => {
    expect(getUserGuidance('NotARealCode')).toBe(DEPLOYMENT_ERROR_MESSAGES.UnknownError)
  })
})

// ---------------------------------------------------------------------------
// Idempotency key generation
// ---------------------------------------------------------------------------

describe('generateIdempotencyKey', () => {
  it('returns a non-empty string', () => {
    const key = generateIdempotencyKey()
    expect(typeof key).toBe('string')
    expect(key.length).toBeGreaterThan(0)
  })

  it('returns a UUID v4 format string', () => {
    const key = generateIdempotencyKey()
    // RFC 4122 v4 UUID pattern
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('returns a different key on each call', () => {
    const keys = new Set(Array.from({ length: 10 }, () => generateIdempotencyKey()))
    expect(keys.size).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Polling delay computation
// ---------------------------------------------------------------------------

describe('computePollingDelay', () => {
  it('returns initialDelayMs for attempt 0', () => {
    expect(computePollingDelay(0, DEFAULT_POLLING_CONFIG)).toBe(2000)
  })

  it('doubles delay with backoffFactor=2', () => {
    expect(computePollingDelay(1, DEFAULT_POLLING_CONFIG)).toBe(4000)
    expect(computePollingDelay(2, DEFAULT_POLLING_CONFIG)).toBe(8000)
  })

  it('caps delay at maxDelayMs', () => {
    expect(computePollingDelay(10, DEFAULT_POLLING_CONFIG)).toBe(30000)
  })

  it('respects custom config', () => {
    const config: PollingConfig = {
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      maxAttempts: 5,
      backoffFactor: 3,
    }
    expect(computePollingDelay(0, config)).toBe(1000)
    expect(computePollingDelay(1, config)).toBe(3000)
    expect(computePollingDelay(2, config)).toBe(5000) // capped
  })
})

// ---------------------------------------------------------------------------
// Terminal state detection
// ---------------------------------------------------------------------------

describe('isTerminalState', () => {
  it('returns true for Completed', () => {
    expect(isTerminalState('Completed')).toBe(true)
  })

  it('returns true for Failed', () => {
    expect(isTerminalState('Failed')).toBe(true)
  })

  it('returns false for non-terminal states', () => {
    expect(isTerminalState('Pending')).toBe(false)
    expect(isTerminalState('Validated')).toBe(false)
    expect(isTerminalState('Submitted')).toBe(false)
    expect(isTerminalState('Confirmed')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// BackendDeploymentContractClient — initiateDeployment
// ---------------------------------------------------------------------------

describe('BackendDeploymentContractClient.initiateDeployment', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns ok:true with data on 200 response', async () => {
    const mockBody: InitiateDeploymentResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Pending',
      isIdempotentReplay: false,
      initiatedAt: '2026-03-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', makeFetchOk(mockBody))

    const result = await client.initiateDeployment({
      idempotencyKey: generateIdempotencyKey(),
      tokenName: 'Test Token',
      tokenSymbol: 'TST',
      totalSupply: '1000000',
      decimals: 6,
      standard: 'ASA',
      network: 'algorand-mainnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.deploymentId).toBe(DEPLOYMENT_ID)
      expect(result.data.state).toBe('Pending')
      expect(result.data.isIdempotentReplay).toBe(false)
    }
  })

  it('detects idempotency replay (isIdempotentReplay: true)', async () => {
    const mockBody: InitiateDeploymentResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Completed',
      isIdempotentReplay: true,
      assetId: '12345678',
      initiatedAt: '2026-03-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', makeFetchOk(mockBody))

    const result = await client.initiateDeployment({
      idempotencyKey: 'same-key-twice',
      tokenName: 'Test Token',
      tokenSymbol: 'TST',
      totalSupply: '1000000',
      decimals: 6,
      standard: 'ASA',
      network: 'algorand-mainnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.isIdempotentReplay).toBe(true)
      expect(result.data.assetId).toBe('12345678')
    }
  })

  it('returns ok:false with typed error on 4xx response', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchError(400, {
        errorCode: 'ValidationFailed',
        userGuidance: 'Token name is required.',
      }),
    )

    const result = await client.initiateDeployment({
      idempotencyKey: generateIdempotencyKey(),
      tokenName: '',
      tokenSymbol: '',
      totalSupply: '0',
      decimals: 0,
      standard: 'ASA',
      network: 'algorand-mainnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('ValidationFailed')
      expect(result.error.userGuidance).toBeTruthy()
    }
  })

  it('returns NetworkUnavailable error when fetch throws', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkError())

    const result = await client.initiateDeployment({
      idempotencyKey: generateIdempotencyKey(),
      tokenName: 'Test',
      tokenSymbol: 'TST',
      totalSupply: '1000',
      decimals: 0,
      standard: 'ASA',
      network: 'algorand-testnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('NetworkUnavailable')
    }
  })

  it('sends Authorization header with bearer token', async () => {
    const fetchMock = makeFetchOk({
      deploymentId: DEPLOYMENT_ID,
      state: 'Pending',
      isIdempotentReplay: false,
      initiatedAt: '2026-03-01T00:00:00Z',
    })
    vi.stubGlobal('fetch', fetchMock)

    await client.initiateDeployment({
      idempotencyKey: generateIdempotencyKey(),
      tokenName: 'Test',
      tokenSymbol: 'TST',
      totalSupply: '1000',
      decimals: 0,
      standard: 'ASA',
      network: 'algorand-mainnet',
      bearerToken: 'my-secret-token',
    })

    const callArgs = fetchMock.mock.calls[0]
    const headers = callArgs[1]?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer my-secret-token')
  })
})

// ---------------------------------------------------------------------------
// BackendDeploymentContractClient — getDeploymentStatus
// ---------------------------------------------------------------------------

describe('BackendDeploymentContractClient.getDeploymentStatus', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns status response on 200', async () => {
    const mockBody: DeploymentStatusResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Validated',
      previousState: 'Pending',
      updatedAt: '2026-03-01T00:01:00Z',
    }
    vi.stubGlobal('fetch', makeFetchOk(mockBody))

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.state).toBe('Validated')
      expect(result.data.previousState).toBe('Pending')
    }
  })

  it('returns error on network failure', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkError())

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('NetworkUnavailable')
    }
  })

  it('returns typed error with Failed state', async () => {
    const mockBody: DeploymentStatusResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Failed',
      updatedAt: '2026-03-01T00:02:00Z',
      error: {
        errorCode: 'ContractDeploymentFailed',
        userGuidance: 'The deployment could not be completed.',
      },
    }
    vi.stubGlobal('fetch', makeFetchOk(mockBody))

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.state).toBe('Failed')
      expect(result.data.error?.errorCode).toBe('ContractDeploymentFailed')
    }
  })

  it('returns ok:false with normalised error on 4xx response', async () => {
    // Covers line 436: normaliseError(body) when body is an error object
    vi.stubGlobal('fetch', makeFetchError(404, {
      errorCode: 'SessionExpired',
      userGuidance: 'Your session has expired. Please log in again.',
    }))

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('SessionExpired')
      expect(result.error.userGuidance).toContain('session')
    }
  })

  it('returns ok:false with fallback error code when 4xx body is null', async () => {
    // Covers line 367: normaliseError when body is null/non-object — fallback code path
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('No body')),
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve(null),  // null body → fallback path
    }))

    const result = await client.getDeploymentStatus(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      // Falls back to UnknownError when body is null
      expect(result.error.errorCode).toBe('UnknownError')
      expect(result.error.userGuidance).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// BackendDeploymentContractClient — validateDeployment
// ---------------------------------------------------------------------------

describe('BackendDeploymentContractClient.validateDeployment', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns isValid:true and isDeterministicAddress:true for valid request', async () => {
    const mockBody: ValidateDeploymentResponse = {
      isValid: true,
      isDeterministicAddress: true,
      derivedAddress: 'BIATEC7ARC76DERIVEDADDRESSXXX',
    }
    vi.stubGlobal('fetch', makeFetchOk(mockBody))

    const result = await client.validateDeployment({
      tokenName: 'Test Token',
      tokenSymbol: 'TST',
      totalSupply: '1000000',
      decimals: 6,
      standard: 'ASA',
      network: 'algorand-mainnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.isValid).toBe(true)
      expect(result.data.isDeterministicAddress).toBe(true)
      expect(result.data.derivedAddress).toBeTruthy()
    }
  })

  it('returns validation errors for invalid request', async () => {
    const mockBody: ValidateDeploymentResponse = {
      isValid: false,
      isDeterministicAddress: false,
      errors: [
        {
          errorCode: 'ValidationFailed',
          userGuidance: 'Token name is required.',
        },
      ],
    }
    vi.stubGlobal('fetch', makeFetchOk(mockBody))

    const result = await client.validateDeployment({
      tokenName: '',
      tokenSymbol: '',
      totalSupply: '0',
      decimals: 0,
      standard: 'ASA',
      network: 'algorand-mainnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.isValid).toBe(false)
      expect(result.data.errors?.length).toBeGreaterThan(0)
    }
  })

  it('returns NetworkUnavailable on fetch error', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkError())

    const result = await client.validateDeployment({
      tokenName: 'Test',
      tokenSymbol: 'TST',
      totalSupply: '1000',
      decimals: 0,
      standard: 'ASA',
      network: 'algorand-testnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('NetworkUnavailable')
    }
  })

  it('returns ok:false with ValidationFailed on 4xx response', async () => {
    // Covers line 475: normaliseError(body, 'ValidationFailed') in !response.ok branch
    vi.stubGlobal('fetch', makeFetchError(422, {
      errorCode: 'ValidationFailed',
      userGuidance: 'Token parameters did not pass server-side validation.',
    }))

    const result = await client.validateDeployment({
      tokenName: 'Bad',
      tokenSymbol: 'BAD',
      totalSupply: '-1',
      decimals: 0,
      standard: 'ASA',
      network: 'algorand-mainnet',
      bearerToken: BEARER,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('ValidationFailed')
      expect(result.error.userGuidance).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// BackendDeploymentContractClient — getAuditTrail
// ---------------------------------------------------------------------------

describe('BackendDeploymentContractClient.getAuditTrail', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns full audit trail on 200', async () => {
    const mockBody: AuditTrailResponse = {
      deploymentId: DEPLOYMENT_ID,
      totalEvents: 7,
      events: [
        {
          eventId: 'e1',
          eventKind: 'session_verified',
          occurredAt: '2026-03-01T00:00:00Z',
          actor: 'BIATEC_ADDRESS',
          description: 'Session verified via ARC76',
        },
        {
          eventId: 'e2',
          eventKind: 'parameters_validated',
          occurredAt: '2026-03-01T00:00:01Z',
          actor: 'system',
          description: 'Parameters validated',
        },
        {
          eventId: 'e3',
          eventKind: 'deployment_initiated',
          occurredAt: '2026-03-01T00:00:02Z',
          actor: 'BIATEC_ADDRESS',
          description: 'Deployment initiated',
        },
        {
          eventId: 'e4',
          eventKind: 'transaction_submitted',
          occurredAt: '2026-03-01T00:00:03Z',
          actor: 'system',
          description: 'Transaction submitted',
        },
        {
          eventId: 'e5',
          eventKind: 'transaction_confirmed',
          occurredAt: '2026-03-01T00:00:04Z',
          actor: 'system',
          description: 'Transaction confirmed',
        },
        {
          eventId: 'e6',
          eventKind: 'deployment_completed',
          occurredAt: '2026-03-01T00:00:05Z',
          actor: 'system',
          description: 'Deployment completed',
        },
      ],
    }
    vi.stubGlobal('fetch', makeFetchOk(mockBody))

    const result = await client.getAuditTrail(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.deploymentId).toBe(DEPLOYMENT_ID)
      expect(result.data.events.length).toBe(6)
      expect(result.data.totalEvents).toBe(7)
    }
  })

  it('returns AuditTrailUnavailable on 503', async () => {
    vi.stubGlobal('fetch', makeFetchError(503, { errorCode: 'AuditTrailUnavailable' }))

    const result = await client.getAuditTrail(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('AuditTrailUnavailable')
      expect(result.error.userGuidance).toBe(DEPLOYMENT_ERROR_MESSAGES.AuditTrailUnavailable)
    }
  })

  it('returns AuditTrailUnavailable error on network failure', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkError())

    const result = await client.getAuditTrail(DEPLOYMENT_ID, BEARER)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('AuditTrailUnavailable')
    }
  })
})

// ---------------------------------------------------------------------------
// BackendDeploymentContractClient — pollUntilTerminal
// ---------------------------------------------------------------------------

describe('BackendDeploymentContractClient.pollUntilTerminal', () => {
  let client: BackendDeploymentContractClient

  beforeEach(() => {
    client = new BackendDeploymentContractClient(BASE_URL)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('resolves immediately when first poll returns a terminal state', async () => {
    const completedBody: DeploymentStatusResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Completed',
      updatedAt: '2026-03-01T00:05:00Z',
      assetId: '99887766',
    }
    vi.stubGlobal('fetch', makeFetchOk(completedBody))

    const updates: DeploymentStatusResponse[] = []
    const resultPromise = client.pollUntilTerminal(DEPLOYMENT_ID, BEARER, (s) => updates.push(s))
    const result = await resultPromise

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.state).toBe('Completed')
      expect(result.data.assetId).toBe('99887766')
    }
    expect(updates.length).toBe(1)
  })

  it('transitions through states and resolves at Completed', async () => {
    const states: DeploymentStatusResponse[] = [
      { deploymentId: DEPLOYMENT_ID, state: 'Pending', updatedAt: 't0' },
      { deploymentId: DEPLOYMENT_ID, state: 'Validated', updatedAt: 't1' },
      { deploymentId: DEPLOYMENT_ID, state: 'Submitted', updatedAt: 't2' },
      { deploymentId: DEPLOYMENT_ID, state: 'Completed', updatedAt: 't3', assetId: '12345' },
    ]
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      const body = states[Math.min(callCount++, states.length - 1)]
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) })
    }))

    const updates: string[] = []
    const fastConfig: PollingConfig = {
      initialDelayMs: 1,
      maxDelayMs: 1,
      maxAttempts: 10,
      backoffFactor: 1,
    }
    const resultPromise = client.pollUntilTerminal(
      DEPLOYMENT_ID,
      BEARER,
      (s) => updates.push(s.state),
      fastConfig,
    )
    // Advance timers to allow polling
    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.state).toBe('Completed')
    }
    // Should have seen all transitions including terminal
    expect(updates).toContain('Pending')
    expect(updates).toContain('Completed')
  })

  it('returns error immediately when fetch fails', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkError())

    const resultPromise = client.pollUntilTerminal(DEPLOYMENT_ID, BEARER)
    const result = await resultPromise

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.errorCode).toBe('NetworkUnavailable')
    }
  })

  it('returns final status after exhausting maxAttempts without reaching terminal state', async () => {
    // Covers line 566: the exhausted-attempts path that calls getDeploymentStatus one final time
    const pendingBody: DeploymentStatusResponse = {
      deploymentId: DEPLOYMENT_ID,
      state: 'Pending',
      updatedAt: '2026-03-01T00:00:00Z',
    }
    // Never reaches terminal — always returns Pending
    vi.stubGlobal('fetch', makeFetchOk(pendingBody))

    const singleAttemptConfig: PollingConfig = {
      initialDelayMs: 1,
      maxDelayMs: 1,
      maxAttempts: 2, // 2 attempts without terminal → exhausts, falls to final check
      backoffFactor: 1,
    }
    const resultPromise = client.pollUntilTerminal(DEPLOYMENT_ID, BEARER, undefined, singleAttemptConfig)
    await vi.runAllTimersAsync()
    const result = await resultPromise

    // After exhausting attempts, final getDeploymentStatus is called and its result returned
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.state).toBe('Pending')
    }
  })
})

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

describe('getBackendDeploymentContractClient', () => {
  it('returns a BackendDeploymentContractClient instance', () => {
    const client = getBackendDeploymentContractClient()
    expect(client).toBeInstanceOf(BackendDeploymentContractClient)
  })

  it('returns the same instance on repeated calls', () => {
    const a = getBackendDeploymentContractClient()
    const b = getBackendDeploymentContractClient()
    expect(a).toBe(b)
  })
})
