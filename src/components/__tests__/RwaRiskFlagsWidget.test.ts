import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RwaRiskFlagsWidget from '../RwaRiskFlagsWidget.vue'
import { complianceService } from '../../services/ComplianceService'

vi.mock('../../services/ComplianceService', () => ({
  complianceService: {
    getRwaRiskFlags: vi.fn(),
  },
}))

const makeMetrics = (overrides = {}) => ({
  totalFlags: 0, criticalFlags: 0, highFlags: 0, mediumFlags: 0, lowFlags: 0,
  lastUpdated: '2024-01-15T10:30:00Z',
  ...overrides,
})

async function mountAndWait(metrics: any) {
  vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue(metrics)
  const w = mount(RwaRiskFlagsWidget)
  await nextTick()
  await new Promise(r => setTimeout(r, 50))
  await nextTick()
  return w
}

describe('RwaRiskFlagsWidget', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue(makeMetrics() as any)
    const w = mount(RwaRiskFlagsWidget)
    expect(w.exists()).toBe(true)
  })

  it('shows no flags message when all clear', async () => {
    const w = await mountAndWait(makeMetrics())
    expect(w.text()).toContain('No active risk flags')
  })

  it('shows critical flags count', async () => {
    const w = await mountAndWait(makeMetrics({ totalFlags: 2, criticalFlags: 2 }))
    expect(w.text()).toContain('Critical')
  })

  it('shows high flags count', async () => {
    const w = await mountAndWait(makeMetrics({ totalFlags: 3, highFlags: 3 }))
    expect(w.text()).toContain('High')
  })

  it('shows medium flags count', async () => {
    const w = await mountAndWait(makeMetrics({ totalFlags: 1, mediumFlags: 1 }))
    expect(w.text()).toContain('Medium')
  })

  it('shows low flags count', async () => {
    const w = await mountAndWait(makeMetrics({ totalFlags: 4, lowFlags: 4 }))
    expect(w.text()).toContain('Low')
  })

  it('shows error state on failure', async () => {
    vi.mocked(complianceService.getRwaRiskFlags).mockRejectedValue(new Error('err'))
    const w = mount(RwaRiskFlagsWidget)
    await nextTick()
    await new Promise(r => setTimeout(r, 50))
    await nextTick()
    expect(w.text()).toContain('Failed to load metrics')
  })

  it('passes network prop to service', async () => {
    vi.mocked(complianceService.getRwaRiskFlags).mockResolvedValue(makeMetrics() as any)
    mount(RwaRiskFlagsWidget, { props: { network: 'VOI' } })
    await nextTick()
    await new Promise(r => setTimeout(r, 20))
    expect(vi.mocked(complianceService.getRwaRiskFlags)).toHaveBeenCalledWith('VOI')
  })
})
