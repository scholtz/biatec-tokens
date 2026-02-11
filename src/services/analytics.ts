/**
 * Analytics Service for Token Creation Wizard
 * 
 * Provides event tracking for wizard interactions, completion funnel,
 * and user behavior analytics. Integrates with Google Analytics or
 * other analytics providers.
 * 
 * Business Value: Enables data-driven optimization of the wizard flow,
 * identifies drop-off points, and measures conversion rates.
 */

export interface AnalyticsEvent {
  event: string
  category?: string
  action?: string
  label?: string
  value?: number
  [key: string]: any
}

export interface WizardAnalyticsData {
  stepIndex: number
  stepId: string
  stepTitle: string
  timestamp?: string
  sessionId?: string
}

export interface TokenCreationAnalyticsData {
  tokenName?: string
  tokenSymbol?: string
  standard?: string
  network?: string
  complianceScore?: number
  selectedPlan?: string
  timestamp?: string
}

class AnalyticsService {
  private sessionId: string
  private isEnabled: boolean
  private trackingId: string | null

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = this.checkIfEnabled()
    this.trackingId = import.meta.env.VITE_GA_TRACKING_ID || null
    
    if (this.isEnabled && this.trackingId) {
      this.initializeGoogleAnalytics()
    }
  }

  /**
   * Generate a unique session ID for tracking user journey
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Check if analytics tracking is enabled
   */
  private checkIfEnabled(): boolean {
    // Check if user has consented to tracking
    const consent = localStorage.getItem('analytics_consent')
    return consent === 'true' || consent === null // Default to enabled if not set
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGoogleAnalytics(): void {
    if (typeof window === 'undefined' || !this.trackingId) return

    // Check if gtag is already loaded
    if ((window as any).gtag) {
      console.log('[Analytics] Google Analytics already initialized')
      return
    }

    // Load gtag script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`
    document.head.appendChild(script)

    // Initialize gtag
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).gtag = function () {
      ;(window as any).dataLayer.push(arguments)
    }
    ;(window as any).gtag('js', new Date())
    ;(window as any).gtag('config', this.trackingId, {
      send_page_view: false, // We'll send page views manually
    })

    console.log('[Analytics] Google Analytics initialized:', this.trackingId)
  }

  /**
   * Track a generic event
   */
  trackEvent(eventData: AnalyticsEvent): void {
    if (!this.isEnabled) {
      console.log('[Analytics] Tracking disabled, event not sent:', eventData)
      return
    }

    // Add session ID to all events
    const enrichedData = {
      ...eventData,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    }

    // Console logging for development
    console.log('[Analytics Event]', enrichedData)

    // Send to Google Analytics if available
    if ((window as any).gtag) {
      ;(window as any).gtag('event', eventData.event, {
        event_category: eventData.category,
        event_action: eventData.action,
        event_label: eventData.label,
        value: eventData.value,
        ...eventData,
      })
    }

    // Send to other analytics providers here (Mixpanel, Amplitude, etc.)
  }

  /**
   * Track wizard step viewed
   */
  trackWizardStepViewed(data: WizardAnalyticsData): void {
    this.trackEvent({
      event: 'wizard_step_viewed',
      category: 'Wizard',
      action: 'Step Viewed',
      label: data.stepTitle,
      ...data,
    })
  }

  /**
   * Track wizard step completed
   */
  trackWizardStepCompleted(data: WizardAnalyticsData): void {
    this.trackEvent({
      event: 'wizard_step_completed',
      category: 'Wizard',
      action: 'Step Completed',
      label: data.stepTitle,
      ...data,
    })
  }

  /**
   * Track wizard step validation error
   */
  trackWizardValidationError(data: WizardAnalyticsData & { errors: string[] }): void {
    this.trackEvent({
      event: 'wizard_validation_error',
      category: 'Wizard',
      action: 'Validation Error',
      label: data.stepTitle,
      ...data,
    })
  }

  /**
   * Track wizard started
   */
  trackWizardStarted(userEmail?: string): void {
    this.trackEvent({
      event: 'wizard_started',
      category: 'Wizard',
      action: 'Started',
      userEmail,
    })
  }

  /**
   * Track wizard completed
   */
  trackWizardCompleted(data: TokenCreationAnalyticsData): void {
    this.trackEvent({
      event: 'wizard_completed',
      category: 'Wizard',
      action: 'Completed',
      label: data.tokenName,
      ...data,
    })
  }

  /**
   * Track wizard abandoned (user left before completing)
   */
  trackWizardAbandoned(currentStep: number, totalSteps: number): void {
    this.trackEvent({
      event: 'wizard_abandoned',
      category: 'Wizard',
      action: 'Abandoned',
      currentStep,
      totalSteps,
      completionPercentage: (currentStep / totalSteps) * 100,
    })
  }

  /**
   * Track draft saved
   */
  trackDraftSaved(data: { stepIndex: number; tokenName?: string }): void {
    this.trackEvent({
      event: 'wizard_draft_saved',
      category: 'Wizard',
      action: 'Draft Saved',
      ...data,
    })
  }

  /**
   * Track subscription plan selected
   */
  trackPlanSelected(plan: string): void {
    this.trackEvent({
      event: 'subscription_plan_selected',
      category: 'Subscription',
      action: 'Plan Selected',
      label: plan,
      plan,
    })
  }

  /**
   * Track token creation attempt (before deployment)
   */
  trackTokenCreationAttempt(data: Partial<TokenCreationAnalyticsData>): void {
    this.trackEvent({
      event: 'token_creation_attempt',
      category: 'Token Creation',
      action: 'Attempt',
      ...data,
    })
  }

  /**
   * Track token creation success
   */
  trackTokenCreationSuccess(data: TokenCreationAnalyticsData): void {
    this.trackEvent({
      event: 'token_creation_success',
      category: 'Token Creation',
      action: 'Success',
      label: data.tokenName,
      ...data,
    })
  }

  /**
   * Track token creation failure
   */
  trackTokenCreationFailure(data: TokenCreationAnalyticsData & { error: string }): void {
    this.trackEvent({
      event: 'token_creation_failure',
      category: 'Token Creation',
      action: 'Failure',
      label: data.error,
      ...data,
    })
  }

  /**
   * Track network selected
   */
  trackNetworkSelected(network: string): void {
    this.trackEvent({
      event: 'network_selected',
      category: 'Token Configuration',
      action: 'Network Selected',
      label: network,
      network,
    })
  }

  /**
   * Track token standard selected
   */
  trackStandardSelected(standard: string, network: string): void {
    this.trackEvent({
      event: 'standard_selected',
      category: 'Token Configuration',
      action: 'Standard Selected',
      label: standard,
      standard,
      network,
    })
  }

  /**
   * Track compliance checklist interaction
   */
  trackComplianceChecklistUpdate(itemId: string, completed: boolean, completionPercentage: number): void {
    this.trackEvent({
      event: 'compliance_checklist_update',
      category: 'Compliance',
      action: completed ? 'Item Completed' : 'Item Unchecked',
      label: itemId,
      completionPercentage,
    })
  }

  /**
   * Track metadata mode toggle
   */
  trackMetadataModeToggle(mode: 'guided' | 'json'): void {
    this.trackEvent({
      event: 'metadata_mode_toggle',
      category: 'Metadata',
      action: 'Mode Changed',
      label: mode,
      mode,
    })
  }

  /**
   * Enable/disable analytics tracking
   */
  setTrackingEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    localStorage.setItem('analytics_consent', enabled ? 'true' : 'false')
    console.log('[Analytics] Tracking', enabled ? 'enabled' : 'disabled')
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Check if tracking is enabled
   */
  isTrackingEnabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()

// Export for testing
export { AnalyticsService }
