import { ref, computed, watch } from 'vue'
import algosdk from 'algosdk'
import { useWalletManager } from './useWalletManager'

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
}

/**
 * Composable for fetching token balances from Algorand networks
 * Uses algosdk to query account information including algo and asset balances
 */
export function useTokenBalance() {
  const { activeAddress, networkInfo, isConnected } = useWalletManager()
  
  const accountBalance = ref<AccountBalance>({
    address: '',
    algoBalance: 0,
    assets: [],
    isLoading: false,
    error: null
  })

  const isLoading = computed(() => accountBalance.value.isLoading)
  const hasAssets = computed(() => accountBalance.value.assets.length > 0)
  const formattedAlgoBalance = computed(() => {
    return (accountBalance.value.algoBalance / 1_000_000).toFixed(6)
  })

  /**
   * Creates an Algodv2 client for the current network
   */
  const createAlgodClient = () => {
    if (!networkInfo.value) {
      throw new Error('Network information not available')
    }

    const { algodUrl } = networkInfo.value
    const token = ''

    return new algosdk.Algodv2(token, algodUrl, '')
  }

  /**
   * Fetches account balance and assets from the blockchain
   */
  const fetchBalance = async (address?: string) => {
    const targetAddress = address || activeAddress.value
    
    if (!targetAddress) {
      accountBalance.value = {
        address: '',
        algoBalance: 0,
        assets: [],
        isLoading: false,
        error: 'No wallet address available'
      }
      return
    }

    accountBalance.value.isLoading = true
    accountBalance.value.error = null

    try {
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

      accountBalance.value = {
        address: targetAddress,
        algoBalance,
        assets,
        isLoading: false,
        error: null
      }
    } catch (error: any) {
      console.error('Error fetching balance:', error)
      accountBalance.value = {
        address: targetAddress,
        algoBalance: 0,
        assets: [],
        isLoading: false,
        error: error.message || 'Failed to fetch balance'
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
   * Refreshes the balance data
   */
  const refresh = () => {
    if (activeAddress.value) {
      fetchBalance(activeAddress.value)
    }
  }

  // Watch for wallet connection changes and auto-fetch balance
  watch([activeAddress, networkInfo], ([newAddress]) => {
    if (newAddress && isConnected.value) {
      fetchBalance(newAddress)
    } else {
      accountBalance.value = {
        address: '',
        algoBalance: 0,
        assets: [],
        isLoading: false,
        error: null
      }
    }
  }, { immediate: true })

  return {
    accountBalance: computed(() => accountBalance.value),
    isLoading,
    hasAssets,
    formattedAlgoBalance,
    fetchBalance,
    getAssetBalance,
    formatAssetBalance,
    refresh
  }
}
