import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrialCountdownBanner from '../TrialCountdownBanner.vue'
import { useSubscriptionStore } from '../../stores/subscription'

const makeMount = (trialDaysRemaining: number, isInTrial = true) => {
  const pinia = createTestingPinia({ createSpy: vi.fn })
  const store = useSubscriptionStore(pinia)
  store.isInTrial = isInTrial as any
  store.trialDaysRemaining = trialDaysRemaining as any
  return mount(TrialCountdownBanner, {
    global: {
      plugins: [pinia],
      stubs: { RouterLink: { template: '<a><slot/></a>' }, ClockIcon: true, XMarkIcon: true },
    },
  })
}

describe('TrialCountdownBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('renders banner when in trial', () => {
    const w = makeMount(5)
    const banner = w.find('[data-testid="trial-countdown-banner"]')
    expect(banner.exists()).toBe(true)
  })

  it('does not render banner when not in trial', () => {
    const w = makeMount(5, false)
    const banner = w.find('[data-testid="trial-countdown-banner"]')
    expect(banner.exists()).toBe(false)
  })

  it('shows 0-day message', () => {
    const w = makeMount(0)
    expect(w.text()).toContain('expires today')
  })

  it('shows 1-day message', () => {
    const w = makeMount(1)
    expect(w.text()).toContain('1 day left')
  })

  it('shows multi-day message', () => {
    const w = makeMount(10)
    expect(w.text()).toContain('10 days left')
  })

  it('applies red class for <= 3 days remaining', () => {
    const w = makeMount(2)
    expect(w.html()).toContain('bg-red-600')
  })

  it('applies yellow class for 4-7 days remaining', () => {
    const w = makeMount(5)
    expect(w.html()).toContain('bg-yellow-500')
  })

  it('applies blue class for > 7 days remaining', () => {
    const w = makeMount(10)
    expect(w.html()).toContain('bg-blue-600')
  })

  it('dismisses banner on dismiss button click', async () => {
    const w = makeMount(5)
    const dismissBtn = w.find('[data-testid="trial-banner-dismiss"]')
    await dismissBtn.trigger('click')
    const banner = w.find('[data-testid="trial-countdown-banner"]')
    expect(banner.exists()).toBe(false)
  })
})
