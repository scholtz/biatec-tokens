/**
 * Conversion Funnel Tracking Helpers
 * 
 * Provides utilities for tracking user conversion through the token discovery
 * and wallet activation journey.
 */

import { analyticsService } from '../services/analytics';
import { CompetitiveTelemetryService } from '../services/CompetitiveTelemetryService';

export interface ConversionEvent {
  event: string;
  category: string;
  action: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface FunnelStep {
  name: string;
  category: 'discovery' | 'comparison' | 'activation' | 'creation';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const telemetryService = CompetitiveTelemetryService.getInstance();

/**
 * Track funnel entry event
 */
export function trackFunnelEntry(
  funnel: 'discovery' | 'comparison' | 'activation',
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: `${funnel}_entry`,
    category: 'Conversion',
    action: 'Entry',
    label: funnel,
    metadata,
  };

  analyticsService.trackEvent(event);
  telemetryService.startJourney(funnel, metadata);
}

/**
 * Track funnel milestone
 */
export function trackFunnelMilestone(
  funnel: string,
  milestone: string,
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: `${funnel}_${milestone}`,
    category: 'Conversion',
    action: 'Milestone',
    label: milestone,
    metadata,
  };

  analyticsService.trackEvent(event);
  telemetryService.trackMilestone({
    journey: funnel,
    milestone,
    timestamp: new Date(),
    metadata,
  });
}

/**
 * Track funnel completion
 */
export function trackFunnelCompletion(
  funnel: string,
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: `${funnel}_complete`,
    category: 'Conversion',
    action: 'Complete',
    label: funnel,
    metadata,
  };

  analyticsService.trackEvent(event);
  telemetryService.trackMilestone({
    journey: funnel,
    milestone: 'completion',
    timestamp: new Date(),
    metadata,
  });
}

/**
 * Track funnel abandonment
 */
export function trackFunnelAbandonment(
  funnel: string,
  step: string,
  reason?: string,
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: `${funnel}_abandoned`,
    category: 'Conversion',
    action: 'Abandon',
    label: step,
    metadata: {
      ...metadata,
      reason,
    },
  };

  analyticsService.trackEvent(event);
  telemetryService.trackErrorRecovery({
    errorType: 'funnel_abandonment',
    stage: step,
    recovered: false,
    recoveryMethod: 'abandon',
  });
}

/**
 * Track CTA click
 */
export function trackCTAClick(
  cta: string,
  context: string,
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: 'cta_click',
    category: 'Conversion',
    action: 'CTA',
    label: cta,
    metadata: {
      ...metadata,
      context,
    },
  };

  analyticsService.trackEvent(event);
}

/**
 * Track wallet connection attempt
 */
export function trackWalletConnectAttempt(
  method: string,
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: 'wallet_connect_attempt',
    category: 'Conversion',
    action: 'WalletConnect',
    label: method,
    metadata,
  };

  analyticsService.trackEvent(event);
}

/**
 * Track wallet connection success
 */
export function trackWalletConnectSuccess(
  method: string,
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: 'wallet_connect_success',
    category: 'Conversion',
    action: 'WalletConnect',
    label: 'success',
    metadata: {
      ...metadata,
      method,
    },
  };

  analyticsService.trackEvent(event);
}

/**
 * Track wallet connection failure
 */
export function trackWalletConnectFailure(
  method: string,
  error: string,
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: 'wallet_connect_failure',
    category: 'Conversion',
    action: 'WalletConnect',
    label: 'failure',
    metadata: {
      ...metadata,
      method,
      error,
    },
  };

  analyticsService.trackEvent(event);
  
  telemetryService.trackErrorRecovery({
    errorType: 'wallet_connection_failed',
    stage: 'activation',
    recovered: false,
  });
}

/**
 * Track standards comparison interaction
 */
export function trackStandardsComparison(
  action: 'view' | 'compare' | 'select',
  standards: string[],
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    event: 'standards_comparison',
    category: 'Conversion',
    action: 'Comparison',
    label: action,
    metadata: {
      ...metadata,
      standards,
      standardCount: standards.length,
    },
  };

  analyticsService.trackEvent(event);
}

/**
 * Calculate conversion rate for a funnel
 */
export function calculateConversionRate(
  totalEntries: number,
  completions: number
): number {
  if (totalEntries === 0) return 0;
  return (completions / totalEntries) * 100;
}
