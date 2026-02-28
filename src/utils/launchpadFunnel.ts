/**
 * Portfolio Launchpad – Funnel Event Tracking
 *
 * Provides a thin, testable abstraction for emitting exactly-once telemetry
 * events at each milestone of the discovery-to-action journey:
 *
 *   launchpad_viewed → token_selected → simulation_completed →
 *   wallet_connected → action_submitted → action_confirmed | action_failed
 *
 * Analytics calls are deliberately isolated here so presentation components
 * stay free of tracking concerns and the emission logic is independently
 * unit-testable.
 */

import { analyticsService } from '../services/analytics'

// ─── Event name constants ─────────────────────────────────────────────────────

export const LAUNCHPAD_EVENTS = {
  LAUNCHPAD_VIEWED: 'launchpad_viewed',
  TOKEN_SELECTED: 'token_selected',
  SIMULATION_COMPLETED: 'simulation_completed',
  WALLET_CONNECTED: 'wallet_connected',
  ACTION_SUBMITTED: 'action_submitted',
  ACTION_CONFIRMED: 'action_confirmed',
  ACTION_FAILED: 'action_failed',
} as const

export type LaunchpadEventName = (typeof LAUNCHPAD_EVENTS)[keyof typeof LAUNCHPAD_EVENTS]

// ─── Payload shapes ───────────────────────────────────────────────────────────

export interface LaunchpadViewedPayload {
  tokenCount: number
  source?: string
}

export interface TokenSelectedPayload {
  tokenId: string
  tokenSymbol: string
  network: string
  stage: string
}

export interface SimulationCompletedPayload {
  tokenId: string
  estimatedFee: number
  estimatedOutcome: string
  durationMs: number
}

export interface WalletConnectedPayload {
  tokenId: string
  walletType?: string
  chainId?: string
}

export interface ActionSubmittedPayload {
  tokenId: string
  actionType: string
  amount?: number
}

export interface ActionConfirmedPayload {
  tokenId: string
  txId: string
  durationMs: number
}

export interface ActionFailedPayload {
  tokenId: string
  reason: string
  code?: string
}

// ─── Guards against duplicate dispatches within the same page lifecycle ───────

const _dispatched = new Set<string>()

function _key(event: LaunchpadEventName, id?: string): string {
  return id ? `${event}::${id}` : event
}

/**
 * Reset dispatch-guard state (useful in tests and on page unmount).
 */
export function resetLaunchpadDispatchGuard(): void {
  _dispatched.clear()
}

// ─── Emit helpers ─────────────────────────────────────────────────────────────

type LaunchpadPayload =
  | LaunchpadViewedPayload
  | TokenSelectedPayload
  | SimulationCompletedPayload
  | WalletConnectedPayload
  | ActionSubmittedPayload
  | ActionConfirmedPayload
  | ActionFailedPayload

function emit(
  event: LaunchpadEventName,
  payload: LaunchpadPayload,
  dedupeKey?: string,
): void {
  const key = _key(event, dedupeKey)
  if (_dispatched.has(key)) return
  _dispatched.add(key)
  analyticsService.trackEvent({ event, category: 'Launchpad', action: event, label: dedupeKey ?? event, ...payload })
}

/**
 * Fire `launchpad_viewed` once per page load.
 */
export function trackLaunchpadViewed(payload: LaunchpadViewedPayload): void {
  emit(LAUNCHPAD_EVENTS.LAUNCHPAD_VIEWED, payload)
}

/**
 * Fire `token_selected` once per tokenId per session.
 */
export function trackTokenSelected(payload: TokenSelectedPayload): void {
  emit(LAUNCHPAD_EVENTS.TOKEN_SELECTED, payload, payload.tokenId)
}

/**
 * Fire `simulation_completed` once per tokenId per session.
 */
export function trackSimulationCompleted(payload: SimulationCompletedPayload): void {
  emit(LAUNCHPAD_EVENTS.SIMULATION_COMPLETED, payload, payload.tokenId)
}

/**
 * Fire `wallet_connected` once per tokenId per session.
 */
export function trackWalletConnected(payload: WalletConnectedPayload): void {
  emit(LAUNCHPAD_EVENTS.WALLET_CONNECTED, payload, payload.tokenId)
}

/**
 * Fire `action_submitted` once per tokenId per session.
 */
export function trackActionSubmitted(payload: ActionSubmittedPayload): void {
  emit(LAUNCHPAD_EVENTS.ACTION_SUBMITTED, payload, payload.tokenId)
}

/**
 * Fire `action_confirmed` (idempotent per txId).
 */
export function trackActionConfirmed(payload: ActionConfirmedPayload): void {
  emit(LAUNCHPAD_EVENTS.ACTION_CONFIRMED, payload, payload.txId)
}

/**
 * Fire `action_failed` (idempotent per tokenId+reason).
 */
export function trackActionFailed(payload: ActionFailedPayload): void {
  emit(LAUNCHPAD_EVENTS.ACTION_FAILED, payload, `${payload.tokenId}::${payload.reason}`)
}
