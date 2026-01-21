import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ComplianceCheckItem {
  id: string
  category: 'kyc-aml' | 'jurisdiction' | 'disclosure' | 'network-specific'
  label: string
  description: string
  required: boolean
  completed: boolean
  networks?: ('VOI' | 'Aramid' | 'Both')[]
  documentUrl?: string
  notes?: string
}

export interface ComplianceChecklistMetrics {
  totalChecks: number
  completedChecks: number
  completionPercentage: number
  lastUpdated: Date | null
  completedAt: Date | null
  exportCount: number
}

// Category types for consistency
export const CHECKLIST_CATEGORIES = ['kyc-aml', 'jurisdiction', 'disclosure', 'network-specific'] as const;

export const useComplianceStore = defineStore('compliance', () => {
  const checklistItems = ref<ComplianceCheckItem[]>([
    // KYC/AML Section
    {
      id: 'kyc-policy',
      category: 'kyc-aml',
      label: 'KYC Policy Established',
      description: 'Implement Know Your Customer procedures for token holders, including identity verification and documentation requirements',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'aml-procedures',
      category: 'kyc-aml',
      label: 'AML Compliance Procedures',
      description: 'Establish Anti-Money Laundering procedures including transaction monitoring, suspicious activity reporting, and record keeping',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'sanctioned-addresses',
      category: 'kyc-aml',
      label: 'Sanctioned Address Screening',
      description: 'Implement screening against OFAC and other sanctions lists to prevent transactions with restricted parties',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'beneficial-ownership',
      category: 'kyc-aml',
      label: 'Beneficial Ownership Verification',
      description: 'Verify ultimate beneficial owners (UBOs) for institutional participants and complex ownership structures',
      required: false,
      completed: false,
      networks: ['Both']
    },
    
    // Jurisdiction Section
    {
      id: 'regulatory-analysis',
      category: 'jurisdiction',
      label: 'Regulatory Environment Analysis',
      description: 'Conduct thorough analysis of regulatory requirements in all target jurisdictions',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'mica-compliance',
      category: 'jurisdiction',
      label: 'MICA Compliance Assessment',
      description: 'For EU operations: Assess token classification under MICA (utility, e-money, or asset-referenced) and meet authorization requirements',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'geo-restrictions',
      category: 'jurisdiction',
      label: 'Geographic Restrictions Implementation',
      description: 'Implement geo-blocking for restricted jurisdictions and document compliance measures',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'securities-analysis',
      category: 'jurisdiction',
      label: 'Securities Law Analysis',
      description: 'Determine if token qualifies as a security under Howey Test or local securities laws',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'cross-border-compliance',
      category: 'jurisdiction',
      label: 'Cross-Border Transfer Compliance',
      description: 'Ensure compliance with international transfer and payment regulations (especially for Aramid payment tokens)',
      required: false,
      completed: false,
      networks: ['Aramid']
    },
    
    // Disclosure Documents Section
    {
      id: 'whitepaper',
      category: 'disclosure',
      label: 'Comprehensive Whitepaper',
      description: 'Publish detailed whitepaper covering technology, tokenomics, use cases, risks, and governance',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'terms-conditions',
      category: 'disclosure',
      label: 'Terms and Conditions',
      description: 'Establish clear terms of service, usage restrictions, and liability limitations',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'risk-disclosure',
      category: 'disclosure',
      label: 'Risk Disclosure Statement',
      description: 'Provide comprehensive disclosure of risks including market volatility, technology risks, and regulatory uncertainty',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'token-rights',
      category: 'disclosure',
      label: 'Token Rights Documentation',
      description: 'Clearly define token holder rights, governance participation, and any economic benefits',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'privacy-policy',
      category: 'disclosure',
      label: 'Privacy Policy (GDPR Compliant)',
      description: 'Establish GDPR-compliant privacy policy covering data collection, processing, and user rights',
      required: true,
      completed: false,
      networks: ['Both']
    },
    {
      id: 'audit-report',
      category: 'disclosure',
      label: 'Smart Contract Audit Report',
      description: 'Obtain and publish third-party security audit of smart contracts (if applicable)',
      required: false,
      completed: false,
      networks: ['Both']
    },
    
    // Network-Specific Section - VOI
    {
      id: 'voi-metadata-ipfs',
      category: 'network-specific',
      label: 'VOI: Metadata on IPFS/Arweave',
      description: 'Store token metadata on decentralized storage (IPFS, Arweave, or VOI native storage) for permanence',
      required: true,
      completed: false,
      networks: ['VOI']
    },
    {
      id: 'voi-fee-structure',
      category: 'network-specific',
      label: 'VOI: Fee Structure Documentation',
      description: 'Document creation (~0.1 VOI) and transaction fees (~0.001 VOI) in user-facing materials',
      required: true,
      completed: false,
      networks: ['VOI']
    },
    {
      id: 'voi-finality',
      category: 'network-specific',
      label: 'VOI: Fast Finality Disclosure',
      description: 'Inform users about VOI\'s instant finality characteristics and implications for transactions',
      required: false,
      completed: false,
      networks: ['VOI']
    },
    
    // Network-Specific Section - Aramid
    {
      id: 'aramid-reserve-requirements',
      category: 'network-specific',
      label: 'Aramid: Reserve Requirements (Stablecoins)',
      description: 'For stablecoins/e-money tokens: Establish reserve requirements and redemption mechanisms per MICA',
      required: false,
      completed: false,
      networks: ['Aramid']
    },
    {
      id: 'aramid-audit-trail',
      category: 'network-specific',
      label: 'Aramid: Transaction Audit Trail',
      description: 'Implement comprehensive audit trail for all transactions to meet enterprise compliance requirements',
      required: true,
      completed: false,
      networks: ['Aramid']
    },
    {
      id: 'aramid-certified-provider',
      category: 'network-specific',
      label: 'Aramid: Use Certified Metadata Providers',
      description: 'Utilize Aramid-certified metadata providers for compliance and regulated use cases',
      required: true,
      completed: false,
      networks: ['Aramid']
    },
    {
      id: 'aramid-payment-compliance',
      category: 'network-specific',
      label: 'Aramid: Payment Service Compliance',
      description: 'For payment tokens: Ensure compliance with payment service regulations and obtain necessary authorizations',
      required: false,
      completed: false,
      networks: ['Aramid']
    }
  ])

  const selectedNetwork = ref<'VOI' | 'Aramid' | 'Both'>('Both')
  const checklistStartedAt = ref<Date | null>(null)
  const checklistCompletedAt = ref<Date | null>(null)
  const exportCount = ref(0)

  const filteredChecklist = computed(() => {
    if (selectedNetwork.value === 'Both') {
      return checklistItems.value
    }
    return checklistItems.value.filter(item => 
      !item.networks || 
      item.networks.includes(selectedNetwork.value) || 
      item.networks.includes('Both')
    )
  })

  const metrics = computed<ComplianceChecklistMetrics>(() => {
    const filtered = filteredChecklist.value
    const completed = filtered.filter(item => item.completed).length
    const total = filtered.length
    
    return {
      totalChecks: total,
      completedChecks: completed,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      lastUpdated: checklistItems.value.some(item => item.completed) 
        ? new Date() 
        : null,
      completedAt: checklistCompletedAt.value,
      exportCount: exportCount.value
    }
  })

  const requiredItemsComplete = computed(() => {
    const requiredItems = filteredChecklist.value.filter(item => item.required)
    return requiredItems.every(item => item.completed)
  })

  const categoryProgress = computed(() => {
    return CHECKLIST_CATEGORIES.map(category => {
      const items = filteredChecklist.value.filter(item => item.category === category)
      const completed = items.filter(item => item.completed).length
      return {
        category,
        total: items.length,
        completed,
        percentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 0
      }
    })
  })

  const setNetwork = (network: 'VOI' | 'Aramid' | 'Both') => {
    selectedNetwork.value = network
  }

  const toggleCheckItem = (itemId: string) => {
    const item = checklistItems.value.find(i => i.id === itemId)
    if (item) {
      item.completed = !item.completed
      
      // Start tracking when first item is checked
      if (!checklistStartedAt.value && item.completed) {
        checklistStartedAt.value = new Date()
      }
      
      // Check if all required items are complete
      if (requiredItemsComplete.value && !checklistCompletedAt.value) {
        checklistCompletedAt.value = new Date()
      } else if (!requiredItemsComplete.value && checklistCompletedAt.value) {
        // Reset completion if a required item is unchecked
        checklistCompletedAt.value = null
      }
    }
  }

  const updateItemNotes = (itemId: string, notes: string) => {
    const item = checklistItems.value.find(i => i.id === itemId)
    if (item) {
      item.notes = notes
    }
  }

  const updateItemDocument = (itemId: string, documentUrl: string) => {
    const item = checklistItems.value.find(i => i.id === itemId)
    if (item) {
      item.documentUrl = documentUrl
    }
  }

  const exportChecklistSummary = () => {
    exportCount.value++
    
    const summary = {
      exportDate: new Date().toISOString(),
      network: selectedNetwork.value,
      metrics: metrics.value,
      categoryProgress: categoryProgress.value,
      checklist: filteredChecklist.value.map(item => ({
        id: item.id,
        category: item.category,
        label: item.label,
        description: item.description,
        required: item.required,
        completed: item.completed,
        notes: item.notes,
        documentUrl: item.documentUrl
      })),
      startedAt: checklistStartedAt.value?.toISOString(),
      completedAt: checklistCompletedAt.value?.toISOString(),
      allRequiredComplete: requiredItemsComplete.value
    }
    
    return summary
  }

  const resetChecklist = () => {
    checklistItems.value.forEach(item => {
      item.completed = false
      item.notes = undefined
      item.documentUrl = undefined
    })
    checklistStartedAt.value = null
    checklistCompletedAt.value = null
  }

  return {
    checklistItems,
    filteredChecklist,
    selectedNetwork,
    metrics,
    requiredItemsComplete,
    categoryProgress,
    setNetwork,
    toggleCheckItem,
    updateItemNotes,
    updateItemDocument,
    exportChecklistSummary,
    resetChecklist,
    checklistStartedAt,
    checklistCompletedAt
  }
})
