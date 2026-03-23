import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NetworkHealthWidget from '../NetworkHealthWidget.vue'
import { complianceService } from '../../services/ComplianceService'

vi.mock('../../services/ComplianceService', () => ({
  complianceService: {
    getNetworkHealth: vi.fn(),
  },
}))

const mockMetricsHealthy = {
  overallHealth: 'healthy',
  lastUpdated: '2024-01-15T10:30:00Z',
  networks: [
    { network: 'VOI', status: 'operational', responseTime: 120 },
    { network: 'Aramid', status: 'operational', responseTime: 95 },
  ],
}
const mockMetricsDegraded = {
  overallHealth: 'degraded',
  lastUpdated: '2024-01-15T10:30:00Z',
  networks: [
    { network: 'VOI', status: 'degraded', responseTime: 500, issues: ['High latency'] },
    { network: 'Aramid', status: 'operational', responseTime: 95 },
  ],
}
const mockMetricsCritical = {
  overallHealth: 'critical',
  lastUpdated: '2024-01-15T10:30:00Z',
  networks: [
    { network: 'VOI', status: 'down' },
    { network: 'Aramid', status: 'operational', responseTime: 95 },
  ],
}

async function mountAndWait(health: any) {
  vi.mocked(complianceService.getNetworkHealth).mockResolvedValue(health)
  const w = mount(NetworkHealthWidget)
  await nextTick()
  await nextTick()
  await new Promise(r => setTimeout(r, 50))
  await nextTick()
  return w
}

describe('NetworkHealthWidget', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    vi.mocked(complianceService.getNetworkHealth).mockResolvedValue(null as any)
    const w = mount(NetworkHealthWidget)
    expect(w.exists()).toBe(true)
  })

  it('shows healthy status correctly', async () => {
    const w = await mountAndWait(mockMetricsHealthy)
    expect(w.text()).toContain('Healthy')
  })

  it('shows degraded status correctly', async () => {
    const w = await mountAndWait(mockMetricsDegraded)
    expect(w.text()).toContain('Degraded')
  })

  it('shows critical status correctly', async () => {
    const w = await mountAndWait(mockMetricsCritical)
    expect(w.text()).toContain('Critical')
  })

  it('shows VOI network name', async () => {
    const w = await mountAndWait(mockMetricsHealthy)
    expect(w.text()).toContain('VOI')
  })

  it('shows error state on failure', async () => {
    vi.mocked(complianceService.getNetworkHealth).mockRejectedValue(new Error('err'))
    const w = mount(NetworkHealthWidget)
    await nextTick()
    await new Promise(r => setTimeout(r, 50))
    await nextTick()
    expect(w.text()).toContain('Failed to load metrics')
  })

  it('emits view-details', () => {
    vi.mocked(complianceService.getNetworkHealth).mockResolvedValue(mockMetricsHealthy)
    const w = mount(NetworkHealthWidget)
    w.vm.$emit('view-details')
    expect(w.emitted('view-details')).toBeTruthy()
  })
})
