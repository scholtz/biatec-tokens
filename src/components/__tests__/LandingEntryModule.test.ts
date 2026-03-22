/**
 * Unit Tests: LandingEntryModule
 *
 * Validates rendering, email sign-up button, and emitted events.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import LandingEntryModule from '../LandingEntryModule.vue'

vi.mock('../../services/TelemetryService', () => ({
  telemetryService: {
    trackEmailSignupStarted: vi.fn(),
    trackOnboardingStarted: vi.fn(),
    trackOnboardingStepComplete: vi.fn(),
  },
}))

const mountModule = () =>
  mount(LandingEntryModule, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
      ],
    },
  })

describe('LandingEntryModule', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders the module with data-testid', () => {
    const wrapper = mountModule()
    expect(wrapper.find('[data-testid="landing-entry-module"]').exists()).toBe(true)
  })

  it('renders "Get Started with Biatec Tokens" heading', () => {
    const wrapper = mountModule()
    expect(wrapper.text()).toContain('Get Started with Biatec Tokens')
  })

  it('renders the email signup button', () => {
    const wrapper = mountModule()
    expect(wrapper.find('[data-testid="email-signup-button"]').exists()).toBe(true)
  })

  it('renders "Start with Email" option text', () => {
    const wrapper = mountModule()
    expect(wrapper.text()).toContain('Start with Email')
  })

  it('renders "Recommended" label on the email path', () => {
    const wrapper = mountModule()
    expect(wrapper.text()).toContain('Recommended')
  })

  it('renders informational footer about blockchain tokens', () => {
    const wrapper = mountModule()
    expect(wrapper.text()).toContain('New to blockchain tokens?')
  })

  // ── Interactions ──────────────────────────────────────────────────────────

  it('emits "email-signup" when email button is clicked', async () => {
    const wrapper = mountModule()
    await wrapper.find('[data-testid="email-signup-button"]').trigger('click')
    expect(wrapper.emitted('email-signup')).toBeTruthy()
    expect(wrapper.emitted('email-signup')!.length).toBe(1)
  })

  // ── Product alignment ────────────────────────────────────────────────────

  it('does not contain wallet connector UI', () => {
    const wrapper = mountModule()
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('mentions email-first approach in the copy', () => {
    const wrapper = mountModule()
    expect(wrapper.text().toLowerCase()).toContain('email')
  })
})
