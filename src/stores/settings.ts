import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface NetworkConfig {
  algodUrl: string
  algodToken: string
  indexerUrl: string
  indexerToken: string
  headers?: Record<string, string>
}

export interface Settings {
  network: 'mainnet' | 'testnet' | 'dockernet'
  networkConfigs: Record<string, NetworkConfig>
  evmRpcUrl: string
  evmChainId: number
  demoMode: boolean
}

// Storage key for network persistence
const NETWORK_STORAGE_KEY = 'biatec_selected_network'

// Load persisted network from localStorage, default to 'testnet' (Algorand testnet)
const loadPersistedNetwork = (): Settings['network'] => {
  try {
    const stored = localStorage.getItem(NETWORK_STORAGE_KEY)
    if (stored && ['mainnet', 'testnet', 'dockernet'].includes(stored)) {
      return stored as Settings['network']
    }
  } catch (error) {
    console.warn('Failed to load persisted network:', error)
  }
  return 'testnet' // Default to Algorand testnet per AC #1
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    network: loadPersistedNetwork(),
    networkConfigs: {
      mainnet: {
        algodUrl: 'https://mainnet-api.algonode.cloud',
        algodToken: '',
        indexerUrl: 'https://mainnet-idx.algonode.cloud',
        indexerToken: ''
      },
      testnet: {
        algodUrl: 'https://testnet-api.algonode.cloud',
        algodToken: '',
        indexerUrl: 'https://testnet-idx.algonode.cloud',
        indexerToken: ''
      },
      dockernet: {
        algodUrl: 'http://localhost:4001',
        algodToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        indexerUrl: 'http://localhost:8980',
        indexerToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      }
    },
    evmRpcUrl: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    evmChainId: 11155111,
    demoMode: true
  })

  const updateNetwork = (network: Settings['network']) => {
    settings.value.network = network
    // Persist network selection to localStorage (AC #1)
    try {
      localStorage.setItem(NETWORK_STORAGE_KEY, network)
    } catch (error) {
      console.warn('Failed to persist network selection:', error)
    }
  }

  const updateNetworkConfig = (network: string, config: NetworkConfig) => {
    settings.value.networkConfigs[network] = config
  }

  const updateEvmConfig = (rpcUrl: string, chainId: number) => {
    settings.value.evmRpcUrl = rpcUrl
    settings.value.evmChainId = chainId
  }

  const toggleDemoMode = () => {
    settings.value.demoMode = !settings.value.demoMode
  }

  const exportSettings = () => {
    return JSON.stringify(settings.value, null, 2)
  }

  const importSettings = (settingsJson: string) => {
    try {
      const imported = JSON.parse(settingsJson)
      settings.value = { ...settings.value, ...imported }
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  return {
    settings,
    updateNetwork,
    updateNetworkConfig,
    updateEvmConfig,
    toggleDemoMode,
    exportSettings,
    importSettings
  }
})