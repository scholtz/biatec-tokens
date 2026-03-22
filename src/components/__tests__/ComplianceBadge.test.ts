/**
 * Unit Tests: ComplianceBadge
 *
 * Validates badge rendering based on complianceFlags props.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ComplianceBadge from '../ComplianceBadge.vue'

const defaultFlags = {
  micaReady: false,
  whitelistRequired: false,
  kycRequired: false,
  jurisdictionRestricted: false,
  transferRestricted: false,
}

const mountBadge = (flags = defaultFlags) =>
  mount(ComplianceBadge, {
    props: { complianceFlags: flags },
    global: {
      stubs: {
        Badge: { template: '<span class="badge"><slot /></span>' },
        Tooltip: { template: '<div><slot /><slot name="content" /></div>' },
      },
    },
  })

describe('ComplianceBadge', () => {
  it('renders "Unrestricted" badge when all flags are false', () => {
    const wrapper = mountBadge()
    expect(wrapper.text()).toContain('Unrestricted')
  })

  it('hasAnyFlags computed returns false when no flags set', () => {
    const wrapper = mountBadge()
    expect((wrapper.vm as any).hasAnyFlags).toBe(false)
  })

  it('hasAnyFlags computed returns true when micaReady is set', () => {
    const wrapper = mountBadge({ ...defaultFlags, micaReady: true })
    expect((wrapper.vm as any).hasAnyFlags).toBe(true)
  })

  it('shows MICA Ready badge when micaReady is true', () => {
    const wrapper = mountBadge({ ...defaultFlags, micaReady: true })
    expect(wrapper.text()).toContain('MICA Ready')
  })

  it('hides MICA Ready badge when micaReady is false', () => {
    const wrapper = mountBadge()
    expect(wrapper.text()).not.toContain('MICA Ready')
  })

  it('shows Whitelist badge when whitelistRequired is true', () => {
    const wrapper = mountBadge({ ...defaultFlags, whitelistRequired: true })
    expect(wrapper.text()).toContain('Whitelist')
  })

  it('shows KYC badge when kycRequired is true', () => {
    const wrapper = mountBadge({ ...defaultFlags, kycRequired: true })
    expect(wrapper.text()).toContain('KYC')
  })

  it('shows Jurisdiction Restricted badge when jurisdictionRestricted is true', () => {
    const wrapper = mountBadge({ ...defaultFlags, jurisdictionRestricted: true })
    expect(wrapper.text()).toContain('Restricted')
  })

  it('shows Transfer Restricted badge when transferRestricted is true', () => {
    const wrapper = mountBadge({ ...defaultFlags, transferRestricted: true })
    expect(wrapper.text()).toContain('Transfer')
  })

  it('renders multiple badges when multiple flags are set', () => {
    const wrapper = mountBadge({
      ...defaultFlags,
      micaReady: true,
      whitelistRequired: true,
      kycRequired: true,
    })
    expect(wrapper.text()).toContain('MICA Ready')
    expect(wrapper.text()).toContain('Whitelist')
    expect(wrapper.text()).toContain('KYC')
  })

  it('hasAnyFlags returns true when any single flag is true', () => {
    const flags = ['micaReady', 'whitelistRequired', 'kycRequired', 'jurisdictionRestricted', 'transferRestricted'] as const
    flags.forEach(flag => {
      const wrapper = mountBadge({ ...defaultFlags, [flag]: true })
      expect((wrapper.vm as any).hasAnyFlags).toBe(true)
    })
  })
})
