import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TokenStandardsComparison from '../TokenStandardsComparison.vue'
import type { TokenStandard } from '../../stores/tokens'

const mockStandards: TokenStandard[] = [
  {
    name: 'ARC3',
    type: 'NFT',
    description: 'ARC3 standard',
    detailedDescription: 'ARC3 detailed',
    icon: null,
    bgClass: 'bg-blue-500',
    badgeVariant: 'info',
    statusColor: 'blue',
    network: 'AVM',
    count: 5,
    pros: ['Pro1'],
    cons: ['Con1'],
    useWhen: ['When1'],
    features: {
      metadataSupport: true,
      smartContract: false,
      whitelisting: false,
      complianceFlags: false,
      royalties: true,
      mutableMetadata: false,
      programmableLogic: false,
      nativeL1: true,
    },
  },
  {
    name: 'ERC20',
    type: 'Fungible',
    description: 'ERC20 standard',
    detailedDescription: 'ERC20 detailed',
    icon: null,
    bgClass: 'bg-purple-500',
    badgeVariant: 'success',
    statusColor: 'purple',
    network: 'EVM',
    count: 3,
    pros: ['Pro1'],
    cons: ['Con1'],
    useWhen: ['When1'],
    features: {
      metadataSupport: false,
      smartContract: true,
      whitelisting: true,
      complianceFlags: true,
      royalties: false,
      mutableMetadata: false,
      programmableLogic: true,
      nativeL1: false,
    },
  },
]

function mountComponent() {
  return mount(TokenStandardsComparison, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: () => vi.fn(),
          initialState: {
            tokens: { tokenStandards: mockStandards },
          },
        }),
      ],
      stubs: {
        Card: { template: '<div><slot /></div>' },
        Badge: { template: '<span><slot /></span>' },
        ChartBarSquareIcon: { template: '<svg />' },
        InformationCircleIcon: { template: '<svg />' },
        CheckCircleIcon: { template: '<svg />' },
        XCircleIcon: { template: '<svg />' },
        DocumentTextIcon: { template: '<svg />' },
        CodeBracketIcon: { template: '<svg />' },
        ShieldCheckIcon: { template: '<svg />' },
        LockClosedIcon: { template: '<svg />' },
        SparklesIcon: { template: '<svg />' },
        ArrowPathIcon: { template: '<svg />' },
        BoltIcon: { template: '<svg />' },
        StarIcon: { template: '<svg />' },
        ExclamationTriangleIcon: { template: '<svg />' },
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

describe('TokenStandardsComparison', () => {
  it('renders the page title', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Token Standards Comparison')
  })

  it('renders network filter buttons', () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map((b) => b.text())
    expect(buttonTexts.some((t) => t.includes('All Networks'))).toBe(true)
    expect(buttonTexts.some((t) => t.includes('AVM'))).toBe(true)
    expect(buttonTexts.some((t) => t.includes('EVM'))).toBe(true)
  })

  it('shows all standards by default (selectedNetwork = all)', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('ARC3')
    expect(wrapper.text()).toContain('ERC20')
  })

  it('filters to AVM standards when AVM network is selected', async () => {
    const wrapper = mountComponent()
    const vm = wrapper.vm as any
    const buttons = wrapper.findAll('button')
    const avmButton = buttons.find((b) => b.text().includes('AVM Chains'))
    await avmButton!.trigger('click')
    // selectedNetwork should be 'AVM' and filteredStandards should only have AVM standards
    expect(vm.selectedNetwork).toBe('AVM')
    const filtered = vm.filteredStandards
    expect(filtered.every((s: any) => s.network === 'AVM')).toBe(true)
  })

  it('filters to EVM standards when EVM network is selected', async () => {
    const wrapper = mountComponent()
    const vm = wrapper.vm as any
    const buttons = wrapper.findAll('button')
    const evmButton = buttons.find((b) => b.text().includes('EVM Chains'))
    await evmButton!.trigger('click')
    expect(vm.selectedNetwork).toBe('EVM')
    const filtered = vm.filteredStandards
    expect(filtered.every((s: any) => s.network === 'EVM')).toBe(true)
  })

  it('returns all standards when All Networks is selected after filtering', async () => {
    const wrapper = mountComponent()
    const vm = wrapper.vm as any
    const buttons = wrapper.findAll('button')
    const avmButton = buttons.find((b) => b.text().includes('AVM Chains'))
    await avmButton!.trigger('click')
    const allButton = buttons.find((b) => b.text().includes('All Networks'))
    await allButton!.trigger('click')
    expect(vm.selectedNetwork).toBe('all')
  })

  it('renders feature rows in the comparison table', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Metadata Support')
    expect(wrapper.text()).toContain('Smart Contract')
    expect(wrapper.text()).toContain('Whitelisting')
    expect(wrapper.text()).toContain('Compliance Flags')
  })

  it('renders Enterprise Value info section', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Enterprise Value')
  })

  it('renders without crashing when standards have no features', () => {
    const noFeaturesStandards: TokenStandard[] = [
      { ...mockStandards[0], features: undefined },
    ]
    const wrapper = mount(TokenStandardsComparison, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: () => vi.fn(),
            initialState: { tokens: { tokenStandards: noFeaturesStandards } },
          }),
        ],
        stubs: {
          Card: { template: '<div><slot /></div>' },
          Badge: { template: '<span><slot /></span>' },
          ChartBarSquareIcon: { template: '<svg />' },
          InformationCircleIcon: { template: '<svg />' },
          CheckCircleIcon: { template: '<svg />' },
          XCircleIcon: { template: '<svg />' },
          DocumentTextIcon: { template: '<svg />' },
          CodeBracketIcon: { template: '<svg />' },
          ShieldCheckIcon: { template: '<svg />' },
          LockClosedIcon: { template: '<svg />' },
          SparklesIcon: { template: '<svg />' },
          ArrowPathIcon: { template: '<svg />' },
          BoltIcon: { template: '<svg />' },
          StarIcon: { template: '<svg />' },
          ExclamationTriangleIcon: { template: '<svg />' },
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders empty state when no standards match filter', async () => {
    const wrapper = mount(TokenStandardsComparison, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: () => vi.fn(),
            initialState: { tokens: { tokenStandards: [] } },
          }),
        ],
        stubs: {
          Card: { template: '<div><slot /></div>' },
          Badge: { template: '<span><slot /></span>' },
          ChartBarSquareIcon: { template: '<svg />' },
          InformationCircleIcon: { template: '<svg />' },
          CheckCircleIcon: { template: '<svg />' },
          XCircleIcon: { template: '<svg />' },
          DocumentTextIcon: { template: '<svg />' },
          CodeBracketIcon: { template: '<svg />' },
          ShieldCheckIcon: { template: '<svg />' },
          LockClosedIcon: { template: '<svg />' },
          SparklesIcon: { template: '<svg />' },
          ArrowPathIcon: { template: '<svg />' },
          BoltIcon: { template: '<svg />' },
          StarIcon: { template: '<svg />' },
          ExclamationTriangleIcon: { template: '<svg />' },
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
