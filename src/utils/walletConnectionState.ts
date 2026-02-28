/**
 * Wallet Connection State
 *
 * Provides deterministic state management for wallet connection and reconnection
 * flows. Covers first-time connection, session restoration, network mismatch
 * detection, and safe retry behaviour so users always know what to do next.
 */

import type { AlgorandUser } from '../stores/auth'

// ─── supported networks ───────────────────────────────────────────────────────

/**
 * All networks the platform supports.  Update this list as new networks are
 * added so mismatch detection stays accurate.
 */
export const SUPPORTED_NETWORKS = [
  'algorand-mainnet',
  'algorand-testnet',
  'voi',
  'aramid',
  'ethereum',
  'arbitrum',
  'base',
  'sepolia',
] as const

export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number]

// ─── connection state types ───────────────────────────────────────────────────

export type WalletConnectionPhase =
  | 'disconnected'    // No active session; first-time or after explicit logout
  | 'restoring'       // Attempting to restore a previous session from storage
  | 'connecting'      // User initiated new connection – waiting for auth
  | 'connected'       // Session active and verified
  | 'reconnecting'    // Automatic reconnect attempt after brief disconnection
  | 'mismatch'        // Session exists but network does not match expectation
  | 'error'           // Unrecoverable error; user must take action

export interface WalletConnectionState {
  phase: WalletConnectionPhase
  /** Human-readable description of the current phase */
  phaseLabel: string
  /** User-facing message explaining the situation */
  userMessage: string
  /** Primary action the user should take, if any */
  actionLabel: string | null
  /** Whether an automatic or background operation is in progress */
  isBusy: boolean
  /** Whether the user can trigger a manual reconnect right now */
  canReconnect: boolean
  /** Whether the connection is ready for token operations */
  isOperational: boolean
  /** Details about a network mismatch, if applicable */
  networkMismatch?: NetworkMismatchInfo
  /** Error details, if in error phase */
  errorDetails?: WalletErrorInfo
}

export interface NetworkMismatchInfo {
  /** The network the session was last seen on */
  lastKnownNetwork: string
  /** The network that is currently required or active */
  currentNetwork: string
  /** Guidance for the user to resolve the mismatch */
  resolution: string
}

export interface WalletErrorInfo {
  /** Short error code for programmatic handling */
  code: 'session_expired' | 'auth_failed' | 'provisioning_error' | 'network_error' | 'unknown'
  /** User-readable description */
  message: string
  /** Whether the error is recoverable without full re-authentication */
  recoverable: boolean
  /** Suggested recovery action */
  recoveryAction: string
}

// ─── phase descriptions ───────────────────────────────────────────────────────

const PHASE_LABELS: Record<WalletConnectionPhase, string> = {
  disconnected: 'Not connected',
  restoring: 'Restoring session…',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  mismatch: 'Network mismatch',
  error: 'Connection error',
}

const PHASE_MESSAGES: Record<WalletConnectionPhase, string> = {
  disconnected:
    'Sign in with your email and password to access your token portfolio.',
  restoring:
    'Checking for a previous session…',
  connecting:
    'Verifying your credentials — this should only take a moment.',
  connected:
    'Your account is active and ready to use.',
  reconnecting:
    'Your connection dropped briefly. Attempting to reconnect automatically.',
  mismatch:
    'Your account was last seen on a different network. Please switch networks to continue.',
  error:
    'Something went wrong with the connection. Please try again.',
}

const PHASE_ACTIONS: Record<WalletConnectionPhase, string | null> = {
  disconnected: 'Sign in',
  restoring: null,
  connecting: null,
  connected: null,
  reconnecting: null,
  mismatch: 'Switch network',
  error: 'Try again',
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Derive a WalletConnectionState from the current auth store values.
 *
 * @param isAuthenticated  Whether the auth store considers the user authenticated
 * @param user             The current AlgorandUser, if any
 * @param isRestoring      Whether the app is still loading the session from storage
 * @param activeNetwork    The network currently selected in the UI (optional)
 * @param expectedNetwork  The network required for the current operation (optional)
 */
export function deriveConnectionState(
  isAuthenticated: boolean,
  user: AlgorandUser | null,
  isRestoring = false,
  activeNetwork?: string,
  expectedNetwork?: string,
): WalletConnectionState {
  // Busy restoring session from localStorage
  if (isRestoring) {
    return buildState('restoring')
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return buildState('disconnected')
  }

  // Connected but network mismatch detected
  if (
    activeNetwork &&
    expectedNetwork &&
    !networksMatch(activeNetwork, expectedNetwork)
  ) {
    return buildState('mismatch', undefined, {
      lastKnownNetwork: activeNetwork,
      currentNetwork: expectedNetwork,
      resolution: `Switch to the "${formatNetworkName(expectedNetwork)}" network to continue.`,
    })
  }

  // Fully connected
  return buildState('connected')
}

/**
 * Build a WalletConnectionState for a reconnection attempt.
 */
export function buildReconnectingState(): WalletConnectionState {
  return buildState('reconnecting')
}

/**
 * Build a WalletConnectionState for a specific error condition.
 */
export function buildErrorState(error: WalletErrorInfo): WalletConnectionState {
  return buildState('error', error)
}

/**
 * Build a WalletConnectionState for the connecting phase.
 */
export function buildConnectingState(): WalletConnectionState {
  return buildState('connecting')
}

/**
 * Map a raw error (caught in a try/catch) to a structured WalletErrorInfo.
 */
export function classifyConnectionError(err: unknown): WalletErrorInfo {
  const message = err instanceof Error ? err.message : String(err)

  if (/session.*expired|token.*invalid/i.test(message)) {
    return {
      code: 'session_expired',
      message: 'Your session has expired. Please sign in again.',
      recoverable: false,
      recoveryAction: 'Sign in',
    }
  }

  if (/auth.*fail|invalid.*credential|wrong.*password/i.test(message)) {
    return {
      code: 'auth_failed',
      message: 'Authentication failed. Please check your credentials.',
      recoverable: false,
      recoveryAction: 'Sign in again',
    }
  }

  if (/provision|account.*not.*ready/i.test(message)) {
    return {
      code: 'provisioning_error',
      message: 'Account setup is not yet complete. Please wait and try again.',
      recoverable: true,
      recoveryAction: 'Retry',
    }
  }

  if (/network|fetch|timeout|offline/i.test(message)) {
    return {
      code: 'network_error',
      message: 'A network error occurred. Check your connection and try again.',
      recoverable: true,
      recoveryAction: 'Retry',
    }
  }

  return {
    code: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    recoverable: true,
    recoveryAction: 'Try again',
  }
}

/**
 * Determine whether the active network is supported.
 */
export function isNetworkSupported(network: string): boolean {
  return SUPPORTED_NETWORKS.includes(normalizeNetworkId(network) as SupportedNetwork)
}

/**
 * Check whether two network identifiers refer to the same network,
 * normalising casing and separators.
 */
export function networksMatch(a: string, b: string): boolean {
  return normalizeNetworkId(a) === normalizeNetworkId(b)
}

// ─── internal helpers ─────────────────────────────────────────────────────────

function normalizeNetworkId(network: string): string {
  return network.trim().toLowerCase().replace(/[_\s]+/g, '-')
}

function formatNetworkName(network: string): string {
  return normalizeNetworkId(network)
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function buildState(
  phase: WalletConnectionPhase,
  errorDetails?: WalletErrorInfo,
  networkMismatch?: NetworkMismatchInfo,
): WalletConnectionState {
  const isBusy = phase === 'restoring' || phase === 'connecting' || phase === 'reconnecting'

  return {
    phase,
    phaseLabel: PHASE_LABELS[phase],
    userMessage: PHASE_MESSAGES[phase],
    actionLabel: PHASE_ACTIONS[phase],
    isBusy,
    canReconnect: phase === 'disconnected' || phase === 'mismatch' || phase === 'error',
    isOperational: phase === 'connected',
    networkMismatch,
    errorDetails,
  }
}
