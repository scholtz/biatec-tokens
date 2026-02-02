import { ref, computed } from 'vue'
import algosdk from 'algosdk'
import axios from 'axios'
import { useWalletManager } from './useWalletManager'

export interface ARC3Metadata {
  name?: string
  description?: string
  image?: string
  image_integrity?: string
  image_mimetype?: string
  external_url?: string
  properties?: Record<string, any>
  decimals?: number
  unitName?: string
}

export interface ComplianceFlags {
  micaReady: boolean
  whitelistRequired: boolean
  kycRequired: boolean
  jurisdictionRestricted: boolean
  transferRestricted: boolean
  notes?: string
}

export interface AssetMetadata {
  assetId: number
  name: string
  unitName: string
  decimals: number
  total: number
  creator: string
  manager?: string
  reserve?: string
  freeze?: string
  clawback?: string
  url?: string
  metadataHash?: string
  arc3?: ARC3Metadata
  standard?: 'ARC3' | 'ARC19' | 'ASA'
  isVerified: boolean
  isLoading: boolean
  error?: string
  complianceFlags?: ComplianceFlags
}

/**
 * Composable for fetching and managing token metadata from Algorand networks
 * Supports ARC3, ARC19, and standard ASA tokens
 */
export function useTokenMetadata() {
  const { networkInfo } = useWalletManager()
  const metadataCache = ref<Map<number, AssetMetadata>>(new Map())

  // Configuration constants
  const IPFS_GATEWAY_URL = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
  const ARC3_FETCH_TIMEOUT_MS = 5000
  const ALGORAND_ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'

  /**
   * Creates an Algodv2 client for the current network
   */
  const createAlgodClient = () => {
    if (!networkInfo.value) {
      throw new Error('Network information not available')
    }

    if (networkInfo.value.chainType !== 'AVM') {
      throw new Error('Token metadata is only available for AVM networks')
    }

    const { algodUrl } = networkInfo.value
    const token = ''

    return new algosdk.Algodv2(token, algodUrl, '')
  }

  /**
   * Resolves IPFS URLs to HTTP gateways
   */
  const resolveIpfsUrl = (url: string): string => {
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '')
      return `${IPFS_GATEWAY_URL}${cid}`
    }
    return url
  }

  /**
   * Fetches ARC3 metadata from URL
   */
  const fetchARC3Metadata = async (url: string): Promise<ARC3Metadata | null> => {
    try {
      const resolvedUrl = resolveIpfsUrl(url)
      const response = await axios.get(resolvedUrl, { timeout: ARC3_FETCH_TIMEOUT_MS })
      return response.data
    } catch (error) {
      console.error('Error fetching ARC3 metadata:', error)
      return null
    }
  }

  /**
   * Determines asset standard based on metadata
   */
  const determineStandard = (assetParams: any): 'ARC3' | 'ARC19' | 'ASA' => {
    const url = assetParams.url || ''
    
    // ARC3: Has URL ending in #arc3
    if (url.endsWith('#arc3')) {
      return 'ARC3'
    }
    
    // ARC19: Has URL starting with template-ipfs://
    if (url.startsWith('template-ipfs://')) {
      return 'ARC19'
    }
    
    return 'ASA'
  }

  /**
   * Determines compliance flags based on asset parameters and network
   * This is a heuristic approach - in production this would query on-chain compliance data
   */
  const determineComplianceFlags = (assetParams: any, arc3Metadata?: ARC3Metadata): ComplianceFlags => {
    // Check if asset has freeze or clawback addresses (indicates potential compliance controls)
    const hasFreeze = !!assetParams.freeze && assetParams.freeze !== ALGORAND_ZERO_ADDRESS
    const hasClawback = !!assetParams.clawback && assetParams.clawback !== ALGORAND_ZERO_ADDRESS
    
    // Check for compliance keywords in metadata
    const description = (arc3Metadata?.description || '').toLowerCase()
    const properties = arc3Metadata?.properties || {}
    
    const hasComplianceKeywords = description.includes('kyc') || 
                                   description.includes('whitelist') || 
                                   description.includes('mica') ||
                                   description.includes('compliant') ||
                                   description.includes('regulated')
    
    // Check properties for explicit compliance flags
    const explicitWhitelist = properties.whitelistRequired === true || properties.whitelist_required === true
    const explicitKyc = properties.kycRequired === true || properties.kyc_required === true
    const explicitMica = properties.micaCompliant === true || properties.mica_compliant === true
    
    return {
      micaReady: explicitMica || (hasFreeze && hasClawback && hasComplianceKeywords),
      whitelistRequired: explicitWhitelist || hasFreeze,
      kycRequired: explicitKyc || (hasFreeze && hasComplianceKeywords),
      jurisdictionRestricted: hasClawback && hasComplianceKeywords,
      transferRestricted: hasFreeze || hasClawback,
      notes: hasFreeze || hasClawback ? 'Token has compliance controls enabled' : undefined
    }
  }

  /**
   * Fetches asset metadata from the blockchain
   */
  const fetchMetadata = async (assetId: number): Promise<AssetMetadata> => {
    // Check cache first
    if (metadataCache.value.has(assetId)) {
      const cached = metadataCache.value.get(assetId)!
      if (!cached.isLoading) {
        return cached
      }
    }

    // Set loading state
    const loadingMetadata: AssetMetadata = {
      assetId,
      name: 'Loading...',
      unitName: '',
      decimals: 0,
      total: 0,
      creator: '',
      standard: 'ASA',
      isVerified: false,
      isLoading: true
    }
    metadataCache.value.set(assetId, loadingMetadata)

    try {
      const algodClient = createAlgodClient()
      const assetInfo = await algodClient.getAssetByID(assetId).do()
      const params = assetInfo.params

      const standard = determineStandard(params)
      let arc3Metadata: ARC3Metadata | undefined

      // Fetch ARC3 metadata if applicable
      if (standard === 'ARC3' && params.url) {
        const url = params.url.replace('#arc3', '')
        arc3Metadata = await fetchARC3Metadata(url) || undefined
      }

      const metadata: AssetMetadata = {
        assetId,
        name: arc3Metadata?.name || params.name || `Asset ${assetId}`,
        unitName: arc3Metadata?.unitName || params.unitName || '',
        decimals: arc3Metadata?.decimals ?? params.decimals ?? 0,
        total: Number(params.total || 0),
        creator: params.creator || '',
        manager: params.manager,
        reserve: params.reserve,
        freeze: params.freeze,
        clawback: params.clawback,
        url: params.url,
        metadataHash: params.metadataHash ? Buffer.from(params.metadataHash).toString('base64') : undefined,
        arc3: arc3Metadata,
        standard,
        isVerified: !!arc3Metadata || standard === 'ARC3',
        isLoading: false,
        complianceFlags: determineComplianceFlags(params, arc3Metadata)
      }

      metadataCache.value.set(assetId, metadata)
      return metadata
    } catch (error: any) {
      console.error(`Error fetching metadata for asset ${assetId}:`, error)
      
      const errorMetadata: AssetMetadata = {
        assetId,
        name: `Asset ${assetId}`,
        unitName: '',
        decimals: 0,
        total: 0,
        creator: '',
        standard: 'ASA',
        isVerified: false,
        isLoading: false,
        error: error.message || 'Failed to fetch metadata'
      }
      
      metadataCache.value.set(assetId, errorMetadata)
      return errorMetadata
    }
  }

  /**
   * Gets cached metadata or fetches if not available
   */
  const getMetadata = async (assetId: number): Promise<AssetMetadata> => {
    const cached = metadataCache.value.get(assetId)
    if (cached && !cached.isLoading && !cached.error) {
      return cached
    }
    return fetchMetadata(assetId)
  }

  /**
   * Batch fetches metadata for multiple assets
   */
  const fetchBatchMetadata = async (assetIds: number[]): Promise<AssetMetadata[]> => {
    const promises = assetIds.map(id => getMetadata(id))
    return Promise.all(promises)
  }

  /**
   * Clears the metadata cache
   */
  const clearCache = () => {
    metadataCache.value.clear()
  }

  /**
   * Gets the verification badge for an asset
   */
  const getVerificationBadge = (standard: string): { color: string; label: string } => {
    switch (standard) {
      case 'ARC3':
        return { color: 'green', label: 'ARC3 Verified' }
      case 'ARC19':
        return { color: 'blue', label: 'ARC19' }
      default:
        return { color: 'gray', label: 'Standard ASA' }
    }
  }

  return {
    metadataCache: computed(() => metadataCache.value),
    fetchMetadata,
    getMetadata,
    fetchBatchMetadata,
    clearCache,
    getVerificationBadge
  }
}
