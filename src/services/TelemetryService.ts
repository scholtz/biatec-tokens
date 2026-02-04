/**
 * Minimal telemetry service for tracking user events
 * Used to monitor wallet connections and platform adoption
 */

export interface TelemetryEvent {
  event: string
  properties?: Record<string, any>
  timestamp: string
}

export class TelemetryService {
  private static instance: TelemetryService
  private events: TelemetryEvent[] = []

  private constructor() {}

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService()
    }
    return TelemetryService.instance
  }

  /**
   * Track a telemetry event
   */
  track(event: string, properties?: Record<string, any>): void {
    const telemetryEvent: TelemetryEvent = {
      event,
      properties,
      timestamp: new Date().toISOString(),
    }

    this.events.push(telemetryEvent)

    // Log to console for visibility
    console.log('[Telemetry]', event, properties)

    // In a production environment, this would send to an analytics service
    // For now, we just store locally and log
  }

  /**
   * Track wallet connection success
   */
  trackWalletConnect(data: {
    walletId: string
    network: string
    address: string
  }): void {
    this.track('wallet_connected', {
      wallet_id: data.walletId,
      network: data.network,
      address_prefix: data.address.slice(0, 6),
    })
  }

  /**
   * Track network switch
   */
  trackNetworkSwitch(data: { fromNetwork: string; toNetwork: string }): void {
    this.track('network_switched', {
      from_network: data.fromNetwork,
      to_network: data.toNetwork,
    })
  }

  /**
   * Track wallet state transition
   */
  trackWalletStateTransition(data: {
    fromState: string
    toState: string
    walletId?: string
    network?: string
  }): void {
    this.track('wallet_state_transition', {
      from_state: data.fromState,
      to_state: data.toState,
      wallet_id: data.walletId,
      network: data.network,
    })
  }

  /**
   * Track wallet detection attempt
   */
  trackWalletDetection(data: {
    walletId: string
    attempt: number
    success: boolean
    errorType?: string
  }): void {
    this.track('wallet_detection', {
      wallet_id: data.walletId,
      attempt: data.attempt,
      success: data.success,
      error_type: data.errorType,
    })
  }

  /**
   * Track wallet connection failure
   */
  trackWalletConnectionFailure(data: {
    walletId?: string
    errorType: string
    errorMessage: string
    diagnosticCode?: string
  }): void {
    this.track('wallet_connection_failure', {
      wallet_id: data.walletId,
      error_type: data.errorType,
      error_message: data.errorMessage,
      diagnostic_code: data.diagnosticCode,
    })
  }

  /**
   * Track network switch failure
   */
  trackNetworkSwitchFailure(data: {
    fromNetwork: string
    toNetwork: string
    errorType: string
    errorMessage: string
  }): void {
    this.track('network_switch_failure', {
      from_network: data.fromNetwork,
      to_network: data.toNetwork,
      error_type: data.errorType,
      error_message: data.errorMessage,
    })
  }

  /**
   * Track balance fetch
   */
  trackBalanceFetch(data: {
    network: string
    address: string
    success: boolean
    durationMs?: number
  }): void {
    this.track('balance_fetch', {
      network: data.network,
      address_prefix: data.address.slice(0, 6),
      success: data.success,
      duration_ms: data.durationMs,
    })
  }

  /**
   * Track login started
   */
  trackLoginStarted(data?: { source?: string }): void {
    this.track('login_started', {
      source: data?.source || 'navbar',
    })
  }

  /**
   * Track login completed
   */
  trackLoginCompleted(data: {
    walletId: string
    network: string
    durationMs?: number
  }): void {
    this.track('login_completed', {
      wallet_id: data.walletId,
      network: data.network,
      duration_ms: data.durationMs,
    })
  }

  /**
   * Track token wizard started
   */
  trackTokenWizardStarted(data?: { 
    source?: string 
    network?: string
  }): void {
    this.track('token_wizard_started', {
      source: data?.source || 'direct',
      network: data?.network,
    })
  }

  /**
   * Track token wizard completed
   */
  trackTokenWizardCompleted(data: {
    tokenStandard: string
    tokenType: string
    network: string
    durationMs?: number
  }): void {
    this.track('token_wizard_completed', {
      token_standard: data.tokenStandard,
      token_type: data.tokenType,
      network: data.network,
      duration_ms: data.durationMs,
    })
  }

  /**
   * Track plan upgrade started
   */
  trackPlanUpgradeStarted(data: {
    fromPlan: string
    toPlan: string
    source?: string
  }): void {
    this.track('plan_upgrade_started', {
      from_plan: data.fromPlan,
      to_plan: data.toPlan,
      source: data.source || 'pricing_page',
    })
  }

  /**
   * Track plan upgrade completed
   */
  trackPlanUpgradeCompleted(data: {
    fromPlan: string
    toPlan: string
    durationMs?: number
  }): void {
    this.track('plan_upgrade_completed', {
      from_plan: data.fromPlan,
      to_plan: data.toPlan,
      duration_ms: data.durationMs,
    })
  }

  /**
   * Track security center viewed
   */
  trackSecurityCenterViewed(data?: {
    source?: string
  }): void {
    this.track('security_center_viewed', {
      source: data?.source || 'account_menu',
    })
  }

  /**
   * Track recovery started
   */
  trackRecoveryStarted(data: {
    recoveryType: string
  }): void {
    this.track('recovery_started', {
      recovery_type: data.recoveryType,
    })
  }

  /**
   * Track audit export started
   */
  trackAuditExportStarted(data: {
    format: string
  }): void {
    this.track('audit_export_started', {
      format: data.format,
    })
  }

  /**
   * Track audit export completed
   */
  trackAuditExportCompleted(data: {
    format: string
    durationMs?: number
    recordCount?: number
  }): void {
    this.track('audit_export_completed', {
      format: data.format,
      duration_ms: data.durationMs,
      record_count: data.recordCount,
    })
  }

  /**
   * Track activity filter applied
   */
  trackActivityFilterApplied(data: {
    filterType: string
    filterValue: string
  }): void {
    this.track('activity_filter_applied', {
      filter_type: data.filterType,
      filter_value: data.filterValue,
    })
  }

  // ========================================
  // ONBOARDING AND DISCOVERY EVENTS
  // ========================================

  /**
   * Track onboarding flow started
   * Emitted when user first lands and sees the onboarding wizard
   */
  trackOnboardingStarted(data?: { source?: string }): void {
    this.track('onboarding_started', {
      source: data?.source || 'landing',
    })
  }

  /**
   * Track onboarding step completed
   * Emitted when user completes each step in the onboarding checklist
   */
  trackOnboardingStepCompleted(data: {
    stepId: string
    stepTitle: string
    stepNumber: number
    totalSteps: number
  }): void {
    this.track('onboarding_step_completed', {
      step_id: data.stepId,
      step_title: data.stepTitle,
      step_number: data.stepNumber,
      total_steps: data.totalSteps,
      progress_percentage: Math.round((data.stepNumber / data.totalSteps) * 100),
    })
  }

  /**
   * Track onboarding completed
   * Emitted when user finishes all required onboarding steps
   */
  trackOnboardingCompleted(data?: { durationMs?: number }): void {
    this.track('onboarding_completed', {
      duration_ms: data?.durationMs,
    })
  }

  /**
   * Track discovery dashboard viewed
   * Emitted when user navigates to the token discovery page
   */
  trackDiscoveryDashboardViewed(data?: { source?: string }): void {
    this.track('discovery_dashboard_viewed', {
      source: data?.source || 'direct',
    })
  }

  /**
   * Track discovery filter applied
   * Emitted when user applies any filter in the discovery dashboard
   */
  trackDiscoveryFilterApplied(data: {
    filterType: 'standard' | 'compliance' | 'liquidity' | 'chain' | 'issuer' | 'other'
    filterValue: string
    filterCount: number
  }): void {
    this.track('discovery_filter_applied', {
      filter_type: data.filterType,
      filter_value: data.filterValue,
      filter_count: data.filterCount,
    })
  }

  /**
   * Track discovery filter saved
   * Emitted when user saves their filter preferences
   */
  trackDiscoveryFilterSaved(data: {
    filterCount: number
    hasStandards: boolean
    hasCompliance: boolean
    hasChains: boolean
  }): void {
    this.track('discovery_filter_saved', {
      filter_count: data.filterCount,
      has_standards: data.hasStandards,
      has_compliance: data.hasCompliance,
      has_chains: data.hasChains,
    })
  }

  /**
   * Track token detail viewed
   * Emitted when user opens a token detail page/drawer
   */
  trackTokenDetailViewed(data: {
    tokenId: string
    tokenStandard: string
    tokenChain: string
    source: 'discovery' | 'dashboard' | 'marketplace' | 'direct'
  }): void {
    this.track('token_detail_viewed', {
      token_id: data.tokenId,
      token_standard: data.tokenStandard,
      token_chain: data.tokenChain,
      source: data.source,
    })
  }

  /**
   * Track watchlist add
   * Emitted when user adds a token to their watchlist
   */
  trackWatchlistAdd(data: {
    tokenId: string
    tokenStandard: string
    source: 'detail' | 'card' | 'discovery'
  }): void {
    this.track('watchlist_add', {
      token_id: data.tokenId,
      token_standard: data.tokenStandard,
      source: data.source,
    })
  }

  /**
   * Track watchlist remove
   * Emitted when user removes a token from their watchlist
   */
  trackWatchlistRemove(data: {
    tokenId: string
    tokenStandard: string
  }): void {
    this.track('watchlist_remove', {
      token_id: data.tokenId,
      token_standard: data.tokenStandard,
    })
  }

  /**
   * Track compliance badge clicked
   * Emitted when user clicks on a compliance badge to view details
   */
  trackComplianceBadgeClicked(data: {
    tokenId: string
    badgeType: string
    complianceStatus: string
  }): void {
    this.track('compliance_badge_clicked', {
      token_id: data.tokenId,
      badge_type: data.badgeType,
      compliance_status: data.complianceStatus,
    })
  }

  /**
   * Track email signup started
   * Emitted when user initiates email-based signup flow
   */
  trackEmailSignupStarted(data?: { source?: string }): void {
    this.track('email_signup_started', {
      source: data?.source || 'landing',
    })
  }

  /**
   * Track email signup completed
   * Emitted when user successfully completes email signup
   */
  trackEmailSignupCompleted(data?: { durationMs?: number }): void {
    this.track('email_signup_completed', {
      duration_ms: data?.durationMs,
    })
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events]
  }

  /**
   * Clear all tracked events
   */
  clearEvents(): void {
    this.events = []
  }
}

export const telemetryService = TelemetryService.getInstance()
