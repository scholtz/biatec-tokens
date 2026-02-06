import { ref, computed, watch } from 'vue'
import algosdk from 'algosdk'
import { useWalletManager } from './useWalletManager'
import { WalletConnectionState } from './walletState'
import { telemetryService } from '../services/TelemetryService'

export interface TokenBalance {
  assetId: number
  amount: number
  decimals: number
  isFrozen: boolean
  creator: string
  unitName?: string
  assetName?: string
}

export interface AccountBalance {
  address: string
  algoBalance: number
  assets: TokenBalance[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

/**
 * Balance cache configuration
 * TTL of 30 seconds to reduce RPC load while keeping data fresh
 */
const BALANCE_CACHE_TTL_MS = 30000 // 30 seconds

interface BalanceCache {
  data: AccountBalance
  timestamp: number
  networkId: string
}

/**
 * Composable for fetching token balances from Algorand networks
 * Uses algosdk to query account information including algo and asset balances
 * Includes TTL-based caching to reduce RPC load
 */
export function useTokenBalance() {
  const walletManager = useWalletManager()
  const { activeAddress, networkInfo, isConnected, walletState } = walletManager
  
  const accountBalance = ref<AccountBalance>({
    address: '',
    algoBalance: 0,
    assets: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  })

  // In-memory cache for balance data
  const balanceCache = ref<Map<string, BalanceCache>>(new Map())

  /**
   * Creates cache key from address and network
   */
  const getCacheKey = (address: string, networkId: string): string => {
    return `${address}_${networkId}`
  }

  /**
   * Checks if cached data is still valid
   */
  const isCacheValid = (cacheEntry: BalanceCache | undefined): boolean => {
    if (!cacheEntry) return false
    const now = Date.now()
    const age = now - cacheEntry.timestamp
    return age < BALANCE_CACHE_TTL_MS
  }

  /**
   * Invalidates cache for specific address or all
   */
  const invalidateCache = (address?: string) => {
    if (address && networkInfo.value) {
      const key = getCacheKey(address, networkInfo.value.id)
      balanceCache.value.delete(key)
      telemetryService.track('balance_cache_invalidated', { address, network: networkInfo.value.id })
    } else {
      balanceCache.value.clear()
      telemetryService.track('balance_cache_cleared')
    }
  }

  const isLoading = computed(() => accountBalance.value.isLoading)
  const hasAssets = computed(() => accountBalance.value.assets.length > 0)
  const formattedAlgoBalance = computed(() => {
    return (accountBalance.value.algoBalance / 1_000_000).toFixed(6)
  })

  const lastUpdatedFormatted = computed(() => {
    if (!accountBalance.value.lastUpdated) return null
    const date = accountBalance.value.lastUpdated
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)

    if (diffSecs < 60) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  })

  /**
   * Creates an Algodv2 client for the current network
   */
  const createAlgodClient = () => {
    if (!networkInfo.value) {
      throw new Error('Network information not available')
    }

    if (networkInfo.value.chainType !== 'AVM') {
      throw new Error('Token balance is only available for AVM networks')
    }

    const { algodUrl } = networkInfo.value
    const token = ''

    return new algosdk.Algodv2(token, algodUrl, '')
  }

  /**
   * Fetches account balance and assets from the blockchain
   * Uses cache if available and valid, otherwise fetches fresh data
   */
  const fetchBalance = async (address?: string, forceRefresh = false) => {
    const targetAddress = address || activeAddress.value
    
    if (!targetAddress) {
      accountBalance.value = {
        address: '',
        algoBalance: 0,
        assets: [],
        isLoading: false,
        error: 'No wallet address available',
        lastUpdated: null,
      }
      return
    }

    if (!networkInfo.value) {
      accountBalance.value = {
        ...accountBalance.value,
        isLoading: false,
        error: 'Network information not available',
      }
      return
    }

    // Check cache if not forcing refresh
    if (!forceRefresh) {
      const cacheKey = getCacheKey(targetAddress, networkInfo.value.id)
      const cached = balanceCache.value.get(cacheKey)
      
      if (cached && isCacheValid(cached)) {
        accountBalance.value = cached.data
        telemetryService.track('balance_cache_hit', { 
          address: targetAddress,
          network: networkInfo.value.id,
          age_ms: Date.now() - cached.timestamp
        })
        return
      }
    }

    accountBalance.value.isLoading = true
    accountBalance.value.error = null

    const startTime = Date.now()

    try {
      // Update wallet state to fetching balance
      if (walletState.value.connectionState === WalletConnectionState.CONNECTED) {
        walletState.value.connectionState = WalletConnectionState.FETCHING_BALANCE
      }

      const algodClient = createAlgodClient()
      const accountInfo = await algodClient.accountInformation(targetAddress).do()

      // Extract algo balance (convert bigint to number)
      const algoBalance = Number(accountInfo.amount || 0)

      // Extract asset holdings
      const assets: TokenBalance[] = (accountInfo.assets || []).map((asset: any) => ({
        assetId: asset['asset-id'],
        amount: asset.amount,
        decimals: asset.decimals || 0,
        isFrozen: asset['is-frozen'] || false,
        creator: asset.creator || '',
        unitName: asset['unit-name'],
        assetName: asset['asset-name']
      }))

      const lastUpdated = new Date()

      const balanceData: AccountBalance = {
        address: targetAddress,
        algoBalance,
        assets,
        isLoading: false,
        error: null,
        lastUpdated,
      }

      accountBalance.value = balanceData

      // Store in cache
      const cacheKey = getCacheKey(targetAddress, networkInfo.value.id)
      balanceCache.value.set(cacheKey, {
        data: balanceData,
        timestamp: Date.now(),
        networkId: networkInfo.value.id
      })

      // Update wallet state balance timestamp
      walletState.value.balanceLastUpdated = lastUpdated

      // Track telemetry
      const durationMs = Date.now() - startTime
      telemetryService.trackBalanceFetch({
        network: networkInfo.value?.id || 'unknown',
        address: targetAddress,
        success: true,
        durationMs
      })

      // Return to connected state
      if (walletState.value.connectionState === WalletConnectionState.FETCHING_BALANCE) {
        walletState.value.connectionState = WalletConnectionState.CONNECTED
      }
    } catch (error: any) {
      console.error('Error fetching balance:', error)
      accountBalance.value = {
        address: targetAddress,
        algoBalance: 0,
        assets: [],
        isLoading: false,
        error: error.message || 'Failed to fetch balance',
        lastUpdated: accountBalance.value.lastUpdated, // Keep previous timestamp if available
      }

      // Track telemetry for failure
      const durationMs = Date.now() - startTime
      telemetryService.trackBalanceFetch({
        network: networkInfo.value?.id || 'unknown',
        address: targetAddress,
        success: false,
        durationMs,
      })

      // Return to connected state even on error
      if (walletState.value.connectionState === WalletConnectionState.FETCHING_BALANCE) {
        walletState.value.connectionState = WalletConnectionState.CONNECTED
      }
    }
  }

  /**
   * Gets balance for a specific asset
   */
  const getAssetBalance = (assetId: number): TokenBalance | null => {
    return accountBalance.value.assets.find(asset => asset.assetId === assetId) || null
  }

  /**
   * Formats asset balance with proper decimals
   */
  const formatAssetBalance = (assetId: number): string => {
    const asset = getAssetBalance(assetId)
    if (!asset) return '0'
    
    const divisor = Math.pow(10, asset.decimals)
    return (asset.amount / divisor).toFixed(asset.decimals)
  }

  /**
   * Refreshes the balance data, forcing a fresh fetch
   */
  const refresh = () => {
    if (activeAddress.value) {
      fetchBalance(activeAddress.value, true) // Force refresh bypasses cache
    }
  }

  // Watch for wallet connection changes and auto-fetch balance
  // Invalidate cache on address or network change
  watch([activeAddress, networkInfo], ([newAddress, newNetwork], [oldAddress, oldNetwork]) => {
    // Invalidate cache if address or network changed
    if (newAddress !== oldAddress || newNetwork?.id !== oldNetwork?.id) {
      invalidateCache()
    }

    if (newAddress && isConnected.value) {
      fetchBalance(newAddress)
    } else {
      accountBalance.value = {
        address: '',
        algoBalance: 0,
        assets: [],
        isLoading: false,
        error: null,
        lastUpdated: null,
      }
    }
  }, { immediate: true })

  return {
    accountBalance: computed(() => accountBalance.value),
    isLoading,
    hasAssets,
    formattedAlgoBalance,
    lastUpdatedFormatted,
    fetchBalance,
    getAssetBalance,
    formatAssetBalance,
    refresh,
    invalidateCache
  }
}
