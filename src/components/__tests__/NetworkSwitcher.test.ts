import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import NetworkSwitcher from '../NetworkSwitcher.vue'

// Mock the useWalletManager composable
const mockCurrentNetwork = ref('voi-mainnet')
const mockNetworkInfo = ref({
  id: 'voi-mainnet',
  name: 'voi-mainnet',
  displayName: 'VOI Mainnet',
  algodUrl: 'https://mainnet-api.voi.nodely.dev',
  genesisId: 'voimain-v1.0',
  isTestnet: false,
})
const mockIsConnected = ref(false)
const mockSwitchNetwork = vi.fn()

vi.mock('../../composables/useWalletManager', () => ({
  useWalletManager: vi.fn(() => ({
    currentNetwork: mockCurrentNetwork,
    networkInfo: mockNetworkInfo,
    switchNetwork: mockSwitchNetwork,
    isConnected: mockIsConnected,
  })),
  NETWORKS: {
    'voi-mainnet': {
      id: 'voi-mainnet',
      name: 'voi-mainnet',
      displayName: 'VOI Mainnet',
      algodUrl: 'https://mainnet-api.voi.nodely.dev',
      genesisId: 'voimain-v1.0',
      isTestnet: false,
    },
    'aramidmain': {
      id: 'aramidmain',
      name: 'aramidmain',
      displayName: 'Aramid Mainnet',
      algodUrl: 'https://algod.aramidmain.a-wallet.net',
      genesisId: 'aramidmain-v1.0',
      isTestnet: false,
    },
    'dockernet': {
      id: 'dockernet',
      name: 'dockernet',
      displayName: 'Dockernet (Local)',
      algodUrl: 'http://localhost:4001',
      genesisId: 'dockernet-v1',
      isTestnet: true,
    },
  },
}))

describe('NetworkSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentNetwork.value = 'voi-mainnet'
    mockIsConnected.value = false
    mockNetworkInfo.value = {
      id: 'voi-mainnet',
      name: 'voi-mainnet',
      displayName: 'VOI Mainnet',
      algodUrl: 'https://mainnet-api.voi.nodely.dev',
      genesisId: 'voimain-v1.0',
      isTestnet: false,
    }
  })

  it('should render current network information', () => {
    const wrapper = mount(NetworkSwitcher)

    expect(wrapper.text()).toContain('VOI Mainnet')
    expect(wrapper.text()).toContain('Online')
  })

  it('should show network status indicator', () => {
    const wrapper = mount(NetworkSwitcher)

    const statusDot = wrapper.find('.w-2.h-2.rounded-full')
    expect(statusDot.exists()).toBe(true)
    expect(statusDot.classes()).toContain('bg-green-400')
  })

  it('should toggle dropdown when button is clicked', async () => {
    const wrapper = mount(NetworkSwitcher)

    const dropdown = wrapper.find('.absolute.right-0')
    expect(dropdown.exists()).toBe(false)

    await wrapper.find('button').trigger('click')
    await nextTick()

    const dropdownAfter = wrapper.find('.absolute.right-0')
    expect(dropdownAfter.exists()).toBe(true)
  })

  it('should display all available networks in dropdown', async () => {
    const wrapper = mount(NetworkSwitcher)

    await wrapper.find('button').trigger('click')
    await nextTick()

    const text = wrapper.text()
    expect(text).toContain('VOI Mainnet')
    expect(text).toContain('Aramid Mainnet')
    expect(text).toContain('Dockernet (Local)')
  })

  it('should show current network details', async () => {
    const wrapper = mount(NetworkSwitcher)

    await wrapper.find('button').trigger('click')
    await nextTick()

    const text = wrapper.text()
    expect(text).toContain('Current Network')
    expect(text).toContain('https://mainnet-api.voi.nodely.dev')
    expect(text).toContain('voimain-v1.0')
  })

  it('should indicate mainnet vs testnet', async () => {
    const wrapper = mount(NetworkSwitcher)

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Mainnet')
  })

  it('should show active network badge', async () => {
    const wrapper = mount(NetworkSwitcher)

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Active')
  })

  it('should show warning when wallet is connected', async () => {
    mockIsConnected.value = true
    const wrapper = mount(NetworkSwitcher)

    await wrapper.find('button').trigger('click')
    await nextTick()

    const text = wrapper.text()
    expect(text).toContain('Switching networks will disconnect')
  })

  it('should rotate chevron icon when dropdown is open', async () => {
    const wrapper = mount(NetworkSwitcher)

    const chevron = wrapper.find('.pi-chevron-down')
    expect(chevron.classes()).not.toContain('rotate-180')

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(chevron.classes()).toContain('rotate-180')
  })

  it('should call switchNetwork when clicking on different network', async () => {
    const wrapper = mount(NetworkSwitcher)

    await wrapper.find('button').trigger('click')
    await nextTick()

    // Find button for Aramid network
    const buttons = wrapper.findAll('button')
    const aramidButton = buttons.find(btn => btn.text().includes('Aramid Mainnet'))

    expect(aramidButton).toBeDefined()

    if (aramidButton) {
      await aramidButton.trigger('click')
      await nextTick()

      expect(mockSwitchNetwork).toHaveBeenCalledWith('aramidmain')
    }
  })

  it('should disable switching to current network', async () => {
    const wrapper = mount(NetworkSwitcher)

    await wrapper.find('button').trigger('click')
    await nextTick()

    const buttons = wrapper.findAll('button')
    const currentNetworkButton = buttons.find(btn => 
      btn.text().includes('VOI Mainnet') && btn.text().includes('Active')
    )

    if (currentNetworkButton) {
      expect(currentNetworkButton.attributes('disabled')).toBeDefined()
    }
  })

  it('should display network genesis IDs', async () => {
    const wrapper = mount(NetworkSwitcher)

    await wrapper.find('button').trigger('click')
    await nextTick()

    const text = wrapper.text()
    expect(text).toContain('voimain-v1.0')
    expect(text).toContain('aramidmain-v1.0')
    expect(text).toContain('dockernet-v1')
  })
})
