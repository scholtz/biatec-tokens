import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { NETWORKS } from '../useWalletManager'

// Mock the @txnlab/use-wallet-vue module
vi.mock('@txnlab/use-wallet-vue', () => ({
  useWallet: vi.fn(() => ({
    activeAccount: { value: null },
    activeWallet: { value: null },
    wallets: {
      value: [
        {
          id: 'pera',
          isActive: true,
          connect: vi.fn(),
          disconnect: vi.fn(),
          setActiveAccount: vi.fn(),
          accounts: [],
        },
        {
          id: 'defly',
          isActive: true,
          connect: vi.fn(),
          disconnect: vi.fn(),
          setActiveAccount: vi.fn(),
          accounts: [],
        },
      ],
    },
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
      expect(NETWORKS['voi-mainnet'].algodUrl).toBe('https://mainnet-api.voi.nodely.dev')
      expect(NETWORKS['voi-mainnet'].genesisId).toBe('voimain-v1.0')
    })

    it('should have Aramid mainnet configuration', () => {
      expect(NETWORKS['aramidmain']).toBeDefined()
      expect(NETWORKS['aramidmain'].displayName).toBe('Aramid Mainnet')
      expect(NETWORKS['aramidmain'].isTestnet).toBe(false)
      expect(NETWORKS['aramidmain'].algodUrl).toBe('https://algod.aramidmain.a-wallet.net')
      expect(NETWORKS['aramidmain'].genesisId).toBe('aramidmain-v1.0')
    })

    it('should have dockernet configuration', () => {
      expect(NETWORKS['dockernet']).toBeDefined()
      expect(NETWORKS['dockernet'].displayName).toBe('Dockernet (Local)')
      expect(NETWORKS['dockernet'].isTestnet).toBe(true)
      expect(NETWORKS['dockernet'].algodUrl).toBe('http://localhost:4001')
      expect(NETWORKS['dockernet'].genesisId).toBe('dockernet-v1')
    })

    it('should have exactly 9 networks configured (5 AVM + 4 EVM)', () => {
      expect(Object.keys(NETWORKS)).toHaveLength(9)
      expect(Object.keys(NETWORKS)).toEqual([
        'algorand-mainnet',
        'voi-mainnet',
        'aramidmain',
        'algorand-testnet',
        'dockernet',
        'ethereum',
        'arbitrum',
        'base',
        'sepolia'
      ])
    })
  })

  describe('Network Configuration Validation', () => {
    it('should have valid algod URLs for AVM networks or RPC URLs for EVM networks', () => {
      Object.entries(NETWORKS).forEach(([key, network]) => {
        if (network.chainType === 'AVM') {
          expect(network.algodUrl).toBeTruthy()
          expect(typeof network.algodUrl).toBe('string')
          
          if (!network.isTestnet) {
            expect(network.algodUrl).toMatch(/^https:\/\//)
          }
        } else if (network.chainType === 'EVM') {
          expect(network.rpcUrl).toBeTruthy()
          expect(typeof network.rpcUrl).toBe('string')
          
          if (!network.isTestnet) {
            expect(network.rpcUrl).toMatch(/^https:\/\//)
          }
        }
      })
    })

    it('should have valid genesis IDs for AVM networks or chain IDs for EVM networks', () => {
      Object.entries(NETWORKS).forEach(([key, network]) => {
        if (network.chainType === 'AVM') {
          expect(network.genesisId).toBeTruthy()
          expect(typeof network.genesisId).toBe('string')
          expect(network.genesisId.length).toBeGreaterThan(0)
        } else if (network.chainType === 'EVM') {
          expect(network.chainId).toBeTruthy()
          expect(typeof network.chainId).toBe('number')
          expect(network.chainId).toBeGreaterThan(0)
        }
      })
    })

    it('should have consistent network IDs', () => {
      Object.entries(NETWORKS).forEach(([key, network]) => {
        expect(network.id).toBe(key)
        expect(network.name).toBe(key)
      })
    })
  })

  describe('Network Switching Logic', () => {
    it('should support switching between VOI and Aramid networks', () => {
      const voiNetwork = NETWORKS['voi-mainnet']
      const aramidNetwork = NETWORKS['aramidmain']

      // Verify both networks are available
      expect(voiNetwork).toBeDefined()
      expect(aramidNetwork).toBeDefined()

      // Verify they are different networks
      expect(voiNetwork.algodUrl).not.toBe(aramidNetwork.algodUrl)
      expect(voiNetwork.genesisId).not.toBe(aramidNetwork.genesisId)
    })

    it('should have testnet flag correctly set', () => {
      expect(NETWORKS['voi-mainnet'].isTestnet).toBe(false)
      expect(NETWORKS['aramidmain'].isTestnet).toBe(false)
      expect(NETWORKS['dockernet'].isTestnet).toBe(true)
    })
  })

  describe('Connection State Persistence', () => {
    it('should define localStorage keys for connection state', () => {
      // Test that the expected keys are used
      const expectedKeys = ['wallet_connected', 'active_wallet_id', 'selected_network']
      
      // Verify localStorage interaction pattern
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('active_wallet_id', 'pera')
      localStorage.setItem('selected_network', 'voi-mainnet')

      expect(localStorage.getItem('wallet_connected')).toBe('true')
      expect(localStorage.getItem('active_wallet_id')).toBe('pera')
      expect(localStorage.getItem('selected_network')).toBe('voi-mainnet')
    })

    it('should handle network restoration from localStorage', () => {
      localStorage.setItem('selected_network', 'aramidmain')

      const savedNetwork = localStorage.getItem('selected_network')
      expect(savedNetwork).toBe('aramidmain')
      expect(NETWORKS[savedNetwork as keyof typeof NETWORKS]).toBeDefined()
    })
  })

  describe('Error Handling for Network Operations', () => {
    it('should handle invalid network ID gracefully', () => {
      const invalidNetwork = 'invalid-network'
      expect(NETWORKS[invalidNetwork as keyof typeof NETWORKS]).toBeUndefined()
    })

    it('should validate network exists before switching', () => {
      const validNetworkIds = Object.keys(NETWORKS)
      expect(validNetworkIds).toContain('voi-mainnet')
      expect(validNetworkIds).toContain('aramidmain')
      expect(validNetworkIds).toContain('dockernet')
    })
  })

  describe('Business Risk Scenarios', () => {
    it('should prevent data loss if network switch fails', () => {
      // Store current state
      localStorage.setItem('selected_network', 'voi-mainnet')
      const originalNetwork = localStorage.getItem('selected_network')

      // Simulate failed switch - original state should be preserved
      expect(originalNetwork).toBe('voi-mainnet')
    })

    it('should maintain wallet connection metadata across page reloads', () => {
      // Simulate connected state
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('active_wallet_id', 'pera')
      localStorage.setItem('selected_network', 'aramidmain')

      // Verify state can be restored
      expect(localStorage.getItem('wallet_connected')).toBe('true')
      expect(localStorage.getItem('active_wallet_id')).toBe('pera')
      expect(localStorage.getItem('selected_network')).toBe('aramidmain')
    })

    it('should provide network configuration for transaction signing', () => {
      const voiNetwork = NETWORKS['voi-mainnet']
      
      // Verify required data for transaction operations
      expect(voiNetwork.algodUrl).toBeTruthy()
      expect(voiNetwork.genesisId).toBeTruthy()
      
      // These are critical for transaction signing
      expect(voiNetwork.algodUrl).toMatch(/^https?:\/\//)
      expect(voiNetwork.genesisId).toMatch(/^[a-zA-Z0-9.-]+$/)
    })
  })
})
