/**
 * Unit tests for WhitelistPolicyStep
 *
 * Validates:
 * - Rendering: heading, toggle, sections, policy summary card
 * - Toggle: enabling/disabling restrictions changes visible sections
 * - Jurisdiction management: allowed and restricted search inputs appear when enabled
 * - Contradiction detection: same country in both lists shows warning
 * - Investor categories: category options appear when enabled
 * - Validation: continuation blocked by contradictions or unconfirmed policy
 * - Emit behavior: 'complete' and 'update' events fire correctly
 * - Draft restore: onMounted restores saved policy from store
 * - Accessibility: toggle has role="switch" and aria-checked, WCAG-friendly labels
 *
 * Business value: Ensures compliance officers can configure who may hold the token
 * in clear business language, with contradiction detection preventing invalid policies.
 * Regression risk: Removing contradiction check or validation gate would allow
 * contradictory/invalid whitelist policies to reach backend deployment.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useGuidedLaunchStore } from '../../../../stores/guidedLaunch'
import WhitelistPolicyStep from '../WhitelistPolicyStep.vue'

// ── Stubs ──────────────────────────────────────────────────────────────────

const ButtonStub = {
  name: 'Button',
  template: '<button :disabled="disabled" :type="type"><slot /></button>',
  props: ['disabled', 'type', 'variant', 'size', 'fullWidth'],
}

const CardStub = {
  name: 'Card',
  template: '<div class="card-stub"><slot /></div>',
  props: ['variant', 'padding'],
}

const BadgeStub = {
  name: 'Badge',
  template: '<span class="badge-stub"><slot /></span>',
  props: ['variant'],
}

const mountStep = () =>
  mount(WhitelistPolicyStep, {
    global: {
      stubs: { Button: ButtonStub, Card: CardStub, Badge: BadgeStub },
    },
  })

// ── Helpers ────────────────────────────────────────────────────────────────

async function enableToggle(wrapper: ReturnType<typeof mountStep>) {
  await wrapper.find('[data-testid="whitelist-enable-toggle"]').trigger('click')
  await nextTick()
}

async function confirmPolicy(wrapper: ReturnType<typeof mountStep>) {
  const checkbox = wrapper.find('[data-testid="policy-confirm-checkbox"]')
  if (checkbox.exists()) {
    // Manually set checked and fire change event for v-model checkbox
    const el = checkbox.element as HTMLInputElement
    el.checked = true
    await checkbox.trigger('change')
    await nextTick()
  }
}

describe('WhitelistPolicyStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders the Whitelist Policy heading', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('Whitelist Policy')
  })

  it('renders the enable-toggle button with role="switch"', () => {
    const wrapper = mountStep()
    const toggle = wrapper.find('[data-testid="whitelist-enable-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('role')).toBe('switch')
  })

  it('toggle has aria-checked="false" initially (restrictions disabled by default)', () => {
    const wrapper = mountStep()
    const toggle = wrapper.find('[data-testid="whitelist-enable-toggle"]')
    expect(toggle.attributes('aria-checked')).toBe('false')
  })

  it('shows info message when restrictions are disabled', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('freely transferable')
  })

  it('does NOT show allowed-jurisdiction-search when restrictions are disabled', () => {
    const wrapper = mountStep()
    expect(wrapper.find('[data-testid="allowed-jurisdiction-search"]').exists()).toBe(false)
  })

  it('does NOT show restricted-jurisdiction-search when restrictions are disabled', () => {
    const wrapper = mountStep()
    expect(wrapper.find('[data-testid="restricted-jurisdiction-search"]').exists()).toBe(false)
  })

  // ── Toggle behavior ────────────────────────────────────────────────────────

  it('toggleEnabled shows allowed-jurisdiction-search when enabled', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    expect(wrapper.find('[data-testid="allowed-jurisdiction-search"]').exists()).toBe(true)
  })

  it('toggleEnabled shows restricted-jurisdiction-search when enabled', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    expect(wrapper.find('[data-testid="restricted-jurisdiction-search"]').exists()).toBe(true)
  })

  it('toggle aria-checked becomes "true" after enabling', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    const toggle = wrapper.find('[data-testid="whitelist-enable-toggle"]')
    expect(toggle.attributes('aria-checked')).toBe('true')
  })

  it('re-disabling restrictions hides jurisdiction sections again', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    await enableToggle(wrapper) // toggle off
    expect(wrapper.find('[data-testid="allowed-jurisdiction-search"]').exists()).toBe(false)
  })

  // ── Continue without restrictions ─────────────────────────────────────────

  it('continue button exists with data-testid="whitelist-continue-button"', () => {
    const wrapper = mountStep()
    expect(wrapper.find('[data-testid="whitelist-continue-button"]').exists()).toBe(true)
  })

  it('emits "complete" immediately when restrictions are disabled', async () => {
    const wrapper = mountStep()
    await wrapper.find('[data-testid="whitelist-continue-button"]').trigger('click')
    await nextTick()
    expect(wrapper.emitted('complete')).toBeTruthy()
  })

  it('calls store.setWhitelistPolicy with isEnabled=false when disabled', async () => {
    const store = useGuidedLaunchStore()
    const wrapper = mountStep()
    await wrapper.find('[data-testid="whitelist-continue-button"]').trigger('click')
    await nextTick()
    expect(store.currentForm.whitelistPolicy?.isEnabled).toBe(false)
  })

  it('emits "complete" with isValid=true when disabled', async () => {
    const wrapper = mountStep()
    await wrapper.find('[data-testid="whitelist-continue-button"]').trigger('click')
    await nextTick()
    const events = wrapper.emitted('complete')
    expect(events).toBeTruthy()
    expect(events![0][0]).toMatchObject({ isValid: true })
  })

  // ── Contradiction detection ────────────────────────────────────────────────

  it('shows contradiction warning when same country is in both allowed and restricted', async () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy({
      isEnabled: true,
      allowedJurisdictions: [{ code: 'US', name: 'United States' }],
      restrictedJurisdictions: [{ code: 'US', name: 'United States' }],
      investorCategories: [],
      policyNotes: '',
      policyConfirmed: false,
    })
    const wrapper = mountStep()
    await nextTick()
    expect(wrapper.find('[data-testid="jurisdiction-contradiction-warning"]').exists()).toBe(true)
  })

  it('blocks "complete" emission when contradictions exist', async () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy({
      isEnabled: true,
      allowedJurisdictions: [{ code: 'DE', name: 'Germany' }],
      restrictedJurisdictions: [{ code: 'DE', name: 'Germany' }],
      investorCategories: [],
      policyNotes: '',
      policyConfirmed: true,
    })
    const wrapper = mountStep()
    await nextTick()
    await wrapper.find('[data-testid="whitelist-continue-button"]').trigger('click')
    await nextTick()
    expect(wrapper.emitted('complete')).toBeFalsy()
  })

  // ── Confirmation gate ─────────────────────────────────────────────────────

  it('shows a confirmation error if user clicks continue without confirming when enabled', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    await wrapper.find('[data-testid="whitelist-continue-button"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="policy-confirm-error"]').exists()).toBe(true)
  })

  it('does NOT emit "complete" when confirmation error fires (unconfirmed enabled policy)', async () => {
    // When enabled and unconfirmed, Continue should NOT emit 'complete'
    const wrapper = mountStep()
    await enableToggle(wrapper)
    // Do NOT confirm the policy
    await wrapper.find('[data-testid="whitelist-continue-button"]').trigger('click')
    await nextTick()
    // Should NOT have emitted complete (confirmation gate blocks it)
    expect(wrapper.emitted('complete')).toBeFalsy()
  })

  it('emits "complete" when enabled, confirmed, no contradictions', async () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy({
      isEnabled: true,
      allowedJurisdictions: [],
      restrictedJurisdictions: [],
      investorCategories: [],
      policyNotes: '',
      policyConfirmed: true,
    })
    const wrapper = mountStep()
    await nextTick()
    await wrapper.find('[data-testid="whitelist-continue-button"]').trigger('click')
    await nextTick()
    expect(wrapper.emitted('complete')).toBeTruthy()
  })

  // ── Investor categories ───────────────────────────────────────────────────

  it('shows investor category options (category-*) when restrictions are enabled', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    const cat = wrapper.find('[data-testid^="category-"]')
    expect(cat.exists()).toBe(true)
  })

  it('toggling an investor category emits "update"', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    const cat = wrapper.find('[data-testid^="category-"]')
    if (cat.exists()) {
      await cat.trigger('click')
      await nextTick()
      const updates = wrapper.emitted('update')
      expect(updates).toBeTruthy()
    }
  })

  // ── Policy summary card ───────────────────────────────────────────────────

  it('shows the policy-summary section when enabled', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    expect(wrapper.find('[data-testid="policy-summary"]').exists()).toBe(true)
  })

  it('summary shows "No jurisdiction restrictions" when both lists are empty', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    const summary = wrapper.find('[data-testid="policy-summary"]')
    expect(summary.text()).toContain('All countries are permitted')
  })

  // ── 'update' event ────────────────────────────────────────────────────────

  it('emits "update" when toggle is clicked', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    expect(wrapper.emitted('update')).toBeTruthy()
  })

  // ── Draft restore (onMounted) ─────────────────────────────────────────────

  it('restores isEnabled=true from draft on mount', async () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy({
      isEnabled: true,
      allowedJurisdictions: [],
      restrictedJurisdictions: [],
      investorCategories: [],
      policyNotes: 'Test note',
      policyConfirmed: false,
    })
    const wrapper = mountStep()
    await nextTick()
    const toggle = wrapper.find('[data-testid="whitelist-enable-toggle"]')
    expect(toggle.attributes('aria-checked')).toBe('true')
  })

  it('restores allowed jurisdictions from draft on mount', async () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy({
      isEnabled: true,
      allowedJurisdictions: [{ code: 'GB', name: 'United Kingdom' }],
      restrictedJurisdictions: [],
      investorCategories: [],
      policyNotes: '',
      policyConfirmed: false,
    })
    const wrapper = mountStep()
    await nextTick()
    expect(wrapper.find('[data-testid="allowed-tag-GB"]').exists()).toBe(true)
  })

  it('restores restricted jurisdictions from draft on mount', async () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy({
      isEnabled: true,
      allowedJurisdictions: [],
      restrictedJurisdictions: [{ code: 'KP', name: 'North Korea' }],
      investorCategories: [],
      policyNotes: '',
      policyConfirmed: false,
    })
    const wrapper = mountStep()
    await nextTick()
    expect(wrapper.find('[data-testid="restricted-tag-KP"]').exists()).toBe(true)
  })

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('toggle has aria-labelledby pointing to the section label', () => {
    const wrapper = mountStep()
    const toggle = wrapper.find('[data-testid="whitelist-enable-toggle"]')
    expect(toggle.attributes('aria-labelledby')).toBe('whitelist-enable-label')
  })

  it('allowed-jurisdiction-search has aria-label when enabled', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    const input = wrapper.find('[data-testid="allowed-jurisdiction-search"]')
    expect(input.attributes('aria-label')).toBeTruthy()
  })

  it('restricted-jurisdiction-search has aria-label when enabled', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    const input = wrapper.find('[data-testid="restricted-jurisdiction-search"]')
    expect(input.attributes('aria-label')).toBeTruthy()
  })

  it('policy-notes input has data-testid when enabled', async () => {
    const wrapper = mountStep()
    await enableToggle(wrapper)
    expect(wrapper.find('[data-testid="policy-notes"]').exists()).toBe(true)
  })

  it('does not render any wallet-connector text', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('does not use blockchain-jargon primary headings', () => {
    const wrapper = mountStep()
    const text = wrapper.text()
    // Business language check — no raw chain IDs or contract addresses
    expect(text).not.toMatch(/0x[0-9a-f]{40}/i)
    expect(text).not.toMatch(/smart contract/i)
  })
})
