import type { NetworkInfo } from '../composables/useWalletManager';

/**
 * Sorts networks with mainnet first, then testnets.
 * Within each group, prioritizes Algorand and Ethereum.
 * Advanced networks (VOI, Aramid) are sorted after primary mainnets but before testnets.
 * 
 * @param networks - Array of network info objects
 * @returns Sorted array of networks
 */
export function sortNetworksByPriority(networks: NetworkInfo[]): NetworkInfo[] {
  return networks.sort((a, b) => {
    // First priority: primary mainnet vs advanced vs testnet
    const aCategory = a.isTestnet ? 2 : (a.isAdvanced ? 1 : 0);
    const bCategory = b.isTestnet ? 2 : (b.isAdvanced ? 1 : 0);
    
    if (aCategory !== bCategory) {
      return aCategory - bCategory;
    }
    
    // Second priority: Algorand mainnet first among primary mainnets
    if (aCategory === 0) {
      if (a.id === 'algorand-mainnet') return -1;
      if (b.id === 'algorand-mainnet') return 1;
      if (a.id === 'ethereum') return -1;
      if (b.id === 'ethereum') return 1;
    }
    
    // Third priority: Algorand testnet first among testnets
    if (aCategory === 2) {
      if (a.id === 'algorand-testnet') return -1;
      if (b.id === 'algorand-testnet') return 1;
      if (a.id === 'sepolia') return -1;
      if (b.id === 'sepolia') return 1;
    }
    
    // Default: alphabetical
    return a.displayName.localeCompare(b.displayName);
  });
}
