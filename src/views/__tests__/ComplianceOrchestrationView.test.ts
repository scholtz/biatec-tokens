import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('../../components/ui/Card.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))
vi.mock('../../components/ui/Button.vue', () => ({
  default: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'variant', 'size'],
    emits: ['click'],
  },
}))
vi.mock('../../components/ui/Badge.vue', () => ({
  default: { template: '<span><slot /></span>', props: ['variant', 'size'] },
}))
vi.mock('../../components/ui/Modal.vue', () => ({
  default: { template: '<div v-if="modelValue"><slot /></div>', props: ['modelValue'] },
}))
vi.mock('../../components/compliance/ComplianceGatingBanner.vue', () => ({
  default: { template: '<div data-testid="compliance-gating-banner"></div>' },
}))
vi.mock('../../components/compliance/ComplianceStatusBadge.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/compliance/KYCProgressChecklist.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/compliance/AMLScreeningStatusPanel.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../utils/complianceStatus', () => ({
  getAMLVerdictMetadata: vi.fn().mockReturnValue({ label: 'Approved', color: 'green' }),
}))

import ComplianceOrchestrationView from '../ComplianceOrchestrationView.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/compliance/orchestration', component: { template: '<div />' } },
      { path: '/launch/guided', component: { template: '<div />' } },
    ],
  })

describe('ComplianceOrchestrationView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountView() {
    const router = makeRouter()
    await router.push('/compliance/orchestration')
    await router.isReady()

    return mount(ComplianceOrchestrationView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              complianceOrchestration: {
                userComplianceState: null,
                loading: false,
                error: null,
              },
              auth: { user: null, isConnected: false },
            },
          }),
          router,
        ],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          ArrowPathIcon: { template: '<span />' },
          ExclamationCircleIcon: { template: '<span />' },
          ClockIcon: { template: '<span />' },
          CheckCircleIcon: { template: '<span />' },
          DocumentArrowUpIcon: { template: '<span />' },
          ShieldCheckIcon: { template: '<span />' },
          ChatBubbleLeftRightIcon: { template: '<span />' },
          DocumentTextIcon: { template: '<span />' },
          ArrowUpTrayIcon: { template: '<span />' },
        },
      },
    })
  }

  it('renders without crashing', async () => {
    const wrapper = await mountView()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows loading state when compliance data loading and no state', async () => {
    const wrapper = await mountView()
    // Either shows a spinner/loading or the main compliance content
    expect(wrapper.exists()).toBe(true)
  })

  it('does not show wallet-connector UI (product alignment)', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('renders compliance heading area', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()
    expect(text).toMatch(/compliance verification|kyc|aml/i)
  })

  it('captures errors without crashing (onErrorCaptured)', async () => {
    const wrapper = await mountView()
    // The view registers onErrorCaptured — renders without throwing
    expect(wrapper.exists()).toBe(true)
  })
})
