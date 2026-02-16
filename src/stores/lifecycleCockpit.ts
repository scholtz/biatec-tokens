/**
 * Lifecycle Cockpit Store
 * 
 * Manages state for the token lifecycle cockpit including readiness status,
 * telemetry, guided actions, wallet diagnostics, and risk indicators.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  UserRole,
  ReadinessStatus,
  LifecycleTelemetry,
  GuidedAction,
  WalletDiagnostics,
  LifecycleRiskIndicators,
  EvidenceTrace,
  RolePermissions,
  ActionPriority,
  ActionStatus,
} from '../types/lifecycleCockpit'

export const useLifecycleCockpitStore = defineStore('lifecycleCockpit', () => {
  // State
  const userRole = ref<UserRole>('issuer_admin')
  const readinessStatus = ref<ReadinessStatus | null>(null)
  const telemetry = ref<LifecycleTelemetry | null>(null)
  const actions = ref<GuidedAction[]>([])
  const walletDiagnostics = ref<WalletDiagnostics | null>(null)
  const riskIndicators = ref<LifecycleRiskIndicators | null>(null)
  const evidenceTraces = ref<EvidenceTrace[]>([])
  const isLoading = ref(false)
  const lastRefresh = ref<Date | null>(null)
  const error = ref<string | null>(null)

  // Computed: Role Permissions
  const rolePermissions = computed<RolePermissions>(() => {
    const role = userRole.value
    
    switch (role) {
      case 'issuer_admin':
        return {
          role,
          canViewReadiness: true,
          canViewTelemetry: true,
          canViewActions: true,
          canViewWalletDiagnostics: true,
          canViewRiskIndicators: true,
          canViewEvidence: true,
          canCompleteActions: true,
          canExportReports: true,
        }
      case 'compliance':
        return {
          role,
          canViewReadiness: true,
          canViewTelemetry: false,
          canViewActions: true,
          canViewWalletDiagnostics: false,
          canViewRiskIndicators: true,
          canViewEvidence: true,
          canCompleteActions: true,
          canExportReports: true,
        }
      case 'operations':
        return {
          role,
          canViewReadiness: false,
          canViewTelemetry: true,
          canViewActions: true,
          canViewWalletDiagnostics: true,
          canViewRiskIndicators: true,
          canViewEvidence: false,
          canCompleteActions: false,
          canExportReports: true,
        }
      case 'treasury':
        return {
          role,
          canViewReadiness: false,
          canViewTelemetry: true,
          canViewActions: false,
          canViewWalletDiagnostics: false,
          canViewRiskIndicators: true,
          canViewEvidence: false,
          canCompleteActions: false,
          canExportReports: true,
        }
      default:
        return {
          role: 'issuer_admin',
          canViewReadiness: false,
          canViewTelemetry: false,
          canViewActions: false,
          canViewWalletDiagnostics: false,
          canViewRiskIndicators: false,
          canViewEvidence: false,
          canCompleteActions: false,
          canExportReports: false,
        }
    }
  })

  // Computed: Prioritized Actions
  const prioritizedActions = computed(() => {
    const priorityOrder: ActionPriority[] = ['critical', 'high', 'medium', 'low']
    
    return [...actions.value]
      .filter(action => action.status === 'pending' || action.status === 'in_progress')
      .sort((a, b) => {
        // First by priority
        const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
        if (priorityDiff !== 0) return priorityDiff
        
        // Then by creation date (older first)
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
  })

  // Computed: Critical Actions Count
  const criticalActionsCount = computed(() => 
    actions.value.filter(a => a.priority === 'critical' && a.status === 'pending').length
  )

  // Computed: Is Launch Ready
  const isLaunchReady = computed(() => 
    readinessStatus.value?.isLaunchReady ?? false
  )

  // Actions
  
  /**
   * Initialize cockpit data
   */
  async function initialize(tokenId?: string) {
    isLoading.value = true
    error.value = null
    
    try {
      // Load all cockpit data
      await Promise.all([
        loadReadinessStatus(),
        loadTelemetry(tokenId),
        loadGuidedActions(),
        loadWalletDiagnostics(),
        loadRiskIndicators(tokenId),
        loadEvidenceTraces(),
      ])
      
      lastRefresh.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize cockpit'
      console.error('Cockpit initialization error:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load readiness status
   */
  async function loadReadinessStatus() {
    // Mock data for now - will be replaced with API call
    readinessStatus.value = {
      overallScore: 75,
      isLaunchReady: false,
      blockers: [
        {
          id: 'blocker-1',
          category: 'compliance',
          title: 'KYC Provider Not Configured',
          description: 'A KYC provider must be configured before token launch',
          impact: 'Cannot launch token without KYC verification',
          deepLink: '/compliance/setup?step=kyc_aml',
          evidenceRequired: true,
          createdAt: new Date(),
        },
      ],
      warnings: [
        {
          id: 'warning-1',
          category: 'wallet',
          title: 'Limited Wallet Compatibility',
          description: 'Only 2 of 5 major wallets are compatible',
          recommendation: 'Consider adding support for additional wallet standards',
          deepLink: '/compliance/setup?step=wallet',
          createdAt: new Date(),
        },
      ],
      recommendations: [
        'Complete KYC/AML configuration',
        'Review whitelist settings',
        'Test wallet integration',
      ],
      lastUpdated: new Date(),
      nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
  }

  /**
   * Load telemetry data
   */
  async function loadTelemetry(tokenId?: string) {
    if (!tokenId) {
      telemetry.value = null
      return
    }

    // Mock data - will be replaced with API call
    telemetry.value = {
      tokenId,
      totalHolders: 1247,
      activeHolders: 823,
      inactiveHolders: 424,
      totalTransactions: 5832,
      transactionsLast24h: 127,
      transactionsLast7d: 892,
      avgTransactionVolume: 1250.50,
      concentrationRisk: {
        severity: 'medium',
        topHolderPercentage: 23.5,
        top5HoldersPercentage: 48.2,
        top10HoldersPercentage: 61.7,
        threshold: 25,
        message: 'Top holder concentration approaching threshold',
      },
      activityTrend: {
        direction: 'increasing',
        changePercentage: 12.3,
        period: '7d',
        message: 'Transaction activity increased 12.3% over last 7 days',
      },
      lastUpdated: new Date(),
    }
  }

  /**
   * Load guided actions
   */
  async function loadGuidedActions() {
    // Mock data - will be replaced with API call
    actions.value = [
      {
        id: 'action-1',
        priority: 'critical',
        status: 'pending',
        title: 'Complete KYC Provider Setup',
        description: 'Configure KYC provider to enable token launch',
        rationale: 'MICA regulation requires KYC verification for all token holders',
        expectedImpact: 'Unblocks token launch and ensures regulatory compliance',
        deepLink: '/compliance/setup?step=kyc_aml',
        category: 'compliance',
        estimatedTime: '10 minutes',
        assignedRole: 'compliance',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 'action-2',
        priority: 'high',
        status: 'pending',
        title: 'Review Wallet Compatibility',
        description: 'Verify token works with major wallets',
        rationale: 'Poor wallet UX reduces adoption and increases support burden',
        expectedImpact: 'Improves user experience and reduces support tickets by 40%',
        deepLink: '/cockpit/diagnostics/wallet',
        category: 'wallet',
        estimatedTime: '15 minutes',
        assignedRole: 'operations',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 'action-3',
        priority: 'medium',
        status: 'pending',
        title: 'Monitor Holder Concentration',
        description: 'Review top holder concentration levels',
        rationale: 'High concentration increases market manipulation risk',
        expectedImpact: 'Reduces market risk and improves token stability',
        deepLink: '/cockpit/risk/concentration',
        category: 'risk',
        estimatedTime: '5 minutes',
        assignedRole: 'treasury',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
    ]
  }

  /**
   * Load wallet diagnostics
   */
  async function loadWalletDiagnostics() {
    // Mock data - will be replaced with API call
    walletDiagnostics.value = {
      overallStatus: 'warn',
      diagnostics: [
        {
          id: 'diag-1',
          name: 'Pera Wallet Compatibility',
          status: 'pass',
          description: 'Token fully compatible with Pera Wallet',
          category: 'compatibility',
          lastChecked: new Date(),
        },
        {
          id: 'diag-2',
          name: 'Defly Wallet Compatibility',
          status: 'pass',
          description: 'Token fully compatible with Defly Wallet',
          category: 'compatibility',
          lastChecked: new Date(),
        },
        {
          id: 'diag-3',
          name: 'MetaMask Compatibility',
          status: 'warn',
          description: 'Limited functionality with MetaMask',
          remediationHint: 'Add EIP-2612 permit support for better UX',
          deepLink: '/docs/wallet-integration',
          category: 'compatibility',
          lastChecked: new Date(),
        },
        {
          id: 'diag-4',
          name: 'Mobile Wallet UX',
          status: 'warn',
          description: 'QR code scanning requires improvement',
          remediationHint: 'Implement deep linking for mobile wallets',
          category: 'ux',
          lastChecked: new Date(),
        },
      ],
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    }
  }

  /**
   * Load risk indicators
   */
  async function loadRiskIndicators(tokenId?: string) {
    if (!tokenId) {
      riskIndicators.value = null
      return
    }

    // Mock data - will be replaced with API call
    riskIndicators.value = {
      concentration: {
        severity: 'medium',
        value: 48.2,
        threshold: 50,
        unit: '%',
        message: 'Top 5 holders control 48.2% of supply',
        tooltip: 'High concentration increases market manipulation risk. Target: <50%',
        trend: 'stable',
        deepLink: '/cockpit/risk/concentration',
        lastUpdated: new Date(),
      },
      inactivity: {
        severity: 'low',
        value: 34,
        threshold: 40,
        unit: '%',
        message: '34% of holders inactive for 30+ days',
        tooltip: 'Inactive holders may indicate low engagement. Target: <40%',
        trend: 'decreasing',
        lastUpdated: new Date(),
      },
      unusualActivity: {
        severity: 'none',
        value: 0,
        threshold: 5,
        unit: 'events',
        message: 'No unusual activity detected',
        tooltip: 'Monitors for suspicious transaction patterns. Target: 0 events',
        trend: 'stable',
        lastUpdated: new Date(),
      },
      lastUpdated: new Date(),
    }
  }

  /**
   * Load evidence traces
   */
  async function loadEvidenceTraces() {
    // Mock data - will be replaced with API call
    evidenceTraces.value = [
      {
        signalId: 'blocker-1',
        signalType: 'blocker',
        evidenceRefs: [
          {
            id: 'evidence-1',
            type: 'audit_log',
            title: 'KYC Configuration Audit',
            url: '/audit/kyc-config',
            timestamp: new Date(),
          },
        ],
      },
    ]
  }

  /**
   * Update action status
   */
  function updateActionStatus(actionId: string, status: ActionStatus) {
    const action = actions.value.find(a => a.id === actionId)
    if (action) {
      action.status = status
      if (status === 'completed') {
        action.completedAt = new Date()
      }
    }
  }

  /**
   * Set user role
   */
  function setUserRole(role: UserRole) {
    userRole.value = role
  }

  /**
   * Refresh all data
   */
  async function refresh(tokenId?: string) {
    await initialize(tokenId)
  }

  return {
    // State
    userRole,
    readinessStatus,
    telemetry,
    actions,
    walletDiagnostics,
    riskIndicators,
    evidenceTraces,
    isLoading,
    lastRefresh,
    error,
    
    // Computed
    rolePermissions,
    prioritizedActions,
    criticalActionsCount,
    isLaunchReady,
    
    // Actions
    initialize,
    refresh,
    updateActionStatus,
    setUserRole,
  }
})
