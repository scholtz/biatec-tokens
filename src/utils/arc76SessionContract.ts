/**
 * ARC76 Session Contract Utility
 *
 * Provides pure-function contract validation for the ARC76-derived session
 * object used throughout the auth-first flow. The contract mirrors the
 * minimal fields checked by:
 *   - src/router/index.ts (navigation guard)
 *   - src/utils/authFirstIssuanceWorkspace.ts (isIssuanceSessionValid)
 *   - e2e/helpers/auth.ts (E2E session bootstrap)
 *
 * Design goals:
 *   - Pure functions — no side effects, no browser globals
 *   - Deterministic: same inputs always produce the same result
 *   - Shared between router logic, auth store, and E2E test helpers
 *   - Zero wallet/blockchain jargon in error messages
 *
 * Canonical auth model: email/password only, no wallet connectors.
 * Backend derives the ARC76 address from email + password server-side.
 *
 * Related:
 *   - src/utils/authFirstIssuanceWorkspace.ts  (issuance session checks)
 *   - src/router/index.ts                       (router guard)
 *   - e2e/helpers/auth.ts                       (E2E session bootstrap)
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Contract type
// ---------------------------------------------------------------------------

/**
 * Minimal session contract required by the auth guard and issuance workspace.
 * Every session seeded in E2E tests and stored in localStorage must satisfy
 * this contract for the auth-first flow to function correctly.
 *
 * **Contract violation handling:**
 * - Router guard: redirects to `/?showAuth=true` if contract is violated
 * - Auth store: clears session and resets to guest state
 * - E2E helpers: throw immediately (fail-fast) if contract is violated at setup
 * - `isConnected: false` is structurally valid but causes redirect on protected routes
 */
export interface ARC76SessionContract {
  /** Non-empty ARC76-derived address. Required for issuance route access. */
  address: string
  /** User email used for ARC76 account derivation (email/password only). */
  email: string
  /** Must be `true` for the issuance route guard to allow access. */
  isConnected: boolean
}

/**
 * Result of validating a raw value against the ARC76 session contract.
 */
export interface SessionValidationResult {
  valid: boolean
  /** Human-readable error descriptions (empty when valid). */
  errors: string[]
}

// ---------------------------------------------------------------------------
// Pure validation functions
// ---------------------------------------------------------------------------

/**
 * Validates that an unknown value meets the ARC76 session contract.
 *
 * Checks:
 *   1. Value is a non-null object
 *   2. `address` is a non-empty string
 *   3. `email` is a non-empty string
 *   4. `isConnected` is a boolean
 *
 * Returns a structured result so callers can assert specific failure reasons.
 */
export function validateARC76Session(value: unknown): SessionValidationResult {
  const errors: string[] = []

  if (!value || typeof value !== 'object') {
    return { valid: false, errors: ['session must be a non-null object'] }
  }

  const s = value as Record<string, unknown>

  if (!s.address || typeof s.address !== 'string' || s.address.trim() === '') {
    errors.push('address must be a non-empty string')
  }
  if (!s.email || typeof s.email !== 'string' || s.email.trim() === '') {
    errors.push('email must be a non-empty string')
  }
  if (typeof s.isConnected !== 'boolean') {
    errors.push('isConnected must be a boolean (not undefined or null)')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Returns `true` if the value is a valid, *connected* ARC76 session.
 *
 * This is the strict check used by the router guard for the issuance route:
 * the session must exist, be well-formed, and have `isConnected === true`.
 *
 * Equivalent to `isIssuanceSessionValid` in authFirstIssuanceWorkspace.ts
 * but without the localStorage parsing step — takes a pre-parsed value.
 */
export function isConnectedSession(value: unknown): boolean {
  const result = validateARC76Session(value)
  if (!result.valid) return false
  const s = value as ARC76SessionContract
  return s.isConnected === true
}

/**
 * Parses a raw JSON string (as stored in localStorage) and validates it
 * against the ARC76 contract. Returns the parsed session or null if invalid.
 *
 * This is the "belt-and-suspenders" version of reading auth state — it
 * validates structure before trusting the value.
 */
export function parseAndValidateSession(raw: string | null): ARC76SessionContract | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const result = validateARC76Session(parsed)
    return result.valid ? (parsed as ARC76SessionContract) : null
  } catch {
    return null
  }
}

/**
 * Describes why a session value is invalid, suitable for developer-facing
 * error messages and test assertion failure context.
 */
export function describeSessionFailure(value: unknown): string {
  if (value === null || value === undefined) {
    return 'session is null or undefined — user is not authenticated'
  }
  const result = validateARC76Session(value)
  if (result.valid) {
    const s = value as ARC76SessionContract
    if (!s.isConnected) {
      return 'session exists but isConnected is false — session is expired or disconnected'
    }
    return 'session is valid and connected'
  }
  return `session contract violated: ${result.errors.join('; ')}`
}

/**
 * Returns the set of field names that are missing or invalid in a session
 * candidate. Useful for targeted error messages in the UI.
 */
export function getMissingSessionFields(value: unknown): string[] {
  if (!value || typeof value !== 'object') {
    return ['address', 'email', 'isConnected']
  }
  const s = value as Record<string, unknown>
  const missing: string[] = []
  if (!s.address || typeof s.address !== 'string' || s.address.trim() === '') {
    missing.push('address')
  }
  if (!s.email || typeof s.email !== 'string' || s.email.trim() === '') {
    missing.push('email')
  }
  if (typeof s.isConnected !== 'boolean') {
    missing.push('isConnected')
  }
  return missing
}
