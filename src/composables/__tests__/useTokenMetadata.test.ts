import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTokenMetadata } from '../useTokenMetadata'
import * as walletManager from '../useWalletManager'
import algosdk from 'algosdk'
import axios from 'axios'

// Mock algosdk
vi.mock('algosdk', () => ({
  default: {
    Algodv2: vi.fn(() => ({
      getAssetByID: vi.fn(() => ({
        do: vi.fn()
      }))
    }))
  }
}))

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}))

// Mock useWalletManager
vi.mock('../useWalletManager', () => ({
  useWalletManager: vi.fn(() => ({
    networkInfo: {
      value: {
        algodUrl: 'https://mainnet-api.voi.nodely.dev',
        genesisId: 'voimain-v1.0'
      }
    }
  }))
}))

describe('useTokenMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty metadata cache', () => {
      const { metadataCache } = useTokenMetadata()
      expect(metadataCache.value.size).toBe(0)
    })
  })

  describe('fetchMetadata', () => {
    it('should fetch standard ASA metadata', async () => {
      const mockAssetInfo = {
        params: {
          name: 'Test Token',
          'unit-name': 'TEST',
          decimals: 6,
          total: 1000000,
          creator: 'MOCK_CREATOR',
          url: ''
        }
      }

      const mockAlgodClient = {
        getAssetByID: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAssetInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      const { fetchMetadata } = useTokenMetadata()
      const metadata = await fetchMetadata(123)

      expect(metadata.assetId).toBe(123)
      expect(metadata.name).toBe('Test Token')
      expect(metadata.unitName).toBe('TEST')
      expect(metadata.decimals).toBe(6)
      expect(metadata.standard).toBe('ASA')
      expect(metadata.isVerified).toBe(false)
      expect(metadata.isLoading).toBe(false)
    })

    it('should fetch and parse ARC3 metadata', async () => {
      const mockAssetInfo = {
        params: {
          name: 'Test Token',
          'unit-name': 'TEST',
          decimals: 6,
          total: 1000000,
          creator: 'MOCK_CREATOR',
          url: 'ipfs://QmTest#arc3'
        }
      }

      const mockArc3Data = {
        name: 'ARC3 Token',
        description: 'Test ARC3 token',
        decimals: 6,
        unitName: 'ARC3',
        image: 'ipfs://QmImage'
      }

      const mockAlgodClient = {
        getAssetByID: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAssetInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)
      vi.mocked(axios.get).mockResolvedValue({ data: mockArc3Data })

      const { fetchMetadata } = useTokenMetadata()
      const metadata = await fetchMetadata(123)

      expect(metadata.standard).toBe('ARC3')
      expect(metadata.name).toBe('ARC3 Token')
      expect(metadata.arc3).toBeDefined()
      expect(metadata.arc3?.description).toBe('Test ARC3 token')
      expect(metadata.isVerified).toBe(true)
    })

    it('should identify ARC19 tokens', async () => {
      const mockAssetInfo = {
        params: {
          name: 'Test Token',
          'unit-name': 'TEST',
          decimals: 0,
          total: 1,
          creator: 'MOCK_CREATOR',
          url: 'template-ipfs://QmTest'
        }
      }

      const mockAlgodClient = {
        getAssetByID: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAssetInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      const { fetchMetadata } = useTokenMetadata()
      const metadata = await fetchMetadata(123)

      expect(metadata.standard).toBe('ARC19')
    })

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Failed to fetch asset')
      const mockAlgodClient = {
        getAssetByID: vi.fn(() => ({
          do: vi.fn().mockRejectedValue(mockError)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      const { fetchMetadata } = useTokenMetadata()
      const metadata = await fetchMetadata(123)

      expect(metadata.error).toBe('Failed to fetch asset')
      expect(metadata.isLoading).toBe(false)
    })

    it('should cache metadata after fetching', async () => {
      const mockAssetInfo = {
        params: {
          name: 'Test Token',
          'unit-name': 'TEST',
          decimals: 6,
          total: 1000000,
          creator: 'MOCK_CREATOR',
          url: ''
        }
      }

      const mockAlgodClient = {
        getAssetByID: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAssetInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      const { fetchMetadata, metadataCache } = useTokenMetadata()
      
      await fetchMetadata(123)
      
      expect(metadataCache.value.has(123)).toBe(true)
      expect(metadataCache.value.get(123)?.name).toBe('Test Token')
    })
  })

  describe('getMetadata', () => {
    it('should return cached metadata if available', async () => {
      const mockAssetInfo = {
        params: {
          name: 'Test Token',
          'unit-name': 'TEST',
          decimals: 6,
          total: 1000000,
          creator: 'MOCK_CREATOR',
          url: ''
        }
      }

      const mockAlgodClient = {
        getAssetByID: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAssetInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      const { getMetadata, fetchMetadata } = useTokenMetadata()
      
      // First fetch
      await fetchMetadata(123)
      
      // Second call should use cache
      const metadata = await getMetadata(123)
      
      expect(metadata.name).toBe('Test Token')
      // Should only be called once (for the first fetch)
      expect(mockAlgodClient.getAssetByID).toHaveBeenCalledTimes(1)
    })
  })

  describe('fetchBatchMetadata', () => {
    it('should fetch metadata for multiple assets', async () => {
      const mockAssetInfo1 = {
        params: {
          name: 'Token 1',
          'unit-name': 'TKN1',
          decimals: 6,
          total: 1000000,
          creator: 'MOCK_CREATOR_1',
          url: ''
        }
      }

      const mockAssetInfo2 = {
        params: {
          name: 'Token 2',
          'unit-name': 'TKN2',
          decimals: 6,
          total: 2000000,
          creator: 'MOCK_CREATOR_2',
          url: ''
        }
      }

      const mockAlgodClient = {
        getAssetByID: vi.fn((assetId: number) => ({
          do: vi.fn().mockResolvedValue(
            assetId === 123 ? mockAssetInfo1 : mockAssetInfo2
          )
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      const { fetchBatchMetadata } = useTokenMetadata()
      const results = await fetchBatchMetadata([123, 456])

      expect(results).toHaveLength(2)
      expect(results[0].name).toBe('Token 1')
      expect(results[1].name).toBe('Token 2')
    })
  })

  describe('clearCache', () => {
    it('should clear the metadata cache', async () => {
      const mockAssetInfo = {
        params: {
          name: 'Test Token',
          'unit-name': 'TEST',
          decimals: 6,
          total: 1000000,
          creator: 'MOCK_CREATOR',
          url: ''
        }
      }

      const mockAlgodClient = {
        getAssetByID: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAssetInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)

      const { fetchMetadata, clearCache, metadataCache } = useTokenMetadata()
      
      await fetchMetadata(123)
      expect(metadataCache.value.size).toBe(1)
      
      clearCache()
      expect(metadataCache.value.size).toBe(0)
    })
  })

  describe('getVerificationBadge', () => {
    it('should return correct badge for ARC3', () => {
      const { getVerificationBadge } = useTokenMetadata()
      const badge = getVerificationBadge('ARC3')
      
      expect(badge.color).toBe('green')
      expect(badge.label).toBe('ARC3 Verified')
    })

    it('should return correct badge for ARC19', () => {
      const { getVerificationBadge } = useTokenMetadata()
      const badge = getVerificationBadge('ARC19')
      
      expect(badge.color).toBe('blue')
      expect(badge.label).toBe('ARC19')
    })

    it('should return correct badge for standard ASA', () => {
      const { getVerificationBadge } = useTokenMetadata()
      const badge = getVerificationBadge('ASA')
      
      expect(badge.color).toBe('gray')
      expect(badge.label).toBe('Standard ASA')
    })
  })

  describe('IPFS URL Resolution', () => {
    it('should resolve IPFS URLs to HTTP gateways in ARC3 metadata', async () => {
      const mockAssetInfo = {
        params: {
          name: 'Test Token',
          'unit-name': 'TEST',
          decimals: 6,
          total: 1000000,
          creator: 'MOCK_CREATOR',
          url: 'ipfs://QmTest#arc3'
        }
      }

      const mockAlgodClient = {
        getAssetByID: vi.fn(() => ({
          do: vi.fn().mockResolvedValue(mockAssetInfo)
        }))
      }

      vi.mocked(algosdk.Algodv2).mockReturnValue(mockAlgodClient as any)
      vi.mocked(axios.get).mockResolvedValue({ data: {} })

      const { fetchMetadata } = useTokenMetadata()
      await fetchMetadata(123)

      expect(axios.get).toHaveBeenCalledWith(
        'https://ipfs.io/ipfs/QmTest',
        expect.any(Object)
      )
    })
  })
})
