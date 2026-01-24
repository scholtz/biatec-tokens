import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTokenBalance } from '../useTokenBalance'
import * as walletManager from '../useWalletManager'
import algosdk from 'algosdk'

// Mock algosdk
vi.mock('algosdk', () => ({
  default: {
    Algodv2: vi.fn(() => ({
      accountInformation: vi.fn(() => ({
        do: vi.fn()
      }))
    }))
  }
}))

// Mock useWalletManager
vi.mock('../useWalletManager', () => ({
  useWalletManager: vi.fn(() => ({
    activeAddress: { value: null },
    networkInfo: {
      value: {
        algodUrl: 'https://mainnet-api.voi.nodely.dev',
        genesisId: 'voimain-v1.0'
      }
    },
    isConnected: { value: false }
  }))
}))

describe('useTokenBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty balance state', () => {
      const { accountBalance } = useTokenBalance()

      expect(accountBalance.value.address).toBe('')
      expect(accountBalance.value.algoBalance).toBe(0)
      expect(accountBalance.value.assets).toEqual([])
      expect(accountBalance.value.isLoading).toBe(false)
      expect(accountBalance.value.error).toBeNull()
    })

    it('should have hasAssets as false initially', () => {
      const { hasAssets } = useTokenBalance()
      expect(hasAssets.value).toBe(false)
    })

    it('should format algo balance correctly', () => {
      const { formattedAlgoBalance } = useTokenBalance()
      expect(formattedAlgoBalance.value).toBe('0.000000')
    })
  })

  describe('fetchBalance', () => {
    it('should handle no wallet address gracefully', async () => {
      const { accountBalance, fetchBalance } = useTokenBalance()

      await fetchBalance()

      expect(accountBalance.value.error).toBe('No wallet address available')
      expect(accountBalance.value.address).toBe('')
    })

    it('should fetch balance when address is provided', async () => {
      const mockAccountInfo = {
        amount: 1000000,
        assets: [
          {
            'asset-id': 123,
            amount: 500,
            decimals: 2,
            'is-frozen': false,
            creator: 'MOCK_CREATOR',
            'unit-name': 'TEST',
            'asset-name': 'Test Token'
          }
        ]
      }

      const mockAlgodClient = {
        accountInformation: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAccountInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        activeAddress: { value: 'MOCK_ADDRESS' },
        networkInfo: {
          value: {
            algodUrl: 'https://mainnet-api.voi.nodely.dev',
            genesisId: 'voimain-v1.0'
          }
        },
        isConnected: { value: true }
      } as any)

      const { accountBalance, fetchBalance } = useTokenBalance()

      await fetchBalance('MOCK_ADDRESS')

      expect(accountBalance.value.address).toBe('MOCK_ADDRESS')
      expect(accountBalance.value.algoBalance).toBe(1000000)
      expect(accountBalance.value.assets).toHaveLength(1)
      expect(accountBalance.value.assets[0].assetId).toBe(123)
      expect(accountBalance.value.assets[0].amount).toBe(500)
      expect(accountBalance.value.error).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error')
      const mockAlgodClient = {
        accountInformation: vi.fn(() => ({
          do: vi.fn().mockRejectedValue(mockError)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      const { accountBalance, fetchBalance } = useTokenBalance()

      await fetchBalance('MOCK_ADDRESS')

      expect(accountBalance.value.error).toBe('Network error')
      expect(accountBalance.value.algoBalance).toBe(0)
      expect(accountBalance.value.assets).toEqual([])
    })
  })

  describe('getAssetBalance', () => {
    it('should return null for non-existent asset', () => {
      const { getAssetBalance } = useTokenBalance()
      
      const result = getAssetBalance(999)
      expect(result).toBeNull()
    })
  })

  describe('formatAssetBalance', () => {
    it('should return "0" for non-existent asset', () => {
      const { formatAssetBalance } = useTokenBalance()
      
      const result = formatAssetBalance(999)
      expect(result).toBe('0')
    })

    it('should format asset balance with correct decimals', () => {
      const mockAccountInfo = {
        amount: 1000000,
        assets: [
          {
            'asset-id': 123,
            amount: 12345,
            decimals: 2,
            'is-frozen': false,
            creator: 'MOCK_CREATOR'
          }
        ]
      }

      const mockAlgodClient = {
        accountInformation: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAccountInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      vi.mocked(walletManager.useWalletManager).mockReturnValue({
        activeAddress: { value: 'MOCK_ADDRESS' },
        networkInfo: {
          value: {
            algodUrl: 'https://mainnet-api.voi.nodely.dev',
            genesisId: 'voimain-v1.0'
          }
        },
        isConnected: { value: true }
      } as any)

      const { formatAssetBalance, fetchBalance } = useTokenBalance()

      fetchBalance('MOCK_ADDRESS').then(() => {
        const result = formatAssetBalance(123)
        expect(result).toBe('123.45')
      })
    })
  })

  describe('Computed Properties', () => {
    it('should compute hasAssets correctly', () => {
      const { hasAssets, accountBalance } = useTokenBalance()
      
      expect(hasAssets.value).toBe(false)
      
      accountBalance.value.assets = [
        {
          assetId: 123,
          amount: 100,
          decimals: 0,
          isFrozen: false,
          creator: 'TEST'
        }
      ]
      
      expect(hasAssets.value).toBe(true)
    })

    it('should format algo balance with 6 decimals', () => {
      const { formattedAlgoBalance, accountBalance } = useTokenBalance()
      
      accountBalance.value.algoBalance = 1234567
      
      expect(formattedAlgoBalance.value).toBe('1.234567')
    })
  })
})
