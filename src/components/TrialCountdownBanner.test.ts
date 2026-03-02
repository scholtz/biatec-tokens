import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TrialCountdownBanner from './TrialCountdownBanner.vue'
import { useSubscriptionStore } from '../stores/subscription'

vi.mock('../stores/subscription', () => ({
  useSubscriptionStore: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}))

const createMockStore = (overrides: {
  isInTrial?: boolean
  trialDaysRemaining?: number
}) => {
  vi.mocked(useSubscriptionStore).mockReturnValue({
    isInTrial: overrides.isInTrial ?? true,
    trialDaysRemaining: overrides.trialDaysRemaining ?? 10,
  } as ReturnType<typeof useSubscriptionStore>)
}

describe('TrialCountdownBanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when in trial', () => {
    it('should render the banner when isInTrial is true', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 7 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="trial-countdown-banner"]').exists()).toBe(true)
    })

    it('should show correct days remaining text', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 10 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="trial-days-text"]').text()).toContain('10 days left')
    })

    it('should show singular "1 day left" when 1 day remaining', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 1 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="trial-days-text"]').text()).toContain('1 day left')
    })

    it('should show "expires today" message when 0 days remaining', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 0 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="trial-days-text"]').text()).toContain('expires today')
    })

    it('should show upgrade link', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 5 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="trial-upgrade-link"]').exists()).toBe(true)
    })

    it('should show dismiss button', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 5 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="trial-banner-dismiss"]').exists()).toBe(true)
    })

    it('should use red styling when 3 or fewer days remain', async () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 2 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      const banner = wrapper.find('[data-testid="trial-countdown-banner"]')
      expect(banner.classes()).toContain('bg-red-600')
    })

    it('should use yellow styling when 4-7 days remain', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 6 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      const banner = wrapper.find('[data-testid="trial-countdown-banner"]')
      expect(banner.classes()).toContain('bg-yellow-500')
    })

    it('should use blue styling when more than 7 days remain', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 14 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      const banner = wrapper.find('[data-testid="trial-countdown-banner"]')
      expect(banner.classes()).toContain('bg-blue-600')
    })

    it('should have correct role and aria-label for accessibility', () => {
      createMockStore({ isInTrial: true, trialDaysRemaining: 5 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      const banner = wrapper.find('[data-testid="trial-countdown-banner"]')
      expect(banner.attributes('role')).toBe('banner')
      expect(banner.attributes('aria-label')).toBe('Free trial countdown')
    })
  })

  describe('when not in trial', () => {
    it('should not render the banner when isInTrial is false', () => {
      createMockStore({ isInTrial: false, trialDaysRemaining: 0 })

      const wrapper = mount(TrialCountdownBanner, {
        global: {
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })

      expect(wrapper.find('[data-testid="trial-countdown-banner"]').exists()).toBe(false)
    })
  })
})
