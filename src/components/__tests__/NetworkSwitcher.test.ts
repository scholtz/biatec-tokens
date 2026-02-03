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
  chainType: 'AVM' as const,
})
const mockIsConnected = ref(false)
const mockSwitchNetwork = vi.fn()

vi.mock('../../composables/useWalletManager', () => {
  const mockNetworks = {
    'algorand-mainnet': {
      id: 'algorand-mainnet',
      name: 'algorand-mainnet',
      displayName: 'Algorand Mainnet',
      algodUrl: 'https://mainnet-api.4160.nodely.dev',
      genesisId: 'mainnet-v1.0',
      isTestnet: false,
      chainType: 'AVM',
    },
    'voi-mainnet': {
      id: 'voi-mainnet',
      name: 'voi-mainnet',
      displayName: 'VOI Mainnet',
      algodUrl: 'https://mainnet-api.voi.nodely.dev',
      genesisId: 'voimain-v1.0',
      isTestnet: false,
      chainType: 'AVM',
    },
    'aramidmain': {
      id: 'aramidmain',
      name: 'aramidmain',
      displayName: 'Aramid Mainnet',
      algodUrl: 'https://algod.aramidmain.a-wallet.net',
      genesisId: 'aramidmain-v1.0',
      isTestnet: false,
      chainType: 'AVM',
    },
    'algorand-testnet': {
      id: 'algorand-testnet',
      name: 'algorand-testnet',
      displayName: 'Algorand Testnet',
      algodUrl: 'https://testnet-api.4160.nodely.dev',
      genesisId: 'testnet-v1.0',
      isTestnet: true,
      chainType: 'AVM',
    },
    'dockernet': {
      id: 'dockernet',
      name: 'dockernet',
      displayName: 'Dockernet (Local)',
      algodUrl: 'http://localhost:4001',
      genesisId: 'dockernet-v1',
      isTestnet: true,
      chainType: 'AVM',
    },
    'ethereum': {
      id: 'ethereum',
      name: 'ethereum',
      displayName: 'Ethereum Mainnet',
      chainId: 1,
      rpcUrl: 'https://ethereum.publicnode.com',
      blockExplorerUrl: 'https://etherscan.io',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      isTestnet: false,
      chainType: 'EVM',
    },
    'arbitrum': {
      id: 'arbitrum',
      name: 'arbitrum',
      displayName: 'Arbitrum One',
      chainId: 42161,
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      blockExplorerUrl: 'https://arbiscan.io',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      isTestnet: false,
      chainType: 'EVM',
    },
    'base': {
      id: 'base',
      name: 'base',
      displayName: 'Base',
      chainId: 8453,
      rpcUrl: 'https://mainnet.base.org',
      blockExplorerUrl: 'https://basescan.org',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      isTestnet: false,
      chainType: 'EVM',
    },
    'sepolia': {
      id: 'sepolia',
      name: 'sepolia',
      displayName: 'Sepolia Testnet',
      chainId: 11155111,
      rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
      blockExplorerUrl: 'https://sepolia.etherscan.io',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      isTestnet: true,
      chainType: 'EVM',
    },
  };
  
  const avmNetworks = {
    'algorand-mainnet': mockNetworks['algorand-mainnet'],
    'voi-mainnet': mockNetworks['voi-mainnet'],
    'aramidmain': mockNetworks['aramidmain'],
    'algorand-testnet': mockNetworks['algorand-testnet'],
    'dockernet': mockNetworks['dockernet'],
  };
  
  const evmNetworks = {
    'ethereum': mockNetworks['ethereum'],
    'arbitrum': mockNetworks['arbitrum'],
    'base': mockNetworks['base'],
    'sepolia': mockNetworks['sepolia'],
  };
  
  return {
    useWalletManager: vi.fn(() => ({
      currentNetwork: mockCurrentNetwork,
      networkInfo: mockNetworkInfo,
      switchNetwork: mockSwitchNetwork,
      isConnected: mockIsConnected,
    })),
    NETWORKS: mockNetworks,
    AVM_NETWORKS: avmNetworks,
    EVM_NETWORKS: evmNetworks,
  };
})

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
      chainType: 'AVM' as const,
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
    expect(text).toContain('Switching networks will sign you out')
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
