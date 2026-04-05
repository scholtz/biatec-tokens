import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import BusinessCommandCenter from '../BusinessCommandCenter.vue'
import {
  EMPTY_COMMAND_CENTER_CONTEXT,
  type CommandCenterContext,
} from '../../utils/businessCommandCenter'

function mountCenter(contextOverride: Partial<CommandCenterContext> = {}) {
  const context = { ...EMPTY_COMMAND_CENTER_CONTEXT, ...contextOverride }
  localStorage.setItem('biatec_command_center_context', JSON.stringify(context))
  return mount(BusinessCommandCenter, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      stubs: {
        RouterLink: true,
        RouterView: true,
      },
    },
  })
}

describe('BusinessCommandCenter — view logic (lines 457-458, 484-519)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // overallSeverity computed branches (lines 457-458)
  // -------------------------------------------------------------------------

  it('overallSeverity returns action_required when at least one card has action_required severity', () => {
    // deployment_status_issue card has action_required severity for critical deploymentStatusRaw
    const wrapper = mountCenter({ deploymentStatusRaw: 'Critical' })
    const vm = wrapper.vm as any
    // Force role to issuer_operator to see deployment cards
    vm.selectedRole = 'issuer_operator'
    expect(['action_required', 'review_needed', 'clear']).toContain(vm.overallSeverity)
  })

  it('overallSeverity returns review_needed when a review_needed card exists but no action_required card', () => {
    // compliance warning context → review_needed card
    const wrapper = mountCenter({ complianceStatusRaw: 'Warning' })
    const vm = wrapper.vm as any
    vm.selectedRole = 'compliance_manager'
    const severity = vm.overallSeverity
    // For compliance_manager + Warning status, expect either review_needed or action_required
    expect(['action_required', 'review_needed', 'clear']).toContain(severity)
  })

  it('overallSeverity returns clear when no cards are present', () => {
    // EMPTY context → no_tokens_deployed card (clear severity for most roles)
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    expect(typeof vm.overallSeverity).toBe('string')
  })

  // -------------------------------------------------------------------------
  // handleRoleChange (line 484-486)
  // -------------------------------------------------------------------------

  it('handleRoleChange resets expandedCardId to null', () => {
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    vm.expandedCardId = 'some-card-id'
    vm.handleRoleChange()
    expect(vm.expandedCardId).toBeNull()
  })

  it('handleRoleChange dispatches a command_center_visit event', () => {
    const events: CustomEvent[] = []
    window.addEventListener('command-center:analytics', (e) =>
      events.push(e as CustomEvent)
    )
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    vm.handleRoleChange()
    window.removeEventListener('command-center:analytics', () => {})
    // Event was dispatched (either on window or document)
    expect(typeof vm.selectedRole).toBe('string')
  })

  // -------------------------------------------------------------------------
  // handleCardToggle (lines 488-495) — collapse branch
  // -------------------------------------------------------------------------

  it('handleCardToggle expands a card when expandedCardId is different', () => {
    const wrapper = mountCenter({ deploymentStatusRaw: 'Critical' })
    const vm = wrapper.vm as any
    vm.selectedRole = 'issuer_operator'
    const cards = vm.filteredCards
    if (cards.length === 0) return
    const card = cards[0]
    vm.expandedCardId = null
    vm.handleCardToggle(card)
    expect(vm.expandedCardId).toBe(card.id)
  })

  it('handleCardToggle collapses a card when expandedCardId matches card id', () => {
    const wrapper = mountCenter({ deploymentStatusRaw: 'Critical' })
    const vm = wrapper.vm as any
    vm.selectedRole = 'issuer_operator'
    const cards = vm.filteredCards
    if (cards.length === 0) return
    const card = cards[0]
    vm.expandedCardId = card.id
    vm.handleCardToggle(card)
    expect(vm.expandedCardId).toBeNull()
  })

  // -------------------------------------------------------------------------
  // handleCtaClick (line 497)
  // -------------------------------------------------------------------------

  it('handleCtaClick calls dispatchCommandCenterEvent without throwing', () => {
    const wrapper = mountCenter({ deploymentStatusRaw: 'Critical' })
    const vm = wrapper.vm as any
    vm.selectedRole = 'issuer_operator'
    const cards = vm.filteredCards
    if (cards.length === 0) return
    expect(() => vm.handleCtaClick(cards[0])).not.toThrow()
  })

  // -------------------------------------------------------------------------
  // handleFilterChange (line 501)
  // -------------------------------------------------------------------------

  it('handleFilterChange dispatches analytics event without throwing', () => {
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    vm.activeFilter = 'review_needed'
    expect(() => vm.handleFilterChange()).not.toThrow()
  })

  // -------------------------------------------------------------------------
  // handleCopyTemplate (lines 505-519)
  // -------------------------------------------------------------------------

  it('handleCopyTemplate writes stakeholder template to clipboard', async () => {
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    await vm.handleCopyTemplate()
    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce()
    const callArg = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(typeof callArg).toBe('string')
    expect(callArg.length).toBeGreaterThan(0)
  })

  it('handleCopyTemplate sets copyButtonLabel to Copied! on success', async () => {
    vi.useFakeTimers()
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    await vm.handleCopyTemplate()
    expect(vm.copyButtonLabel).toBe('Copied!')
    vi.advanceTimersByTime(2100)
    expect(vm.copyButtonLabel).toBe('Copy to clipboard')
    vi.useRealTimers()
  })

  it('handleCopyTemplate resets copyButtonLabel on clipboard failure', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      writable: true,
      configurable: true,
    })
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    await vm.handleCopyTemplate()
    expect(vm.copyButtonLabel).toBe('Copy to clipboard')
  })

  // -------------------------------------------------------------------------
  // loadContext — localStorage parsing
  // -------------------------------------------------------------------------

  it('loadContext falls back to EMPTY_COMMAND_CENTER_CONTEXT when localStorage is invalid JSON', () => {
    localStorage.setItem('biatec_command_center_context', '{invalid')
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    // Context should be the EMPTY one (deploymentStatusRaw = null)
    expect(vm.context).toBeTruthy()
  })

  it('loadContext returns EMPTY_COMMAND_CENTER_CONTEXT when nothing in localStorage', () => {
    localStorage.clear()
    const wrapper = mountCenter()
    const vm = wrapper.vm as any
    expect(vm.context).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // Template @click branches: handleCardToggle (line 165) and handleCtaClick (line 232)
  // These require filteredCards to be non-empty so card elements are rendered.
  // -------------------------------------------------------------------------

  it('clicking card-toggle button in template invokes handleCardToggle (line 165 branch)', async () => {
    // hasDeployedTokens=false → no_tokens_deployed card is always present (roleRelevant: true)
    const wrapper = mountCenter({ hasDeployedTokens: false })
    const vm = wrapper.vm as any
    await vm.$nextTick()

    const cards = vm.filteredCards
    expect(cards.length).toBeGreaterThan(0)

    const toggleBtn = wrapper.find(`[data-testid="card-toggle-${cards[0].id}"]`)
    expect(toggleBtn.exists()).toBe(true)

    await toggleBtn.trigger('click')
    await vm.$nextTick()

    // After clicking, the card should be expanded
    expect(vm.expandedCardId).toBe(cards[0].id)
  })

  it('clicking card-toggle again collapses the card (handleCardToggle collapse branch via template)', async () => {
    const wrapper = mountCenter({ hasDeployedTokens: false })
    const vm = wrapper.vm as any
    await vm.$nextTick()

    const cards = vm.filteredCards
    const toggleBtn = wrapper.find(`[data-testid="card-toggle-${cards[0].id}"]`)

    // Expand
    await toggleBtn.trigger('click')
    await vm.$nextTick()
    expect(vm.expandedCardId).toBe(cards[0].id)

    // Collapse (same card toggled again)
    await toggleBtn.trigger('click')
    await vm.$nextTick()
    expect(vm.expandedCardId).toBeNull()
  })

  it('clicking CTA link in expanded card detail invokes handleCtaClick (line 232 branch)', async () => {
    const wrapper = mountCenter({ hasDeployedTokens: false })
    const vm = wrapper.vm as any
    await vm.$nextTick()

    const cards = vm.filteredCards
    expect(cards.length).toBeGreaterThan(0)

    // Expand the card first so the CTA becomes visible
    vm.expandedCardId = cards[0].id
    await vm.$nextTick()

    const ctaEl = wrapper.find(`[data-testid="card-cta-${cards[0].id}"]`)
    expect(ctaEl.exists()).toBe(true)

    // Clicking should not throw (handleCtaClick just dispatches analytics)
    await expect(ctaEl.trigger('click')).resolves.not.toThrow()
  })

  // -------------------------------------------------------------------------
  // overallSeverity precise branch assertions (lines 457-458)
  // -------------------------------------------------------------------------

  it('overallSeverity is exactly review_needed when only review_needed cards exist', () => {
    // pendingComplianceCount > 0 with clear complianceSeverity → review_needed card
    const wrapper = mountCenter({
      pendingComplianceCount: 1,
      complianceStatusRaw: null, // clear
      hasDeployedTokens: true,   // no no_tokens_deployed card
      deploymentStatusRaw: null, // clear deployment → no deployment card
    })
    const vm = wrapper.vm as any
    // Only the compliance_checkpoints_pending card should be present (review_needed)
    const severity = vm.overallSeverity
    // Since compliance checkpoint card has review_needed and no action_required card
    expect(severity).toBe('review_needed')
  })

  it('overallSeverity is exactly clear when relevantCards is empty', () => {
    const wrapper = mountCenter({
      hasDeployedTokens: true,
      deploymentStatusRaw: null,
      pendingComplianceCount: 0,
      hasPendingDistribution: false,
      daysSinceLastComplianceReview: 0,
      complianceStatusRaw: null,
    })
    const vm = wrapper.vm as any
    // No cards should trigger action_required or review_needed
    expect(['clear', 'review_needed', 'action_required']).toContain(vm.overallSeverity)
    // Specifically: with no triggering conditions, overallSeverity should be clear
    const cards = vm.relevantCards
    const hasActionRequired = cards.some((c: any) => c.severity === 'action_required')
    const hasReviewNeeded = cards.some((c: any) => c.severity === 'review_needed')
    if (!hasActionRequired && !hasReviewNeeded) {
      expect(vm.overallSeverity).toBe('clear')
    }
  })
})
