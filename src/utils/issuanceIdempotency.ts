/**
 * Issuance Idempotency Utility
 *
 * Prevents duplicate token issuance events under repeated submissions or
 * transient network failures. Each submission attempt is identified by a
 * stable idempotency key derived from the immutable draft identity.
 *
 * Design goals:
 * - Pure derivation: same draftId + userEmail → same key (deterministic)
 * - Persistence: in-progress and completed submissions survive page reload
 * - No duplicate events: same key is rejected if already submitted successfully
 * - Retry safety: failed submissions can be retried using the same key
 * - Zero wallet/blockchain terminology in user-facing output
 *
 * Related files:
 * - src/stores/guidedLaunch.ts   (consumes idempotency helpers)
 * - src/utils/launchErrorMessages.ts (user-facing error context)
 *
 * Issue: Roadmap — production-grade auth-first issuance UX
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Storage key constants
// ---------------------------------------------------------------------------

const IDEMPOTENCY_STORE_KEY = 'biatec_issuance_idempotency_v1'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubmissionStatus = 'pending' | 'success' | 'failed'

export interface IdempotencyRecord {
  /** Stable key derived from draftId + userEmail */
  key: string
  /** Draft ID that anchors this submission */
  draftId: string
  /** ISO timestamp when submission was first attempted */
  firstAttemptAt: string
  /** ISO timestamp of most recent attempt */
  lastAttemptAt: string
  /** Number of attempts made with this key */
  attemptCount: number
  /** Current status of the submission */
  status: SubmissionStatus
  /** Submission ID returned by the server on success */
  serverSubmissionId?: string
  /** Last error message for failed status */
  lastError?: string
}

export interface IdempotencyCheckResult {
  /** Whether it is safe to submit (key not already successfully submitted) */
  isSafeToSubmit: boolean
  /** Existing record if found, otherwise undefined */
  existingRecord?: IdempotencyRecord
  /** Human-readable reason if submission is blocked */
  blockedReason?: string
}

// ---------------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------------

/**
 * Derives a deterministic idempotency key from stable submission inputs.
 *
 * The key changes only if the draft identity or submitting user changes.
 * Using the same draftId + email pair will always produce the same key,
 * allowing the backend and client-side deduplication layers to agree.
 *
 * @param draftId  Stable draft identifier (UUID-like string)
 * @param userEmail  Submitting user's email address
 * @returns Opaque string key suitable for storage and header propagation
 */
export function deriveIdempotencyKey(draftId: string, userEmail: string): string {
  if (!draftId || !userEmail) {
    throw new Error('deriveIdempotencyKey: draftId and userEmail are required')
  }
  // Normalise to avoid case-sensitivity issues in emails
  const normalised = `${draftId.trim()}::${userEmail.trim().toLowerCase()}`
  // Simple stable hash using btoa — avoids crypto API dependency for compatibility
  return `idem_${btoa(normalised).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c] ?? c))}`
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function loadStore(): Record<string, IdempotencyRecord> {
  try {
    const raw = localStorage.getItem(IDEMPOTENCY_STORE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, IdempotencyRecord>
  } catch {
    return {}
  }
}

function saveStore(store: Record<string, IdempotencyRecord>): void {
  try {
    localStorage.setItem(IDEMPOTENCY_STORE_KEY, JSON.stringify(store))
  } catch {
    // localStorage quota exceeded — degrade gracefully; submission is still allowed
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether it is safe to submit with the given idempotency key.
 *
 * Submission is blocked only if a previous attempt with the same key
 * already completed successfully. Failed or pending prior attempts are
 * treated as safe-to-retry.
 *
 * @param key  Idempotency key (from `deriveIdempotencyKey`)
 * @returns IdempotencyCheckResult
 */
export function checkIdempotency(key: string): IdempotencyCheckResult {
  const store = loadStore()
  const existing = store[key]

  if (!existing) {
    return { isSafeToSubmit: true }
  }

  if (existing.status === 'success') {
    return {
      isSafeToSubmit: false,
      existingRecord: existing,
      blockedReason:
        'This token launch was already submitted successfully. ' +
        'To create another token, start a new draft.',
    }
  }

  // pending or failed → safe to retry
  return { isSafeToSubmit: true, existingRecord: existing }
}

/**
 * Record a new submission attempt for the given key.
 * Increments attempt count and updates lastAttemptAt.
 *
 * Call this immediately before initiating the network request.
 *
 * @param key      Idempotency key
 * @param draftId  Draft identifier
 */
export function recordSubmissionAttempt(key: string, draftId: string): void {
  const store = loadStore()
  const now = new Date().toISOString()
  const existing = store[key]

  store[key] = {
    key,
    draftId,
    firstAttemptAt: existing?.firstAttemptAt ?? now,
    lastAttemptAt: now,
    attemptCount: (existing?.attemptCount ?? 0) + 1,
    status: 'pending',
    serverSubmissionId: existing?.serverSubmissionId,
  }

  saveStore(store)
}

/**
 * Mark a submission as successfully completed.
 *
 * After this call, `checkIdempotency` will return `isSafeToSubmit: false`
 * for the same key, preventing duplicate launches.
 *
 * @param key               Idempotency key
 * @param serverSubmissionId  Server-assigned submission ID
 */
export function markSubmissionSuccess(key: string, serverSubmissionId: string): void {
  const store = loadStore()
  const existing = store[key]
  if (!existing) return

  store[key] = {
    ...existing,
    status: 'success',
    serverSubmissionId,
    lastAttemptAt: new Date().toISOString(),
  }

  saveStore(store)
}

/**
 * Mark a submission attempt as failed, preserving the record for diagnostics
 * and allowing future retry with the same key.
 *
 * @param key        Idempotency key
 * @param errorMsg   Error message to store for diagnostics
 */
export function markSubmissionFailed(key: string, errorMsg: string): void {
  const store = loadStore()
  const existing = store[key]
  if (!existing) return

  store[key] = {
    ...existing,
    status: 'failed',
    lastError: errorMsg,
    lastAttemptAt: new Date().toISOString(),
  }

  saveStore(store)
}

/**
 * Remove the idempotency record for a key.
 *
 * Call this when the user explicitly starts a new draft to ensure the
 * new submission is not blocked by a prior record.
 *
 * @param key  Idempotency key to clear
 */
export function clearIdempotencyRecord(key: string): void {
  const store = loadStore()
  delete store[key]
  saveStore(store)
}

/**
 * Retrieve the persisted idempotency record for a key, if any.
 * Returns undefined if no record exists for the key.
 *
 * @param key  Idempotency key
 */
export function getIdempotencyRecord(key: string): IdempotencyRecord | undefined {
  return loadStore()[key]
}

/**
 * Remove all idempotency records older than `maxAgeMs` milliseconds.
 * Useful for periodic housekeeping to prevent unbounded localStorage growth.
 *
 * @param maxAgeMs  Maximum age in milliseconds (default: 7 days)
 */
export function pruneExpiredRecords(maxAgeMs = 7 * 24 * 60 * 60 * 1000): number {
  const store = loadStore()
  const cutoff = Date.now() - maxAgeMs
  let removed = 0

  for (const key of Object.keys(store)) {
    const record = store[key]
    const lastAttempt = new Date(record.lastAttemptAt).getTime()
    if (lastAttempt < cutoff) {
      delete store[key]
      removed++
    }
  }

  if (removed > 0) {
    saveStore(store)
  }

  return removed
}
