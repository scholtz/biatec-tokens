/**
 * ComplianceMonitoringDashboardEnhanced.logic.test.ts
 *
 * Tests for internal functions and computed properties of
 * ComplianceMonitoringDashboardEnhanced.vue.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

// ── Stubs ────────────────────────────────────────────────────────────────────
vi.mock('../../layout/MainLayout.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../components/compliance/TokenComplianceSummaryCard.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/compliance/ComplianceGapList.vue', () => ({
  default: { template: '<div></div>', emits: ['export'] },
}))
vi.mock('../../components/compliance/AuditEvidenceExport.vue', () => ({
  default: { template: '<div></div>', emits: ['export'] },
}))

vi.mock('../../services/ComplianceService', () => ({
  complianceService: {
    getMonitoringMetrics: vi.fn().mockResolvedValue({
      activeTokens: 5,
      complianceRate: 0.85,
      openGaps: 2,
      lastAuditDate: '2026-01-01T00:00:00Z',
      whitelistEnforcement: { recentViolations: 0 },
      auditHealth: { criticalIssues: 0 },
    }),
    exportMonitoringData: vi.fn().mockResolvedValue('col1,col2\nval1,val2'),
  },
}))

import ComplianceMonitoringDashboardEnhanced from '../ComplianceMonitoringDashboardEnhanced.vue'
import { complianceService } from '../../services/ComplianceService'

// Convenience references to the mocked functions
const getMetricsMock = complianceService.getMonitoringMetrics as ReturnType<typeof vi.fn>
const exportMock = complianceService.exportMonitoringData as ReturnType<typeof vi.fn>

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      {
        path: '/compliance/monitoring-enhanced',
        name: 'MonitoringEnhanced',
        component: { template: '<div />' },
      },
      { path: '/tokens/:id', name: 'TokenDetail', component: { template: '<div />' } },
    ],
  })

async function mountDashboard(queryParams = {}) {
  const router = makeRouter()
  const queryStr = new URLSearchParams(queryParams).toString()
  await router.push(
    `/compliance/monitoring-enhanced${queryStr ? '?' + queryStr : ''}`,
  )
  await router.isReady()

  const wrapper = mount(ComplianceMonitoringDashboardEnhanced, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            tokens: {
              tokens: [
                {
                  id: 'tok-1',
                  name: 'Alpha Token',
                  symbol: 'ALP',
                  assetId: '111',
                  complianceMetadata: { jurisdictionRestrictions: ['US'], micaReady: true },
                  attestationMetadata: { attestations: [] },
                },
                {
                  id: 'tok-2',
                  name: 'Beta Token',
                  symbol: 'BET',
                  assetId: '222',
                  complianceMetadata: { jurisdictionRestrictions: [], micaReady: false },
                  attestationMetadata: { attestations: [] },
                },
              ],
            },
          },
        }),
        router,
      ],
    },
  })
  await nextTick()
  return { wrapper, router }
}

describe('ComplianceMonitoringDashboardEnhanced — logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without crashing', async () => {
    const { wrapper } = await mountDashboard()
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('calls getMonitoringMetrics on mount', async () => {
    await mountDashboard()
    expect(getMetricsMock).toHaveBeenCalled()
  })

  it('does not show wallet-connector UI (product alignment)', async () => {
    const { wrapper } = await mountDashboard()
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    wrapper.unmount()
  })

  // ── getScoreColor ──────────────────────────────────────────────────────────

  it('getScoreColor returns green for score >= 90', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreColor(95)).toContain('green')
    expect(vm.getScoreColor(90)).toContain('green')
    wrapper.unmount()
  })

  it('getScoreColor returns yellow for score 70-89', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreColor(75)).toContain('yellow')
    expect(vm.getScoreColor(70)).toContain('yellow')
    wrapper.unmount()
  })

  it('getScoreColor returns orange for score 50-69', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreColor(60)).toContain('orange')
    expect(vm.getScoreColor(50)).toContain('orange')
    wrapper.unmount()
  })

  it('getScoreColor returns red for score < 50', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreColor(49)).toContain('red')
    expect(vm.getScoreColor(0)).toContain('red')
    wrapper.unmount()
  })

  // ── getScoreGrade ──────────────────────────────────────────────────────────

  it('getScoreGrade returns A for score >= 90', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreGrade(95)).toBe('A')
    expect(vm.getScoreGrade(90)).toBe('A')
    wrapper.unmount()
  })

  it('getScoreGrade returns B for score 80-89', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreGrade(85)).toBe('B')
    expect(vm.getScoreGrade(80)).toBe('B')
    wrapper.unmount()
  })

  it('getScoreGrade returns C for score 70-79', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreGrade(75)).toBe('C')
    wrapper.unmount()
  })

  it('getScoreGrade returns D for score 60-69', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreGrade(65)).toBe('D')
    wrapper.unmount()
  })

  it('getScoreGrade returns F for score < 60', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.getScoreGrade(55)).toBe('F')
    expect(vm.getScoreGrade(0)).toBe('F')
    wrapper.unmount()
  })

  // ── formatTimestamp / formatDate ───────────────────────────────────────────

  it('formatTimestamp() returns a non-empty string', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    const result = vm.formatTimestamp('2026-03-15T09:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('formatDate() returns a short date string', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    const result = vm.formatDate('2026-03-15')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
    wrapper.unmount()
  })

  // ── hasActiveFilters ───────────────────────────────────────────────────────

  it('hasActiveFilters is false when all filters are defaults', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    vm.filters.network = 'all'
    vm.filters.assetId = undefined
    vm.filters.startDate = undefined
    vm.filters.endDate = undefined
    await nextTick()
    expect(vm.hasActiveFilters).toBe(false)
    wrapper.unmount()
  })

  it('hasActiveFilters is true when network is not "all"', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    vm.filters.network = 'VOI'
    await nextTick()
    expect(vm.hasActiveFilters).toBe(true)
    wrapper.unmount()
  })

  it('hasActiveFilters is true when assetId is set', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    vm.filters.assetId = '12345'
    await nextTick()
    expect(vm.hasActiveFilters).toBe(true)
    wrapper.unmount()
  })

  it('hasActiveFilters is true when startDate is set', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    vm.filters.startDate = '2026-01-01'
    await nextTick()
    expect(vm.hasActiveFilters).toBe(true)
    wrapper.unmount()
  })

  // ── resetFilters ───────────────────────────────────────────────────────────

  it('resetFilters() resets all filters to defaults', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    vm.filters.network = 'VOI'
    vm.filters.assetId = '111'
    vm.filters.startDate = '2026-01-01'
    vm.filters.endDate = '2026-12-31'
    await nextTick()
    vm.resetFilters()
    await nextTick()
    expect(vm.filters.network).toBe('all')
    expect(vm.filters.assetId).toBeUndefined()
    expect(vm.filters.startDate).toBeUndefined()
    expect(vm.filters.endDate).toBeUndefined()
    wrapper.unmount()
  })

  // ── handleViewTokenDetails ─────────────────────────────────────────────────

  it('handleViewTokenDetails() navigates to /tokens/:id', async () => {
    const { wrapper, router } = await mountDashboard()
    const vm = wrapper.vm as any
    vm.handleViewTokenDetails('tok-abc')
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/tokens/tok-abc')
    wrapper.unmount()
  })

  // ── handleExportTokenEvidence ──────────────────────────────────────────────

  it('handleExportTokenEvidence() switches activeView to export', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    expect(vm.activeView).toBe('tokens')
    vm.handleExportTokenEvidence('tok-1')
    await nextTick()
    expect(vm.activeView).toBe('export')
    wrapper.unmount()
  })

  // ── loadMetricsData error handling ────────────────────────────────────────

  it('loadMetricsData() sets error on 401', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    getMetricsMock.mockRejectedValueOnce({ response: { status: 401 } })
    await vm.loadMetricsData()
    expect(vm.error).toContain('Unauthorized')
    wrapper.unmount()
  })

  it('loadMetricsData() sets error on 403', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    getMetricsMock.mockRejectedValueOnce({ response: { status: 403 } })
    await vm.loadMetricsData()
    expect(vm.error).toContain('Access denied')
    wrapper.unmount()
  })

  it('loadMetricsData() sets error on 404', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    getMetricsMock.mockRejectedValueOnce({ response: { status: 404 } })
    await vm.loadMetricsData()
    expect(vm.error).toContain('not found')
    wrapper.unmount()
  })

  it('loadMetricsData() sets error on network failure', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    getMetricsMock.mockRejectedValueOnce({
      code: 'ECONNREFUSED',
      message: 'Network Error',
    })
    await vm.loadMetricsData()
    expect(vm.error).toContain('Cannot connect')
    wrapper.unmount()
  })

  it('loadMetricsData() sets generic error message for unknown errors', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    getMetricsMock.mockRejectedValueOnce(new Error('Something exploded'))
    await vm.loadMetricsData()
    expect(vm.error).toContain('Something exploded')
    wrapper.unmount()
  })

  it('loadMetricsData() clears error and sets isLoading=false on success', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    vm.error = 'stale error'
    await vm.loadMetricsData()
    expect(vm.error).toBeNull()
    expect(vm.isLoading).toBe(false)
    wrapper.unmount()
  })

  // ── allComplianceGaps ──────────────────────────────────────────────────────

  it('allComplianceGaps includes incomplete jurisdiction gap for tokens without restrictions', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    // tok-2 has empty jurisdictionRestrictions
    // load token data first
    await vm.loadTokenData()
    await nextTick()
    const gaps = vm.allComplianceGaps
    const incompleteGap = gaps.find((g: any) => g.title === 'Incomplete Jurisdiction Configuration')
    expect(incompleteGap).toBeTruthy()
    expect(incompleteGap.severity).toBe('medium')
    wrapper.unmount()
  })

  it('allComplianceGaps adds whitelist violation gap from metrics', async () => {
    // Mount first (onMounted will consume the default mock), then set the custom mock
    // before calling loadMetricsData explicitly so metrics.value has recentViolations > 0
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    getMetricsMock.mockResolvedValueOnce({
      activeTokens: 2,
      complianceRate: 0.9,
      openGaps: 0,
      lastAuditDate: null,
      whitelistEnforcement: { recentViolations: 3 },
      auditHealth: { criticalIssues: 0 },
    })
    await vm.loadMetricsData()
    await nextTick()
    const gaps = vm.allComplianceGaps
    const violationGap = gaps.find((g: any) => g.title === 'Recent Whitelist Violations Detected')
    expect(violationGap).toBeTruthy()
    expect(violationGap.severity).toBe('high')
    wrapper.unmount()
  })

  it('allComplianceGaps adds critical audit gap from metrics', async () => {
    // Mount first (onMounted will consume the default mock), then set the custom mock
    // before calling loadMetricsData explicitly so metrics.value has criticalIssues > 0
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    getMetricsMock.mockResolvedValueOnce({
      activeTokens: 2,
      complianceRate: 0.9,
      openGaps: 0,
      lastAuditDate: null,
      whitelistEnforcement: { recentViolations: 0 },
      auditHealth: { criticalIssues: 2 },
    })
    await vm.loadMetricsData()
    await nextTick()
    const gaps = vm.allComplianceGaps
    const criticalGap = gaps.find((g: any) => g.title === 'Critical Audit Issues Detected')
    expect(criticalGap).toBeTruthy()
    expect(criticalGap.severity).toBe('critical')
    wrapper.unmount()
  })

  // ── tokenNameMap ───────────────────────────────────────────────────────────

  it('tokenNameMap maps token id to token name', async () => {
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    const map = vm.tokenNameMap
    expect(map['tok-1']).toBe('Alpha Token')
    expect(map['tok-2']).toBe('Beta Token')
    wrapper.unmount()
  })

  // ── handleMetricsExport ────────────────────────────────────────────────────

  it('handleMetricsExport() triggers CSV download', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any))
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    await vm.handleMetricsExport()
    expect(exportMock).toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
    wrapper.unmount()
  })

  it('handleMetricsExport() sets error on failure', async () => {
    exportMock.mockRejectedValueOnce(new Error('Export failed'))
    const { wrapper } = await mountDashboard()
    const vm = wrapper.vm as any
    await vm.handleMetricsExport()
    expect(vm.error).toContain('Failed to export data')
    wrapper.unmount()
  })
})
