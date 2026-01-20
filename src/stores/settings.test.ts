import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from './settings'
import type { NetworkConfig } from './settings'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    it('should initialize with default settings', () => {
      const store = useSettingsStore()

      expect(store.settings.network).toBe('testnet')
      expect(store.settings.demoMode).toBe(true)
      expect(store.settings.networkConfigs).toBeDefined()
      expect(store.settings.networkConfigs.mainnet).toBeDefined()
      expect(store.settings.networkConfigs.testnet).toBeDefined()
      expect(store.settings.networkConfigs.dockernet).toBeDefined()
    })

    it('should have valid network configurations', () => {
      const store = useSettingsStore()

      const mainnet = store.settings.networkConfigs.mainnet
      expect(mainnet.algodUrl).toBe('https://mainnet-api.algonode.cloud')
      expect(mainnet.indexerUrl).toBe('https://mainnet-idx.algonode.cloud')

      const testnet = store.settings.networkConfigs.testnet
      expect(testnet.algodUrl).toBe('https://testnet-api.algonode.cloud')
      expect(testnet.indexerUrl).toBe('https://testnet-idx.algonode.cloud')

      const dockernet = store.settings.networkConfigs.dockernet
      expect(dockernet.algodUrl).toBe('http://localhost:4001')
      expect(dockernet.indexerUrl).toBe('http://localhost:8980')
    })
  })

  describe('updateNetwork', () => {
    it('should update the network setting', () => {
      const store = useSettingsStore()

      store.updateNetwork('mainnet')
      expect(store.settings.network).toBe('mainnet')

      store.updateNetwork('dockernet')
      expect(store.settings.network).toBe('dockernet')

      store.updateNetwork('testnet')
      expect(store.settings.network).toBe('testnet')
    })
  })

  describe('updateNetworkConfig', () => {
    it('should update network configuration', () => {
      const store = useSettingsStore()

      const newConfig: NetworkConfig = {
        algodUrl: 'https://custom-algod.example.com',
        algodToken: 'custom-token',
        indexerUrl: 'https://custom-indexer.example.com',
        indexerToken: 'custom-indexer-token'
      }

      store.updateNetworkConfig('testnet', newConfig)

      expect(store.settings.networkConfigs.testnet).toEqual(newConfig)
      expect(store.settings.networkConfigs.testnet.algodUrl).toBe('https://custom-algod.example.com')
    })

    it('should add new network configuration', () => {
      const store = useSettingsStore()

      const customConfig: NetworkConfig = {
        algodUrl: 'https://custom-network.example.com',
        algodToken: 'token',
        indexerUrl: 'https://custom-indexer.example.com',
        indexerToken: 'indexer-token'
      }

      store.updateNetworkConfig('custom', customConfig)

      expect(store.settings.networkConfigs.custom).toEqual(customConfig)
    })
  })

  describe('updateEvmConfig', () => {
    it('should update EVM RPC URL and chain ID', () => {
      const store = useSettingsStore()

      const newRpcUrl = 'https://custom-rpc.example.com'
      const newChainId = 1

      store.updateEvmConfig(newRpcUrl, newChainId)

      expect(store.settings.evmRpcUrl).toBe(newRpcUrl)
      expect(store.settings.evmChainId).toBe(newChainId)
    })
  })

  describe('toggleDemoMode', () => {
    it('should toggle demo mode on and off', () => {
      const store = useSettingsStore()

      const initialDemoMode = store.settings.demoMode
      
      store.toggleDemoMode()
      expect(store.settings.demoMode).toBe(!initialDemoMode)

      store.toggleDemoMode()
      expect(store.settings.demoMode).toBe(initialDemoMode)
    })
  })

  describe('exportSettings', () => {
    it('should export settings as JSON string', () => {
      const store = useSettingsStore()

      const exported = store.exportSettings()

      expect(typeof exported).toBe('string')
      const parsed = JSON.parse(exported)
      expect(parsed.network).toBe('testnet')
      expect(parsed.demoMode).toBe(true)
      expect(parsed.networkConfigs).toBeDefined()
    })

    it('should export updated settings', () => {
      const store = useSettingsStore()

      store.updateNetwork('mainnet')
      store.toggleDemoMode()

      const exported = store.exportSettings()
      const parsed = JSON.parse(exported)

      expect(parsed.network).toBe('mainnet')
      expect(parsed.demoMode).toBe(false)
    })
  })

  describe('importSettings', () => {
    it('should import valid settings JSON', () => {
      const store = useSettingsStore()

      const settingsToImport = {
        network: 'mainnet' as const,
        demoMode: false
      }

      const result = store.importSettings(JSON.stringify(settingsToImport))

      expect(result).toBe(true)
      expect(store.settings.network).toBe('mainnet')
      expect(store.settings.demoMode).toBe(false)
    })

    it('should handle invalid JSON gracefully', () => {
      const store = useSettingsStore()
      
      const originalNetwork = store.settings.network

      const result = store.importSettings('invalid json {')

      expect(result).toBe(false)
      expect(store.settings.network).toBe(originalNetwork)
    })

    it('should merge imported settings with existing settings', () => {
      const store = useSettingsStore()

      const originalNetworkConfigs = store.settings.networkConfigs

      const partialSettings = {
        network: 'dockernet' as const
      }

      store.importSettings(JSON.stringify(partialSettings))

      expect(store.settings.network).toBe('dockernet')
      expect(store.settings.networkConfigs).toEqual(originalNetworkConfigs)
    })
  })
})
