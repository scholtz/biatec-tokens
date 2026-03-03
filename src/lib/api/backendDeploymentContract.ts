/**
 * Backend Deployment Contract API Client
 *
 * Typed TypeScript client for the `/api/v1/backend-deployment-contract` endpoints
 * delivered in BiatecTokensApi#473.
 *
 * Endpoints:
 *   POST  /api/v1/backend-deployment-contract/initiate  — initiate token deployment
 *   GET   /api/v1/backend-deployment-contract/status/{id} — poll deployment lifecycle state
 *   POST  /api/v1/backend-deployment-contract/validate  — dry-run validation (no on-chain side effects)
 *   GET   /api/v1/backend-deployment-contract/audit/{id} — compliance audit trail
 *
 * Auth: All authenticated endpoints require a Bearer token obtained from the
 * email/password login flow (not a wallet connection).
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 * Issue: #557 — Frontend Integration: Backend Deployment Contract API
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Structured error codes returned by the backend deployment contract API.
 * Maps to user-facing guidance messages via {@link DEPLOYMENT_ERROR_MESSAGES}.
 */
export type DeploymentErrorCode =
  | 'DeriveAddressMismatch'
  | 'SessionExpired'
  | 'IdempotencyConflict'
  | 'ValidationFailed'
  | 'InsufficientBalance'
  | 'NetworkUnavailable'
  | 'ContractDeploymentFailed'
  | 'AuditTrailUnavailable'
  | 'UnknownError'

/**
 * Lifecycle states a deployment can be in.
 * State machine: Pending → Validated → Submitted → Confirmed → Completed
 * Error state can be reached from any state.
 */
export type DeploymentLifecycleState =
  | 'Pending'
  | 'Validated'
  | 'Submitted'
  | 'Confirmed'
  | 'Completed'
  | 'Failed'

/**
 * Structured error response from the deployment contract API.
 */
export interface DeploymentContractError {
  /** Typed error code for programmatic handling */
  errorCode: DeploymentErrorCode
  /** Human-readable guidance surfaced to the UI (no raw stack traces) */
  userGuidance: string
  /** Optional additional context for debugging (not shown to end users) */
  detail?: string
}

/**
 * Request body for initiating a new token deployment.
 */
export interface InitiateDeploymentRequest {
  /** UUID v4 idempotency key — generated per initiation to prevent duplicate deployments */
  idempotencyKey: string
  /** Token name */
  tokenName: string
  /** Token symbol (ticker) */
  tokenSymbol: string
  /** Total supply as string to avoid precision loss */
  totalSupply: string
  /** Number of decimal places */
  decimals: number
  /** Token standard (e.g. 'ASA', 'ARC3', 'ERC20') */
  standard: string
  /** Target network identifier */
  network: string
  /** Deploying user's bearer token (ARC76-derived session) */
  bearerToken: string
  /** Optional: additional token metadata */
  metadata?: Record<string, unknown>
}

/**
 * Response from initiating a deployment.
 */
export interface InitiateDeploymentResponse {
  /** Unique deployment ID used for status polling and audit retrieval */
  deploymentId: string
  /** Current lifecycle state immediately after initiation */
  state: DeploymentLifecycleState
  /** True if this request is a replay of a previous idempotent request */
  isIdempotentReplay: boolean
  /** Asset ID if already deployed (populated for idempotent replays) */
  assetId?: string
  /** ISO 8601 timestamp of initiation */
  initiatedAt: string
}

/**
 * Response from polling deployment status.
 */
export interface DeploymentStatusResponse {
  /** Deployment ID */
  deploymentId: string
  /** Current lifecycle state */
  state: DeploymentLifecycleState
  /** Previous state (for transition validation) */
  previousState?: DeploymentLifecycleState
  /** Asset/contract ID once deployed */
  assetId?: string
  /** ISO 8601 timestamp of last state update */
  updatedAt: string
  /** Error details if state is 'Failed' */
  error?: DeploymentContractError
  /** Estimated completion time (ISO 8601) */
  estimatedCompletionAt?: string
}

/**
 * Request body for dry-run validation.
 */
export interface ValidateDeploymentRequest {
  /** Token name */
  tokenName: string
  /** Token symbol */
  tokenSymbol: string
  /** Total supply */
  totalSupply: string
  /** Decimals */
  decimals: number
  /** Token standard */
  standard: string
  /** Network */
  network: string
  /** Bearer token for ARC76 address derivation check */
  bearerToken: string
}

/**
 * Response from dry-run validation.
 */
export interface ValidateDeploymentResponse {
  /** True if the deployment parameters are valid and can proceed */
  isValid: boolean
  /** True when the session maps to a deterministic ARC76-derived address */
  isDeterministicAddress: boolean
  /** The ARC76-derived address for this session */
  derivedAddress?: string
  /** Validation errors if isValid is false */
  errors?: DeploymentContractError[]
  /** Non-fatal warnings */
  warnings?: string[]
}

/**
 * A single audit event in the deployment compliance trail.
 */
export interface AuditEvent {
  /** Unique event ID */
  eventId: string
  /** Event kind (one of 7 structured kinds per the backend contract) */
  eventKind:
    | 'session_verified'
    | 'parameters_validated'
    | 'deployment_initiated'
    | 'transaction_submitted'
    | 'transaction_confirmed'
    | 'deployment_completed'
    | 'deployment_failed'
  /** ISO 8601 timestamp */
  occurredAt: string
  /** Actor (user address or system) */
  actor: string
  /** Human-readable description */
  description: string
  /** Optional structured metadata */
  metadata?: Record<string, unknown>
}

/**
 * Full compliance audit trail for a deployment.
 */
export interface AuditTrailResponse {
  /** Deployment ID this trail belongs to */
  deploymentId: string
  /** Ordered list of audit events (oldest first) */
  events: AuditEvent[]
  /** Total count of events */
  totalEvents: number
}

/**
 * Result type wrapping a successful response or a typed error.
 */
export type DeploymentResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DeploymentContractError }

// ---------------------------------------------------------------------------
// Error message mapping
// ---------------------------------------------------------------------------

/**
 * Maps {@link DeploymentErrorCode} values to user-friendly guidance messages.
 * These messages are safe to display in the UI — no raw error codes exposed.
 */
export const DEPLOYMENT_ERROR_MESSAGES: Record<DeploymentErrorCode, string> = {
  DeriveAddressMismatch:
    'Your session credentials do not match the expected account. Please sign in again to continue.',
  SessionExpired:
    'Your session has expired. Please sign in again to continue with your deployment.',
  IdempotencyConflict:
    'A deployment with these details is already in progress. Please wait for it to complete.',
  ValidationFailed:
    'The token parameters are invalid. Please review your inputs and try again.',
  InsufficientBalance:
    'Your account does not have sufficient balance to complete this deployment.',
  NetworkUnavailable:
    'The selected network is currently unavailable. Please try again in a few minutes.',
  ContractDeploymentFailed:
    'The deployment could not be completed at this time. Please contact support if the issue persists.',
  AuditTrailUnavailable:
    'The compliance audit trail is temporarily unavailable. Your deployment was not affected.',
  UnknownError:
    'An unexpected error occurred. Please try again or contact support.',
}

/**
 * Returns the user-friendly guidance message for a given error code,
 * falling back to the UnknownError message for unrecognised codes.
 */
export function getUserGuidance(errorCode: DeploymentErrorCode | string): string {
  return (
    DEPLOYMENT_ERROR_MESSAGES[errorCode as DeploymentErrorCode] ??
    DEPLOYMENT_ERROR_MESSAGES.UnknownError
  )
}

// ---------------------------------------------------------------------------
// Idempotency key
// ---------------------------------------------------------------------------

/**
 * Generates a UUID v4 idempotency key for a new deployment initiation.
 * Each call to `initiateDeployment` should use a freshly generated key.
 *
 * **Cryptographic note**: Uses `crypto.randomUUID()` (CSPRNG) when available
 * (all modern browsers and Node 14.17+). The Math.random() fallback below is
 * **not** cryptographically secure and should only be reached in legacy
 * environments (e.g. very old Node.js without Web Crypto). In production the
 * CSPRNG path is always taken. If you need strong idempotency guarantees in a
 * legacy environment, generate keys server-side instead.
 */
export function generateIdempotencyKey(): string {
  // Use crypto.randomUUID() when available (modern browsers + Node 14.17+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: construct RFC 4122 v4 UUID manually.
  // WARNING: Math.random() is NOT cryptographically secure.
  // This path is only reached in legacy environments without Web Crypto.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ---------------------------------------------------------------------------
// Polling configuration
// ---------------------------------------------------------------------------

/** Configuration for status polling with exponential backoff */
export interface PollingConfig {
  /** Initial delay in ms before the first poll (default: 2000) */
  initialDelayMs: number
  /** Maximum delay in ms between polls (default: 30000) */
  maxDelayMs: number
  /** Maximum number of polling attempts (default: 10) */
  maxAttempts: number
  /** Backoff multiplier applied each attempt (default: 2) */
  backoffFactor: number
}

export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  initialDelayMs: 2000,
  maxDelayMs: 30000,
  maxAttempts: 10,
  backoffFactor: 2,
}

/**
 * Computes the delay (ms) for a given poll attempt with exponential backoff,
 * capped at {@link PollingConfig.maxDelayMs}.
 *
 * @param attempt - Zero-indexed attempt number
 * @param config  - Polling configuration
 */
export function computePollingDelay(attempt: number, config: PollingConfig = DEFAULT_POLLING_CONFIG): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt)
  return Math.min(delay, config.maxDelayMs)
}

// ---------------------------------------------------------------------------
// Terminal states
// ---------------------------------------------------------------------------

/** Lifecycle states that indicate the deployment has reached a terminal state */
export const TERMINAL_STATES: ReadonlySet<DeploymentLifecycleState> = new Set([
  'Completed',
  'Failed',
])

/**
 * Returns true if the given lifecycle state is terminal (no further polling needed).
 */
export function isTerminalState(state: DeploymentLifecycleState): boolean {
  return TERMINAL_STATES.has(state)
}

// ---------------------------------------------------------------------------
// API client class
// ---------------------------------------------------------------------------

/** Base URL for the backend deployment contract endpoints */
const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

/**
 * Client for the `/api/v1/backend-deployment-contract` endpoints.
 *
 * All methods return a {@link DeploymentResult} discriminated union —
 * check `result.ok` before accessing `result.data` or `result.error`.
 */
export class BackendDeploymentContractClient {
  private readonly baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
  }

  /**
   * Builds the Authorization header value from a bearer token.
   */
  private authHeader(bearerToken: string): Record<string, string> {
    return { Authorization: `Bearer ${bearerToken}` }
  }

  /**
   * Normalises a backend error response into a {@link DeploymentContractError}.
   * Never throws — always returns a typed error.
   */
  private normaliseError(body: unknown, fallbackCode: DeploymentErrorCode = 'UnknownError'): DeploymentContractError {
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>
      const code = (b.errorCode as DeploymentErrorCode) || fallbackCode
      return {
        errorCode: code,
        userGuidance: (b.userGuidance as string) || getUserGuidance(code),
        detail: (b.detail as string) || undefined,
      }
    }
    return {
      errorCode: fallbackCode,
      userGuidance: getUserGuidance(fallbackCode),
    }
  }

  /**
   * Initiates a new token deployment.
   *
   * POST /api/v1/backend-deployment-contract/initiate
   */
  async initiateDeployment(
    request: InitiateDeploymentRequest,
  ): Promise<DeploymentResult<InitiateDeploymentResponse>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/backend-deployment-contract/initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.authHeader(request.bearerToken),
          },
          body: JSON.stringify(request),
        },
      )

      const body = await response.json().catch(() => null)

      if (!response.ok) {
        return { ok: false, error: this.normaliseError(body, 'ContractDeploymentFailed') }
      }

      return { ok: true, data: body as InitiateDeploymentResponse }
    } catch {
      return {
        ok: false,
        error: {
          errorCode: 'NetworkUnavailable',
          userGuidance: getUserGuidance('NetworkUnavailable'),
        },
      }
    }
  }

  /**
   * Polls the deployment lifecycle state.
   *
   * GET /api/v1/backend-deployment-contract/status/{id}
   */
  async getDeploymentStatus(
    deploymentId: string,
    bearerToken: string,
  ): Promise<DeploymentResult<DeploymentStatusResponse>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/backend-deployment-contract/status/${encodeURIComponent(deploymentId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...this.authHeader(bearerToken),
          },
        },
      )

      const body = await response.json().catch(() => null)

      if (!response.ok) {
        return { ok: false, error: this.normaliseError(body) }
      }

      return { ok: true, data: body as DeploymentStatusResponse }
    } catch {
      return {
        ok: false,
        error: {
          errorCode: 'NetworkUnavailable',
          userGuidance: getUserGuidance('NetworkUnavailable'),
        },
      }
    }
  }

  /**
   * Performs a dry-run validation without triggering any on-chain side effects.
   *
   * POST /api/v1/backend-deployment-contract/validate
   */
  async validateDeployment(
    request: ValidateDeploymentRequest,
  ): Promise<DeploymentResult<ValidateDeploymentResponse>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/backend-deployment-contract/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.authHeader(request.bearerToken),
          },
          body: JSON.stringify(request),
        },
      )

      const body = await response.json().catch(() => null)

      if (!response.ok) {
        return { ok: false, error: this.normaliseError(body, 'ValidationFailed') }
      }

      return { ok: true, data: body as ValidateDeploymentResponse }
    } catch {
      return {
        ok: false,
        error: {
          errorCode: 'NetworkUnavailable',
          userGuidance: getUserGuidance('NetworkUnavailable'),
        },
      }
    }
  }

  /**
   * Retrieves the compliance audit trail for a completed deployment.
   *
   * GET /api/v1/backend-deployment-contract/audit/{id}
   */
  async getAuditTrail(
    deploymentId: string,
    bearerToken: string,
  ): Promise<DeploymentResult<AuditTrailResponse>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/backend-deployment-contract/audit/${encodeURIComponent(deploymentId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...this.authHeader(bearerToken),
          },
        },
      )

      const body = await response.json().catch(() => null)

      if (!response.ok) {
        return { ok: false, error: this.normaliseError(body, 'AuditTrailUnavailable') }
      }

      return { ok: true, data: body as AuditTrailResponse }
    } catch {
      return {
        ok: false,
        error: {
          errorCode: 'AuditTrailUnavailable',
          userGuidance: getUserGuidance('AuditTrailUnavailable'),
        },
      }
    }
  }

  /**
   * Polls deployment status until a terminal state is reached, using exponential backoff.
   *
   * Calls `onUpdate` with each intermediate status, then resolves when the
   * deployment reaches `Completed` or `Failed` (or when `maxAttempts` is exhausted).
   *
   * @param deploymentId   - Deployment ID to poll
   * @param bearerToken    - Bearer token for authentication
   * @param onUpdate       - Optional callback invoked with each status update
   * @param config         - Polling configuration (defaults to {@link DEFAULT_POLLING_CONFIG})
   * @returns Final status response or error
   */
  async pollUntilTerminal(
    deploymentId: string,
    bearerToken: string,
    onUpdate?: (status: DeploymentStatusResponse) => void,
    config: PollingConfig = DEFAULT_POLLING_CONFIG,
  ): Promise<DeploymentResult<DeploymentStatusResponse>> {
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = computePollingDelay(attempt - 1, config)
        await new Promise<void>((resolve) => setTimeout(resolve, delay))
      }

      const result = await this.getDeploymentStatus(deploymentId, bearerToken)

      if (!result.ok) return result

      onUpdate?.(result.data)

      if (isTerminalState(result.data.state)) {
        return result
      }
    }

    // Exhausted attempts — return last known status or error
    const finalResult = await this.getDeploymentStatus(deploymentId, bearerToken)
    return finalResult
  }
}

// ---------------------------------------------------------------------------
// Default singleton instance
// ---------------------------------------------------------------------------

let _defaultClient: BackendDeploymentContractClient | null = null

/**
 * Returns the default singleton {@link BackendDeploymentContractClient}.
 * Creates it on first call using the `VITE_API_BASE_URL` environment variable.
 */
export function getBackendDeploymentContractClient(): BackendDeploymentContractClient {
  if (!_defaultClient) {
    _defaultClient = new BackendDeploymentContractClient()
  }
  return _defaultClient
}
