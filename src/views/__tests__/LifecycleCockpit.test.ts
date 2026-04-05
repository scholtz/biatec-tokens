/**
 * Tests: LifecycleCockpit.vue
 *
 * Covers:
 * - Rendering of loading/error/success states
 * - formatTimestamp branches (just now, minutes, hours, days)
 * - handleRoleChange, handleRefresh, handleNavigate branches
 * - handleActionSelected, handleActionCompleted, handleEvidenceViewed
 * - Role selector option count
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// ── Hoisted mocks (declared before vi.mock calls are hoisted) ─────────────────

const { mockInitialize, mockRefresh, mockSetUserRole, mockUpdateActionStatus, mockDispatchCockpitEvent } = vi.hoisted(() => ({
  mockInitialize: vi.fn().mockResolvedValue(undefined),
  mockRefresh: vi.fn().mockResolvedValue(undefined),
  mockSetUserRole: vi.fn(),
  mockUpdateActionStatus: vi.fn(),
  mockDispatchCockpitEvent: vi.fn(),
}))

// ── Store state ───────────────────────────────────────────────────────────────

const cockpitStoreState = {
  isLoading: false,
  error: null as string | null,
  lastRefresh: null as Date | null,
  timeline: null,
  readinessStatus: null,
  telemetry: null,
  walletDiagnostics: null,
  riskIndicators: null,
  evidenceTraces: [],
  prioritizedActions: [],
  rolePermissions: {
    role: 'issuer_admin',
    canViewReadiness: true,
    canViewTelemetry: true,
    canViewActions: true,
    canViewWalletDiagnostics: true,
    canViewRiskIndicators: true,
    canViewEvidence: true,
    canCompleteActions: true,
    canExportReports: true,
  },
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../stores/lifecycleCockpit', () => ({
  useLifecycleCockpitStore: () => ({
    ...cockpitStoreState,
    initialize: mockInitialize,
    refresh: mockRefresh,
    setUserRole: mockSetUserRole,
    updateActionStatus: mockUpdateActionStatus,
  }),
}))

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => ({
    account: 'TESTACCOUNT12345678',
    isAuthenticated: true,
  }),
}))

vi.mock('../../utils/cockpitAnalytics', () => ({
  dispatchCockpitEvent: mockDispatchCockpitEvent,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../../components/lifecycleCockpit/ReadinessStatusWidget.vue', () => ({
  default: { template: '<div data-testid="readiness-widget" />' },
}))
vi.mock('../../components/lifecycleCockpit/TelemetrySummaryWidget.vue', () => ({
  default: { template: '<div data-testid="telemetry-widget" />' },
}))
vi.mock('../../components/lifecycleCockpit/GuidedActionsWidget.vue', () => ({
  default: { template: '<div data-testid="actions-widget" />' },
}))
vi.mock('../../components/lifecycleCockpit/WalletDiagnosticsWidget.vue', () => ({
  default: { template: '<div data-testid="diagnostics-widget" />' },
}))
vi.mock('../../components/lifecycleCockpit/RiskIndicatorsWidget.vue', () => ({
  default: { template: '<div data-testid="risk-widget" />' },
}))
vi.mock('../../components/lifecycleCockpit/EvidenceLinksWidget.vue', () => ({
  default: { template: '<div data-testid="evidence-widget" />' },
}))
vi.mock('../../components/lifecycleCockpit/TimelineWidget.vue', () => ({
  default: { template: '<div data-testid="timeline-widget" />' },
}))
vi.mock('../../components/ui/Button.vue', () => ({
  default: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    emits: ['click'],
  },
}))

// ── Component and helpers ─────────────────────────────────────────────────────

import LifecycleCockpit from '../LifecycleCockpit.vue'

async function mountCockpit(overrides: Partial<typeof cockpitStoreState> = {}) {
  Object.assign(cockpitStoreState, overrides)
  const wrapper = mount(LifecycleCockpit)
  await nextTick()
  return wrapper
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LifecycleCockpit — rendering states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cockpitStoreState.isLoading = false
    cockpitStoreState.error = null
    cockpitStoreState.lastRefresh = null
  })

  it('renders the main heading', async () => {
    const w = await mountCockpit()
    expect(w.text()).toContain('Token Lifecycle Cockpit')
  })

  it('renders 4 role selector options', async () => {
    const w = await mountCockpit()
    const options = w.findAll('select option')
    expect(options.length).toBe(4)
  })

  it('shows loading state when isLoading is true', async () => {
    const w = await mountCockpit({ isLoading: true })
    expect(w.text()).toContain('Loading cockpit data')
  })

  it('shows error state when error is set', async () => {
    const w = await mountCockpit({ error: 'Connection failed' })
    expect(w.text()).toContain('Failed to Load Cockpit')
    expect(w.text()).toContain('Connection failed')
  })

  it('renders main widgets when loaded without error', async () => {
    const w = await mountCockpit({ isLoading: false, error: null })
    expect(w.find('[data-testid="readiness-widget"]').exists()).toBe(true)
    expect(w.find('[data-testid="timeline-widget"]').exists()).toBe(true)
  })

  it('shows last-updated text when lastRefresh is set', async () => {
    const w = await mountCockpit({ lastRefresh: new Date() })
    expect(w.text()).toContain('Last updated:')
  })

  it('does NOT show last-updated text when lastRefresh is null', async () => {
    const w = await mountCockpit({ lastRefresh: null })
    expect(w.text()).not.toContain('Last updated:')
  })

  it('calls cockpitStore.initialize on mount', async () => {
    await mountCockpit()
    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })
})

describe('LifecycleCockpit — formatTimestamp branches', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns "Just now" for < 1 minute', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    const result = vm.formatTimestamp(new Date(Date.now() - 30_000))
    expect(result).toBe('Just now')
  })

  it('returns "1 minute ago" (singular)', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    const result = vm.formatTimestamp(new Date(Date.now() - 61_000))
    expect(result).toBe('1 minute ago')
  })

  it('returns "5 minutes ago" (plural)', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    const result = vm.formatTimestamp(new Date(Date.now() - 5 * 60_000 - 1_000))
    expect(result).toBe('5 minutes ago')
  })

  it('returns "1 hour ago" (singular)', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    const result = vm.formatTimestamp(new Date(Date.now() - 3_601_000))
    expect(result).toBe('1 hour ago')
  })

  it('returns "3 hours ago" (plural)', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    const result = vm.formatTimestamp(new Date(Date.now() - 3 * 3_600_000 - 1_000))
    expect(result).toBe('3 hours ago')
  })

  it('returns "1 day ago" (singular)', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    const result = vm.formatTimestamp(new Date(Date.now() - 86_401_000))
    expect(result).toBe('1 day ago')
  })

  it('returns "2 days ago" (plural)', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    const result = vm.formatTimestamp(new Date(Date.now() - 2 * 86_400_000 - 1_000))
    expect(result).toBe('2 days ago')
  })
})

describe('LifecycleCockpit — handlers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('handleRefresh calls store.refresh and dispatches event', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    await vm.handleRefresh()
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockDispatchCockpitEvent).toHaveBeenCalledWith('page_view', expect.any(String), { refreshed: true })
  })

  it('handleRoleChange calls store.setUserRole with selectedRole', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    vm.selectedRole = 'compliance'
    vm.handleRoleChange()
    expect(mockSetUserRole).toHaveBeenCalledWith('compliance')
  })

  it('handleNavigate calls window.open for external http links', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const w = await mountCockpit()
    const vm = w.vm as any
    vm.handleNavigate('https://external.example.com')
    expect(openSpy).toHaveBeenCalledWith('https://external.example.com', '_blank')
    openSpy.mockRestore()
  })

  it('handleActionSelected dispatches analytics event', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    vm.handleActionSelected('action-001')
    expect(mockDispatchCockpitEvent).toHaveBeenCalledWith(
      'action_selected',
      expect.any(String),
      { actionId: 'action-001' }
    )
  })

  it('handleActionCompleted updates status and dispatches event', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    vm.handleActionCompleted('action-002')
    expect(mockUpdateActionStatus).toHaveBeenCalledWith('action-002', 'completed')
    expect(mockDispatchCockpitEvent).toHaveBeenCalledWith(
      'action_completed',
      expect.any(String),
      { actionId: 'action-002' }
    )
  })

  it('handleEvidenceViewed dispatches analytics event', async () => {
    const w = await mountCockpit()
    const vm = w.vm as any
    vm.handleEvidenceViewed('ev-001')
    expect(mockDispatchCockpitEvent).toHaveBeenCalledWith(
      'evidence_viewed',
      expect.any(String),
      { evidenceId: 'ev-001' }
    )
  })
})
