import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TelemetryService, telemetryService } from '../TelemetryService'

describe('TelemetryService', () => {
  let service: TelemetryService

  beforeEach(() => {
    service = TelemetryService.getInstance()
    service.clearEvents()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should be a singleton', () => {
    const instance1 = TelemetryService.getInstance()
    const instance2 = TelemetryService.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should track events', () => {
    service.track('test_event', { foo: 'bar' })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('test_event')
    expect(events[0].properties).toEqual({ foo: 'bar' })
    expect(events[0].timestamp).toBeDefined()
  })

  it('should track wallet connection', () => {
    service.trackWalletConnect({
      walletId: 'pera',
      network: 'voi-mainnet',
      address: 'ALGO123456789ABCDEF',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('wallet_connected')
    expect(events[0].properties?.wallet_id).toBe('pera')
    expect(events[0].properties?.network).toBe('voi-mainnet')
    expect(events[0].properties?.address_prefix).toBe('ALGO12')
  })

  it('should track network switch', () => {
    service.trackNetworkSwitch({
      fromNetwork: 'voi-mainnet',
      toNetwork: 'aramidmain',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('network_switched')
    expect(events[0].properties?.from_network).toBe('voi-mainnet')
    expect(events[0].properties?.to_network).toBe('aramidmain')
  })

  it('should track wallet state transition', () => {
    service.trackWalletStateTransition({
      fromState: 'disconnected',
      toState: 'connecting',
      walletId: 'pera',
      network: 'voi-mainnet',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('wallet_state_transition')
    expect(events[0].properties?.from_state).toBe('disconnected')
    expect(events[0].properties?.to_state).toBe('connecting')
    expect(events[0].properties?.wallet_id).toBe('pera')
    expect(events[0].properties?.network).toBe('voi-mainnet')
  })

  it('should track wallet detection', () => {
    service.trackWalletDetection({
      walletId: 'pera',
      attempt: 1,
      success: true,
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('wallet_detection')
    expect(events[0].properties?.wallet_id).toBe('pera')
    expect(events[0].properties?.attempt).toBe(1)
    expect(events[0].properties?.success).toBe(true)
  })

  it('should track wallet detection failure', () => {
    service.trackWalletDetection({
      walletId: 'pera',
      attempt: 3,
      success: false,
      errorType: 'timeout',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('wallet_detection')
    expect(events[0].properties?.wallet_id).toBe('pera')
    expect(events[0].properties?.attempt).toBe(3)
    expect(events[0].properties?.success).toBe(false)
    expect(events[0].properties?.error_type).toBe('timeout')
  })

  it('should track wallet connection failure', () => {
    service.trackWalletConnectionFailure({
      walletId: 'pera',
      errorType: 'user_rejected',
      errorMessage: 'User rejected the request',
      diagnosticCode: 'ERR_USER_REJECTED',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('wallet_connection_failure')
    expect(events[0].properties?.wallet_id).toBe('pera')
    expect(events[0].properties?.error_type).toBe('user_rejected')
    expect(events[0].properties?.error_message).toBe('User rejected the request')
    expect(events[0].properties?.diagnostic_code).toBe('ERR_USER_REJECTED')
  })

  it('should track wallet connection failure without wallet ID', () => {
    service.trackWalletConnectionFailure({
      errorType: 'network_error',
      errorMessage: 'Network timeout',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('wallet_connection_failure')
    expect(events[0].properties?.wallet_id).toBeUndefined()
    expect(events[0].properties?.error_type).toBe('network_error')
    expect(events[0].properties?.error_message).toBe('Network timeout')
  })

  it('should track network switch failure', () => {
    service.trackNetworkSwitchFailure({
      fromNetwork: 'voi-mainnet',
      toNetwork: 'aramidmain',
      errorType: 'wallet_not_connected',
      errorMessage: 'Wallet not connected to target network',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('network_switch_failure')
    expect(events[0].properties?.from_network).toBe('voi-mainnet')
    expect(events[0].properties?.to_network).toBe('aramidmain')
    expect(events[0].properties?.error_type).toBe('wallet_not_connected')
    expect(events[0].properties?.error_message).toBe('Wallet not connected to target network')
  })

  it('should track balance fetch success', () => {
    service.trackBalanceFetch({
      network: 'voi-mainnet',
      address: 'ALGO123456789ABCDEF',
      success: true,
      durationMs: 150,
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('balance_fetch')
    expect(events[0].properties?.network).toBe('voi-mainnet')
    expect(events[0].properties?.address_prefix).toBe('ALGO12')
    expect(events[0].properties?.success).toBe(true)
    expect(events[0].properties?.duration_ms).toBe(150)
  })

  it('should track balance fetch failure', () => {
    service.trackBalanceFetch({
      network: 'voi-mainnet',
      address: 'ALGO123456789ABCDEF',
      success: false,
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('balance_fetch')
    expect(events[0].properties?.network).toBe('voi-mainnet')
    expect(events[0].properties?.address_prefix).toBe('ALGO12')
    expect(events[0].properties?.success).toBe(false)
    expect(events[0].properties?.duration_ms).toBeUndefined()
  })

  it('should track login started', () => {
    service.trackLoginStarted()

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('login_started')
    expect(events[0].properties?.source).toBe('navbar')
  })

  it('should track login started with custom source', () => {
    service.trackLoginStarted({ source: 'modal' })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('login_started')
    expect(events[0].properties?.source).toBe('modal')
  })

  it('should track login completed', () => {
    service.trackLoginCompleted({
      walletId: 'pera',
      network: 'voi-mainnet',
      durationMs: 2500,
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('login_completed')
    expect(events[0].properties?.wallet_id).toBe('pera')
    expect(events[0].properties?.network).toBe('voi-mainnet')
    expect(events[0].properties?.duration_ms).toBe(2500)
  })

  it('should track token wizard started', () => {
    service.trackTokenWizardStarted()

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('token_wizard_started')
    expect(events[0].properties?.source).toBe('direct')
    expect(events[0].properties?.network).toBeUndefined()
  })

  it('should track token wizard started with custom data', () => {
    service.trackTokenWizardStarted({
      source: 'dashboard',
      network: 'voi-mainnet',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('token_wizard_started')
    expect(events[0].properties?.source).toBe('dashboard')
    expect(events[0].properties?.network).toBe('voi-mainnet')
  })

  it('should track token wizard completed', () => {
    service.trackTokenWizardCompleted({
      tokenStandard: 'ASA',
      tokenType: 'fungible',
      network: 'voi-mainnet',
      durationMs: 5000,
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('token_wizard_completed')
    expect(events[0].properties?.token_standard).toBe('ASA')
    expect(events[0].properties?.token_type).toBe('fungible')
    expect(events[0].properties?.network).toBe('voi-mainnet')
    expect(events[0].properties?.duration_ms).toBe(5000)
  })

  it('should track plan upgrade started', () => {
    service.trackPlanUpgradeStarted({
      fromPlan: 'free',
      toPlan: 'basic',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('plan_upgrade_started')
    expect(events[0].properties?.from_plan).toBe('free')
    expect(events[0].properties?.to_plan).toBe('basic')
    expect(events[0].properties?.source).toBe('pricing_page')
  })

  it('should track plan upgrade started with custom source', () => {
    service.trackPlanUpgradeStarted({
      fromPlan: 'basic',
      toPlan: 'pro',
      source: 'dashboard',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('plan_upgrade_started')
    expect(events[0].properties?.from_plan).toBe('basic')
    expect(events[0].properties?.to_plan).toBe('pro')
    expect(events[0].properties?.source).toBe('dashboard')
  })

  it('should track plan upgrade completed', () => {
    service.trackPlanUpgradeCompleted({
      fromPlan: 'free',
      toPlan: 'basic',
      durationMs: 30000,
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('plan_upgrade_completed')
    expect(events[0].properties?.from_plan).toBe('free')
    expect(events[0].properties?.to_plan).toBe('basic')
    expect(events[0].properties?.duration_ms).toBe(30000)
  })

  it('should track security center viewed', () => {
    service.trackSecurityCenterViewed()

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('security_center_viewed')
    expect(events[0].properties?.source).toBe('account_menu')
  })

  it('should track security center viewed with custom source', () => {
    service.trackSecurityCenterViewed({ source: 'notification' })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('security_center_viewed')
    expect(events[0].properties?.source).toBe('notification')
  })

  it('should track recovery started', () => {
    service.trackRecoveryStarted({
      recoveryType: 'seed_phrase',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('recovery_started')
    expect(events[0].properties?.recovery_type).toBe('seed_phrase')
  })

  it('should track audit export started', () => {
    service.trackAuditExportStarted({
      format: 'csv',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('audit_export_started')
    expect(events[0].properties?.format).toBe('csv')
  })

  it('should track audit export completed', () => {
    service.trackAuditExportCompleted({
      format: 'json',
      durationMs: 1500,
      recordCount: 250,
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('audit_export_completed')
    expect(events[0].properties?.format).toBe('json')
    expect(events[0].properties?.duration_ms).toBe(1500)
    expect(events[0].properties?.record_count).toBe(250)
  })

  it('should track activity filter applied', () => {
    service.trackActivityFilterApplied({
      filterType: 'status',
      filterValue: 'completed',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('activity_filter_applied')
    expect(events[0].properties?.filter_type).toBe('status')
    expect(events[0].properties?.filter_value).toBe('completed')
  })

  it('should log events to console', () => {
    service.track('test_event', { data: 'value' })

    expect(console.log).toHaveBeenCalledWith(
      '[Telemetry]',
      'test_event',
      { data: 'value' }
    )
  })

  it('should clear events', () => {
    service.track('event1')
    service.track('event2')
    expect(service.getEvents()).toHaveLength(2)

    service.clearEvents()
    expect(service.getEvents()).toHaveLength(0)
  })

  it('should include timestamp in all events', () => {
    const beforeTime = new Date().toISOString()
    service.track('timed_event')
    const afterTime = new Date().toISOString()

    const events = service.getEvents()
    expect(events[0].timestamp).toBeDefined()
    expect(events[0].timestamp >= beforeTime).toBe(true)
    expect(events[0].timestamp <= afterTime).toBe(true)
  })

  it('should export singleton instance', () => {
    expect(telemetryService).toBeInstanceOf(TelemetryService)
    expect(telemetryService).toBe(TelemetryService.getInstance())
  })

  it('should track token wizard abandoned', () => {
    service.trackTokenWizardAbandoned({ lastStep: 3, totalSteps: 5, tokenStandard: 'ARC3', network: 'algorand' })
    const events = service.getEvents()
    expect(events[0].event).toBe('token_wizard_abandoned')
    expect(events[0].properties?.last_step).toBe(3)
    expect(events[0].properties?.total_steps).toBe(5)
    expect(events[0].properties?.progress_percentage).toBe(60)
    expect(events[0].properties?.token_standard).toBe('ARC3')
    expect(events[0].properties?.network).toBe('algorand')
  })

  it('should track token list viewed without data', () => {
    service.trackTokenListViewed()
    const events = service.getEvents()
    expect(events[0].event).toBe('token_list_viewed')
    expect(events[0].properties?.filter_applied).toBe(false)
    expect(events[0].properties?.source).toBe('dashboard')
  })

  it('should track token list viewed with data', () => {
    service.trackTokenListViewed({ filterApplied: true, tokenCount: 5, source: 'search' })
    const events = service.getEvents()
    expect(events[0].properties?.filter_applied).toBe(true)
    expect(events[0].properties?.token_count).toBe(5)
    expect(events[0].properties?.source).toBe('search')
  })

  it('should track token creation attempt', () => {
    service.trackTokenCreationAttempt({ tokenStandard: 'ERC20', network: 'ethereum', tokenType: 'fungible' })
    const events = service.getEvents()
    expect(events[0].event).toBe('token_creation_attempt')
    expect(events[0].properties?.token_standard).toBe('ERC20')
    expect(events[0].properties?.token_type).toBe('fungible')
  })

  it('should track token creation success', () => {
    service.trackTokenCreationSuccess({ tokenId: 'tok1', tokenStandard: 'ARC3', network: 'voi', durationMs: 1200 })
    const events = service.getEvents()
    expect(events[0].event).toBe('token_creation_success')
    expect(events[0].properties?.token_id).toBe('tok1')
    expect(events[0].properties?.duration_ms).toBe(1200)
  })

  it('should track token creation failure', () => {
    service.trackTokenCreationFailure({ tokenStandard: 'ARC69', network: 'algorand', errorType: 'validation', errorMessage: 'missing name' })
    const events = service.getEvents()
    expect(events[0].event).toBe('token_creation_failure')
    expect(events[0].properties?.error_type).toBe('validation')
  })

  it('should track token transfer initiated', () => {
    service.trackTokenTransferInitiated({ tokenId: 'tok2', tokenStandard: 'ARC3', network: 'voi' })
    const events = service.getEvents()
    expect(events[0].event).toBe('token_transfer_initiated')
    expect(events[0].properties?.token_id).toBe('tok2')
  })

  it('should track token transfer success', () => {
    service.trackTokenTransferSuccess({ tokenId: 'tok3', transactionId: 'tx1', network: 'algorand', durationMs: 800 })
    const events = service.getEvents()
    expect(events[0].event).toBe('token_transfer_success')
    expect(events[0].properties?.transaction_id).toBe('tx1')
  })

  it('should track token standards comparison viewed without source', () => {
    service.trackTokenStandardsComparisonViewed()
    const events = service.getEvents()
    expect(events[0].event).toBe('token_standards_comparison_viewed')
    expect(events[0].properties?.source).toBe('direct')
  })

  it('should track token standards comparison viewed with source', () => {
    service.trackTokenStandardsComparisonViewed({ source: 'navbar' })
    const events = service.getEvents()
    expect(events[0].properties?.source).toBe('navbar')
  })

  it('should track token metadata updated', () => {
    service.trackTokenMetadataUpdated({ tokenId: 'tok4', tokenStandard: 'ARC3', fieldsUpdated: ['name', 'symbol'] })
    const events = service.getEvents()
    expect(events[0].event).toBe('token_metadata_updated')
    expect(events[0].properties?.fields_updated).toBe('name,symbol')
    expect(events[0].properties?.field_count).toBe(2)
  })

  it('should track deployment status check', () => {
    service.trackDeploymentStatusCheck({ transactionId: 'tx5', network: 'ethereum', status: 'pending' })
    const events = service.getEvents()
    expect(events[0].event).toBe('deployment_status_check')
    expect(events[0].properties?.status).toBe('pending')
  })

  it('should track transaction success', () => {
    service.trackTransactionSuccess({ transactionType: 'deploy', transactionId: 'tx6', network: 'base', durationMs: 2000 })
    const events = service.getEvents()
    expect(events[0].event).toBe('transaction_success')
    expect(events[0].properties?.transaction_type).toBe('deploy')
  })

  it('should track transaction failure', () => {
    service.trackTransactionFailure({ transactionType: 'transfer', network: 'arbitrum', errorType: 'timeout', errorMessage: 'timed out' })
    const events = service.getEvents()
    expect(events[0].event).toBe('transaction_failure')
    expect(events[0].properties?.error_type).toBe('timeout')
  })

  it('should track onboarding started without data', () => {
    service.trackOnboardingStarted()
    const events = service.getEvents()
    expect(events[0].event).toBe('onboarding_started')
    expect(events[0].properties?.source).toBe('landing')
  })

  it('should track onboarding started with source', () => {
    service.trackOnboardingStarted({ source: 'email' })
    const events = service.getEvents()
    expect(events[0].properties?.source).toBe('email')
  })

  it('should track onboarding step completed', () => {
    service.trackOnboardingStepCompleted({ stepId: 'kyc', stepTitle: 'KYC', stepNumber: 2, totalSteps: 4 })
    const events = service.getEvents()
    expect(events[0].event).toBe('onboarding_step_completed')
    expect(events[0].properties?.progress_percentage).toBe(50)
    expect(events[0].properties?.step_id).toBe('kyc')
  })

  it('should track onboarding completed without data', () => {
    service.trackOnboardingCompleted()
    const events = service.getEvents()
    expect(events[0].event).toBe('onboarding_completed')
  })

  it('should track onboarding completed with duration', () => {
    service.trackOnboardingCompleted({ durationMs: 5000 })
    const events = service.getEvents()
    expect(events[0].properties?.duration_ms).toBe(5000)
  })

  it('should track discovery dashboard viewed without source', () => {
    service.trackDiscoveryDashboardViewed()
    const events = service.getEvents()
    expect(events[0].event).toBe('discovery_dashboard_viewed')
    expect(events[0].properties?.source).toBe('direct')
  })

  it('should track discovery dashboard viewed with source', () => {
    service.trackDiscoveryDashboardViewed({ source: 'navbar' })
    const events = service.getEvents()
    expect(events[0].properties?.source).toBe('navbar')
  })

  it('should track discovery filter applied', () => {
    service.trackDiscoveryFilterApplied({ filterType: 'standard', filterValue: 'ARC3', filterCount: 1 })
    const events = service.getEvents()
    expect(events[0].event).toBe('discovery_filter_applied')
    expect(events[0].properties?.filter_type).toBe('standard')
    expect(events[0].properties?.filter_count).toBe(1)
  })

  it('should track discovery filter saved', () => {
    service.trackDiscoveryFilterSaved({ filterCount: 3, hasStandards: true, hasCompliance: false, hasChains: true })
    const events = service.getEvents()
    expect(events[0].event).toBe('discovery_filter_saved')
    expect(events[0].properties?.has_standards).toBe(true)
    expect(events[0].properties?.has_compliance).toBe(false)
  })

  it('should track token detail viewed', () => {
    service.trackTokenDetailViewed({ tokenId: 'tok7', tokenStandard: 'ARC69', tokenChain: 'algorand', source: 'discovery' })
    const events = service.getEvents()
    expect(events[0].event).toBe('token_detail_viewed')
    expect(events[0].properties?.source).toBe('discovery')
  })

  it('should track watchlist add', () => {
    service.trackWatchlistAdd({ tokenId: 'tok8', tokenStandard: 'ARC3', source: 'card' })
    const events = service.getEvents()
    expect(events[0].event).toBe('watchlist_add')
    expect(events[0].properties?.source).toBe('card')
  })

  it('should track watchlist remove', () => {
    service.trackWatchlistRemove({ tokenId: 'tok9', tokenStandard: 'ERC721' })
    const events = service.getEvents()
    expect(events[0].event).toBe('watchlist_remove')
    expect(events[0].properties?.token_standard).toBe('ERC721')
  })

  it('should track compliance badge clicked', () => {
    service.trackComplianceBadgeClicked({ tokenId: 'tok10', badgeType: 'mica', complianceStatus: 'compliant' })
    const events = service.getEvents()
    expect(events[0].event).toBe('compliance_badge_clicked')
    expect(events[0].properties?.badge_type).toBe('mica')
    expect(events[0].properties?.compliance_status).toBe('compliant')
  })

  it('should track email signup started without source', () => {
    service.trackEmailSignupStarted()
    const events = service.getEvents()
    expect(events[0].event).toBe('email_signup_started')
    expect(events[0].properties?.source).toBe('landing')
  })

  it('should track email signup started with source', () => {
    service.trackEmailSignupStarted({ source: 'modal' })
    const events = service.getEvents()
    expect(events[0].properties?.source).toBe('modal')
  })

  it('should track email signup completed without data', () => {
    service.trackEmailSignupCompleted()
    const events = service.getEvents()
    expect(events[0].event).toBe('email_signup_completed')
  })

  it('should track email signup completed with duration', () => {
    service.trackEmailSignupCompleted({ durationMs: 3000 })
    const events = service.getEvents()
    expect(events[0].properties?.duration_ms).toBe(3000)
  })
})
