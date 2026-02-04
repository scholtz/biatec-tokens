import type { NetworkInfo } from '../composables/useWalletManager';

/**
 * Sorts networks with mainnet first, then testnets.
 * Within each group, prioritizes Algorand and Ethereum.
 * 
 * @param networks - Array of network info objects
 * @returns Sorted array of networks
 */
export function sortNetworksByPriority(networks: NetworkInfo[]): NetworkInfo[] {
  return networks.sort((a, b) => {
    // First priority: mainnet vs testnet
    if (a.isTestnet !== b.isTestnet) {
      return a.isTestnet ? 1 : -1;
    }
    
    // Second priority: Algorand mainnet first among mainnets
    if (!a.isTestnet && !b.isTestnet) {
      if (a.id === 'algorand-mainnet') return -1;
      if (b.id === 'algorand-mainnet') return 1;
      if (a.id === 'ethereum') return -1;
      if (b.id === 'ethereum') return 1;
    }
    
    // Third priority: Algorand testnet first among testnets
    if (a.isTestnet && b.isTestnet) {
      if (a.id === 'algorand-testnet') return -1;
      if (b.id === 'algorand-testnet') return 1;
      if (a.id === 'sepolia') return -1;
      if (b.id === 'sepolia') return 1;
    }
    
    // Default: alphabetical
    return a.displayName.localeCompare(b.displayName);
  });
}
