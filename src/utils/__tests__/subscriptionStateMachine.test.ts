import { describe, it, expect } from 'vitest'
import {
  applySubscriptionEvent,
  createInitialState,
  fromStripeStatus,
  getStatusLabel,
  isFeaturesAccessible,
  isInGracePeriod,
  isPayingCustomer,
  type SubscriptionState,
} from '../subscriptionStateMachine'

describe('subscriptionStateMachine', () => {
  describe('createInitialState', () => {
    it('creates a not_started state', () => {
      const state = createInitialState()
      expect(state.status).toBe('not_started')
      expect(state.cancelAtPeriodEnd).toBe(false)
      expect(state.trialEndsAt).toBeNull()
      expect(state.currentPeriodEnd).toBeNull()
      expect(state.gracePeriodDays).toBe(0)
    })
  })

  describe('START_TRIAL transition', () => {
    it('transitions not_started → trialing', () => {
      const state = createInitialState()
      const result = applySubscriptionEvent(state, 'START_TRIAL')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('trialing')
      expect(result.nextState.trialEndsAt).toBeInstanceOf(Date)
    })

    it('sets trial end ~14 days in the future', () => {
      const before = new Date()
      const result = applySubscriptionEvent(createInitialState(), 'START_TRIAL')
      const trialEnd = result.nextState.trialEndsAt!
      const diffDays = (trialEnd.getTime() - before.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThanOrEqual(13)
      expect(diffDays).toBeLessThanOrEqual(15)
    })

    it('rejects START_TRIAL from active state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      const result = applySubscriptionEvent(state, 'START_TRIAL')
      expect(result.allowed).toBe(false)
      expect(result.nextState.status).toBe('active')
    })

    it('rejects START_TRIAL from trialing state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'trialing' }
      const result = applySubscriptionEvent(state, 'START_TRIAL')
      expect(result.allowed).toBe(false)
    })

    it('rejects START_TRIAL from cancelled state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'cancelled' }
      const result = applySubscriptionEvent(state, 'START_TRIAL')
      expect(result.allowed).toBe(false)
    })
  })

  describe('PAYMENT_SUCCEEDED transition', () => {
    it('transitions trialing → active', () => {
      const trialingState: SubscriptionState = { ...createInitialState(), status: 'trialing' }
      const result = applySubscriptionEvent(trialingState, 'PAYMENT_SUCCEEDED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('active')
      expect(result.nextState.trialEndsAt).toBeNull()
      expect(result.nextState.cancelAtPeriodEnd).toBe(false)
    })

    it('transitions not_started → active (direct subscription without trial)', () => {
      const result = applySubscriptionEvent(createInitialState(), 'PAYMENT_SUCCEEDED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('active')
    })

    it('transitions past_due → active (payment resolved via new payment)', () => {
      const pastDueState: SubscriptionState = { ...createInitialState(), status: 'past_due', gracePeriodDays: 3 }
      const result = applySubscriptionEvent(pastDueState, 'PAYMENT_SUCCEEDED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('active')
      expect(result.nextState.gracePeriodDays).toBe(0)
    })

    it('transitions cancelled → active (re-subscribe)', () => {
      const cancelledState: SubscriptionState = { ...createInitialState(), status: 'cancelled' }
      const result = applySubscriptionEvent(cancelledState, 'PAYMENT_SUCCEEDED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('active')
    })

    it('rejects PAYMENT_SUCCEEDED from already active state', () => {
      const activeState: SubscriptionState = { ...createInitialState(), status: 'active' }
      const result = applySubscriptionEvent(activeState, 'PAYMENT_SUCCEEDED')
      expect(result.allowed).toBe(false)
    })

    it('sets currentPeriodEnd approximately 1 month ahead', () => {
      const before = new Date()
      const result = applySubscriptionEvent(createInitialState(), 'PAYMENT_SUCCEEDED')
      const periodEnd = result.nextState.currentPeriodEnd!
      const diffDays = (periodEnd.getTime() - before.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThanOrEqual(27)
      expect(diffDays).toBeLessThanOrEqual(32)
    })
  })

  describe('PAYMENT_FAILED transition', () => {
    it('transitions active → past_due', () => {
      const activeState: SubscriptionState = { ...createInitialState(), status: 'active' }
      const result = applySubscriptionEvent(activeState, 'PAYMENT_FAILED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('past_due')
      expect(result.nextState.gracePeriodDays).toBe(7)
    })

    it('rejects PAYMENT_FAILED from trialing state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'trialing' }
      const result = applySubscriptionEvent(state, 'PAYMENT_FAILED')
      expect(result.allowed).toBe(false)
    })

    it('rejects PAYMENT_FAILED from past_due state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'past_due' }
      const result = applySubscriptionEvent(state, 'PAYMENT_FAILED')
      expect(result.allowed).toBe(false)
    })

    it('rejects PAYMENT_FAILED from not_started state', () => {
      const result = applySubscriptionEvent(createInitialState(), 'PAYMENT_FAILED')
      expect(result.allowed).toBe(false)
    })
  })

  describe('PAYMENT_RESOLVED transition', () => {
    it('transitions past_due → active', () => {
      const pastDueState: SubscriptionState = { ...createInitialState(), status: 'past_due', gracePeriodDays: 5 }
      const result = applySubscriptionEvent(pastDueState, 'PAYMENT_RESOLVED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('active')
      expect(result.nextState.gracePeriodDays).toBe(0)
    })

    it('rejects PAYMENT_RESOLVED from active state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      const result = applySubscriptionEvent(state, 'PAYMENT_RESOLVED')
      expect(result.allowed).toBe(false)
    })

    it('rejects PAYMENT_RESOLVED from not_started state', () => {
      const result = applySubscriptionEvent(createInitialState(), 'PAYMENT_RESOLVED')
      expect(result.allowed).toBe(false)
    })
  })

  describe('GRACE_PERIOD_EXPIRED transition', () => {
    it('transitions past_due → cancelled when grace period expires', () => {
      const pastDueState: SubscriptionState = { ...createInitialState(), status: 'past_due', gracePeriodDays: 0 }
      const result = applySubscriptionEvent(pastDueState, 'GRACE_PERIOD_EXPIRED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('cancelled')
      expect(result.nextState.gracePeriodDays).toBe(0)
    })

    it('rejects GRACE_PERIOD_EXPIRED from active state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      const result = applySubscriptionEvent(state, 'GRACE_PERIOD_EXPIRED')
      expect(result.allowed).toBe(false)
    })

    it('rejects GRACE_PERIOD_EXPIRED from not_started state', () => {
      const result = applySubscriptionEvent(createInitialState(), 'GRACE_PERIOD_EXPIRED')
      expect(result.allowed).toBe(false)
    })
  })

  describe('CANCEL_REQUESTED transition', () => {
    it('sets cancelAtPeriodEnd=true for active subscriptions', () => {
      const activeState: SubscriptionState = { ...createInitialState(), status: 'active' }
      const result = applySubscriptionEvent(activeState, 'CANCEL_REQUESTED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('active')
      expect(result.nextState.cancelAtPeriodEnd).toBe(true)
    })

    it('sets cancelAtPeriodEnd=true for trialing subscriptions', () => {
      const trialingState: SubscriptionState = { ...createInitialState(), status: 'trialing' }
      const result = applySubscriptionEvent(trialingState, 'CANCEL_REQUESTED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.cancelAtPeriodEnd).toBe(true)
    })

    it('rejects CANCEL_REQUESTED from already cancelled state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'cancelled' }
      const result = applySubscriptionEvent(state, 'CANCEL_REQUESTED')
      expect(result.allowed).toBe(false)
    })

    it('rejects CANCEL_REQUESTED from past_due state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'past_due' }
      const result = applySubscriptionEvent(state, 'CANCEL_REQUESTED')
      expect(result.allowed).toBe(false)
    })

    it('rejects CANCEL_REQUESTED from not_started state', () => {
      const result = applySubscriptionEvent(createInitialState(), 'CANCEL_REQUESTED')
      expect(result.allowed).toBe(false)
    })
  })

  describe('PERIOD_ENDED transition', () => {
    it('transitions active → cancelled when cancelAtPeriodEnd is true', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active', cancelAtPeriodEnd: true }
      const result = applySubscriptionEvent(state, 'PERIOD_ENDED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('cancelled')
      expect(result.nextState.cancelAtPeriodEnd).toBe(false)
    })

    it('renews subscription (active → active) when cancelAtPeriodEnd is false', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active', cancelAtPeriodEnd: false }
      const result = applySubscriptionEvent(state, 'PERIOD_ENDED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('active')
      expect(result.nextState.currentPeriodEnd).toBeInstanceOf(Date)
    })
  })

  describe('TRIAL_ENDED transition', () => {
    it('transitions trialing → cancelled when trial ends without payment', () => {
      const trialingState: SubscriptionState = { ...createInitialState(), status: 'trialing' }
      const result = applySubscriptionEvent(trialingState, 'TRIAL_ENDED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('cancelled')
      expect(result.nextState.trialEndsAt).toBeNull()
    })

    it('rejects TRIAL_ENDED from active state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      const result = applySubscriptionEvent(state, 'TRIAL_ENDED')
      expect(result.allowed).toBe(false)
    })

    it('rejects TRIAL_ENDED from not_started state', () => {
      const result = applySubscriptionEvent(createInitialState(), 'TRIAL_ENDED')
      expect(result.allowed).toBe(false)
    })
  })

  describe('REACTIVATE transition', () => {
    it('transitions cancelled → not_started (ready for checkout)', () => {
      const cancelledState: SubscriptionState = { ...createInitialState(), status: 'cancelled', cancelAtPeriodEnd: true }
      const result = applySubscriptionEvent(cancelledState, 'REACTIVATE')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('not_started')
      expect(result.nextState.cancelAtPeriodEnd).toBe(false)
    })

    it('rejects REACTIVATE from active state', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      const result = applySubscriptionEvent(state, 'REACTIVATE')
      expect(result.allowed).toBe(false)
    })

    it('rejects REACTIVATE from not_started state', () => {
      const result = applySubscriptionEvent(createInitialState(), 'REACTIVATE')
      expect(result.allowed).toBe(false)
    })
  })

  describe('full lifecycle transitions', () => {
    it('happy path: not_started → active via direct payment', () => {
      let state = createInitialState()
      let result = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED')
      expect(result.allowed).toBe(true)
      expect(result.nextState.status).toBe('active')
    })

    it('trial path: not_started → trialing → active', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'START_TRIAL').nextState
      expect(state.status).toBe('trialing')
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      expect(state.status).toBe('active')
    })

    it('past_due recovery path: active → past_due → active', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      expect(state.status).toBe('active')
      state = applySubscriptionEvent(state, 'PAYMENT_FAILED').nextState
      expect(state.status).toBe('past_due')
      expect(state.gracePeriodDays).toBe(7)
      state = applySubscriptionEvent(state, 'PAYMENT_RESOLVED').nextState
      expect(state.status).toBe('active')
    })

    it('grace period expiry path: active → past_due → cancelled', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      state = applySubscriptionEvent(state, 'PAYMENT_FAILED').nextState
      expect(state.status).toBe('past_due')
      state = applySubscriptionEvent(state, 'GRACE_PERIOD_EXPIRED').nextState
      expect(state.status).toBe('cancelled')
    })

    it('cancellation path: active → active(cancelling) → cancelled', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      state = applySubscriptionEvent(state, 'CANCEL_REQUESTED').nextState
      expect(state.status).toBe('active')
      expect(state.cancelAtPeriodEnd).toBe(true)
      state = applySubscriptionEvent(state, 'PERIOD_ENDED').nextState
      expect(state.status).toBe('cancelled')
    })

    it('trial cancellation path: not_started → trialing → cancelled', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'START_TRIAL').nextState
      state = applySubscriptionEvent(state, 'TRIAL_ENDED').nextState
      expect(state.status).toBe('cancelled')
    })

    it('reactivation path: cancelled → not_started → active', () => {
      let state = createInitialState()
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      state = applySubscriptionEvent(state, 'CANCEL_REQUESTED').nextState
      state = applySubscriptionEvent(state, 'PERIOD_ENDED').nextState
      expect(state.status).toBe('cancelled')
      state = applySubscriptionEvent(state, 'REACTIVATE').nextState
      expect(state.status).toBe('not_started')
      state = applySubscriptionEvent(state, 'PAYMENT_SUCCEEDED').nextState
      expect(state.status).toBe('active')
    })
  })

  describe('fromStripeStatus', () => {
    it('maps "active" stripe status', () => {
      expect(fromStripeStatus('active')).toBe('active')
    })

    it('maps "trialing" stripe status', () => {
      expect(fromStripeStatus('trialing')).toBe('trialing')
    })

    it('maps "past_due" stripe status', () => {
      expect(fromStripeStatus('past_due')).toBe('past_due')
    })

    it('maps "canceled" stripe status (US spelling)', () => {
      expect(fromStripeStatus('canceled')).toBe('cancelled')
    })

    it('maps "cancelled" stripe status (UK spelling)', () => {
      expect(fromStripeStatus('cancelled')).toBe('cancelled')
    })

    it('maps "unpaid" stripe status', () => {
      expect(fromStripeStatus('unpaid')).toBe('unpaid')
    })

    it('maps "not_started" stripe status', () => {
      expect(fromStripeStatus('not_started')).toBe('not_started')
    })

    it('maps unknown status to not_started', () => {
      expect(fromStripeStatus('unknown_status')).toBe('not_started')
    })
  })

  describe('getStatusLabel', () => {
    it('returns "Free" for not_started', () => {
      const state = createInitialState()
      expect(getStatusLabel(state)).toBe('Free')
    })

    it('returns "Trial" for trialing', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'trialing' }
      expect(getStatusLabel(state)).toBe('Trial')
    })

    it('returns "Active" for active', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      expect(getStatusLabel(state)).toBe('Active')
    })

    it('returns "Cancelling" for active with cancelAtPeriodEnd=true', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active', cancelAtPeriodEnd: true }
      expect(getStatusLabel(state)).toBe('Cancelling')
    })

    it('returns "Past Due" for past_due', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'past_due' }
      expect(getStatusLabel(state)).toBe('Past Due')
    })

    it('returns "Cancelled" for cancelled', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'cancelled' }
      expect(getStatusLabel(state)).toBe('Cancelled')
    })

    it('returns "Unpaid" for unpaid', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'unpaid' }
      expect(getStatusLabel(state)).toBe('Unpaid')
    })
  })

  describe('isFeaturesAccessible', () => {
    it('returns true for active subscription', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      expect(isFeaturesAccessible(state)).toBe(true)
    })

    it('returns true for trialing subscription', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'trialing' }
      expect(isFeaturesAccessible(state)).toBe(true)
    })

    it('returns true for past_due within grace period', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'past_due', gracePeriodDays: 3 }
      expect(isFeaturesAccessible(state)).toBe(true)
    })

    it('returns false for past_due with 0 grace period days', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'past_due', gracePeriodDays: 0 }
      expect(isFeaturesAccessible(state)).toBe(false)
    })

    it('returns false for cancelled subscription', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'cancelled' }
      expect(isFeaturesAccessible(state)).toBe(false)
    })

    it('returns false for not_started subscription', () => {
      expect(isFeaturesAccessible(createInitialState())).toBe(false)
    })
  })

  describe('isPayingCustomer', () => {
    it('returns true for active subscription', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      expect(isPayingCustomer(state)).toBe(true)
    })

    it('returns true for trialing subscription', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'trialing' }
      expect(isPayingCustomer(state)).toBe(true)
    })

    it('returns false for past_due subscription', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'past_due' }
      expect(isPayingCustomer(state)).toBe(false)
    })

    it('returns false for cancelled subscription', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'cancelled' }
      expect(isPayingCustomer(state)).toBe(false)
    })

    it('returns false for not_started subscription', () => {
      expect(isPayingCustomer(createInitialState())).toBe(false)
    })
  })

  describe('isInGracePeriod', () => {
    it('returns true for past_due with grace period remaining', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'past_due', gracePeriodDays: 5 }
      expect(isInGracePeriod(state)).toBe(true)
    })

    it('returns false for past_due with 0 grace period days', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'past_due', gracePeriodDays: 0 }
      expect(isInGracePeriod(state)).toBe(false)
    })

    it('returns false for active subscription', () => {
      const state: SubscriptionState = { ...createInitialState(), status: 'active' }
      expect(isInGracePeriod(state)).toBe(false)
    })

    it('returns false for not_started subscription', () => {
      expect(isInGracePeriod(createInitialState())).toBe(false)
    })
  })
})
