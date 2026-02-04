import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { NetworkId } from '../composables/useWalletManager'
import type { TokenAttestationMetadata } from '../types/compliance'
import type { MicaComplianceMetadata } from '../types/api'

/**
 * Token draft form data
 */
export interface TokenDraftForm {
  name: string
  symbol: string
  description: string
  supply: number | null
  decimals: number
  imageUrl: string
  attributes: Array<{ trait_type: string; value: string }>
  
  // Compliance metadata
  micaMetadata?: MicaComplianceMetadata
  attestationMetadata?: TokenAttestationMetadata
  
  // Selections
  selectedTemplate?: string
  selectedNetwork?: NetworkId
  selectedStandard?: string
  
  // Timestamps
  lastModified?: Date
  createdAt?: Date
}

const STORAGE_KEY = 'biatec_token_draft'
const STORAGE_VERSION = '1.0'

/**
 * Store for managing token creation drafts with network-aware persistence
 * Survives page refresh and network switches
 */
export const useTokenDraftStore = defineStore('tokenDraft', () => {
  const currentDraft = ref<TokenDraftForm | null>(null)
  const isDraftLoaded = ref(false)
  const lastSavedNetwork = ref<NetworkId | null>(null)

  /**
   * Load draft from sessionStorage
   */
  const loadDraft = (): TokenDraftForm | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      
      // Validate version
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Token draft version mismatch, clearing old draft')
        clearDraft()
        return null
      }

      // Restore dates
      if (parsed.draft.lastModified) {
        parsed.draft.lastModified = new Date(parsed.draft.lastModified)
      }
      if (parsed.draft.createdAt) {
        parsed.draft.createdAt = new Date(parsed.draft.createdAt)
      }

      lastSavedNetwork.value = parsed.network || null
      return parsed.draft
    } catch (error) {
      console.error('Failed to load token draft:', error)
      clearDraft()
      return null
    }
  }

  /**
   * Save draft to sessionStorage
   */
  const saveDraft = (draft: TokenDraftForm, networkId?: NetworkId) => {
    try {
      const dataToSave = {
        version: STORAGE_VERSION,
        draft: {
          ...draft,
          lastModified: new Date(),
        },
        network: networkId || lastSavedNetwork.value,
        timestamp: Date.now(),
      }

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      lastSavedNetwork.value = networkId || lastSavedNetwork.value
      console.log('Token draft saved to sessionStorage')
    } catch (error) {
      console.error('Failed to save token draft:', error)
    }
  }

  /**
   * Clear draft from storage
   */
  const clearDraft = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    currentDraft.value = null
    lastSavedNetwork.value = null
    console.log('Token draft cleared')
  }

  /**
   * Initialize draft (create new or load existing)
   */
  const initializeDraft = (networkId?: NetworkId): TokenDraftForm => {
    if (!isDraftLoaded.value) {
      const loaded = loadDraft()
      if (loaded) {
        currentDraft.value = loaded
        isDraftLoaded.value = true
        return loaded
      }
    }

    // Create new draft
    const newDraft: TokenDraftForm = {
      name: '',
      symbol: '',
      description: '',
      supply: null,
      decimals: 0,
      imageUrl: '',
      attributes: [],
      selectedNetwork: networkId,
      createdAt: new Date(),
      lastModified: new Date(),
    }

    currentDraft.value = newDraft
    isDraftLoaded.value = true
    saveDraft(newDraft, networkId)
    return newDraft
  }

  /**
   * Update draft form data
   */
  const updateDraft = (updates: Partial<TokenDraftForm>, networkId?: NetworkId) => {
    if (!currentDraft.value) {
      initializeDraft(networkId)
    }

    currentDraft.value = {
      ...currentDraft.value!,
      ...updates,
      lastModified: new Date(),
    }

    saveDraft(currentDraft.value, networkId)
  }

  /**
   * Check if draft has unsaved changes
   */
  const hasDraft = (): boolean => {
    return currentDraft.value !== null && (
      currentDraft.value.name !== '' ||
      currentDraft.value.symbol !== '' ||
      currentDraft.value.description !== ''
    )
  }

  /**
   * Check if draft is compatible with target network
   */
  const isDraftCompatibleWithNetwork = (networkId: NetworkId): boolean => {
    if (!currentDraft.value || !currentDraft.value.selectedStandard) {
      return true // No incompatibility if no standard selected
    }

    const standard = currentDraft.value.selectedStandard
    const isEVM = ['ethereum', 'arbitrum', 'base', 'sepolia'].includes(networkId)
    const isAVM = !isEVM

    // ERC standards require EVM network
    if (standard.startsWith('ERC') && !isEVM) {
      return false
    }

    // ASA/ARC standards require AVM network
    if ((standard.startsWith('ASA') || standard.startsWith('ARC')) && !isAVM) {
      return false
    }

    return true
  }

  /**
   * Validate network switch compatibility
   */
  const validateNetworkSwitch = (_fromNetwork: NetworkId, toNetwork: NetworkId): {
    compatible: boolean
    warnings: string[]
  } => {
    const warnings: string[] = []

    if (!currentDraft.value) {
      return { compatible: true, warnings: [] }
    }

    // Check standard compatibility
    if (!isDraftCompatibleWithNetwork(toNetwork)) {
      warnings.push(
        `Your selected token standard (${currentDraft.value.selectedStandard}) is not compatible with ${toNetwork}. You will need to select a different standard.`
      )
    }

    // Check if compliance metadata needs updating
    if (currentDraft.value.micaMetadata && lastSavedNetwork.value !== toNetwork) {
      warnings.push(
        'Network switch detected. Please review your compliance metadata to ensure it matches the new network requirements.'
      )
    }

    // Check for attestation metadata
    if (currentDraft.value.attestationMetadata) {
      warnings.push(
        'Attestation metadata may need to be updated for the new network.'
      )
    }

    return {
      compatible: warnings.length === 0,
      warnings,
    }
  }

  /**
   * Auto-save timeout ref (instance-scoped to prevent race conditions)
   * Using ref instead of module-scoped variable ensures each store instance
   * has its own debounce timer, preventing interference between instances.
   */
  const saveTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  
  /**
   * Auto-save watch (debounced)
   */
  watch(
    currentDraft,
    (newDraft) => {
      if (newDraft && isDraftLoaded.value) {
        // Debounce auto-save
        if (saveTimeout.value) clearTimeout(saveTimeout.value)
        saveTimeout.value = setTimeout(() => {
          saveDraft(newDraft)
        }, 1000)
      }
    },
    { deep: true }
  )

  return {
    // State
    currentDraft,
    isDraftLoaded,
    lastSavedNetwork,

    // Actions
    initializeDraft,
    updateDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    isDraftCompatibleWithNetwork,
    validateNetworkSwitch,
  }
})
