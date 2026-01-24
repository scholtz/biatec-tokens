import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import WalletDashboard from '../WalletDashboard.vue'
import * as walletManager from '../../composables/useWalletManager'

// Mock composables
vi.mock('../../composables/useWalletManager', () => ({
  useWalletManager: vi.fn()
}))

vi.mock('../../composables/useTokenBalance', () => ({
  useTokenBalance: vi.fn(() => ({
    accountBalance: {
      value: {
        address: '',
        algoBalance: 0,
        assets: [],
        isLoading: false,
        error: null
      }
    },
    isLoading: { value: false },
    hasAssets: { value: false },
    formattedAlgoBalance: { value: '0.000000' },
    refresh: vi.fn()
  }))
}))

vi.mock('../../composables/useTokenMetadata', () => ({
  useTokenMetadata: vi.fn(() => ({
    metadataCache: { value: new Map() },
    fetchMetadata: vi.fn(),
    getMetadata: vi.fn(),
    fetchBatchMetadata: vi.fn(),
    clearCache: vi.fn(),
    getVerificationBadge: vi.fn()
  }))
}))

describe('WalletDashboard Integration', () => {
  let router: any

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/wallet', name: 'WalletDashboard', component: WalletDashboard },
        { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
      ]
    })

    vi.clearAllMocks()
  })

  describe('Not Connected State', () => {
    it('should display connect wallet prompt when not connected', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: false },
        networkInfo: { value: null },
        disconnect: vi.fn()
      } as any)

      const wrapper = mount(WalletDashboard, {
        global: {
          plugins: [router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>'
            },
            WalletConnectModal: true,
            NetworkSwitcher: true
          }
        }
      })

      expect(wrapper.text()).toContain('Connect Your Wallet')
      expect(wrapper.text()).toContain('Connect your wallet to access your token balances')
    })

    it('should show connect button when not connected', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: false },
        networkInfo: { value: null },
        disconnect: vi.fn()
      } as any)

      const wrapper = mount(WalletDashboard, {
        global: {
          plugins: [router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>'
            },
            Button: {
              template: '<button><slot /></button>'
            },
            WalletConnectModal: true,
            NetworkSwitcher: true
          }
        }
      })

      expect(wrapper.find('button').exists()).toBe(true)
    })
  })

  describe('Connected State', () => {
    it('should display wallet dashboard sections when connected', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            algodUrl: 'https://mainnet-api.voi.nodely.dev',
            genesisId: 'voimain-v1.0',
            isTestnet: false
          }
        },
        disconnect: vi.fn()
      } as any)

      const wrapper = mount(WalletDashboard, {
        global: {
          plugins: [router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>'
            },
            AccountSwitcher: true,
            WalletInfo: true,
            TokenBalancePanel: true,
            ComplianceStatusIndicator: true,
            WalletConnectModal: true,
            NetworkSwitcher: true
          }
        }
      })

      expect(wrapper.text()).toContain('Wallet Dashboard')
      expect(wrapper.text()).toContain('Network Status')
      expect(wrapper.text()).toContain('Quick Actions')
    })

    it('should show AccountSwitcher when connected', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            algodUrl: 'https://mainnet-api.voi.nodely.dev',
            genesisId: 'voimain-v1.0',
            isTestnet: false
          }
        },
        disconnect: vi.fn()
      } as any)

      const wrapper = mount(WalletDashboard, {
        global: {
          plugins: [router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>'
            },
            AccountSwitcher: {
              template: '<div class="account-switcher">Account Switcher</div>'
            },
            WalletInfo: true,
            TokenBalancePanel: true,
            ComplianceStatusIndicator: true,
            WalletConnectModal: true,
            NetworkSwitcher: true
          }
        }
      })

      expect(wrapper.find('.account-switcher').exists()).toBe(true)
    })
  })
})
