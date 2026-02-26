import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  useNetworkStore,
  NETWORKS,
  AVM_NETWORKS,
  EVM_NETWORKS,
} from './network'
import type { NetworkId } from './network'

describe('Network Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    it('should initialize with algorand-mainnet as default', () => {
      const store = useNetworkStore()
      expect(store.networkInfo.id).toBe('algorand-mainnet')
      expect(store.networkInfo.chainType).toBe('AVM')
      expect(store.networkInfo.isTestnet).toBe(false)
    })

    it('should have algorand-mainnet in networkInfo with correct properties', () => {
      const store = useNetworkStore()
      const info = store.networkInfo
      expect(info.name).toBe('algorand-mainnet')
      expect(info.displayName).toBe('Algorand Mainnet')
    })
  })

  describe('switchNetwork', () => {
    it('should switch to algorand-testnet', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('algorand-testnet')
      expect(store.networkInfo.id).toBe('algorand-testnet')
      expect(store.networkInfo.isTestnet).toBe(true)
    })

    it('should switch to voi-mainnet', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('voi-mainnet')
      expect(store.networkInfo.id).toBe('voi-mainnet')
      expect(store.networkInfo.chainType).toBe('AVM')
    })

    it('should switch to aramidmain', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('aramidmain')
      expect(store.networkInfo.id).toBe('aramidmain')
      expect(store.networkInfo.chainType).toBe('AVM')
    })

    it('should switch to dockernet', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('dockernet')
      expect(store.networkInfo.id).toBe('dockernet')
      expect(store.networkInfo.isTestnet).toBe(true)
    })

    it('should switch to ethereum', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('ethereum')
      expect(store.networkInfo.id).toBe('ethereum')
      expect(store.networkInfo.chainType).toBe('EVM')
      expect(store.networkInfo.isTestnet).toBe(false)
    })

    it('should switch to arbitrum', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('arbitrum')
      expect(store.networkInfo.id).toBe('arbitrum')
      expect(store.networkInfo.chainType).toBe('EVM')
    })

    it('should switch to base', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('base')
      expect(store.networkInfo.id).toBe('base')
      expect(store.networkInfo.chainType).toBe('EVM')
    })

    it('should switch to sepolia', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('sepolia')
      expect(store.networkInfo.id).toBe('sepolia')
      expect(store.networkInfo.chainType).toBe('EVM')
      expect(store.networkInfo.isTestnet).toBe(true)
    })

    it('should throw an error when given an invalid network ID', async () => {
      const store = useNetworkStore()
      await expect(
        store.switchNetwork('invalid-network-xyz' as NetworkId)
      ).rejects.toThrow(/Unsupported network ID/)
    })

    it('should not change networkInfo when switchNetwork throws', async () => {
      const store = useNetworkStore()
      const original = store.networkInfo.id
      await expect(
        store.switchNetwork('not-a-real-network' as NetworkId)
      ).rejects.toThrow()
      expect(store.networkInfo.id).toBe(original)
    })

    it('should allow switching back to algorand-mainnet', async () => {
      const store = useNetworkStore()
      await store.switchNetwork('ethereum')
      expect(store.networkInfo.id).toBe('ethereum')
      await store.switchNetwork('algorand-mainnet')
      expect(store.networkInfo.id).toBe('algorand-mainnet')
    })
  })

  describe('NETWORKS constant', () => {
    it('should include all AVM networks', () => {
      expect(NETWORKS['algorand-mainnet']).toBeDefined()
      expect(NETWORKS['algorand-testnet']).toBeDefined()
      expect(NETWORKS['voi-mainnet']).toBeDefined()
      expect(NETWORKS['aramidmain']).toBeDefined()
      expect(NETWORKS['dockernet']).toBeDefined()
    })

    it('should include all EVM networks', () => {
      expect(NETWORKS['ethereum']).toBeDefined()
      expect(NETWORKS['arbitrum']).toBeDefined()
      expect(NETWORKS['base']).toBeDefined()
      expect(NETWORKS['sepolia']).toBeDefined()
    })

    it('should have AVM networks with algodUrl', () => {
      const mainnet = AVM_NETWORKS['algorand-mainnet']
      expect(mainnet.algodUrl).toBeDefined()
      expect(mainnet.genesisId).toBeDefined()
    })

    it('should have EVM networks with chainId and rpcUrl', () => {
      const ethereum = EVM_NETWORKS['ethereum']
      expect(ethereum.chainId).toBeDefined()
      expect(ethereum.rpcUrl).toBeDefined()
      expect(ethereum.blockExplorerUrl).toBeDefined()
      expect(ethereum.nativeCurrency).toBeDefined()
    })
  })
})
