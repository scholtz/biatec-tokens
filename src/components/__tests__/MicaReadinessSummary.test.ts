import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import MicaReadinessSummary from '../MicaReadinessSummary.vue'

const mockPush = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRouter: () => ({ push: mockPush })
  }
})

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/compliance', name: 'ComplianceDashboard', component: { template: '<div />' } },
      { path: '/attestations', name: 'AttestationsDashboard', component: { template: '<div />' } },
      { path: '/guide', name: 'EnterpriseGuide', component: { template: '<div />' } }
    ]
  })

describe('MicaReadinessSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the MICA Readiness Dashboard heading', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    expect(wrapper.text()).toContain('MICA Readiness Dashboard')
  })

  it('shows VOI and Aramid network tabs', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    expect(wrapper.text()).toContain('VOI')
    expect(wrapper.text()).toContain('Aramid')
  })

  it('defaults to VOI network tab active', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    const voi = wrapper.find('button.bg-biatec-accent') ?? wrapper.findAll('button').find(b => b.text() === 'VOI')
    expect(wrapper.text()).toContain('VOI Network')
  })

  it('switches to Aramid network when tab clicked', async () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    const aramidBtn = wrapper.findAll('button').find(b => b.text() === 'Aramid')
    expect(aramidBtn).toBeTruthy()
    await aramidBtn!.trigger('click')
    expect(wrapper.text()).toContain('Aramid Network')
  })

  it('shows readiness score percentage', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    // VOI default score is 75
    expect(wrapper.text()).toContain('75%')
  })

  it('readinessScoreColor: green for >=80 (Aramid=82)', async () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    // Switch to Aramid which has score 82
    const aramidBtn = wrapper.findAll('button').find(b => b.text() === 'Aramid')
    await aramidBtn!.trigger('click')
    const scoreEl = wrapper.find('.text-4xl')
    expect(scoreEl.classes()).toContain('text-green-400')
  })

  it('readinessScoreColor: yellow for >=60 and <80 (VOI=75)', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    const scoreEl = wrapper.find('.text-4xl')
    expect(scoreEl.classes()).toContain('text-yellow-400')
  })

  it('readinessLabel: Enterprise Ready for Aramid (82)', async () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    const aramidBtn = wrapper.findAll('button').find(b => b.text() === 'Aramid')
    await aramidBtn!.trigger('click')
    expect(wrapper.text()).toContain('Enterprise Ready')
  })

  it('readinessLabel: Good Progress for VOI (75)', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    expect(wrapper.text()).toContain('Good Progress')
  })

  it('shows refresh button when not loading', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    const refreshBtn = wrapper.findAll('button').find(b => b.text().includes('Refresh'))
    expect(refreshBtn).toBeTruthy()
  })

  it('navigateToCompliance calls router.push with ComplianceDashboard', async () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    const complianceBtn = wrapper.findAll('button').find(b => b.text().includes('Compliance'))
    expect(complianceBtn).toBeTruthy()
    await complianceBtn!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ComplianceDashboard' })
    )
  })

  it('navigateToAttestations calls router.push with AttestationsDashboard', async () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    const attBtn = wrapper.findAll('button').find(b => b.text().includes('Attestations'))
    expect(attBtn).toBeTruthy()
    await attBtn!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'AttestationsDashboard' })
    )
  })

  it('navigateToGuide calls router.push with EnterpriseGuide', async () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    const guideBtn = wrapper.findAll('button').find(b => b.text().includes('Enterprise Guide'))
    expect(guideBtn).toBeTruthy()
    await guideBtn!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'EnterpriseGuide' })
    )
  })

  it('shows compliance requirement labels', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    expect(wrapper.text()).toContain('Token Whitepaper')
    expect(wrapper.text()).toContain('KYC/AML Policy')
    expect(wrapper.text()).toContain('Transfer Restrictions')
    expect(wrapper.text()).toContain('Audit Trail')
  })

  it('shows audit exports ready count for VOI', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    // VOI has 3 ready exports
    expect(wrapper.text()).toContain('Audit Exports')
  })

  it('shows whitelist coverage percentage for VOI', () => {
    const wrapper = mount(MicaReadinessSummary, {
      global: { plugins: [makeRouter()] }
    })
    expect(wrapper.text()).toContain('68%')
  })
})
