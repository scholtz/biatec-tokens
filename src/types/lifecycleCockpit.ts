/**
 * Token Lifecycle Cockpit Types
 * 
 * Types for the competitive intelligence and token lifecycle cockpit.
 * Combines readiness diagnostics, post-launch telemetry, wallet diagnostics,
 * and lifecycle risk indicators.
 */

export type UserRole = 'issuer_admin' | 'compliance' | 'operations' | 'treasury'

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low'
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed'

export type DiagnosticStatus = 'pass' | 'warn' | 'fail'
export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low' | 'none'

/**
 * Readiness Status combining compliance setup and launch readiness
 */
export interface ReadinessStatus {
  overallScore: number // 0-100
  isLaunchReady: boolean
  blockers: ReadinessBlocker[]
  warnings: ReadinessWarning[]
  recommendations: string[]
  lastUpdated: Date
  nextReviewDate?: Date
}

export interface ReadinessBlocker {
  id: string
  category: 'compliance' | 'technical' | 'legal' | 'wallet'
  title: string
  description: string
  impact: string
  deepLink: string
  evidenceRequired: boolean
  createdAt: Date
}

export interface ReadinessWarning {
  id: string
  category: 'compliance' | 'technical' | 'legal' | 'wallet'
  title: string
  description: string
  recommendation: string
  deepLink?: string
  createdAt: Date
}

/**
 * Lifecycle Telemetry Summary for post-launch health
 */
export interface LifecycleTelemetry {
  tokenId: string
  totalHolders: number
  activeHolders: number // holders who transacted in last 30 days
  inactiveHolders: number
  totalTransactions: number
  transactionsLast24h: number
  transactionsLast7d: number
  avgTransactionVolume: number
  concentrationRisk: ConcentrationRisk
  activityTrend: ActivityTrend
  lastUpdated: Date
}

export interface ConcentrationRisk {
  severity: RiskSeverity
  topHolderPercentage: number // % held by top holder
  top5HoldersPercentage: number // % held by top 5 holders
  top10HoldersPercentage: number // % held by top 10 holders
  threshold: number // warning threshold
  message: string
}

export interface ActivityTrend {
  direction: 'increasing' | 'stable' | 'decreasing'
  changePercentage: number // compared to previous period
  period: '7d' | '30d'
  message: string
}

/**
 * Guided Next Actions with prioritization
 */
export interface GuidedAction {
  id: string
  priority: ActionPriority
  status: ActionStatus
  title: string
  description: string
  rationale: string
  expectedImpact: string
  deepLink: string
  category: 'setup' | 'compliance' | 'wallet' | 'operations' | 'risk'
  estimatedTime?: string // e.g., "5 minutes"
  assignedRole?: UserRole
  createdAt: Date
  completedAt?: Date
}

/**
 * Wallet Experience Diagnostics
 */
export interface WalletDiagnostics {
  overallStatus: DiagnosticStatus
  diagnostics: WalletDiagnosticItem[]
  lastChecked: Date
  nextCheck?: Date
}

export interface WalletDiagnosticItem {
  id: string
  name: string
  status: DiagnosticStatus
  description: string
  remediationHint?: string
  deepLink?: string
  category: 'compatibility' | 'ux' | 'security' | 'performance'
  details?: string
  lastChecked: Date
}

/**
 * Lifecycle Risk Indicators
 */
export interface LifecycleRiskIndicators {
  concentration: RiskIndicator
  inactivity: RiskIndicator
  unusualActivity: RiskIndicator
  lastUpdated: Date
}

export interface RiskIndicator {
  severity: RiskSeverity
  value: number
  threshold: number
  unit: string
  message: string
  tooltip: string
  trend?: 'increasing' | 'stable' | 'decreasing'
  deepLink?: string
  lastUpdated: Date
}

/**
 * Evidence Traceability for readiness/risk signals
 */
export interface EvidenceTrace {
  signalId: string
  signalType: 'blocker' | 'warning' | 'risk' | 'diagnostic'
  evidenceRefs: EvidenceReference[]
}

export interface EvidenceReference {
  id: string
  type: 'document' | 'transaction' | 'attestation' | 'audit_log'
  title: string
  url: string
  timestamp: Date
  provider?: string
}

/**
 * Role-Based Widget Visibility
 */
export interface RolePermissions {
  role: UserRole
  canViewReadiness: boolean
  canViewTelemetry: boolean
  canViewActions: boolean
  canViewWalletDiagnostics: boolean
  canViewRiskIndicators: boolean
  canViewEvidence: boolean
  canCompleteActions: boolean
  canExportReports: boolean
}

/**
 * Cockpit State
 */
export interface CockpitState {
  userRole: UserRole
  readinessStatus: ReadinessStatus | null
  telemetry: LifecycleTelemetry | null
  actions: GuidedAction[]
  walletDiagnostics: WalletDiagnostics | null
  riskIndicators: LifecycleRiskIndicators | null
  evidenceTraces: EvidenceTrace[]
  isLoading: boolean
  lastRefresh: Date | null
  error: string | null
}

/**
 * Analytics Event Types
 */
export interface CockpitAnalyticsEvent {
  eventType: 'page_view' | 'action_selected' | 'action_completed' | 'widget_expanded' | 'evidence_viewed' | 'export_initiated'
  timestamp: Date
  userId: string
  metadata?: Record<string, unknown>
}
