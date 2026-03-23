/**
 * ComplianceOrchestrationView.logic.test.ts
 *
 * Tests for the internal functions and computed properties of ComplianceOrchestrationView.
 * These include formatting helpers, icon/badge mapping, navigation actions,
 * computed eligibility, and document upload state — all exercising code paths
 * that the basic render test leaves uncovered.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { useComplianceOrchestrationStore } from '../../stores/complianceOrchestration'

// ── Mock all child components ────────────────────────────────────────────────
vi.mock('../../layout/MainLayout.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../components/ui/Card.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../components/ui/Button.vue', () => ({
  default: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'variant', 'size'],
    emits: ['click'],
  },
}))
vi.mock('../../components/ui/Badge.vue', () => ({
  default: { template: '<span><slot /></span>', props: ['variant'] },
}))
vi.mock('../../components/ui/Modal.vue', () => ({
  default: { template: '<div v-if="show"><slot /><slot name="header" /></div>', props: ['show'] },
}))
vi.mock('../../components/compliance/ComplianceGatingBanner.vue', () => ({
  default: { template: '<div data-testid="gating-banner"></div>' },
}))
vi.mock('../../components/compliance/ComplianceStatusBadge.vue', () => ({
  default: { template: '<span></span>' },
}))
vi.mock('../../components/compliance/KYCProgressChecklist.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/compliance/AMLScreeningStatusPanel.vue', () => ({
  default: { template: '<div></div>' },
}))

vi.mock('../../utils/complianceStatus', () => ({
  getAMLVerdictMetadata: vi.fn((verdict: string) => ({
    label: verdict === 'clear' ? 'Clear' : verdict === 'blocked' ? 'Blocked — AML Hit' : 'Under Review',
    isBlocking: verdict === 'blocked',
  })),
}))

import ComplianceOrchestrationView from '../ComplianceOrchestrationView.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedLaunch', component: { template: '<div />' } },
      { path: '/enterprise-guide', name: 'EnterpriseGuide', component: { template: '<div />' } },
      { path: '/compliance', name: 'Compliance', component: { template: '<div />' } },
    ],
  })

const makeMockComplianceStore = (overrides: Record<string, unknown> = {}) => ({
  userComplianceState: null,
  loading: false,
  error: null,
  complianceStatus: 'not_started',
  completedDocuments: [],
  documentCompletionPercentage: 0,
  recentEvents: [],
  initializeComplianceState: vi.fn(),
  checkIssuanceEligibility: vi.fn(() => ({
    eligible: false,
    status: 'in_progress',
    reasons: ['KYC pending'],
    nextActions: ['Complete identity verification'],
    canRetry: true,
  })),
  uploadKYCDocument: vi.fn(),
  ...overrides,
})

async function mountView(storeOverrides: Record<string, unknown> = {}) {
  const router = makeRouter()
  await router.isReady()
  const wrapper = mount(ComplianceOrchestrationView, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            complianceOrchestration: makeMockComplianceStore(storeOverrides),
            auth: { user: { address: 'TEST_ADDRESS', email: 'test@example.com' }, isConnected: true },
          },
        }),
        router,
      ],
    },
  })
  await nextTick()
  return { wrapper, router }
}

describe('ComplianceOrchestrationView — logic', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without crashing in default state', async () => {
    const { wrapper } = await mountView()
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows loading state when loading is true and no compliance state', async () => {
    const { wrapper } = await mountView({ loading: true, userComplianceState: null })
    expect(wrapper.html()).toContain('Loading compliance status')
    wrapper.unmount()
  })

  it('shows error state when error is set', async () => {
    const { wrapper } = await mountView({ error: 'Network timeout' })
    expect(wrapper.html()).toContain('Error Loading Compliance Data')
    expect(wrapper.html()).toContain('Network timeout')
    wrapper.unmount()
  })

  it('does not show wallet-connector UI (product alignment)', async () => {
    const { wrapper } = await mountView()
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    wrapper.unmount()
  })

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('navigateToTokenCreation() pushes to /launch/guided', async () => {
    const { wrapper, router } = await mountView()
    const vm = wrapper.vm as any
    vm.navigateToTokenCreation()
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/launch/guided')
    wrapper.unmount()
  })

  it('viewDocumentation() pushes to /enterprise-guide', async () => {
    const { wrapper, router } = await mountView()
    const vm = wrapper.vm as any
    vm.viewDocumentation()
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/enterprise-guide')
    wrapper.unmount()
  })

  it('contactSupport() opens mailto link', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    vm.contactSupport()
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:support@biatec.io'),
      '_blank',
    )
    openSpy.mockRestore()
    wrapper.unmount()
  })

  it('retryCompliance() calls initializeComplianceState when user is present', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    await vm.retryCompliance()
    const { useComplianceOrchestrationStore } = await import('../../stores/complianceOrchestration')
    const store = useComplianceOrchestrationStore()
    expect(store.initializeComplianceState).toHaveBeenCalledWith('TEST_ADDRESS', 'test@example.com')
    wrapper.unmount()
  })

  // ── handleDocumentUpload state ──────────────────────────────────────────────

  it('handleDocumentUpload() sets selectedDocumentType and opens modal', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    expect(vm.uploadModalOpen).toBe(false)
    vm.handleDocumentUpload('passport')
    await nextTick()
    expect(vm.uploadModalOpen).toBe(true)
    expect(vm.selectedDocumentType).toBe('passport')
    expect(vm.selectedFile).toBeNull()
    wrapper.unmount()
  })

  // ── Computed: currentEligibility ───────────────────────────────────────────

  it('currentEligibility returns store result when store has a value', async () => {
    // createTestingPinia stubs all actions with vi.fn() — override after mounting
    const { wrapper } = await mountView()
    const store = useComplianceOrchestrationStore()
    ;(store.checkIssuanceEligibility as ReturnType<typeof vi.fn>).mockReturnValue({
      eligible: true,
      status: 'approved',
      reasons: [],
      nextActions: [],
      canRetry: false,
    })
    await nextTick()
    const vm = wrapper.vm as any
    expect(vm.currentEligibility.eligible).toBe(true)
    expect(vm.currentEligibility.status).toBe('approved')
    wrapper.unmount()
  })

  it('currentEligibility returns fail-closed state when store throws', async () => {
    // createTestingPinia stubs all actions with vi.fn() — override after mounting
    const { wrapper } = await mountView()
    const store = useComplianceOrchestrationStore()
    ;(store.checkIssuanceEligibility as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Store unavailable')
    })
    await nextTick()
    const vm = wrapper.vm as any
    expect(vm.currentEligibility.eligible).toBe(false)
    expect(vm.currentEligibility.canRetry).toBe(true)
    wrapper.unmount()
  })

  // ── Computed: totalRequiredDocuments ───────────────────────────────────────

  it('totalRequiredDocuments returns 0 when userComplianceState is null', async () => {
    const { wrapper } = await mountView({ userComplianceState: null })
    const vm = wrapper.vm as any
    expect(vm.totalRequiredDocuments).toBe(0)
    wrapper.unmount()
  })

  it('totalRequiredDocuments counts only required documents', async () => {
    const { wrapper } = await mountView({
      userComplianceState: {
        events: [],
        kycDocuments: [
          { id: '1', required: true, type: 'passport' },
          { id: '2', required: false, type: 'utility_bill' },
          { id: '3', required: true, type: 'selfie' },
        ],
      },
    })
    const vm = wrapper.vm as any
    expect(vm.totalRequiredDocuments).toBe(2)
    wrapper.unmount()
  })

  // ── getEventIcon mapping ───────────────────────────────────────────────────

  it('getEventIcon() returns a truthy icon for all known event types', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    const eventTypes = [
      'compliance_started', 'document_uploaded', 'document_rejected', 'kyc_review_started',
      'kyc_approved', 'kyc_rejected', 'aml_screening_started', 'aml_screening_completed',
      'aml_match_detected', 'case_escalated', 'compliance_approved', 'compliance_rejected',
      'compliance_expired', 'issuance_attempted', 'issuance_blocked', 'remediation_requested',
    ]
    for (const type of eventTypes) {
      expect(vm.getEventIcon(type)).toBeTruthy()
    }
    wrapper.unmount()
  })

  it('getEventIcon() returns a fallback for unknown event type', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    expect(vm.getEventIcon('unknown_event_xyz')).toBeTruthy()
    wrapper.unmount()
  })

  // ── getEventBadgeVariant ────────────────────────────────────────────────────

  it('getEventBadgeVariant() returns correct variants', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    expect(vm.getEventBadgeVariant('user')).toBe('info')
    expect(vm.getEventBadgeVariant('system')).toBe('default')
    expect(vm.getEventBadgeVariant('admin')).toBe('success')
    expect(vm.getEventBadgeVariant('provider')).toBe('default')
    expect(vm.getEventBadgeVariant('unknown_actor')).toBe('default')
    wrapper.unmount()
  })

  // ── getAMLLabel ─────────────────────────────────────────────────────────────

  it('getAMLLabel() returns human-readable label for clear verdict', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    expect(vm.getAMLLabel('clear')).toBe('Clear')
    wrapper.unmount()
  })

  it('getAMLLabel() returns blocking label for blocked verdict', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    expect(vm.getAMLLabel('blocked')).toBe('Blocked — AML Hit')
    wrapper.unmount()
  })

  // ── formatEventTimestamp ────────────────────────────────────────────────────

  it('formatEventTimestamp() returns "Just now" for very recent events', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    expect(vm.formatEventTimestamp(tenMinAgo)).toBe('Just now')
    wrapper.unmount()
  })

  it('formatEventTimestamp() returns "Xh ago" for hours-old events', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(vm.formatEventTimestamp(twoHoursAgo)).toBe('2h ago')
    wrapper.unmount()
  })

  it('formatEventTimestamp() returns "Xd ago" for day-old events', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(vm.formatEventTimestamp(threeDaysAgo)).toBe('3d ago')
    wrapper.unmount()
  })

  it('formatEventTimestamp() returns locale date for old events', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const result = vm.formatEventTimestamp(twoWeeksAgo)
    // Should be a short date like "Mar 9" – not "Xh ago" or "Xd ago"
    expect(result).not.toMatch(/ago$/)
    wrapper.unmount()
  })

  // ── formatTimestamp ─────────────────────────────────────────────────────────

  it('formatTimestamp() returns a formatted date string', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    const ts = new Date('2026-01-15T10:30:00Z').toISOString()
    const result = vm.formatTimestamp(ts)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    wrapper.unmount()
  })

  // ── uploadDocument state guard ─────────────────────────────────────────────

  it('uploadDocument() does nothing when selectedFile is null', async () => {
    const { wrapper } = await mountView()
    const vm = wrapper.vm as any
    vm.selectedFile = null
    await vm.uploadDocument()
    const { useComplianceOrchestrationStore } = await import('../../stores/complianceOrchestration')
    const store = useComplianceOrchestrationStore()
    expect(store.uploadKYCDocument).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
