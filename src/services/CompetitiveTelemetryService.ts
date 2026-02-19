/**
 * Competitive Telemetry Service
 * 
 * Unified telemetry system for tracking competitive advantage metrics:
 * - Token creation flow completion rates
 * - Standards selection patterns
 * - Compliance checkpoint success rates
 * - Deployment status visibility and error recovery
 * - Post-deployment engagement
 * 
 * Business Value: Provides actionable data to improve conversion, reduce abandonment,
 * and optimize user journeys compared to competitors.
 */

import { analyticsService } from './analytics';

export interface CompetitiveMetric {
  category: 'conversion' | 'engagement' | 'quality' | 'performance';
  metric: string;
  value: number;
  context?: Record<string, unknown>;
}

export interface UserJourneyMilestone {
  journey: string;
  milestone: string;
  timestamp: Date;
  duration?: number; // milliseconds from journey start
  metadata?: Record<string, unknown>;
}

export interface FeatureDiscoveryEvent {
  feature: string;
  discovered: boolean;
  timeToDiscovery?: number; // seconds
  context?: string;
}

export interface ErrorRecoveryEvent {
  errorType: string;
  stage: string;
  recovered: boolean;
  recoveryMethod?: 'retry' | 'edit' | 'support' | 'abandon';
  timeToRecover?: number; // seconds
}

export interface ComplianceCheckpoint {
  checkpoint: string;
  passed: boolean;
  blockers?: string[];
  recommendedActions?: string[];
  complianceScore?: number;
}

export interface PostDeploymentActivity {
  tokenId: string;
  activity: 'view_details' | 'share' | 'manage_whitelist' | 'update_metadata' | 'view_explorer';
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class CompetitiveTelemetryService {
  private static instance: CompetitiveTelemetryService;
  private journeyStartTimes: Map<string, number> = new Map();
  private featureInteractions: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): CompetitiveTelemetryService {
    if (!CompetitiveTelemetryService.instance) {
      CompetitiveTelemetryService.instance = new CompetitiveTelemetryService();
    }
    return CompetitiveTelemetryService.instance;
  }

  /**
   * Track journey start
   */
  startJourney(journey: string, metadata?: Record<string, unknown>): void {
    const startTime = Date.now();
    this.journeyStartTimes.set(journey, startTime);

    analyticsService.trackEvent({
      event: 'journey_started',
      category: 'Competitive',
      action: 'Journey',
      label: journey,
      journey,
      metadata,
    });
  }

  /**
   * Track journey milestone
   */
  trackMilestone(data: UserJourneyMilestone): void {
    const journeyStart = this.journeyStartTimes.get(data.journey);
    const duration = journeyStart ? Date.now() - journeyStart : undefined;

    analyticsService.trackEvent({
      event: 'journey_milestone',
      category: 'Competitive',
      action: 'Milestone',
      label: `${data.journey} - ${data.milestone}`,
      journey: data.journey,
      milestone: data.milestone,
      duration,
      metadata: data.metadata,
    });
  }

  /**
   * Track journey completion
   */
  completeJourney(journey: string, success: boolean, metadata?: Record<string, unknown>): void {
    const journeyStart = this.journeyStartTimes.get(journey);
    const duration = journeyStart ? Date.now() - journeyStart : undefined;

    analyticsService.trackEvent({
      event: success ? 'journey_completed' : 'journey_abandoned',
      category: 'Competitive',
      action: success ? 'Complete' : 'Abandon',
      label: journey,
      journey,
      duration,
      success,
      metadata,
    });

    // Clean up journey start time
    this.journeyStartTimes.delete(journey);
  }

  /**
   * Track feature discovery (competitive advantage: time to discover key features)
   */
  trackFeatureDiscovery(data: FeatureDiscoveryEvent): void {
    if (data.discovered && !this.featureInteractions.has(data.feature)) {
      this.featureInteractions.set(data.feature, Date.now());
    }

    analyticsService.trackEvent({
      event: 'feature_discovered',
      category: 'Competitive',
      action: 'Discovery',
      label: data.feature,
      feature: data.feature,
      timeToDiscovery: data.timeToDiscovery,
      context: data.context,
    });
  }

  /**
   * Track error recovery (competitive advantage: self-service error resolution)
   */
  trackErrorRecovery(data: ErrorRecoveryEvent): void {
    analyticsService.trackEvent({
      event: data.recovered ? 'error_recovered' : 'error_abandoned',
      category: 'Competitive',
      action: 'Error',
      label: data.errorType,
      errorType: data.errorType,
      stage: data.stage,
      recovered: data.recovered,
      recoveryMethod: data.recoveryMethod,
      timeToRecover: data.timeToRecover,
    });
  }

  /**
   * Track compliance checkpoint (competitive advantage: proactive compliance guidance)
   */
  trackComplianceCheckpoint(data: ComplianceCheckpoint): void {
    analyticsService.trackEvent({
      event: 'compliance_checkpoint',
      category: 'Competitive',
      action: data.passed ? 'Passed' : 'Blocked',
      label: data.checkpoint,
      checkpoint: data.checkpoint,
      passed: data.passed,
      blockers: data.blockers,
      recommendedActions: data.recommendedActions,
      complianceScore: data.complianceScore,
    });
  }

  /**
   * Track post-deployment activity (competitive advantage: sustained engagement)
   */
  trackPostDeploymentActivity(data: PostDeploymentActivity): void {
    analyticsService.trackEvent({
      event: 'post_deployment_activity',
      category: 'Competitive',
      action: 'Engagement',
      label: data.activity,
      tokenId: data.tokenId,
      activity: data.activity,
      context: data.context,
    });
  }

  /**
   * Track deployment status visibility (competitive advantage: clear progress feedback)
   */
  trackDeploymentStatusVisibility(data: {
    stage: string;
    status: string;
    progress?: number;
    timeInStage?: number;
    userInteraction?: 'viewed' | 'refreshed' | 'abandoned';
  }): void {
    analyticsService.trackEvent({
      event: 'deployment_status_viewed',
      category: 'Competitive',
      action: 'Status',
      label: `${data.stage} - ${data.status}`,
      stage: data.stage,
      status: data.status,
      progress: data.progress,
      timeInStage: data.timeInStage,
      userInteraction: data.userInteraction,
    });
  }

  /**
   * Track standards comparison usage (competitive advantage: informed decision making)
   */
  trackStandardsComparison(data: {
    standardsCompared: string[];
    selectedStandard?: string;
    comparisonFeatures?: string[];
    timeSpent?: number;
  }): void {
    analyticsService.trackEvent({
      event: 'standards_compared',
      category: 'Competitive',
      action: 'Compare',
      label: data.standardsCompared.join(' vs '),
      standardsCompared: data.standardsCompared,
      selectedStandard: data.selectedStandard,
      comparisonFeatures: data.comparisonFeatures,
      timeSpent: data.timeSpent,
    });
  }

  /**
   * Track competitive metric
   */
  trackMetric(data: CompetitiveMetric): void {
    analyticsService.trackEvent({
      event: 'competitive_metric',
      category: data.category,
      action: 'Metric',
      label: data.metric,
      value: data.value,
      metric: data.metric,
      context: data.context,
    });
  }

  /**
   * Get conversion funnel metrics
   */
  getConversionFunnelMetrics(): {
    journeyStarted: number;
    milestonesReached: Map<string, number>;
    journeysCompleted: number;
    journeysAbandoned: number;
    conversionRate: number;
  } {
    // This would query accumulated analytics data
    // For now, return structure showing what's tracked
    return {
      journeyStarted: this.journeyStartTimes.size,
      milestonesReached: new Map(),
      journeysCompleted: 0,
      journeysAbandoned: 0,
      conversionRate: 0,
    };
  }

  /**
   * Reset journey tracking (useful for testing)
   */
  resetJourneys(): void {
    this.journeyStartTimes.clear();
  }

  /**
   * Reset feature interactions (useful for testing)
   */
  resetFeatureInteractions(): void {
    this.featureInteractions.clear();
  }
}

// Export singleton instance
export const competitiveTelemetryService = CompetitiveTelemetryService.getInstance();
