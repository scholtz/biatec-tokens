import { describe, it, expect } from 'vitest';
import { sortNetworksByPriority } from '../networkSorting';
import type { NetworkInfo } from '../../composables/useWalletManager';

describe('Network Sorting Utility', () => {
  describe('sortNetworksByPriority', () => {
    it('should prioritize mainnet networks over testnets', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'algorand-testnet',
          name: 'algorand-testnet',
          displayName: 'Algorand Testnet',
          algodUrl: 'https://testnet-api.algonode.cloud',
          genesisId: 'testnet-v1.0',
          isTestnet: true,
          chainType: 'AVM',
        } as any,
        {
          id: 'algorand-mainnet',
          name: 'algorand-mainnet',
          displayName: 'Algorand Mainnet',
          algodUrl: 'https://mainnet-api.algonode.cloud',
          genesisId: 'mainnet-v1.0',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      expect(sorted[0].id).toBe('algorand-mainnet');
      expect(sorted[1].id).toBe('algorand-testnet');
    });

    it('should prioritize Algorand mainnet at the top of mainnet list', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'ethereum',
          name: 'ethereum',
          displayName: 'Ethereum Mainnet',
          chainId: 1,
          rpcUrl: 'https://ethereum.publicnode.com',
          blockExplorerUrl: 'https://etherscan.io',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          isTestnet: false,
          chainType: 'EVM',
        } as any,
        {
          id: 'voi-mainnet',
          name: 'voi-mainnet',
          displayName: 'VOI Mainnet',
          algodUrl: 'https://mainnet-api.voi.nodely.dev',
          genesisId: 'voimain-v1.0',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
        {
          id: 'algorand-mainnet',
          name: 'algorand-mainnet',
          displayName: 'Algorand Mainnet',
          algodUrl: 'https://mainnet-api.algonode.cloud',
          genesisId: 'mainnet-v1.0',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      expect(sorted[0].id).toBe('algorand-mainnet');
      expect(sorted[1].id).toBe('ethereum');
      expect(sorted[2].id).toBe('voi-mainnet');
    });

    it('should prioritize Ethereum mainnet second among mainnets', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'base',
          name: 'base',
          displayName: 'Base',
          chainId: 8453,
          rpcUrl: 'https://mainnet.base.org',
          blockExplorerUrl: 'https://basescan.org',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          isTestnet: false,
          chainType: 'EVM',
        } as any,
        {
          id: 'ethereum',
          name: 'ethereum',
          displayName: 'Ethereum Mainnet',
          chainId: 1,
          rpcUrl: 'https://ethereum.publicnode.com',
          blockExplorerUrl: 'https://etherscan.io',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          isTestnet: false,
          chainType: 'EVM',
        } as any,
        {
          id: 'algorand-mainnet',
          name: 'algorand-mainnet',
          displayName: 'Algorand Mainnet',
          algodUrl: 'https://mainnet-api.algonode.cloud',
          genesisId: 'mainnet-v1.0',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      expect(sorted[0].id).toBe('algorand-mainnet');
      expect(sorted[1].id).toBe('ethereum');
      expect(sorted[2].id).toBe('base');
    });

    it('should prioritize Algorand testnet first among testnets', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'sepolia',
          name: 'sepolia',
          displayName: 'Sepolia Testnet',
          chainId: 11155111,
          rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
          blockExplorerUrl: 'https://sepolia.etherscan.io',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
          isTestnet: true,
          chainType: 'EVM',
        } as any,
        {
          id: 'dockernet',
          name: 'dockernet',
          displayName: 'Dockernet (Local)',
          algodUrl: 'http://localhost:4001',
          genesisId: 'dockernet-v1',
          isTestnet: true,
          chainType: 'AVM',
        } as any,
        {
          id: 'algorand-testnet',
          name: 'algorand-testnet',
          displayName: 'Algorand Testnet',
          algodUrl: 'https://testnet-api.algonode.cloud',
          genesisId: 'testnet-v1.0',
          isTestnet: true,
          chainType: 'AVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      expect(sorted[0].id).toBe('algorand-testnet');
      expect(sorted[1].id).toBe('sepolia');
      expect(sorted[2].id).toBe('dockernet');
    });

    it('should prioritize Sepolia testnet second among testnets', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'dockernet',
          name: 'dockernet',
          displayName: 'Dockernet (Local)',
          algodUrl: 'http://localhost:4001',
          genesisId: 'dockernet-v1',
          isTestnet: true,
          chainType: 'AVM',
        } as any,
        {
          id: 'sepolia',
          name: 'sepolia',
          displayName: 'Sepolia Testnet',
          chainId: 11155111,
          rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
          blockExplorerUrl: 'https://sepolia.etherscan.io',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
          isTestnet: true,
          chainType: 'EVM',
        } as any,
        {
          id: 'algorand-testnet',
          name: 'algorand-testnet',
          displayName: 'Algorand Testnet',
          algodUrl: 'https://testnet-api.algonode.cloud',
          genesisId: 'testnet-v1.0',
          isTestnet: true,
          chainType: 'AVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      expect(sorted[0].id).toBe('algorand-testnet');
      expect(sorted[1].id).toBe('sepolia');
      expect(sorted[2].id).toBe('dockernet');
    });

    it('should sort other mainnets alphabetically after prioritized ones', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'base',
          name: 'base',
          displayName: 'Base',
          isTestnet: false,
          chainType: 'EVM',
        } as any,
        {
          id: 'aramidmain',
          name: 'aramidmain',
          displayName: 'Aramid Mainnet',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
        {
          id: 'algorand-mainnet',
          name: 'algorand-mainnet',
          displayName: 'Algorand Mainnet',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
        {
          id: 'ethereum',
          name: 'ethereum',
          displayName: 'Ethereum Mainnet',
          isTestnet: false,
          chainType: 'EVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      expect(sorted[0].id).toBe('algorand-mainnet');
      expect(sorted[1].id).toBe('ethereum');
      expect(sorted[2].id).toBe('aramidmain'); // Alphabetical after prioritized
      expect(sorted[3].id).toBe('base'); // Alphabetical after prioritized
    });

    it('should sort other testnets alphabetically after prioritized ones', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'dockernet',
          name: 'dockernet',
          displayName: 'Dockernet (Local)',
          isTestnet: true,
          chainType: 'AVM',
        } as any,
        {
          id: 'sepolia',
          name: 'sepolia',
          displayName: 'Sepolia Testnet',
          isTestnet: true,
          chainType: 'EVM',
        } as any,
        {
          id: 'algorand-testnet',
          name: 'algorand-testnet',
          displayName: 'Algorand Testnet',
          isTestnet: true,
          chainType: 'AVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      expect(sorted[0].id).toBe('algorand-testnet');
      expect(sorted[1].id).toBe('sepolia');
      expect(sorted[2].id).toBe('dockernet');
    });

    it('should handle mixed mainnet and testnet networks correctly', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'sepolia',
          name: 'sepolia',
          displayName: 'Sepolia Testnet',
          isTestnet: true,
          chainType: 'EVM',
        } as any,
        {
          id: 'voi-mainnet',
          name: 'voi-mainnet',
          displayName: 'VOI Mainnet',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
        {
          id: 'algorand-testnet',
          name: 'algorand-testnet',
          displayName: 'Algorand Testnet',
          isTestnet: true,
          chainType: 'AVM',
        } as any,
        {
          id: 'ethereum',
          name: 'ethereum',
          displayName: 'Ethereum Mainnet',
          isTestnet: false,
          chainType: 'EVM',
        } as any,
        {
          id: 'algorand-mainnet',
          name: 'algorand-mainnet',
          displayName: 'Algorand Mainnet',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      // First should be all mainnets
      expect(sorted[0].isTestnet).toBe(false);
      expect(sorted[1].isTestnet).toBe(false);
      expect(sorted[2].isTestnet).toBe(false);

      // Then all testnets
      expect(sorted[3].isTestnet).toBe(true);
      expect(sorted[4].isTestnet).toBe(true);

      // Check specific ordering
      expect(sorted[0].id).toBe('algorand-mainnet');
      expect(sorted[1].id).toBe('ethereum');
      expect(sorted[3].id).toBe('algorand-testnet');
      expect(sorted[4].id).toBe('sepolia');
    });

    it('should handle empty array', () => {
      const networks: NetworkInfo[] = [];
      const sorted = sortNetworksByPriority(networks);
      expect(sorted).toEqual([]);
    });

    it('should handle single network', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'algorand-mainnet',
          name: 'algorand-mainnet',
          displayName: 'Algorand Mainnet',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
      ];

      const sorted = sortNetworksByPriority(networks);

      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe('algorand-mainnet');
    });

    it('should not mutate original array', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'sepolia',
          name: 'sepolia',
          displayName: 'Sepolia Testnet',
          isTestnet: true,
          chainType: 'EVM',
        } as any,
        {
          id: 'algorand-mainnet',
          name: 'algorand-mainnet',
          displayName: 'Algorand Mainnet',
          isTestnet: false,
          chainType: 'AVM',
        } as any,
      ];

      const originalFirstId = networks[0].id;
      sortNetworksByPriority(networks);

      // Original array should be mutated by sort (expected behavior)
      expect(networks[0].id).toBe('algorand-mainnet');
      expect(originalFirstId).toBe('sepolia');
    });
  });
});
