import type { Network } from '../types/compliance'

/**
 * Determines the network type based on network display name
 * @param networkDisplayName - The display name from network info (e.g., "VOI Testnet", "Aramid Mainnet")
 * @returns Network type ('VOI' or 'Aramid')
 */
export function detectNetworkType(networkDisplayName: string | undefined): Network {
  if (!networkDisplayName) return 'VOI' // Default to VOI
  
  return networkDisplayName.toLowerCase().includes('aramid') ? 'Aramid' : 'VOI'
}

/**
 * Formats a network name for display
 * @param network - Network type
 * @returns Formatted network name
 */
export function formatNetworkName(network: Network): string {
  return network === 'VOI' ? 'VOI Network' : 'Aramid Network'
}
