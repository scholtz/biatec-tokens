import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * MICA compliance checklist item for a specific token
 */
export interface TokenMicaChecklistItem {
  id: string
  label: string
  completed: boolean
}

/**
 * MICA compliance state for a single token
 */
export interface TokenMicaCompliance {
  tokenId: string
  checklist: TokenMicaChecklistItem[]
  lastUpdated: Date
}

/**
 * MICA readiness badge status
 */
export type MicaReadinessStatus = 'Ready' | 'At Risk' | 'Incomplete'

// Default MICA checklist items for tokens
const DEFAULT_MICA_CHECKLIST: Omit<TokenMicaChecklistItem, 'completed'>[] = [
  { id: 'whitepaper', label: 'Token whitepaper published' },
  { id: 'kyc-policy', label: 'KYC/AML policy established' },
  { id: 'risk-disclosure', label: 'Risk disclosure statement' },
  { id: 'jurisdiction-analysis', label: 'Jurisdiction compliance review' },
  { id: 'transfer-restrictions', label: 'Transfer restrictions configured' }
]

const STORAGE_KEY = 'biatec_token_compliance'

/**
 * Store for managing per-token MICA compliance checklists
 */
export const useTokenComplianceStore = defineStore('tokenCompliance', () => {
  // State: Map of tokenId to compliance data
  const complianceData = ref<Record<string, TokenMicaCompliance>>({})

  // Load from localStorage on initialization
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(tokenId => {
          if (parsed[tokenId].lastUpdated) {
            parsed[tokenId].lastUpdated = new Date(parsed[tokenId].lastUpdated)
          }
        })
        complianceData.value = parsed
      }
    } catch (error) {
      console.error('Failed to load token compliance from localStorage:', error)
    }
  }

  // Save to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complianceData.value))
    } catch (error) {
      console.error('Failed to save token compliance to localStorage:', error)
    }
  }

  /**
   * Get or initialize compliance data for a token
   */
  const getTokenCompliance = (tokenId: string): TokenMicaCompliance => {
    if (!complianceData.value[tokenId]) {
      complianceData.value[tokenId] = {
        tokenId,
        checklist: DEFAULT_MICA_CHECKLIST.map(item => ({
          ...item,
          completed: false
        })),
        lastUpdated: new Date()
      }
      saveToStorage()
    }
    return complianceData.value[tokenId]
  }

  /**
   * Toggle a checklist item for a token
   */
  const toggleChecklistItem = (tokenId: string, itemId: string) => {
    const compliance = getTokenCompliance(tokenId)
    const item = compliance.checklist.find(i => i.id === itemId)
    if (item) {
      item.completed = !item.completed
      compliance.lastUpdated = new Date()
      saveToStorage()
    }
  }

  /**
   * Calculate completion percentage for a token
   */
  const getCompletionPercentage = (tokenId: string): number => {
    const compliance = getTokenCompliance(tokenId)
    const completed = compliance.checklist.filter(i => i.completed).length
    const total = compliance.checklist.length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  /**
   * Get readiness status based on completion percentage
   * Ready: 80-100%
   * At Risk: 40-79%
   * Incomplete: 0-39%
   */
  const getReadinessStatus = (tokenId: string): MicaReadinessStatus => {
    const percentage = getCompletionPercentage(tokenId)
    if (percentage >= 80) return 'Ready'
    if (percentage >= 40) return 'At Risk'
    return 'Incomplete'
  }

  /**
   * Get badge variant for UI rendering
   */
  const getReadinessBadgeVariant = (status: MicaReadinessStatus): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'Ready':
        return 'success'
      case 'At Risk':
        return 'warning'
      case 'Incomplete':
        return 'error'
    }
  }

  /**
   * Reset checklist for a token
   */
  const resetTokenCompliance = (tokenId: string) => {
    if (complianceData.value[tokenId]) {
      complianceData.value[tokenId].checklist.forEach(item => {
        item.completed = false
      })
      complianceData.value[tokenId].lastUpdated = new Date()
      saveToStorage()
    }
  }

  /**
   * Delete compliance data for a token
   */
  const deleteTokenCompliance = (tokenId: string) => {
    delete complianceData.value[tokenId]
    saveToStorage()
  }

  // Initialize from localStorage
  loadFromStorage()

  return {
    complianceData,
    getTokenCompliance,
    toggleChecklistItem,
    getCompletionPercentage,
    getReadinessStatus,
    getReadinessBadgeVariant,
    resetTokenCompliance,
    deleteTokenCompliance
  }
})
