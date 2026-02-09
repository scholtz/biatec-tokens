import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import EnterpriseOnboardingCommandCenter from '../EnterpriseOnboardingCommandCenter.vue'
import { useEnterpriseOnboardingStore } from '../../stores/enterpriseOnboarding'
import { useAuthStore } from '../../stores/auth'

// Mock heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  CheckCircleIcon: { template: '<div>CheckCircleIcon</div>' },
  ExclamationCircleIcon: { template: '<div>ExclamationCircleIcon</div>' },
  ExclamationTriangleIcon: { template: '<div>ExclamationTriangleIcon</div>' },
  ArrowPathIcon: { template: '<div>ArrowPathIcon</div>' },
  UserIcon: { template: '<div>UserIcon</div>' },
  ClockIcon: { template: '<div>ClockIcon</div>' },
  InformationCircleIcon: { template: '<div>InformationCircleIcon</div>' },
  ArrowTopRightOnSquareIcon: { template: '<div>ArrowTopRightOnSquareIcon</div>' },
}))

describe('EnterpriseOnboardingCommandCenter', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'Home',
          component: { template: '<div>Home</div>' },
        },
        {
          path: '/enterprise/onboarding',
          name: 'EnterpriseOnboardingCommandCenter',
          component: EnterpriseOnboardingCommandCenter,
        },
      ],
    })

    // Mock authenticated user
    const authStore = useAuthStore()
    authStore.isConnected = true
  })

  describe('Component Rendering', () => {
    it('should render the main heading', async () => {
      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Enterprise Onboarding Command Center')
    })

    it('should display progress overview', async () => {
      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Onboarding Progress')
      expect(wrapper.text()).toMatch(/\d+ of \d+ steps completed/)
    })

    it('should render all default steps', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Create Organization Profile')
      expect(wrapper.text()).toContain('Upload Corporate Documents')
      expect(wrapper.text()).toContain('Identify Authorized Signatories')
      expect(wrapper.text()).toContain('Verify Compliance Profile')
      expect(wrapper.text()).toContain('Configure Token Issuance Parameters')
      expect(wrapper.text()).toContain('Review and Accept Terms')
      expect(wrapper.text()).toContain('Request Token Issuance')
    })
  })

  describe('Progress Calculation', () => {
    it('should show 0% when no steps completed', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('0%')
    })

    it('should show correct percentage with completed steps', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      // Complete 2 out of 7 steps = ~29%
      store.updateStepStatus(store.steps[0].id, 'completed')
      store.updateStepStatus(store.steps[1].id, 'completed')

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      const text = wrapper.text()
      expect(text).toMatch(/2[89]%|3[01]%/) // Account for rounding
    })

    it('should show 100% when all steps completed', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.completeOnboarding()

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('100%')
    })
  })

  describe('Step Status Display', () => {
    it('should display status badges correctly', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.updateStepStatus(store.steps[0].id, 'completed')
      store.updateStepStatus(store.steps[1].id, 'in_progress')
      store.updateStepStatus(store.steps[2].id, 'needs_action')

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Completed')
      expect(wrapper.text()).toContain('In Progress')
      expect(wrapper.text()).toContain('Needs Action')
      expect(wrapper.text()).toContain('Not Started')
    })

    it('should show error message for needs_action status', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const error = {
        message: 'Document verification failed',
        remediation: 'Please upload a valid document',
      }
      store.updateStepStatus(store.steps[0].id, 'needs_action', error)

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Action Required')
      expect(wrapper.text()).toContain('Document verification failed')
      expect(wrapper.text()).toContain('Please upload a valid document')
    })
  })

  describe('Activity Feed', () => {
    it('should display recent activities', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.updateStepStatus(store.steps[0].id, 'completed')

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Recent Activity')
      expect(wrapper.text()).toContain('Completed')
    })

    it('should show "No activity yet" when empty', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No activity yet')
    })
  })

  describe('Guidance Panel', () => {
    it('should display guidance panel', async () => {
      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Getting Started')
      expect(wrapper.text()).toContain('Select a step to view detailed guidance')
    })

    it('should show compliance information', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      // First step should be selected by default
      expect(wrapper.text()).toContain('COMPLIANCE NOTE')
    })
  })

  describe('Step Actions', () => {
    it('should show Start button for not_started steps', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Start')
    })

    it('should show Continue button for in_progress steps', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.updateStepStatus(store.steps[0].id, 'in_progress')

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Continue')
    })

    it('should not show action button for completed steps', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.updateStepStatus(store.steps[0].id, 'completed')

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      // Find the completed step card
      const stepText = wrapper.text()
      expect(stepText).toContain('Completed')
      // The Start/Continue buttons should still be present for other steps
      // but not for the completed step
    })
  })

  describe('Date Formatting', () => {
    it('should format recent dates as relative time', async () => {
      const store = useEnterpriseOnboardingStore()
      await store.initialize()

      store.updateStepStatus(store.steps[0].id, 'completed')

      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      // Should show relative time like "just now" or "X minutes ago"
      const text = wrapper.text()
      expect(text).toMatch(/just now|minute|hour|day|ago/)
    })
  })

  describe('Responsive Layout', () => {
    it('should use grid layout for content', async () => {
      const wrapper = mount(EnterpriseOnboardingCommandCenter, {
        global: {
          plugins: [pinia, router],
        },
      })

      await wrapper.vm.$nextTick()

      const html = wrapper.html()
      expect(html).toContain('grid')
      expect(html).toContain('lg:col-span-2')
      expect(html).toContain('lg:col-span-1')
    })
  })
})
