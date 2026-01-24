import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WalletInfo from '../../WalletInfo.vue'
import * as walletManager from '../../../composables/useWalletManager'
import * as tokenBalance from '../../../composables/useTokenBalance'

// Mock composables
vi.mock('../../../composables/useWalletManager', () => ({
  useWalletManager: vi.fn()
}))

vi.mock('../../../composables/useTokenBalance', () => ({
  useTokenBalance: vi.fn()
}))

describe('WalletInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Not Connected State', () => {
    it('should display connect prompt when wallet is not connected', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: false },
        activeAddress: { value: null },
        formattedAddress: { value: null },
        networkInfo: { value: null }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
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
      } as any)

      const wrapper = mount(WalletInfo)

      expect(wrapper.text()).toContain('Connect your wallet to view balance')
      expect(wrapper.find('.pi-wallet').exists()).toBe(true)
    })
  })

  describe('Connected State', () => {
    it('should display wallet information when connected', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQR' },
        formattedAddress: { value: 'ABCDEF...NOPQR' },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            isTestnet: false
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQR',
            algoBalance: 5000000,
            assets: [],
            isLoading: false,
            error: null
          }
        },
        isLoading: { value: false },
        hasAssets: { value: false },
        formattedAlgoBalance: { value: '5.000000' },
        refresh: vi.fn()
      } as any)

      const wrapper = mount(WalletInfo)

      expect(wrapper.text()).toContain('Wallet Information')
      expect(wrapper.text()).toContain('ABCDEF...NOPQR')
      expect(wrapper.text()).toContain('VOI Mainnet')
      expect(wrapper.text()).toContain('5.000000')
      expect(wrapper.text()).toContain('ALGO')
    })

    it('should display network status indicator', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'MOCK_ADDRESS' },
        formattedAddress: { value: 'MOCK_A...DRESS' },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            isTestnet: false
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'MOCK_ADDRESS',
            algoBalance: 1000000,
            assets: [],
            isLoading: false,
            error: null
          }
        },
        isLoading: { value: false },
        hasAssets: { value: false },
        formattedAlgoBalance: { value: '1.000000' },
        refresh: vi.fn()
      } as any)

      const wrapper = mount(WalletInfo)

      expect(wrapper.find('.bg-green-500').exists()).toBe(true) // Mainnet indicator
    })

    it('should show testnet indicator for testnet', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'MOCK_ADDRESS' },
        formattedAddress: { value: 'MOCK_A...DRESS' },
        networkInfo: {
          value: {
            displayName: 'Dockernet (Local)',
            isTestnet: true
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'MOCK_ADDRESS',
            algoBalance: 1000000,
            assets: [],
            isLoading: false,
            error: null
          }
        },
        isLoading: { value: false },
        hasAssets: { value: false },
        formattedAlgoBalance: { value: '1.000000' },
        refresh: vi.fn()
      } as any)

      const wrapper = mount(WalletInfo)

      expect(wrapper.find('.bg-yellow-500').exists()).toBe(true) // Testnet indicator
    })
  })

  describe('Asset Holdings', () => {
    it('should display asset holdings when available', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'MOCK_ADDRESS' },
        formattedAddress: { value: 'MOCK_A...DRESS' },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            isTestnet: false
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'MOCK_ADDRESS',
            algoBalance: 1000000,
            assets: [
              {
                assetId: 123,
                amount: 1000,
                decimals: 2,
                isFrozen: false,
                creator: 'CREATOR',
                assetName: 'Test Token',
                unitName: 'TEST'
              }
            ],
            isLoading: false,
            error: null
          }
        },
        isLoading: { value: false },
        hasAssets: { value: true },
        formattedAlgoBalance: { value: '1.000000' },
        refresh: vi.fn()
      } as any)

      const wrapper = mount(WalletInfo)

      expect(wrapper.text()).toContain('Asset Holdings (1)')
      expect(wrapper.text()).toContain('Test Token')
      expect(wrapper.text()).toContain('ID: 123')
    })

    it('should show "No asset holdings" when no assets', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'MOCK_ADDRESS' },
        formattedAddress: { value: 'MOCK_A...DRESS' },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            isTestnet: false
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'MOCK_ADDRESS',
            algoBalance: 1000000,
            assets: [],
            isLoading: false,
            error: null
          }
        },
        isLoading: { value: false },
        hasAssets: { value: false },
        formattedAlgoBalance: { value: '1.000000' },
        refresh: vi.fn()
      } as any)

      const wrapper = mount(WalletInfo)

      expect(wrapper.text()).toContain('No asset holdings')
    })

    it('should display "View all" button when more than 5 assets', () => {
      const assets = Array.from({ length: 10 }, (_, i) => ({
        assetId: i,
        amount: 1000,
        decimals: 2,
        isFrozen: false,
        creator: 'CREATOR',
        assetName: `Token ${i}`,
        unitName: `TKN${i}`
      }))

      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'MOCK_ADDRESS' },
        formattedAddress: { value: 'MOCK_A...DRESS' },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            isTestnet: false
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'MOCK_ADDRESS',
            algoBalance: 1000000,
            assets,
            isLoading: false,
            error: null
          }
        },
        isLoading: { value: false },
        hasAssets: { value: true },
        formattedAlgoBalance: { value: '1.000000' },
        refresh: vi.fn()
      } as any)

      const wrapper = mount(WalletInfo)

      expect(wrapper.text()).toContain('View all 10 assets')
    })
  })

  describe('Error Handling', () => {
    it('should display error message when balance fetch fails', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'MOCK_ADDRESS' },
        formattedAddress: { value: 'MOCK_A...DRESS' },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            isTestnet: false
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'MOCK_ADDRESS',
            algoBalance: 0,
            assets: [],
            isLoading: false,
            error: 'Network error: Failed to fetch'
          }
        },
        isLoading: { value: false },
        hasAssets: { value: false },
        formattedAlgoBalance: { value: '0.000000' },
        refresh: vi.fn()
      } as any)

      const wrapper = mount(WalletInfo)

      expect(wrapper.text()).toContain('Failed to load balance')
      expect(wrapper.text()).toContain('Network error: Failed to fetch')
    })
  })

  describe('User Actions', () => {
    it('should call refresh when refresh button is clicked', async () => {
      const mockRefresh = vi.fn()

      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'MOCK_ADDRESS' },
        formattedAddress: { value: 'MOCK_A...DRESS' },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            isTestnet: false
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'MOCK_ADDRESS',
            algoBalance: 1000000,
            assets: [],
            isLoading: false,
            error: null
          }
        },
        isLoading: { value: false },
        hasAssets: { value: false },
        formattedAlgoBalance: { value: '1.000000' },
        refresh: mockRefresh
      } as any)

      const wrapper = mount(WalletInfo)

      await wrapper.find('button[title="Refresh balance"]').trigger('click')

      expect(mockRefresh).toHaveBeenCalled()
    })

    it('should disable refresh button when loading', () => {
      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        isConnected: { value: true },
        activeAddress: { value: 'MOCK_ADDRESS' },
        formattedAddress: { value: 'MOCK_A...DRESS' },
        networkInfo: {
          value: {
            displayName: 'VOI Mainnet',
            isTestnet: false
          }
        }
      } as any)

      vi.mocked(tokenBalance.useTokenBalance).mockReturnValue({
        accountBalance: {
          value: {
            address: 'MOCK_ADDRESS',
            algoBalance: 1000000,
            assets: [],
            isLoading: true,
            error: null
          }
        },
        isLoading: { value: true },
        hasAssets: { value: false },
        formattedAlgoBalance: { value: '1.000000' },
        refresh: vi.fn()
      } as any)

      const wrapper = mount(WalletInfo)

      const refreshButton = wrapper.find('button[title="Refresh balance"]')
      expect(refreshButton.attributes('disabled')).toBeDefined()
    })
  })
})
