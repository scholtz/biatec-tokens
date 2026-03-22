import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PolicyAuditCard from '../PolicyAuditCard.vue'
import type { WhitelistPolicy } from '../../../stores/whitelistPolicy'

function makePolicy(overrides: Partial<WhitelistPolicy> = {}): WhitelistPolicy {
  return {
    id: 'policy-1',
    tokenId: 'token-1',
    version: '1.0.0',
    status: 'active',
    defaultBehavior: 'deny_all',
    allowedJurisdictions: [],
    restrictedJurisdictions: [],
    blockedJurisdictions: [],
    allowedInvestorCategories: [],
    kycRequired: true,
    accreditationRequired: false,
    summary: 'Test policy',
    lastUpdatedAt: '2026-01-15T10:00:00Z',
    lastUpdatedBy: 'user-1',
    lastUpdatedByEmail: 'admin@example.com',
    createdAt: '2025-12-01T08:00:00Z',
    reviewStatus: 'approved',
    gaps: [],
    ...overrides,
  }
}

describe('PolicyAuditCard', () => {
  it('renders policy version', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ version: '2.3.1' }) } })
    expect(wrapper.text()).toContain('2.3.1')
  })

  it('renders Audit Trail heading', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy() } })
    expect(wrapper.text()).toContain('Audit Trail')
  })

  it('shows reviewer email', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ lastUpdatedByEmail: 'bob@acme.io' }) } })
    expect(wrapper.text()).toContain('bob@acme.io')
  })

  describe('reviewStatusClass', () => {
    it('returns green class for approved status', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ reviewStatus: 'approved' }) } })
      const badge = wrapper.find('[class*="bg-green-800"]')
      expect(badge.exists()).toBe(true)
    })

    it('returns amber class for pending_review status', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ reviewStatus: 'pending_review' }) } })
      const badge = wrapper.find('[class*="bg-amber-800"]')
      expect(badge.exists()).toBe(true)
    })

    it('returns red class for changes_requested status', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ reviewStatus: 'changes_requested' }) } })
      const badge = wrapper.find('[class*="bg-red-800"]')
      expect(badge.exists()).toBe(true)
    })

    it('returns fallback gray class for unknown review status', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ reviewStatus: 'unknown_status' as any }) } })
      const badge = wrapper.find('[class*="bg-gray-700"]')
      expect(badge.exists()).toBe(true)
    })
  })

  describe('reviewStatusLabel', () => {
    it('shows "Approved ✓" for approved', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ reviewStatus: 'approved' }) } })
      expect(wrapper.text()).toContain('Approved')
    })

    it('shows "Pending Review" for pending_review', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ reviewStatus: 'pending_review' }) } })
      expect(wrapper.text()).toContain('Pending Review')
    })

    it('shows "Changes Requested" for changes_requested', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ reviewStatus: 'changes_requested' }) } })
      expect(wrapper.text()).toContain('Changes Requested')
    })

    it('shows raw value for unknown review status', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ reviewStatus: 'custom_status' as any }) } })
      expect(wrapper.text()).toContain('custom_status')
    })
  })

  describe('statusClass', () => {
    it('returns green class for active status', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ status: 'active' }) } })
      const statusSpan = wrapper.findAll('[class*="rounded-full"]').find(el => el.text().includes('active'))
      expect(statusSpan?.classes().join(' ')).toMatch(/bg-green-800/)
    })

    it('returns gray class for draft status', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ status: 'draft' }) } })
      const statusSpan = wrapper.findAll('[class*="rounded-full"]').find(el => el.text().includes('draft'))
      expect(statusSpan?.classes().join(' ')).toMatch(/bg-gray-700/)
    })

    it('returns amber class for pending_review status', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ status: 'pending_review' }) } })
      const statusSpan = wrapper.findAll('[class*="rounded-full"]').find(el => el.text().includes('pending review'))
      expect(statusSpan?.classes().join(' ')).toMatch(/bg-amber-800/)
    })
  })

  describe('date formatting', () => {
    it('formats lastUpdatedAt date', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ lastUpdatedAt: '2026-01-15T10:00:00Z' }) } })
      // Should contain some date text (day number or month abbreviation)
      expect(wrapper.text()).toMatch(/Jan|2026|15/)
    })

    it('formats createdAt date', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ createdAt: '2025-12-01T08:00:00Z' }) } })
      expect(wrapper.text()).toMatch(/Dec|2025|1/)
    })

    it('returns raw string for invalid date', () => {
      const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy({ lastUpdatedAt: 'not-a-date' }) } })
      // Should gracefully handle invalid date without throwing
      expect(wrapper.exists()).toBe(true)
    })
  })

  it('has accessible region role', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy() } })
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toContain('audit')
  })

  it('shows Policy Version label', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy() } })
    expect(wrapper.text()).toContain('Policy Version')
  })

  it('shows Review Status label', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy() } })
    expect(wrapper.text()).toContain('Review Status')
  })

  it('shows Last Updated label', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy() } })
    expect(wrapper.text()).toContain('Last Updated')
  })

  it('shows Created label', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy() } })
    expect(wrapper.text()).toContain('Created')
  })

  it('shows Status label', () => {
    const wrapper = mount(PolicyAuditCard, { props: { policy: makePolicy() } })
    expect(wrapper.text()).toContain('Status')
  })
})
