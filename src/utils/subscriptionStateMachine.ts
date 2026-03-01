/**
 * Subscription State Machine
 *
 * Models the full lifecycle of a subscription:
 *   not_started → trialing → active → past_due → cancelled
 *   active → cancelled (immediate cancellation or cancel_at_period_end)
 *   past_due → active (payment resolved)
 *   trialing → cancelled (trial cancelled before conversion)
 *
 * Pure functions, no side effects. Suitable for unit testing all transitions.
 */

export type SubscriptionStatus =
  | 'not_started'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'

export interface SubscriptionState {
  status: SubscriptionStatus
  cancelAtPeriodEnd: boolean
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  gracePeriodDays: number
}

export type SubscriptionEvent =
  | 'START_TRIAL'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_RESOLVED'
  | 'CANCEL_REQUESTED'
  | 'PERIOD_ENDED'
  | 'TRIAL_ENDED'
  | 'REACTIVATE'
  | 'GRACE_PERIOD_EXPIRED'

export interface TransitionResult {
  nextState: SubscriptionState
  allowed: boolean
  reason: string
}

const GRACE_PERIOD_DAYS = 7

/**
 * Determine what features are accessible for a given subscription status
 */
export function isFeaturesAccessible(state: SubscriptionState): boolean {
  if (state.status === 'trialing') return true
  if (state.status === 'past_due' && state.gracePeriodDays > 0) return true
  // active: features accessible, whether or not cancelAtPeriodEnd is set
  if (state.status === 'active') return true
  return false
}

/**
 * Determine if a subscription is in a paying state (active or trialing)
 */
export function isPayingCustomer(state: SubscriptionState): boolean {
  return state.status === 'active' || state.status === 'trialing'
}

/**
 * Apply a subscription event and return the resulting state transition.
 * Returns `allowed: false` if the transition is not valid from the current state.
 */
export function applySubscriptionEvent(
  state: SubscriptionState,
  event: SubscriptionEvent
): TransitionResult {
  switch (event) {
    case 'START_TRIAL': {
      if (state.status !== 'not_started') {
        return {
          nextState: state,
          allowed: false,
          reason: `Cannot start trial from state '${state.status}'`,
        }
      }
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      return {
        nextState: {
          ...state,
          status: 'trialing',
          trialEndsAt: trialEnd,
          cancelAtPeriodEnd: false,
        },
        allowed: true,
        reason: '14-day trial started',
      }
    }

    case 'PAYMENT_SUCCEEDED': {
      if (state.status !== 'trialing' && state.status !== 'not_started' && state.status !== 'past_due' && state.status !== 'cancelled') {
        return {
          nextState: state,
          allowed: false,
          reason: `Cannot process payment from state '${state.status}'`,
        }
      }
      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)
      return {
        nextState: {
          ...state,
          status: 'active',
          trialEndsAt: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: periodEnd,
          gracePeriodDays: 0,
        },
        allowed: true,
        reason: 'Payment processed — subscription activated',
      }
    }

    case 'PAYMENT_FAILED': {
      if (state.status !== 'active') {
        return {
          nextState: state,
          allowed: false,
          reason: `Payment failure only applies to active subscriptions, not '${state.status}'`,
        }
      }
      return {
        nextState: {
          ...state,
          status: 'past_due',
          gracePeriodDays: GRACE_PERIOD_DAYS,
        },
        allowed: true,
        reason: `Payment failed — grace period of ${GRACE_PERIOD_DAYS} days started`,
      }
    }

    case 'PAYMENT_RESOLVED': {
      if (state.status !== 'past_due') {
        return {
          nextState: state,
          allowed: false,
          reason: `Payment resolution only applies to past_due subscriptions, not '${state.status}'`,
        }
      }
      return {
        nextState: {
          ...state,
          status: 'active',
          gracePeriodDays: 0,
        },
        allowed: true,
        reason: 'Payment resolved — subscription reactivated',
      }
    }

    case 'GRACE_PERIOD_EXPIRED': {
      if (state.status !== 'past_due') {
        return {
          nextState: state,
          allowed: false,
          reason: `Grace period expiry only applies to past_due subscriptions, not '${state.status}'`,
        }
      }
      return {
        nextState: {
          ...state,
          status: 'cancelled',
          gracePeriodDays: 0,
        },
        allowed: true,
        reason: 'Grace period expired — subscription cancelled',
      }
    }

    case 'CANCEL_REQUESTED': {
      if (state.status !== 'active' && state.status !== 'trialing') {
        return {
          nextState: state,
          allowed: false,
          reason: `Cannot cancel from state '${state.status}'`,
        }
      }
      return {
        nextState: {
          ...state,
          cancelAtPeriodEnd: true,
        },
        allowed: true,
        reason: 'Cancellation scheduled — access continues until period end',
      }
    }

    case 'PERIOD_ENDED': {
      // If cancel_at_period_end was set, the subscription ends
      if (state.cancelAtPeriodEnd) {
        return {
          nextState: {
            ...state,
            status: 'cancelled',
            cancelAtPeriodEnd: false,
          },
          allowed: true,
          reason: 'Billing period ended and cancellation was requested',
        }
      }
      // Normal renewal: status stays active (new period starts)
      const nextPeriodEnd = new Date()
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1)
      return {
        nextState: {
          ...state,
          status: 'active',
          currentPeriodEnd: nextPeriodEnd,
        },
        allowed: true,
        reason: 'Subscription renewed for another billing period',
      }
    }

    case 'TRIAL_ENDED': {
      if (state.status !== 'trialing') {
        return {
          nextState: state,
          allowed: false,
          reason: `Trial end only applies to trialing subscriptions, not '${state.status}'`,
        }
      }
      // Trial ended without payment: move to cancelled
      return {
        nextState: {
          ...state,
          status: 'cancelled',
          trialEndsAt: null,
        },
        allowed: true,
        reason: 'Trial ended without payment — subscription cancelled',
      }
    }

    case 'REACTIVATE': {
      if (state.status !== 'cancelled') {
        return {
          nextState: state,
          allowed: false,
          reason: `Reactivation only applies to cancelled subscriptions, not '${state.status}'`,
        }
      }
      return {
        nextState: {
          ...state,
          status: 'not_started',
          cancelAtPeriodEnd: false,
        },
        allowed: true,
        reason: 'Subscription reactivation initiated — complete checkout to activate',
      }
    }

    default: {
      return {
        nextState: state,
        allowed: false,
        reason: `Unknown event`,
      }
    }
  }
}

/**
 * Create the initial state for a new (not yet subscribed) user
 */
export function createInitialState(): SubscriptionState {
  return {
    status: 'not_started',
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    currentPeriodEnd: null,
    gracePeriodDays: 0,
  }
}

/**
 * Map a raw Stripe subscription_status string to the internal SubscriptionStatus type.
 * Also handles the cancel_at_period_end flag.
 */
export function fromStripeStatus(
  stripeStatus: string
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'cancelled':
      return 'cancelled'
    case 'unpaid':
      return 'unpaid'
    case 'not_started':
    default:
      return 'not_started'
  }
}

/**
 * Get a user-friendly label for a subscription status.
 */
export function getStatusLabel(state: SubscriptionState): string {
  if (state.cancelAtPeriodEnd && state.status === 'active') return 'Cancelling'
  switch (state.status) {
    case 'not_started':
      return 'Free'
    case 'trialing':
      return 'Trial'
    case 'active':
      return 'Active'
    case 'past_due':
      return 'Past Due'
    case 'cancelled':
      return 'Cancelled'
    case 'unpaid':
      return 'Unpaid'
    default:
      return 'Unknown'
  }
}

/**
 * Check if the user is within the 7-day grace period after payment failure
 */
export function isInGracePeriod(state: SubscriptionState): boolean {
  return state.status === 'past_due' && state.gracePeriodDays > 0
}
