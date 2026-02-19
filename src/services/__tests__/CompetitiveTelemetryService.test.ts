/**
 * Tests for CompetitiveTelemetryService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompetitiveTelemetryService } from '../CompetitiveTelemetryService';
import { analyticsService } from '../analytics';

// Mock analytics service
vi.mock('../analytics', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  },
}));

describe('CompetitiveTelemetryService', () => {
  let service: CompetitiveTelemetryService;

  beforeEach(() => {
    service = CompetitiveTelemetryService.getInstance();
    service.resetJourneys();
    service.resetFeatureInteractions();
    vi.clearAllMocks();
  });

  describe('Journey Tracking', () => {
    it('should start a journey and track event', () => {
      service.startJourney('token_creation', { userType: 'new' });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'journey_started',
          category: 'Competitive',
          action: 'Journey',
          label: 'token_creation',
          journey: 'token_creation',
          metadata: { userType: 'new' },
        })
      );
    });

    it('should track journey milestone with duration', () => {
      service.startJourney('token_creation');

      service.trackMilestone({
        journey: 'token_creation',
        milestone: 'standards_selected',
        timestamp: new Date(),
        metadata: { standard: 'ERC20' },
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'journey_milestone',
          journey: 'token_creation',
          milestone: 'standards_selected',
          metadata: { standard: 'ERC20' },
        })
      );
    });

    it('should track journey completion with success', () => {
      service.startJourney('token_creation');
      service.completeJourney('token_creation', true, { deploymentId: '123' });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'journey_completed',
          category: 'Competitive',
          action: 'Complete',
          journey: 'token_creation',
          success: true,
          metadata: { deploymentId: '123' },
        })
      );
    });

    it('should track journey abandonment', () => {
      service.startJourney('token_creation');
      service.completeJourney('token_creation', false, { reason: 'insufficient_funds' });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'journey_abandoned',
          action: 'Abandon',
          success: false,
          metadata: { reason: 'insufficient_funds' },
        })
      );
    });

    it('should clean up journey start time after completion', () => {
      service.startJourney('token_creation');
      const metrics1 = service.getConversionFunnelMetrics();
      expect(metrics1.journeyStarted).toBe(1);

      service.completeJourney('token_creation', true);
      const metrics2 = service.getConversionFunnelMetrics();
      expect(metrics2.journeyStarted).toBe(0);
    });
  });

  describe('Feature Discovery Tracking', () => {
    it('should track feature discovery', () => {
      service.trackFeatureDiscovery({
        feature: 'compliance_dashboard',
        discovered: true,
        timeToDiscovery: 30,
        context: 'from_navigation',
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'feature_discovered',
          category: 'Competitive',
          action: 'Discovery',
          label: 'compliance_dashboard',
          feature: 'compliance_dashboard',
          timeToDiscovery: 30,
          context: 'from_navigation',
        })
      );
    });

    it('should track first discovery of feature', () => {
      service.trackFeatureDiscovery({
        feature: 'standards_comparison',
        discovered: true,
      });

      service.trackFeatureDiscovery({
        feature: 'standards_comparison',
        discovered: true,
      });

      // Both discoveries should be tracked
      expect(analyticsService.trackEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery Tracking', () => {
    it('should track successful error recovery', () => {
      service.trackErrorRecovery({
        errorType: 'INSUFFICIENT_BALANCE',
        stage: 'deployment',
        recovered: true,
        recoveryMethod: 'retry',
        timeToRecover: 120,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'error_recovered',
          category: 'Competitive',
          action: 'Error',
          label: 'INSUFFICIENT_BALANCE',
          errorType: 'INSUFFICIENT_BALANCE',
          stage: 'deployment',
          recovered: true,
          recoveryMethod: 'retry',
          timeToRecover: 120,
        })
      );
    });

    it('should track error abandonment', () => {
      service.trackErrorRecovery({
        errorType: 'NETWORK_ERROR',
        stage: 'confirming',
        recovered: false,
        recoveryMethod: 'abandon',
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'error_abandoned',
          action: 'Error',
          recovered: false,
        })
      );
    });
  });

  describe('Compliance Checkpoint Tracking', () => {
    it('should track passed compliance checkpoint', () => {
      service.trackComplianceCheckpoint({
        checkpoint: 'kyc_verification',
        passed: true,
        complianceScore: 85,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'compliance_checkpoint',
          category: 'Competitive',
          action: 'Passed',
          label: 'kyc_verification',
          checkpoint: 'kyc_verification',
          passed: true,
          complianceScore: 85,
        })
      );
    });

    it('should track failed compliance checkpoint with blockers', () => {
      service.trackComplianceCheckpoint({
        checkpoint: 'jurisdiction_check',
        passed: false,
        blockers: ['restricted_jurisdiction', 'missing_disclosure'],
        recommendedActions: ['Update jurisdiction', 'Add whitepaper URL'],
        complianceScore: 40,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'compliance_checkpoint',
          action: 'Blocked',
          passed: false,
          blockers: ['restricted_jurisdiction', 'missing_disclosure'],
          recommendedActions: ['Update jurisdiction', 'Add whitepaper URL'],
          complianceScore: 40,
        })
      );
    });
  });

  describe('Post-Deployment Activity Tracking', () => {
    it('should track post-deployment activity', () => {
      const tokenId = 'token_123';
      const timestamp = new Date();

      service.trackPostDeploymentActivity({
        tokenId,
        activity: 'view_details',
        timestamp,
        context: { source: 'dashboard' },
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'post_deployment_activity',
          category: 'Competitive',
          action: 'Engagement',
          label: 'view_details',
          tokenId,
          activity: 'view_details',
          context: { source: 'dashboard' },
        })
      );
    });

    it('should track different post-deployment activities', () => {
      const activities: Array<'view_details' | 'share' | 'manage_whitelist' | 'update_metadata' | 'view_explorer'> = [
        'view_details',
        'share',
        'manage_whitelist',
        'update_metadata',
        'view_explorer',
      ];

      activities.forEach((activity) => {
        service.trackPostDeploymentActivity({
          tokenId: 'token_123',
          activity,
          timestamp: new Date(),
        });
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledTimes(5);
    });
  });

  describe('Deployment Status Visibility Tracking', () => {
    it('should track deployment status visibility', () => {
      service.trackDeploymentStatusVisibility({
        stage: 'deploying',
        status: 'in-progress',
        progress: 65,
        timeInStage: 15000,
        userInteraction: 'viewed',
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'deployment_status_viewed',
          category: 'Competitive',
          action: 'Status',
          label: 'deploying - in-progress',
          stage: 'deploying',
          status: 'in-progress',
          progress: 65,
          timeInStage: 15000,
          userInteraction: 'viewed',
        })
      );
    });

    it('should track user refresh action', () => {
      service.trackDeploymentStatusVisibility({
        stage: 'confirming',
        status: 'in-progress',
        userInteraction: 'refreshed',
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userInteraction: 'refreshed',
        })
      );
    });
  });

  describe('Standards Comparison Tracking', () => {
    it('should track standards comparison', () => {
      service.trackStandardsComparison({
        standardsCompared: ['ERC20', 'ARC3', 'ARC200'],
        selectedStandard: 'ARC3',
        comparisonFeatures: ['metadata', 'royalties', 'whitelisting'],
        timeSpent: 45,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'standards_compared',
          category: 'Competitive',
          action: 'Compare',
          label: 'ERC20 vs ARC3 vs ARC200',
          standardsCompared: ['ERC20', 'ARC3', 'ARC200'],
          selectedStandard: 'ARC3',
          comparisonFeatures: ['metadata', 'royalties', 'whitelisting'],
          timeSpent: 45,
        })
      );
    });

    it('should track comparison without selection', () => {
      service.trackStandardsComparison({
        standardsCompared: ['ERC20', 'ARC200'],
        timeSpent: 10,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          standardsCompared: ['ERC20', 'ARC200'],
          selectedStandard: undefined,
        })
      );
    });
  });

  describe('Competitive Metric Tracking', () => {
    it('should track conversion metric', () => {
      service.trackMetric({
        category: 'conversion',
        metric: 'token_creation_completion_rate',
        value: 0.75,
        context: { cohort: 'january_2025' },
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'competitive_metric',
          category: 'conversion',
          action: 'Metric',
          label: 'token_creation_completion_rate',
          value: 0.75,
          metric: 'token_creation_completion_rate',
          context: { cohort: 'january_2025' },
        })
      );
    });

    it('should track engagement metric', () => {
      service.trackMetric({
        category: 'engagement',
        metric: 'post_deployment_actions_per_token',
        value: 3.5,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'engagement',
          metric: 'post_deployment_actions_per_token',
          value: 3.5,
        })
      );
    });

    it('should track quality metric', () => {
      service.trackMetric({
        category: 'quality',
        metric: 'compliance_score_average',
        value: 82,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'quality',
          value: 82,
        })
      );
    });

    it('should track performance metric', () => {
      service.trackMetric({
        category: 'performance',
        metric: 'deployment_time_average_seconds',
        value: 45,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          value: 45,
        })
      );
    });
  });

  describe('Conversion Funnel Metrics', () => {
    it('should return funnel metrics structure', () => {
      const metrics = service.getConversionFunnelMetrics();

      expect(metrics).toHaveProperty('journeyStarted');
      expect(metrics).toHaveProperty('milestonesReached');
      expect(metrics).toHaveProperty('journeysCompleted');
      expect(metrics).toHaveProperty('journeysAbandoned');
      expect(metrics).toHaveProperty('conversionRate');
    });

    it('should count active journeys', () => {
      service.startJourney('journey_1');
      service.startJourney('journey_2');

      const metrics = service.getConversionFunnelMetrics();
      expect(metrics.journeyStarted).toBe(2);
    });
  });

  describe('Reset Functions', () => {
    it('should reset journeys', () => {
      service.startJourney('test_journey');
      expect(service.getConversionFunnelMetrics().journeyStarted).toBe(1);

      service.resetJourneys();
      expect(service.getConversionFunnelMetrics().journeyStarted).toBe(0);
    });

    it('should reset feature interactions', () => {
      service.trackFeatureDiscovery({
        feature: 'test_feature',
        discovered: true,
      });

      service.resetFeatureInteractions();
      
      // Should still be able to track after reset
      service.trackFeatureDiscovery({
        feature: 'test_feature',
        discovered: true,
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = CompetitiveTelemetryService.getInstance();
      const instance2 = CompetitiveTelemetryService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
