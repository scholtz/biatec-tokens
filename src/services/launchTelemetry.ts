/**
 * Telemetry service for guided token launch activation tracking
 * 
 * Emits events for conversion funnel analysis and user behavior insights.
 * No wallet connector references - email/password authentication only.
 */

import { LaunchEventType, type LaunchTelemetryEvent } from '../types/guidedLaunch'

class LaunchTelemetryService {
  private sessionId: string
  private userId: string | null = null
  private events: LaunchTelemetryEvent[] = []

  constructor() {
    // Generate session ID on initialization
    this.sessionId = this.generateSessionId()
  }

  /**
   * Initialize telemetry with user identification
   */
  initialize(userId: string) {
    this.userId = userId
  }

  /**
   * Track flow started
   */
  trackFlowStarted(data: { referrer?: string; source?: string } = {}) {
    this.trackEvent(LaunchEventType.FLOW_STARTED, data)
  }

  /**
   * Track step started
   */
  trackStepStarted(stepId: string, stepTitle: string, stepIndex: number) {
    this.trackEvent(LaunchEventType.STEP_STARTED, {
      stepId,
      stepTitle,
      stepIndex,
    })
  }

  /**
   * Track step completed
   */
  trackStepCompleted(
    stepId: string,
    stepTitle: string,
    stepIndex: number,
    timeSpentSeconds: number
  ) {
    this.trackEvent(LaunchEventType.STEP_COMPLETED, {
      stepId,
      stepTitle,
      stepIndex,
      timeSpentSeconds,
    })
  }

  /**
   * Track step validation failed
   */
  trackValidationFailed(
    stepId: string,
    stepTitle: string,
    errors: string[],
    warnings: string[]
  ) {
    this.trackEvent(LaunchEventType.STEP_VALIDATION_FAILED, {
      stepId,
      stepTitle,
      errors,
      warnings,
      errorCount: errors.length,
      warningCount: warnings.length,
    })
  }

  /**
   * Track draft saved
   */
  trackDraftSaved(draftId: string, completedSteps: number, totalSteps: number) {
    this.trackEvent(LaunchEventType.DRAFT_SAVED, {
      draftId,
      completedSteps,
      totalSteps,
      progressPercentage: Math.round((completedSteps / totalSteps) * 100),
    })
  }

  /**
   * Track draft resumed
   */
  trackDraftResumed(draftId: string, lastModified: Date, daysSinceModified: number) {
    this.trackEvent(LaunchEventType.DRAFT_RESUMED, {
      draftId,
      lastModified: lastModified.toISOString(),
      daysSinceModified,
    })
  }

  /**
   * Track launch submitted
   */
  trackLaunchSubmitted(data: {
    templateId: string
    standard: string
    network: string
    complianceLevel: string
    hasMICA: boolean
    hasKYC: boolean
  }) {
    this.trackEvent(LaunchEventType.LAUNCH_SUBMITTED, data)
  }

  /**
   * Track launch success
   */
  trackLaunchSuccess(submissionId: string, tokenId: string, timeToComplete: number) {
    this.trackEvent(LaunchEventType.LAUNCH_SUCCESS, {
      submissionId,
      tokenId,
      timeToCompleteMinutes: Math.round(timeToComplete / 60),
    })
  }

  /**
   * Track launch failed
   */
  trackLaunchFailed(submissionId: string, error: string, retryable: boolean) {
    this.trackEvent(LaunchEventType.LAUNCH_FAILED, {
      submissionId,
      error,
      retryable,
    })
  }

  /**
   * Track flow abandoned
   */
  trackFlowAbandoned(lastStep: string, completedSteps: number, totalSteps: number) {
    this.trackEvent(LaunchEventType.FLOW_ABANDONED, {
      lastStep,
      completedSteps,
      totalSteps,
      progressPercentage: Math.round((completedSteps / totalSteps) * 100),
    })
  }

  /**
   * Core event tracking method
   */
  private trackEvent(type: LaunchEventType, data: Record<string, any>) {
    if (!this.userId) {
      console.warn('Telemetry: User ID not set, event will be queued')
    }

    const event: LaunchTelemetryEvent = {
      type,
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date(),
      data,
    }

    this.events.push(event)
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Telemetry]', type, data)
    }

    // TODO: Send to backend analytics service
    // await analyticsAPI.trackEvent(event)
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get all recorded events (for debugging)
   */
  getEvents(): LaunchTelemetryEvent[] {
    return [...this.events]
  }

  /**
   * Clear events (for testing)
   */
  clearEvents() {
    this.events = []
  }
}

// Export singleton instance
export const launchTelemetryService = new LaunchTelemetryService()
