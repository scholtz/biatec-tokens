import { describe, it, expect, beforeEach, vi } from 'vitest';
import { telemetryService } from '../TelemetryService';
import {
  trackFunnelStepStarted,
  trackFunnelStepCompleted,
  trackFunnelStepAbandoned,
  trackFunnelStepError,
  trackStateTransition,
  trackErrorRecovery,
  trackFunnelAbandonment,
  TokenCreationFunnel,
  ComplianceFunnel,
  trackServerActionExplainer,
  trackRetryAttempt,
  trackTrustPanelInteraction,
} from '../executionTimelineTelemetry';
import type { StateTransition } from '../../utils/deterministicStateManager';

describe('executionTimelineTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    telemetryService.clearEvents();
  });

  describe('trackFunnelStepStarted', () => {
    it('should track funnel step started event', () => {
      trackFunnelStepStarted('test-funnel', 'step-1', 'First Step', { userId: '123' });
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('funnel_step_started');
      expect(events[0].properties).toMatchObject({
        funnel_id: 'test-funnel',
        step_id: 'step-1',
        step_name: 'First Step',
        event_type: 'started',
        userId: '123',
      });
    });
  });

  describe('trackFunnelStepCompleted', () => {
    it('should track funnel step completed event with duration', () => {
      trackFunnelStepCompleted('test-funnel', 'step-1', 'First Step', 1500);
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('funnel_step_completed');
      expect(events[0].properties).toMatchObject({
        funnel_id: 'test-funnel',
        step_id: 'step-1',
        step_name: 'First Step',
        event_type: 'completed',
        duration_ms: 1500,
      });
    });

    it('should track completion without duration', () => {
      trackFunnelStepCompleted('test-funnel', 'step-2', 'Second Step');
      
      const events = telemetryService.getEvents();
      expect(events[0].properties?.duration_ms).toBeUndefined();
    });
  });

  describe('trackFunnelStepAbandoned', () => {
    it('should track funnel step abandoned event', () => {
      trackFunnelStepAbandoned('test-funnel', 'step-3', 'Third Step', 'User navigated away');
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('funnel_step_abandoned');
      expect(events[0].properties).toMatchObject({
        funnel_id: 'test-funnel',
        step_id: 'step-3',
        step_name: 'Third Step',
        event_type: 'abandoned',
        reason: 'User navigated away',
      });
    });
  });

  describe('trackFunnelStepError', () => {
    it('should track funnel step error event', () => {
      trackFunnelStepError(
        'test-funnel',
        'step-4',
        'Fourth Step',
        'NETWORK_ERROR',
        'Connection failed'
      );
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('funnel_step_error');
      expect(events[0].properties).toMatchObject({
        funnel_id: 'test-funnel',
        step_id: 'step-4',
        step_name: 'Fourth Step',
        event_type: 'error',
        error_code: 'NETWORK_ERROR',
        error_message: 'Connection failed',
      });
    });
  });

  describe('trackStateTransition', () => {
    it('should track state transition event', () => {
      const transition: StateTransition = {
        from: 'loading',
        to: 'success',
        timestamp: '2024-01-01T00:00:00.000Z',
        reason: 'Data loaded',
        metadata: { itemCount: 10 },
      };
      
      trackStateTransition('token-deployment', transition, 2000, { network: 'mainnet' });
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('state_transition');
      expect(events[0].properties).toMatchObject({
        context: 'token-deployment',
        from_state: 'loading',
        to_state: 'success',
        reason: 'Data loaded',
        transition_timestamp: '2024-01-01T00:00:00.000Z',
        duration_ms: 2000,
        itemCount: 10,
        network: 'mainnet',
      });
    });
  });

  describe('trackErrorRecovery', () => {
    it('should track successful error recovery', () => {
      trackErrorRecovery(
        'NETWORK_ERROR',
        'Connection timeout',
        2,
        true,
        'Retry with exponential backoff'
      );
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('error_recovery');
      expect(events[0].properties).toMatchObject({
        error_code: 'NETWORK_ERROR',
        error_message: 'Connection timeout',
        attempt_number: 2,
        recovered: true,
        recovery_action: 'Retry with exponential backoff',
      });
    });

    it('should track failed error recovery', () => {
      trackErrorRecovery('FATAL_ERROR', 'Unrecoverable', 3, false);
      
      const events = telemetryService.getEvents();
      expect(events[0].properties?.recovered).toBe(false);
    });
  });

  describe('trackFunnelAbandonment', () => {
    it('should track funnel abandonment event', () => {
      trackFunnelAbandonment({
        funnelId: 'test-funnel',
        lastStepCompleted: 'step-2',
        totalSteps: 5,
        progressPercentage: 40,
        timeSpentMs: 45000,
        timestamp: '2024-01-01T00:05:00.000Z',
        metadata: { reason: 'session-timeout' },
      });
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('funnel_abandoned');
      expect(events[0].properties).toMatchObject({
        funnel_id: 'test-funnel',
        last_step_completed: 'step-2',
        total_steps: 5,
        progress_percentage: 40,
        time_spent_ms: 45000,
        abandonment_timestamp: '2024-01-01T00:05:00.000Z',
        reason: 'session-timeout',
      });
    });
  });

  describe('TokenCreationFunnel', () => {
    it('should have correct funnel ID', () => {
      expect(TokenCreationFunnel.FUNNEL_ID).toBe('token-creation-auth-first');
    });

    it('should track auth complete', () => {
      TokenCreationFunnel.trackAuthComplete({ email: 'test@example.com' });
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        funnel_id: 'token-creation-auth-first',
        step_id: 'auth-complete',
        email: 'test@example.com',
      });
    });

    it('should track organization profile started', () => {
      TokenCreationFunnel.trackOrgProfileStarted();
      
      const events = telemetryService.getEvents();
      expect(events[0].event).toBe('funnel_step_started');
      expect(events[0].properties?.step_id).toBe('organization-profile');
    });

    it('should track organization profile completed with duration', () => {
      TokenCreationFunnel.trackOrgProfileCompleted(3000);
      
      const events = telemetryService.getEvents();
      expect(events[0].event).toBe('funnel_step_completed');
      expect(events[0].properties).toMatchObject({
        step_id: 'organization-profile',
        duration_ms: 3000,
      });
    });

    it('should track token params flow', () => {
      TokenCreationFunnel.trackTokenParamsStarted();
      TokenCreationFunnel.trackTokenParamsCompleted(2500);
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('funnel_step_started');
      expect(events[1].event).toBe('funnel_step_completed');
    });

    it('should track compliance review flow', () => {
      TokenCreationFunnel.trackComplianceReviewStarted();
      TokenCreationFunnel.trackComplianceReviewCompleted(5000);
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].properties?.step_id).toBe('compliance-review');
    });

    it('should track deployment confirmation flow', () => {
      TokenCreationFunnel.trackDeploymentConfirmStarted();
      TokenCreationFunnel.trackDeploymentConfirmCompleted(1000);
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].properties?.step_id).toBe('deployment-confirm');
    });

    it('should track deployment complete', () => {
      TokenCreationFunnel.trackDeploymentComplete(15000, { tokenId: 'token-123' });
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        step_id: 'deployment-complete',
        duration_ms: 15000,
        tokenId: 'token-123',
      });
    });

    it('should track funnel abandonment', () => {
      TokenCreationFunnel.trackAbandonment('token-parameters', 6, 50, 60000);
      
      const events = telemetryService.getEvents();
      expect(events[0].event).toBe('funnel_abandoned');
      expect(events[0].properties).toMatchObject({
        funnel_id: 'token-creation-auth-first',
        last_step_completed: 'token-parameters',
        total_steps: 6,
        progress_percentage: 50,
      });
    });
  });

  describe('ComplianceFunnel', () => {
    it('should have correct funnel ID', () => {
      expect(ComplianceFunnel.FUNNEL_ID).toBe('compliance-workflow');
    });

    it('should track checklist flow', () => {
      ComplianceFunnel.trackChecklistStarted();
      ComplianceFunnel.trackChecklistCompleted(4000);
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].properties?.step_id).toBe('checklist-start');
    });

    it('should track document upload flow', () => {
      ComplianceFunnel.trackDocumentUploadStarted();
      ComplianceFunnel.trackDocumentUploadCompleted(8000);
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].properties?.step_id).toBe('document-upload');
    });

    it('should track validation flow', () => {
      ComplianceFunnel.trackValidationStarted();
      ComplianceFunnel.trackValidationCompleted(2000);
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].properties?.step_id).toBe('validation');
    });

    it('should track review submit flow', () => {
      ComplianceFunnel.trackReviewSubmitStarted();
      ComplianceFunnel.trackReviewSubmitCompleted(1500);
      
      const events = telemetryService.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].properties?.step_id).toBe('review-submit');
    });

    it('should track approval received', () => {
      ComplianceFunnel.trackApprovalReceived({ approvedBy: 'admin@example.com' });
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        step_id: 'approval',
        approvedBy: 'admin@example.com',
      });
    });

    it('should track compliance complete', () => {
      ComplianceFunnel.trackComplianceComplete(30000);
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        step_id: 'complete',
        duration_ms: 30000,
      });
    });

    it('should track funnel abandonment', () => {
      ComplianceFunnel.trackAbandonment('validation', 6, 67, 120000);
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        funnel_id: 'compliance-workflow',
        last_step_completed: 'validation',
      });
    });
  });

  describe('trackServerActionExplainer', () => {
    it('should track view interaction', () => {
      trackServerActionExplainer('token-validation', 'view');
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        action_type: 'token-validation',
        interaction_type: 'view',
      });
    });

    it('should track expand interaction', () => {
      trackServerActionExplainer('deployment-submit', 'expand', { section: 'details' });
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        action_type: 'deployment-submit',
        interaction_type: 'expand',
        section: 'details',
      });
    });
  });

  describe('trackRetryAttempt', () => {
    it('should track successful retry', () => {
      trackRetryAttempt('token-deployment', 2, true);
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        context: 'token-deployment',
        attempt_number: 2,
        success: true,
      });
    });

    it('should track failed retry with error code', () => {
      trackRetryAttempt('compliance-check', 3, false, 'VALIDATION_ERROR');
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        context: 'compliance-check',
        attempt_number: 3,
        success: false,
        error_code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('trackTrustPanelInteraction', () => {
    it('should track view interaction', () => {
      trackTrustPanelInteraction('view');
      
      const events = telemetryService.getEvents();
      expect(events[0].properties?.interaction_type).toBe('view');
    });

    it('should track compare clicked with comparison type', () => {
      trackTrustPanelInteraction('compare-clicked', 'auth-first-vs-wallet');
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        interaction_type: 'compare-clicked',
        comparison_type: 'auth-first-vs-wallet',
      });
    });

    it('should track learn more interaction', () => {
      trackTrustPanelInteraction('learn-more', undefined, { source: 'onboarding' });
      
      const events = telemetryService.getEvents();
      expect(events[0].properties).toMatchObject({
        interaction_type: 'learn-more',
        source: 'onboarding',
      });
    });
  });
});
