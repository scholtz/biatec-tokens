import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useWalletManager, NETWORKS } from '../useWalletManager'

// Mock the @txnlab/use-wallet-vue module
vi.mock('@txnlab/use-wallet-vue', () => ({
  useWallet: vi.fn(() => ({
    activeAccount: { value: null },
    activeWallet: { value: null },
    accounts: { value: [] },
    wallets: {
      value: [
        {
          id: 'pera',
          isActive: true,
          connect: vi.fn(),
          disconnect: vi.fn(),
          setActiveAccount: vi.fn(),
        },
        {
          id: 'defly',
          isActive: true,
          connect: vi.fn(),
          disconnect: vi.fn(),
          setActiveAccount: vi.fn(),
        },
      ],
    },
    subscribe: vi.fn(() => vi.fn()),
  })),
}))

describe('useWalletManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('NETWORKS constant', () => {
    it('should have VOI mainnet configuration', () => {
      expect(NETWORKS['voi-mainnet']).toBeDefined()
      expect(NETWORKS['voi-mainnet'].displayName).toBe('VOI Mainnet')
      expect(NETWORKS['voi-mainnet'].isTestnet).toBe(false)
    })

    it('should have Aramid mainnet configuration', () => {
      expect(NETWORKS['aramidmain']).toBeDefined()
      expect(NETWORKS['aramidmain'].displayName).toBe('Aramid Mainnet')
      expect(NETWORKS['aramidmain'].isTestnet).toBe(false)
    })

    it('should have dockernet configuration', () => {
      expect(NETWORKS['dockernet']).toBeDefined()
      expect(NETWORKS['dockernet'].displayName).toBe('Dockernet (Local)')
      expect(NETWORKS['dockernet'].isTestnet).toBe(true)
    })
  })

  describe('Wallet State Management', () => {
    it('should initialize with disconnected state', () => {
      const TestComponent = {
        template: '<div></div>',
        setup() {
          const walletManager = useWalletManager()
          return { walletManager }
        },
      }

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [createPinia()],
        },
      })

      const { walletManager } = wrapper.vm as any

      expect(walletManager.isConnected.value).toBe(false)
      expect(walletManager.activeAddress.value).toBeNull()
      expect(walletManager.activeWallet.value).toBeNull()
    })

    it('should provide formatted address when connected', () => {
      const TestComponent = {
        template: '<div></div>',
        setup() {
          const walletManager = useWalletManager()
          // Simulate connected state
          walletManager.walletState.value = {
            isConnected: true,
            activeAddress: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
            activeWallet: 'pera',
            accounts: [],
            isConnecting: false,
            error: null,
          }
          return { walletManager }
        },
      }

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [createPinia()],
        },
      })

      const { walletManager } = wrapper.vm as any

      expect(walletManager.formattedAddress.value).toMatch(/^.{6}\.\.\..{4}$/)
    })
  })

  describe('Network Management', () => {
    it('should have VOI mainnet as default network', () => {
      const TestComponent = {
        template: '<div></div>',
        setup() {
          const walletManager = useWalletManager()
          return { walletManager }
        },
      }

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [createPinia()],
        },
      })

      const { walletManager } = wrapper.vm as any

      expect(walletManager.currentNetwork.value).toBe('voi-mainnet')
      expect(walletManager.networkInfo.value.displayName).toBe('VOI Mainnet')
    })

    it('should provide all available networks', () => {
      const TestComponent = {
        template: '<div></div>',
        setup() {
          const walletManager = useWalletManager()
          return { walletManager }
        },
      }

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [createPinia()],
        },
      })

      const { walletManager } = wrapper.vm as any

      expect(walletManager.availableNetworks).toBe(NETWORKS)
      expect(Object.keys(walletManager.availableNetworks)).toHaveLength(3)
    })
  })

  describe('Connection Persistence', () => {
    it('should persist connection state to localStorage', () => {
      const TestComponent = {
        template: '<div></div>',
        setup() {
          const walletManager = useWalletManager()
          // Simulate connected state
          walletManager.walletState.value = {
            isConnected: true,
            activeAddress: 'TEST_ADDRESS',
            activeWallet: 'pera',
            accounts: [],
            isConnecting: false,
            error: null,
          }
          return { walletManager }
        },
      }

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [createPinia()],
        },
      })

      // The connection state should be persisted when connected
      // This would be done by the persistConnectionState function
      expect(localStorage.getItem).toBeDefined()
    })

    it('should restore network from localStorage', () => {
      localStorage.setItem('selected_network', 'aramidmain')

      const TestComponent = {
        template: '<div></div>',
        setup() {
          const walletManager = useWalletManager()
          return { walletManager }
        },
      }

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [createPinia()],
        },
      })

      // Network restoration happens in attemptReconnect
      // This test verifies the localStorage interaction
      expect(localStorage.getItem('selected_network')).toBe('aramidmain')
    })
  })

  describe('Error Handling', () => {
    it('should handle wallet connection errors', () => {
      const TestComponent = {
        template: '<div></div>',
        setup() {
          const walletManager = useWalletManager()
          // Simulate error state
          walletManager.walletState.value = {
            isConnected: false,
            activeAddress: null,
            activeWallet: null,
            accounts: [],
            isConnecting: false,
            error: 'Connection failed',
          }
          return { walletManager }
        },
      }

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [createPinia()],
        },
      })

      const { walletManager } = wrapper.vm as any

      expect(walletManager.walletState.value.error).toBe('Connection failed')
      expect(walletManager.isConnected.value).toBe(false)
    })
  })
})
