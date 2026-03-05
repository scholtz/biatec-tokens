/**
 * Unit Tests: ComplianceDashboard — Logic Coverage
 *
 * Validates the component logic for the compliance dashboard view.
 *
 * Coverage targets:
 *   - formatTimestamp: ISO string formatted to short date/time string
 *   - issueSeverityClass: all 5 severity branches (critical, high, medium, low, default)
 *   - loadComplianceStatus: success path, error fallback path, no-op when tokenId absent
 *   - Computed properties: tokenId (route.params.id, route.query.tokenId, undefined),
 *       selectedNetwork (query.network, default "VOI"), issuerAddress (account or "")
 *   - Tab definitions: all 9 tabs present with correct id/label/icon
 *   - Widget navigation handlers: showKycProviderDetails, showSubscriptionDetails,
 *       navigateToUpgrade — router.push called with correct paths
 *   - No wallet connector UI rendered
 *   - onMounted triggers loadComplianceStatus
 *
 * Issue: MVP frontend sign-off hardening — increase critical-path test coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import ComplianceDashboard from '../ComplianceDashboard.vue'

// Route path matches actual router (src/router/index.ts): /compliance/:id?
const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/compliance/:id?', name: 'ComplianceDashboard', component: { template: '<div />' } },
      { path: '/settings', name: 'Settings', component: { template: '<div />' } },
      { path: '/subscription/pricing', name: 'Pricing', component: { template: '<div />' } },
    ],
  })

const makeStubs = () => ({
  MainLayout: { template: '<div><slot /></div>' },
  MicaWhitelistManagement: { template: '<div data-testid="mica-whitelist" />' },
  WhitelistJurisdictionView: { template: '<div data-testid="whitelist-jurisdiction" />' },
  TransferValidationForm: { template: '<div data-testid="transfer-validation" />' },
  AuditLogViewer: { template: '<div data-testid="audit-log" />' },
  ComplianceChecklist: { template: '<div data-testid="compliance-checklist" />' },
  MicaDashboardSummary: { template: '<div data-testid="mica-summary" />' },
  ComplianceExports: { template: '<div data-testid="compliance-exports" />' },
  AttestationPanel: { template: '<div data-testid="attestation-panel" />' },
  TeamAccessView: { template: '<div data-testid="team-access" />' },
  WhitelistCoverageWidget: { template: '<div data-testid="whitelist-coverage" />' },
  IssuerStatusWidget: { template: '<div data-testid="issuer-status" />' },
  KycProviderStatusWidget: { template: '<div data-testid="kyc-status" />' },
  RwaRiskFlagsWidget: { template: '<div data-testid="rwa-risk" />' },
  NetworkHealthWidget: { template: '<div data-testid="network-health" />' },
  SubscriptionTierGatingWidget: { template: '<div data-testid="subscription-tier" />' },
  MicaReadinessPanel: { template: '<div data-testid="mica-readiness" />' },
  AuditTrailSummaryPanel: { template: '<div data-testid="audit-trail" />' },
  WhitelistStatusPanel: { template: '<div data-testid="whitelist-status" />' },
  ComplianceReportsPanel: { template: '<div data-testid="compliance-reports" />' },
  ComplianceAlertsPanel: { template: '<div data-testid="compliance-alerts" />' },
})

let router: ReturnType<typeof makeRouter>

beforeEach(() => {
  router = makeRouter()
  vi.clearAllMocks()
})

const mountDashboard = async (routePath = '/compliance/token-123', opts: Record<string, unknown> = {}) => {
  await router.push(routePath)
  await router.isReady()
  return shallowMount(ComplianceDashboard, {
    global: {
      plugins: [
        router,
        createTestingPinia({ createSpy: vi.fn }),
      ],
      stubs: makeStubs(),
    },
    ...opts,
  })
}

// ---------------------------------------------------------------------------
// formatTimestamp
// ---------------------------------------------------------------------------
describe('formatTimestamp', () => {
  it('formats a valid ISO timestamp into a human-readable string', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { formatTimestamp: (ts: string) => string }
    const result = vm.formatTimestamp('2025-01-15T14:30:00.000Z')
    // Should produce something like "Jan 15, 02:30 PM" — just verify it's a non-empty string
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    // Should contain month abbreviation
    expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i)
  })

  it('formats different months correctly', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { formatTimestamp: (ts: string) => string }
    const julyResult = vm.formatTimestamp('2025-07-04T10:00:00.000Z')
    const decResult = vm.formatTimestamp('2025-12-25T23:59:00.000Z')
    expect(julyResult).toMatch(/Jul/i)
    expect(decResult).toMatch(/Dec/i)
  })
})

// ---------------------------------------------------------------------------
// issueSeverityClass
// ---------------------------------------------------------------------------
describe('issueSeverityClass', () => {
  let vm: { issueSeverityClass: (sev: string) => string }

  beforeEach(async () => {
    const wrapper = await mountDashboard()
    vm = wrapper.vm as unknown as { issueSeverityClass: (sev: string) => string }
  })

  it('returns red classes for critical severity', () => {
    const cls = vm.issueSeverityClass('critical')
    expect(cls).toContain('red-500')
    expect(cls).toContain('border')
  })

  it('returns orange classes for high severity', () => {
    const cls = vm.issueSeverityClass('high')
    expect(cls).toContain('orange-500')
  })

  it('returns yellow classes for medium severity', () => {
    const cls = vm.issueSeverityClass('medium')
    expect(cls).toContain('yellow-500')
  })

  it('returns blue classes for low severity', () => {
    const cls = vm.issueSeverityClass('low')
    expect(cls).toContain('blue-500')
  })

  it('returns gray classes for unknown/default severity', () => {
    const unknown = vm.issueSeverityClass('unknown')
    expect(unknown).toContain('gray-500')
    const empty = vm.issueSeverityClass('')
    expect(empty).toContain('gray-500')
  })
})

// ---------------------------------------------------------------------------
// Computed: tokenId
// ---------------------------------------------------------------------------
describe('tokenId computed', () => {
  it('reads token ID from route.params.id', async () => {
    await router.push('/compliance/my-token-abc')
    await router.isReady()
    const wrapper = shallowMount(ComplianceDashboard, {
      global: {
        plugins: [router, createTestingPinia({ createSpy: vi.fn })],
        stubs: makeStubs(),
      },
    })
    const vm = wrapper.vm as unknown as { tokenId: string }
    expect(vm.tokenId).toBe('my-token-abc')
  })

  it('reads token ID from route.query.tokenId when no param', async () => {
    await router.push('/compliance?tokenId=query-token-xyz')
    await router.isReady()
    const wrapper = shallowMount(ComplianceDashboard, {
      global: {
        plugins: [router, createTestingPinia({ createSpy: vi.fn })],
        stubs: makeStubs(),
      },
    })
    const vm = wrapper.vm as unknown as { tokenId: string }
    expect(vm.tokenId).toBe('query-token-xyz')
  })

  it('returns undefined when no token ID in route', async () => {
    await router.push('/compliance')
    await router.isReady()
    const wrapper = shallowMount(ComplianceDashboard, {
      global: {
        plugins: [router, createTestingPinia({ createSpy: vi.fn })],
        stubs: makeStubs(),
      },
    })
    const vm = wrapper.vm as unknown as { tokenId: string | undefined }
    expect(vm.tokenId).toBeFalsy()
  })
})

// ---------------------------------------------------------------------------
// Computed: selectedNetwork
// ---------------------------------------------------------------------------
describe('selectedNetwork computed', () => {
  it('defaults to "VOI" when no network query param', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { selectedNetwork: string }
    expect(vm.selectedNetwork).toBe('VOI')
  })

  it('reads network from route.query.network', async () => {
    await router.push('/compliance/tok-1?network=Aramid')
    await router.isReady()
    const wrapper = shallowMount(ComplianceDashboard, {
      global: {
        plugins: [router, createTestingPinia({ createSpy: vi.fn })],
        stubs: makeStubs(),
      },
    })
    const vm = wrapper.vm as unknown as { selectedNetwork: string }
    expect(vm.selectedNetwork).toBe('Aramid')
  })
})

// ---------------------------------------------------------------------------
// loadComplianceStatus
// ---------------------------------------------------------------------------
describe('loadComplianceStatus', () => {
  it('does nothing when tokenId is empty', async () => {
    await router.push('/compliance')
    await router.isReady()
    const { complianceService } = await import('../../services/ComplianceService')
    const spy = vi.spyOn(complianceService, 'getComplianceStatus')
    shallowMount(ComplianceDashboard, {
      global: {
        plugins: [router, createTestingPinia({ createSpy: vi.fn })],
        stubs: makeStubs(),
      },
    })
    await new Promise(r => setTimeout(r, 10))
    expect(spy).not.toHaveBeenCalled()
  })

  it('calls complianceService.getComplianceStatus with tokenId and network', async () => {
    const { complianceService } = await import('../../services/ComplianceService')
    vi.spyOn(complianceService, 'getComplianceStatus').mockResolvedValue({
      tokenId: 'tok-1',
      network: 'VOI',
      whitelistEnabled: true,
      whitelistCount: 5,
    })
    const wrapper = await mountDashboard('/compliance/tok-1')
    await new Promise(r => setTimeout(r, 50))
    expect(complianceService.getComplianceStatus).toHaveBeenCalledWith('tok-1', 'VOI')
    const vm = wrapper.vm as unknown as { complianceStatus: { whitelistCount: number } | null }
    expect(vm.complianceStatus?.whitelistCount).toBe(5)
  })

  it('sets fallback complianceStatus on API error', async () => {
    const { complianceService } = await import('../../services/ComplianceService')
    vi.spyOn(complianceService, 'getComplianceStatus').mockRejectedValue(new Error('API error'))
    const wrapper = await mountDashboard('/compliance/tok-err')
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as unknown as { complianceStatus: { tokenId: string; whitelistEnabled: boolean } | null }
    expect(vm.complianceStatus).not.toBeNull()
    expect(vm.complianceStatus?.tokenId).toBe('tok-err')
    expect(vm.complianceStatus?.whitelistEnabled).toBe(true)
  })

  it('sets isLoadingStatus to false after completion', async () => {
    const { complianceService } = await import('../../services/ComplianceService')
    vi.spyOn(complianceService, 'getComplianceStatus').mockResolvedValue({
      tokenId: 'tok-2',
      network: 'VOI',
      whitelistEnabled: false,
      whitelistCount: 0,
    })
    const wrapper = await mountDashboard('/compliance/tok-2')
    await new Promise(r => setTimeout(r, 50))
    const vm = wrapper.vm as unknown as { isLoadingStatus: boolean }
    expect(vm.isLoadingStatus).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
describe('tabs configuration', () => {
  it('defines all 9 expected tabs', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { tabs: Array<{ id: string; label: string; icon: string }> }
    expect(vm.tabs).toHaveLength(9)
  })

  it('contains overview tab as first tab', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { tabs: Array<{ id: string }> }
    expect(vm.tabs[0].id).toBe('overview')
  })

  it('contains whitelist, validation, audit-log tabs', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { tabs: Array<{ id: string }> }
    const ids = vm.tabs.map(t => t.id)
    expect(ids).toContain('whitelist')
    expect(ids).toContain('validation')
    expect(ids).toContain('audit-log')
  })
})

// ---------------------------------------------------------------------------
// Widget navigation handlers
// ---------------------------------------------------------------------------
describe('navigation handlers', () => {
  it('showKycProviderDetails navigates to /settings with kyc-providers tab', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { showKycProviderDetails: () => void }
    vm.showKycProviderDetails()
    await wrapper.vm.$nextTick()
    expect(router.currentRoute.value.path).toBe('/settings')
    expect(router.currentRoute.value.query.tab).toBe('kyc-providers')
  })

  it('showSubscriptionDetails navigates to /subscription/pricing', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { showSubscriptionDetails: () => void }
    vm.showSubscriptionDetails()
    await wrapper.vm.$nextTick()
    expect(router.currentRoute.value.path).toBe('/subscription/pricing')
  })

  it('navigateToUpgrade navigates to /subscription/pricing with upgrade action', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { navigateToUpgrade: () => void }
    vm.navigateToUpgrade()
    await wrapper.vm.$nextTick()
    expect(router.currentRoute.value.path).toBe('/subscription/pricing')
    expect(router.currentRoute.value.query.action).toBe('upgrade')
  })
})

// ---------------------------------------------------------------------------
// activeTab initial state
// ---------------------------------------------------------------------------
describe('activeTab', () => {
  it('defaults to "overview"', async () => {
    const wrapper = await mountDashboard()
    const vm = wrapper.vm as unknown as { activeTab: string }
    expect(vm.activeTab).toBe('overview')
  })
})

// ---------------------------------------------------------------------------
// No wallet connector UI
// ---------------------------------------------------------------------------
describe('no wallet connector UI', () => {
  it('does not render wallet connector text', async () => {
    const wrapper = await mountDashboard()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b.*Wallet|Defly/i)
    expect(html).not.toContain('Connect Wallet')
    expect(html).not.toMatch(/not connected/i)
  })
})
