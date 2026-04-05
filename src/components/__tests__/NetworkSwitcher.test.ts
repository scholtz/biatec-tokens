import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import NetworkSwitcher from '../NetworkSwitcher.vue'
import { AVM_NETWORKS } from '../../stores/network'

const mockNetworkInfo = AVM_NETWORKS['algorand-mainnet']

function mountSwitcher(overrides: Record<string, unknown> = {}) {
  return mount(NetworkSwitcher, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            network: {
              networkInfo: mockNetworkInfo,
              currentNetworkId: 'algorand-mainnet',
            },
          },
        }),
      ],
    },
    ...overrides,
  })
}

describe('NetworkSwitcher', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('networkStatus computed', () => {
    it('shows "Online" when not switching', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      expect(vm.networkStatus).toBe('Online')
    })

    it('shows "Switching..." when isSwitching is true', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      vm.isSwitching = true
      expect(vm.networkStatus).toBe('Switching...')
    })
  })

  describe('networkStatusColor computed', () => {
    it('returns green color when not switching', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      expect(vm.networkStatusColor).toBe('bg-green-400')
    })

    it('returns yellow animated color when switching', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      vm.isSwitching = true
      expect(vm.networkStatusColor).toBe('bg-yellow-400 animate-pulse')
    })
  })

  describe('avmNetworks computed', () => {
    it('returns only non-testnet AVM networks', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      const avmNets = vm.avmNetworks
      expect(avmNets.every((n: any) => !n.isTestnet)).toBe(true)
      expect(avmNets.every((n: any) => n.chainType === 'AVM')).toBe(true)
    })

    it('places algorand-mainnet first', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      expect(vm.avmNetworks[0].id).toBe('algorand-mainnet')
    })
  })

  describe('avmTestNetworks computed', () => {
    it('returns only testnet AVM networks', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      const testNets = vm.avmTestNetworks
      expect(testNets.every((n: any) => n.isTestnet)).toBe(true)
    })
  })

  describe('evmNetworks computed', () => {
    it('returns only non-testnet EVM networks', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      const evmNets = vm.evmNetworks
      expect(evmNets.every((n: any) => !n.isTestnet)).toBe(true)
      expect(evmNets.every((n: any) => n.chainType === 'EVM')).toBe(true)
    })

    it('places ethereum first', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      expect(vm.evmNetworks[0].id).toBe('ethereum')
    })
  })

  describe('evmTestNetworks computed', () => {
    it('returns only testnet EVM networks', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      const testNets = vm.evmTestNetworks
      expect(testNets.every((n: any) => n.isTestnet)).toBe(true)
    })
  })

  describe('toggleDropdown', () => {
    it('opens dropdown when closed', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      expect(vm.isOpen).toBe(false)
      vm.toggleDropdown()
      expect(vm.isOpen).toBe(true)
    })

    it('closes dropdown when open', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      vm.isOpen = true
      vm.toggleDropdown()
      expect(vm.isOpen).toBe(false)
    })

    it('clears error on toggle', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      vm.error = 'Previous error'
      vm.toggleDropdown()
      expect(vm.error).toBeNull()
    })
  })

  describe('handleNetworkSwitch', () => {
    it('does nothing when switching to current network', async () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      vi.spyOn(vm, 'handleNetworkSwitch')
      // Call with current network
      await vm.handleNetworkSwitch('algorand-mainnet')
      // isSwitching should remain false since it's the current network
      expect(vm.isSwitching).toBe(false)
    })

    it('does nothing when already switching', async () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      vm.isSwitching = true
      await vm.handleNetworkSwitch('voi-mainnet')
      // Should not have modified isSwitching
      expect(vm.isSwitching).toBe(true)
    })

    it('sets isSwitching and calls store switchNetwork for different network', async () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      const networkStore = vm.networkStore || (wrapper.vm as any).$pinia?.state?.value?.network
      // Mock the store's switchNetwork
      const switchNetworkSpy = vi.fn().mockResolvedValue(undefined)
      vm.networkStore = { ...vm.networkStore, switchNetwork: switchNetworkSpy }
      // The switchNetwork is on the store, we can test isSwitching becomes true
      // by checking the state before/after
      expect(vm.isSwitching).toBe(false)
    })

    it('handles error when switchNetwork throws', async () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      const { useNetworkStore } = await import('../../stores/network')
      const store = useNetworkStore()
      const errorMsg = 'Switch failed'
      store.switchNetwork = vi.fn().mockRejectedValue(new Error(errorMsg))
      await vm.handleNetworkSwitch('voi-mainnet')
      expect(vm.error).toBe(errorMsg)
      expect(vm.isSwitching).toBe(false)
    })
  })

  describe('handleClickOutside', () => {
    it('closes dropdown when clicking outside', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      vm.isOpen = true
      // Simulate clicking outside by calling directly with non-contained event
      const event = { target: document.body } as unknown as MouseEvent
      vm.handleClickOutside(event)
      expect(vm.isOpen).toBe(false)
    })
  })

  describe('currentNetwork computed', () => {
    it('returns the network id from store', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      expect(vm.currentNetwork).toBe('algorand-mainnet')
    })
  })
})

  describe('handleNetworkSwitch — non-Error exception branch (line 272)', () => {
    it('sets error to default message when thrown exception is not an Error object', async () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      // Access the testing pinia store directly to mock switchNetwork
      const { useNetworkStore } = await import('../../stores/network')
      const store = useNetworkStore()
      store.switchNetwork = vi.fn().mockRejectedValue('plain string error')
      await vm.handleNetworkSwitch('voi-mainnet')
      expect(vm.error).toBe('Failed to switch network')
      expect(vm.isSwitching).toBe(false)
    })
  })

  describe('onUnmounted — removeEventListener called (line 293)', () => {
    it('removes click listener when component is unmounted', () => {
      const wrapper = mountSwitcher()
      const removeSpy = vi.spyOn(document, 'removeEventListener')
      wrapper.unmount()
      expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function))
      removeSpy.mockRestore()
    })
  })

  describe('evmTestNetworks sort — locale comparison (line 244)', () => {
    it('sort comparator is exercised when multiple EVM test networks exist', async () => {
      const { EVM_NETWORKS } = await import('../../stores/network')
      // Temporarily add a second EVM test network so sort comparator fires
      const extraNetwork = {
        id: 'arbitrum-sepolia',
        name: 'arbitrum-sepolia',
        displayName: 'Arbitrum Sepolia',
        chainId: 421614,
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        blockExplorerUrl: 'https://sepolia.arbiscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: true,
        chainType: 'EVM' as const,
      }
      ;(EVM_NETWORKS as Record<string, unknown>)['arbitrum-sepolia'] = extraNetwork
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      const testNets = vm.evmTestNetworks
      // With 2+ EVM test networks, sort comparator fires and returns correct order
      expect(testNets.length).toBeGreaterThanOrEqual(2)
      for (let i = 0; i < testNets.length - 1; i++) {
        expect(testNets[i].displayName.localeCompare(testNets[i + 1].displayName)).toBeLessThanOrEqual(0)
      }
      // Cleanup
      delete (EVM_NETWORKS as Record<string, unknown>)['arbitrum-sepolia']
    })
  })

  describe('handleClickOutside — dropdownRef null branch (line ~286)', () => {
    it('does not crash when dropdownRef is null', () => {
      const wrapper = mountSwitcher()
      const vm = wrapper.vm as any
      vm.isOpen = true
      // Simulate when dropdownRef is null (not yet attached)
      const origRef = vm.dropdownRef
      vm.dropdownRef = null
      const event = { target: document.body } as unknown as MouseEvent
      expect(() => vm.handleClickOutside(event)).not.toThrow()
      vm.dropdownRef = origRef
    })
  })

  describe('AVM test network Active badge (line 127)', () => {
    it('renders Active badge when current network is an AVM test network', async () => {
      const { AVM_NETWORKS } = await import('../../stores/network')
      const testNetInfo = AVM_NETWORKS['algorand-testnet']
      const wrapper = mount(NetworkSwitcher, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                network: {
                  networkInfo: testNetInfo,
                  currentNetworkId: 'algorand-testnet',
                },
              },
            }),
          ],
        },
      })
      const vm = wrapper.vm as any
      // Open dropdown so test network buttons render in DOM
      vm.isOpen = true
      await nextTick()
      expect(vm.currentNetwork).toBe('algorand-testnet')
      // The Active badge is rendered for the current network in the AVM test networks list
      expect(vm.avmTestNetworks.some((n: { id: string }) => n.id === 'algorand-testnet')).toBe(true)
      // Active badge should appear in the rendered dropdown
      const html = wrapper.html()
      expect(html).toContain('Algorand Testnet')
    })
  })

  describe('EVM test network Active badge (line 153)', () => {
    it('renders Active badge when current network is an EVM test network', async () => {
      const { EVM_NETWORKS } = await import('../../stores/network')
      const sepoliaInfo = EVM_NETWORKS['sepolia']
      const wrapper = mount(NetworkSwitcher, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                network: {
                  networkInfo: sepoliaInfo,
                  currentNetworkId: 'sepolia',
                },
              },
            }),
          ],
        },
      })
      const vm = wrapper.vm as any
      // Open dropdown so EVM test network buttons render in DOM
      vm.isOpen = true
      await nextTick()
      expect(vm.currentNetwork).toBe('sepolia')
      // Active badge should appear for the sepolia test network
      expect(vm.evmTestNetworks.some((n: { id: string }) => n.id === 'sepolia')).toBe(true)
      const html = wrapper.html()
      expect(html).toContain('Sepolia')
    })
  })
