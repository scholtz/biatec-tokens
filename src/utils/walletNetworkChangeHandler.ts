/**
 * Wallet Network Change Handler
 *
 * Detects and handles mid-session wallet network and account context changes
 * so users always receive clear guidance when their environment shifts beneath
 * them. This prevents silent failures when, for example, a user's auth token
 * was issued on Algorand Testnet but they navigate to a Mainnet operation.
 *
 * Design goals:
 *  - Deterministic state transitions; no ambiguous states.
 *  - Human-readable guidance for every transition type.
 *  - Zero side effects — pure functions that the UI can call and react to.
 *
 * Addresses Acceptance Criterion #2:
 *   "Wallet connection and transaction journeys handle account/network changes
 *    gracefully."
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContextChangeKind =
  | 'account_changed'    // Same network, different user address
  | 'network_changed'    // Same account, different network
  | 'account_and_network_changed' // Both changed simultaneously
  | 'session_restored'   // Context resumed from storage; now active
  | 'session_cleared'    // User logged out or session was invalidated
  | 'no_change'          // Context identical to previous snapshot

export type ContextChangeImpact =
  | 'blocking'    // Operations must stop until user acknowledges / re-authenticates
  | 'warning'     // User should be informed; current operation may be safe to continue
  | 'informational' // Low impact; no action strictly required
  | 'none'        // No impact; change is transparent to the user

export interface WalletContextSnapshot {
  accountAddress: string | null
  network: string | null
  sessionId?: string | null
}

export interface ContextChangeResult {
  kind: ContextChangeKind
  impact: ContextChangeImpact
  /** Plain-language heading for a notification or alert */
  title: string
  /** One-sentence explanation of what happened */
  message: string
  /** What the user should do, or null when no action is required */
  actionLabel: string | null
  /** Route for the primary action, or null */
  actionRoute: string | null
  /** Whether the currently active operation should be paused */
  shouldPauseCurrentOperation: boolean
  /** Whether the user should be asked to re-authenticate */
  requiresReauth: boolean
  prev: WalletContextSnapshot
  next: WalletContextSnapshot
}

// ─── Core detection function ──────────────────────────────────────────────────

/**
 * Compares two wallet context snapshots and returns a structured change
 * result describing what happened and what the user should do next.
 */
export function detectContextChange(
  prev: WalletContextSnapshot,
  next: WalletContextSnapshot,
): ContextChangeResult {
  const accountChanged = normaliseAddress(prev.accountAddress) !== normaliseAddress(next.accountAddress)
  const networkChanged = normaliseNetwork(prev.network) !== normaliseNetwork(next.network)

  // Session-level transitions take priority over field-level changes.
  // The explicit null checks below must run before the normalised comparisons
  // because normaliseAddress(null) === normaliseAddress('') — both return ''.
  // Prioritising session checks prevents a null→'' transition from being
  // misclassified as a mere account_changed event.

  // Session cleared: user logged out or session invalidated
  if (prev.accountAddress !== null && next.accountAddress === null) {
    return {
      kind: 'session_cleared',
      impact: 'blocking',
      title: 'Session ended',
      message: 'Your session has ended. Sign in again to continue.',
      actionLabel: 'Sign in',
      actionRoute: '/',
      shouldPauseCurrentOperation: true,
      requiresReauth: true,
      prev,
      next,
    }
  }

  // Session restored: previously null, now populated
  if (prev.accountAddress === null && next.accountAddress !== null) {
    return {
      kind: 'session_restored',
      impact: 'informational',
      title: 'Session restored',
      message: `Signed in as ${formatAddress(next.accountAddress)}.`,
      actionLabel: null,
      actionRoute: null,
      shouldPauseCurrentOperation: false,
      requiresReauth: false,
      prev,
      next,
    }
  }

  // Both changed — most disruptive scenario
  if (accountChanged && networkChanged) {
    return {
      kind: 'account_and_network_changed',
      impact: 'blocking',
      title: 'Account and network changed',
      message: `Your account and network have both changed. Operations started on the previous session cannot continue safely.`,
      actionLabel: 'Review and continue',
      actionRoute: '/settings',
      shouldPauseCurrentOperation: true,
      requiresReauth: true,
      prev,
      next,
    }
  }

  // Account changed — operations may be affected
  if (accountChanged) {
    return {
      kind: 'account_changed',
      impact: 'blocking',
      title: 'Account switched',
      message: `You are now signed in as ${formatAddress(next.accountAddress)}. Any pending operations have been paused for safety.`,
      actionLabel: 'Continue with new account',
      actionRoute: null,
      shouldPauseCurrentOperation: true,
      requiresReauth: false,
      prev,
      next,
    }
  }

  // Network changed — deployment target affected
  if (networkChanged) {
    return {
      kind: 'network_changed',
      impact: 'warning',
      title: 'Network changed',
      message: `The active network has changed from ${prev.network ?? 'unknown'} to ${next.network ?? 'unknown'}. Verify that your token configuration targets the correct network.`,
      actionLabel: 'Check configuration',
      actionRoute: '/launch/guided',
      shouldPauseCurrentOperation: false,
      requiresReauth: false,
      prev,
      next,
    }
  }

  // No meaningful change
  return {
    kind: 'no_change',
    impact: 'none',
    title: 'No change detected',
    message: 'Your account and network context are unchanged.',
    actionLabel: null,
    actionRoute: null,
    shouldPauseCurrentOperation: false,
    requiresReauth: false,
    prev,
    next,
  }
}

// ─── Guard helpers ────────────────────────────────────────────────────────────

/**
 * Returns true when a change result means the user should be blocked from
 * continuing an in-progress operation.
 */
export function isOperationBlocked(result: ContextChangeResult): boolean {
  return result.shouldPauseCurrentOperation
}

/**
 * Returns true when the change requires the user to acknowledge before
 * they can take any further action (e.g. a full re-auth).
 */
export function requiresUserAcknowledgement(result: ContextChangeResult): boolean {
  return result.impact === 'blocking' || result.requiresReauth
}

/**
 * Returns a short human-readable description suitable for a toast/snackbar
 * notification when a context change occurs mid-flow.
 */
export function getContextChangeToastText(result: ContextChangeResult): string {
  if (result.kind === 'no_change') return ''
  return result.message
}

// ─── Snapshot builder ─────────────────────────────────────────────────────────

/**
 * Builds a WalletContextSnapshot from an AlgorandUser-like object (or null).
 * Accepts the minimal fields needed so callers do not need to import the full
 * auth store type.
 */
export function buildContextSnapshot(user: {
  address?: string | null
  network?: string | null
  sessionId?: string | null
} | null): WalletContextSnapshot {
  if (!user) {
    return { accountAddress: null, network: null, sessionId: null }
  }
  return {
    accountAddress: user.address ?? null,
    network: user.network ?? null,
    sessionId: user.sessionId ?? null,
  }
}

// ─── Internal normalisation ───────────────────────────────────────────────────

function normaliseAddress(address: string | null | undefined): string {
  return (address ?? '').trim().toLowerCase()
}

function normaliseNetwork(network: string | null | undefined): string {
  return (network ?? '').trim().toLowerCase()
}

function formatAddress(address: string | null): string {
  if (!address) return 'unknown'
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
