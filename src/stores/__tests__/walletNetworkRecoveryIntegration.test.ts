/**
 * Integration tests: wallet/network context change detection + WalletSessionRecoveryBanner
 *
 * Covers:
 * - detectContextChange pure function for all ContextChangeKind values
 * - Impact, requiresReauth, shouldPauseCurrentOperation for each kind
 * - Human-readable title/message/actionLabel fields
 * - buildContextSnapshot helper
 * - isOperationBlocked / requiresUserAcknowledgement guards
 * - getContextChangeToastText helper
 * - WalletSessionRecoveryBanner component integration (show/hide/events)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  detectContextChange,
  buildContextSnapshot,
  isOperationBlocked,
  requiresUserAcknowledgement,
  getContextChangeToastText,
  type WalletContextSnapshot,
} from '../../utils/walletNetworkChangeHandler'
import WalletSessionRecoveryBanner from '../../components/guidedLaunch/WalletSessionRecoveryBanner.vue'

// ── Snapshot helpers ──────────────────────────────────────────────────────────

const snap = (
  accountAddress: string | null,
  network: string | null,
): WalletContextSnapshot => ({ accountAddress, network, sessionId: null })

const ADDR_A = 'ALGO_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const ADDR_B = 'ALGO_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
const NET_MAIN = 'algorand_mainnet'
const NET_TEST = 'algorand_testnet'

describe('walletNetworkChangeHandler — detectContextChange', () => {
  // ── account_changed ───────────────────────────────────────────────────────

  it('returns kind=account_changed when only account changes', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(result.kind).toBe('account_changed')
  })

  it('account_changed has impact=blocking', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(result.impact).toBe('blocking')
  })

  it('account_changed has requiresReauth=false (different user, same network)', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(result.requiresReauth).toBe(false)
  })

  it('account_changed has shouldPauseCurrentOperation=true', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(result.shouldPauseCurrentOperation).toBe(true)
  })

  it('account_changed has non-empty title', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(result.title.length).toBeGreaterThan(0)
  })

  it('account_changed has non-empty message', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(result.message.length).toBeGreaterThan(0)
  })

  it('account_changed has non-null actionLabel', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(result.actionLabel).not.toBeNull()
  })

  // ── network_changed ───────────────────────────────────────────────────────

  it('returns kind=network_changed when only network changes', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_TEST))
    expect(result.kind).toBe('network_changed')
  })

  it('network_changed has impact=warning', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_TEST))
    expect(result.impact).toBe('warning')
  })

  it('network_changed has shouldPauseCurrentOperation=false', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_TEST))
    expect(result.shouldPauseCurrentOperation).toBe(false)
  })

  it('network_changed has requiresReauth=false', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_TEST))
    expect(result.requiresReauth).toBe(false)
  })

  it('network_changed message contains both network names', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_TEST))
    expect(result.message).toContain(NET_MAIN)
    expect(result.message).toContain(NET_TEST)
  })

  // ── account_and_network_changed ───────────────────────────────────────────

  it('returns kind=account_and_network_changed when both change', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_TEST))
    expect(result.kind).toBe('account_and_network_changed')
  })

  it('account_and_network_changed has impact=blocking', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_TEST))
    expect(result.impact).toBe('blocking')
  })

  it('account_and_network_changed has requiresReauth=true', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_TEST))
    expect(result.requiresReauth).toBe(true)
  })

  it('account_and_network_changed has shouldPauseCurrentOperation=true', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_TEST))
    expect(result.shouldPauseCurrentOperation).toBe(true)
  })

  it('account_and_network_changed has non-null actionLabel', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_TEST))
    expect(result.actionLabel).not.toBeNull()
  })

  // ── no_change ─────────────────────────────────────────────────────────────

  it('returns kind=no_change when nothing changes', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(result.kind).toBe('no_change')
  })

  it('no_change has impact=none', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(result.impact).toBe('none')
  })

  it('no_change has shouldPauseCurrentOperation=false', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(result.shouldPauseCurrentOperation).toBe(false)
  })

  it('no_change has actionLabel=null', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(result.actionLabel).toBeNull()
  })

  // ── session_cleared ───────────────────────────────────────────────────────

  it('returns kind=session_cleared when address goes null', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(null, NET_MAIN))
    expect(result.kind).toBe('session_cleared')
  })

  it('session_cleared has impact=blocking', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(null, NET_MAIN))
    expect(result.impact).toBe('blocking')
  })

  it('session_cleared has requiresReauth=true', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(null, NET_MAIN))
    expect(result.requiresReauth).toBe(true)
  })

  it('session_cleared has shouldPauseCurrentOperation=true', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(null, NET_MAIN))
    expect(result.shouldPauseCurrentOperation).toBe(true)
  })

  // ── session_restored ──────────────────────────────────────────────────────

  it('returns kind=session_restored when prev address was null', () => {
    const result = detectContextChange(snap(null, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(result.kind).toBe('session_restored')
  })

  it('session_restored has impact=informational', () => {
    const result = detectContextChange(snap(null, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(result.impact).toBe('informational')
  })

  it('session_restored has shouldPauseCurrentOperation=false', () => {
    const result = detectContextChange(snap(null, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(result.shouldPauseCurrentOperation).toBe(false)
  })

  it('session_restored has requiresReauth=false', () => {
    const result = detectContextChange(snap(null, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(result.requiresReauth).toBe(false)
  })

  // ── prev/next echoed correctly ────────────────────────────────────────────

  it('result.prev and result.next reflect the inputs', () => {
    const prev = snap(ADDR_A, NET_MAIN)
    const next = snap(ADDR_B, NET_TEST)
    const result = detectContextChange(prev, next)
    expect(result.prev).toEqual(prev)
    expect(result.next).toEqual(next)
  })
})

describe('walletNetworkChangeHandler — guard helpers', () => {
  it('isOperationBlocked returns true for blocking change', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(isOperationBlocked(result)).toBe(true)
  })

  it('isOperationBlocked returns false for no_change', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(isOperationBlocked(result)).toBe(false)
  })

  it('requiresUserAcknowledgement returns true for blocking impact', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(requiresUserAcknowledgement(result)).toBe(true)
  })

  it('requiresUserAcknowledgement returns false for no_change', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(requiresUserAcknowledgement(result)).toBe(false)
  })

  it('getContextChangeToastText returns empty string for no_change', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_A, NET_MAIN))
    expect(getContextChangeToastText(result)).toBe('')
  })

  it('getContextChangeToastText returns non-empty string for account_changed', () => {
    const result = detectContextChange(snap(ADDR_A, NET_MAIN), snap(ADDR_B, NET_MAIN))
    expect(getContextChangeToastText(result).length).toBeGreaterThan(0)
  })
})

describe('walletNetworkChangeHandler — buildContextSnapshot', () => {
  it('builds snapshot from user object', () => {
    const snap2 = buildContextSnapshot({ address: ADDR_A, network: NET_MAIN, sessionId: 'abc' })
    expect(snap2.accountAddress).toBe(ADDR_A)
    expect(snap2.network).toBe(NET_MAIN)
    expect(snap2.sessionId).toBe('abc')
  })

  it('builds null snapshot from null user', () => {
    const snap2 = buildContextSnapshot(null)
    expect(snap2.accountAddress).toBeNull()
    expect(snap2.network).toBeNull()
  })

  it('handles user with missing optional fields', () => {
    const snap2 = buildContextSnapshot({ address: ADDR_A })
    expect(snap2.accountAddress).toBe(ADDR_A)
    expect(snap2.network).toBeNull()
  })
})

describe('WalletSessionRecoveryBanner — component integration', () => {
  const mountBanner = (props: Record<string, unknown> = {}) =>
    mount(WalletSessionRecoveryBanner, {
      props: { isRecoveryNeeded: true, ...props },
      global: {
        stubs: {
          ExclamationCircleIcon: { template: '<span />' },
          XMarkIcon: { template: '<span />' },
          ArrowPathIcon: { template: '<span />' },
        },
      },
    })

  it('renders banner when isRecoveryNeeded=true', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(true)
  })

  it('hides banner when isRecoveryNeeded=false', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: false })
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(false)
  })

  it('shows dismiss button when banner is visible', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    expect(wrapper.find('[data-testid="banner-dismiss"]').exists()).toBe(true)
  })

  it('emitting dismiss hides the banner', async () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    await wrapper.find('[data-testid="banner-dismiss"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(false)
  })

  it('emits "dismiss" event when dismiss button is clicked', async () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    await wrapper.find('[data-testid="banner-dismiss"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  it('emits "restore" event when Restore Session button is clicked', async () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    await wrapper.find('[data-testid="banner-restore-btn"]').trigger('click')
    expect(wrapper.emitted('restore')).toBeTruthy()
  })

  it('emits "start-fresh" event when Start Fresh button is clicked', async () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    await wrapper.find('[data-testid="banner-start-fresh-btn"]').trigger('click')
    expect(wrapper.emitted('start-fresh')).toBeTruthy()
  })

  it('shows session_interrupted title by default', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    expect(wrapper.find('[data-testid="banner-title"]').text()).toMatch(/Session interrupted/i)
  })

  it('shows network_mismatch title when reason=network_mismatch', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true, reason: 'network_mismatch' })
    expect(wrapper.find('[data-testid="banner-title"]').text()).toMatch(/Network mismatch/i)
  })

  it('shows session_expired title when reason=session_expired', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true, reason: 'session_expired' })
    expect(wrapper.find('[data-testid="banner-title"]').text()).toMatch(/Session expired/i)
  })

  it('shows network mismatch detail when reason=network_mismatch and networks provided', () => {
    const wrapper = mountBanner({
      isRecoveryNeeded: true,
      reason: 'network_mismatch',
      expectedNetwork: 'algorand_mainnet',
      currentNetwork: 'algorand_testnet',
    })
    expect(wrapper.find('[data-testid="network-mismatch-detail"]').exists()).toBe(true)
  })

  it('does not show network mismatch detail for session_interrupted', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true, reason: 'session_interrupted' })
    expect(wrapper.find('[data-testid="network-mismatch-detail"]').exists()).toBe(false)
  })

  it('shows explanation text', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    const explanation = wrapper.find('[data-testid="banner-explanation"]')
    expect(explanation.exists()).toBe(true)
    expect(explanation.text().length).toBeGreaterThan(0)
  })

  it('re-shows banner when isRecoveryNeeded transitions false → true', async () => {
    const wrapper = mountBanner({ isRecoveryNeeded: true })
    // Dismiss it
    await wrapper.find('[data-testid="banner-dismiss"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(false)
    // Parent re-activates
    await wrapper.setProps({ isRecoveryNeeded: false })
    await wrapper.setProps({ isRecoveryNeeded: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(true)
  })
})
