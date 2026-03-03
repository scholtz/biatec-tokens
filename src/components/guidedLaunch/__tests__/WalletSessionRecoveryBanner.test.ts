/**
 * Unit tests for WalletSessionRecoveryBanner component
 *
 * Validates:
 * - Renders when isRecoveryNeeded is true
 * - Hidden when isRecoveryNeeded is false
 * - Correct title and explanation per reason
 * - Network mismatch detail block visibility
 * - Dismiss, restore, and start-fresh actions
 * - Re-shows when isRecoveryNeeded toggles back on
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import WalletSessionRecoveryBanner from '../WalletSessionRecoveryBanner.vue'
import type { RecoveryReason } from '../WalletSessionRecoveryBanner.vue'

const mountBanner = (props: Record<string, unknown> = {}) =>
  mount(WalletSessionRecoveryBanner, {
    props: {
      isRecoveryNeeded: true,
      reason: 'session_interrupted' as RecoveryReason,
      ...props,
    },
    global: {
      stubs: {
        ExclamationCircleIcon: { template: '<span />' },
        XMarkIcon: { template: '<span />' },
        ArrowPathIcon: { template: '<span />' },
      },
    },
  })

describe('WalletSessionRecoveryBanner', () => {
  // ── Visibility ─────────────────────────────────────────────────────────────

  it('is visible when isRecoveryNeeded is true', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(true)
  })

  it('is hidden when isRecoveryNeeded is false', () => {
    const wrapper = mountBanner({ isRecoveryNeeded: false })
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(false)
  })

  // ── Title per reason ───────────────────────────────────────────────────────

  it('shows "Session interrupted" title for session_interrupted', () => {
    const wrapper = mountBanner({ reason: 'session_interrupted' })
    expect(wrapper.find('[data-testid="banner-title"]').text()).toContain('Session interrupted')
  })

  it('shows "Network mismatch detected" title for network_mismatch', () => {
    const wrapper = mountBanner({ reason: 'network_mismatch' })
    expect(wrapper.find('[data-testid="banner-title"]').text()).toContain('Network mismatch')
  })

  it('shows "Session expired" title for session_expired', () => {
    const wrapper = mountBanner({ reason: 'session_expired' })
    expect(wrapper.find('[data-testid="banner-title"]').text()).toContain('Session expired')
  })

  // ── Explanation text ───────────────────────────────────────────────────────

  it('shows interrupted explanation for session_interrupted', () => {
    const wrapper = mountBanner({ reason: 'session_interrupted' })
    expect(wrapper.find('[data-testid="banner-explanation"]').text()).toContain('interrupted')
  })

  it('shows network explanation for network_mismatch', () => {
    const wrapper = mountBanner({ reason: 'network_mismatch' })
    expect(wrapper.find('[data-testid="banner-explanation"]').text()).toContain('network')
  })

  it('shows expired explanation for session_expired', () => {
    const wrapper = mountBanner({ reason: 'session_expired' })
    expect(wrapper.find('[data-testid="banner-explanation"]').text()).toContain('expired')
  })

  // ── Network mismatch detail ────────────────────────────────────────────────

  it('shows network mismatch detail when reason is network_mismatch and networks provided', () => {
    const wrapper = mountBanner({
      reason: 'network_mismatch',
      expectedNetwork: 'algorand',
      currentNetwork: 'algorand-testnet',
    })
    const detail = wrapper.find('[data-testid="network-mismatch-detail"]')
    expect(detail.exists()).toBe(true)
    expect(detail.text()).toContain('algorand')
  })

  it('hides network mismatch detail for non-mismatch reason', () => {
    const wrapper = mountBanner({ reason: 'session_interrupted' })
    expect(wrapper.find('[data-testid="network-mismatch-detail"]').exists()).toBe(false)
  })

  // ── Actions ────────────────────────────────────────────────────────────────

  it('emits restore event when Restore Session button clicked', async () => {
    const wrapper = mountBanner()
    await wrapper.find('[data-testid="banner-restore-btn"]').trigger('click')
    expect(wrapper.emitted('restore')).toBeTruthy()
  })

  it('emits start-fresh event when Start Fresh button clicked', async () => {
    const wrapper = mountBanner()
    await wrapper.find('[data-testid="banner-start-fresh-btn"]').trigger('click')
    expect(wrapper.emitted('start-fresh')).toBeTruthy()
  })

  it('emits dismiss event and hides banner when dismiss clicked', async () => {
    const wrapper = mountBanner()
    await wrapper.find('[data-testid="banner-dismiss"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(false)
  })

  it('re-shows banner when isRecoveryNeeded toggles back to true after dismiss', async () => {
    const wrapper = mountBanner()
    await wrapper.find('[data-testid="banner-dismiss"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(false)

    await wrapper.setProps({ isRecoveryNeeded: false })
    await wrapper.setProps({ isRecoveryNeeded: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="wallet-session-recovery-banner"]').exists()).toBe(true)
  })
})
