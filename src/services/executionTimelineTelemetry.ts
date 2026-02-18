/**
 * Execution Timeline Telemetry Service
 * 
 * Provides funnel tracking and event telemetry for deterministic execution
 * timelines in the auth-first token creation and compliance workflow.
 * 
 * Business Value: Enables data-driven optimization of conversion funnels,
 * identifies abandonment points, measures time-to-completion, and supports
 * product analytics for trust-first UX improvements.
 */

import { telemetryService } from './TelemetryService';
import type { DeterministicStateType, StateTransition } from '../utils/deterministicStateManager';

export interface FunnelEvent {
  funnelId: string;
  stepId: string;
  stepName: string;
  eventType: 'started' | 'completed' | 'abandoned' | 'error';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface StateTransitionEvent {
  context: string;
  fromState: DeterministicStateType;
  toState: DeterministicStateType;
  timestamp: string;
  reason?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorRecoveryEvent {
  errorCode: string;
  errorMessage: string;
  attemptNumber: number;
  recovered: boolean;
  recoveryAction?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AbandonmentEvent {
  funnelId: string;
  lastStepCompleted: string;
  totalSteps: number;
  progressPercentage: number;
  timeSpentMs: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track funnel step started
 */
export function trackFunnelStepStarted(
  funnelId: string,
  stepId: string,
  stepName: string,
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('funnel_step_started', {
    funnel_id: funnelId,
    step_id: stepId,
    step_name: stepName,
    event_type: 'started',
    ...metadata,
  });
}

/**
 * Track funnel step completed
 */
export function trackFunnelStepCompleted(
  funnelId: string,
  stepId: string,
  stepName: string,
  durationMs?: number,
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('funnel_step_completed', {
    funnel_id: funnelId,
    step_id: stepId,
    step_name: stepName,
    event_type: 'completed',
    duration_ms: durationMs,
    ...metadata,
  });
}

/**
 * Track funnel step abandoned
 */
export function trackFunnelStepAbandoned(
  funnelId: string,
  stepId: string,
  stepName: string,
  reason?: string,
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('funnel_step_abandoned', {
    funnel_id: funnelId,
    step_id: stepId,
    step_name: stepName,
    event_type: 'abandoned',
    reason,
    ...metadata,
  });
}

/**
 * Track funnel step error
 */
export function trackFunnelStepError(
  funnelId: string,
  stepId: string,
  stepName: string,
  errorCode: string,
  errorMessage: string,
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('funnel_step_error', {
    funnel_id: funnelId,
    step_id: stepId,
    step_name: stepName,
    event_type: 'error',
    error_code: errorCode,
    error_message: errorMessage,
    ...metadata,
  });
}

/**
 * Track state transition
 */
export function trackStateTransition(
  context: string,
  transition: StateTransition,
  durationMs?: number,
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('state_transition', {
    context,
    from_state: transition.from,
    to_state: transition.to,
    reason: transition.reason,
    transition_timestamp: transition.timestamp,
    duration_ms: durationMs,
    ...transition.metadata,
    ...metadata,
  });
}

/**
 * Track error recovery attempt
 */
export function trackErrorRecovery(
  errorCode: string,
  errorMessage: string,
  attemptNumber: number,
  recovered: boolean,
  recoveryAction?: string,
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('error_recovery', {
    error_code: errorCode,
    error_message: errorMessage,
    attempt_number: attemptNumber,
    recovered,
    recovery_action: recoveryAction,
    ...metadata,
  });
}

/**
 * Track user abandonment of a funnel
 */
export function trackFunnelAbandonment(event: AbandonmentEvent): void {
  telemetryService.track('funnel_abandoned', {
    funnel_id: event.funnelId,
    last_step_completed: event.lastStepCompleted,
    total_steps: event.totalSteps,
    progress_percentage: event.progressPercentage,
    time_spent_ms: event.timeSpentMs,
    abandonment_timestamp: event.timestamp,
    ...event.metadata,
  });
}

/**
 * Track token creation funnel events
 */
export const TokenCreationFunnel = {
  FUNNEL_ID: 'token-creation-auth-first',
  
  steps: {
    AUTH_COMPLETE: 'auth-complete',
    ORG_PROFILE: 'organization-profile',
    TOKEN_PARAMS: 'token-parameters',
    COMPLIANCE_REVIEW: 'compliance-review',
    DEPLOYMENT_CONFIRM: 'deployment-confirm',
    DEPLOYMENT_COMPLETE: 'deployment-complete',
  },
  
  trackAuthComplete(metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.AUTH_COMPLETE,
      'Authentication Complete',
      undefined,
      metadata
    );
  },
  
  trackOrgProfileStarted(metadata?: Record<string, unknown>): void {
    trackFunnelStepStarted(
      this.FUNNEL_ID,
      this.steps.ORG_PROFILE,
      'Organization Profile',
      metadata
    );
  },
  
  trackOrgProfileCompleted(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.ORG_PROFILE,
      'Organization Profile',
      durationMs,
      metadata
    );
  },
  
  trackTokenParamsStarted(metadata?: Record<string, unknown>): void {
    trackFunnelStepStarted(
      this.FUNNEL_ID,
      this.steps.TOKEN_PARAMS,
      'Token Parameters',
      metadata
    );
  },
  
  trackTokenParamsCompleted(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.TOKEN_PARAMS,
      'Token Parameters',
      durationMs,
      metadata
    );
  },
  
  trackComplianceReviewStarted(metadata?: Record<string, unknown>): void {
    trackFunnelStepStarted(
      this.FUNNEL_ID,
      this.steps.COMPLIANCE_REVIEW,
      'Compliance Review',
      metadata
    );
  },
  
  trackComplianceReviewCompleted(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.COMPLIANCE_REVIEW,
      'Compliance Review',
      durationMs,
      metadata
    );
  },
  
  trackDeploymentConfirmStarted(metadata?: Record<string, unknown>): void {
    trackFunnelStepStarted(
      this.FUNNEL_ID,
      this.steps.DEPLOYMENT_CONFIRM,
      'Deployment Confirmation',
      metadata
    );
  },
  
  trackDeploymentConfirmCompleted(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.DEPLOYMENT_CONFIRM,
      'Deployment Confirmation',
      durationMs,
      metadata
    );
  },
  
  trackDeploymentComplete(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.DEPLOYMENT_COMPLETE,
      'Deployment Complete',
      durationMs,
      metadata
    );
  },
  
  trackAbandonment(
    lastStepCompleted: string,
    totalSteps: number,
    progressPercentage: number,
    timeSpentMs: number,
    metadata?: Record<string, unknown>
  ): void {
    trackFunnelAbandonment({
      funnelId: this.FUNNEL_ID,
      lastStepCompleted,
      totalSteps,
      progressPercentage,
      timeSpentMs,
      timestamp: new Date().toISOString(),
      metadata,
    });
  },
};

/**
 * Track compliance workflow funnel events
 */
export const ComplianceFunnel = {
  FUNNEL_ID: 'compliance-workflow',
  
  steps: {
    CHECKLIST_START: 'checklist-start',
    DOCUMENT_UPLOAD: 'document-upload',
    VALIDATION: 'validation',
    REVIEW_SUBMIT: 'review-submit',
    APPROVAL: 'approval',
    COMPLETE: 'complete',
  },
  
  trackChecklistStarted(metadata?: Record<string, unknown>): void {
    trackFunnelStepStarted(
      this.FUNNEL_ID,
      this.steps.CHECKLIST_START,
      'Checklist Started',
      metadata
    );
  },
  
  trackChecklistCompleted(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.CHECKLIST_START,
      'Checklist Completed',
      durationMs,
      metadata
    );
  },
  
  trackDocumentUploadStarted(metadata?: Record<string, unknown>): void {
    trackFunnelStepStarted(
      this.FUNNEL_ID,
      this.steps.DOCUMENT_UPLOAD,
      'Document Upload',
      metadata
    );
  },
  
  trackDocumentUploadCompleted(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.DOCUMENT_UPLOAD,
      'Document Upload',
      durationMs,
      metadata
    );
  },
  
  trackValidationStarted(metadata?: Record<string, unknown>): void {
    trackFunnelStepStarted(
      this.FUNNEL_ID,
      this.steps.VALIDATION,
      'Validation',
      metadata
    );
  },
  
  trackValidationCompleted(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.VALIDATION,
      'Validation',
      durationMs,
      metadata
    );
  },
  
  trackReviewSubmitStarted(metadata?: Record<string, unknown>): void {
    trackFunnelStepStarted(
      this.FUNNEL_ID,
      this.steps.REVIEW_SUBMIT,
      'Review Submit',
      metadata
    );
  },
  
  trackReviewSubmitCompleted(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.REVIEW_SUBMIT,
      'Review Submit',
      durationMs,
      metadata
    );
  },
  
  trackApprovalReceived(metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.APPROVAL,
      'Approval Received',
      undefined,
      metadata
    );
  },
  
  trackComplianceComplete(durationMs?: number, metadata?: Record<string, unknown>): void {
    trackFunnelStepCompleted(
      this.FUNNEL_ID,
      this.steps.COMPLETE,
      'Compliance Complete',
      durationMs,
      metadata
    );
  },
  
  trackAbandonment(
    lastStepCompleted: string,
    totalSteps: number,
    progressPercentage: number,
    timeSpentMs: number,
    metadata?: Record<string, unknown>
  ): void {
    trackFunnelAbandonment({
      funnelId: this.FUNNEL_ID,
      lastStepCompleted,
      totalSteps,
      progressPercentage,
      timeSpentMs,
      timestamp: new Date().toISOString(),
      metadata,
    });
  },
};

/**
 * Track server action explainer interaction
 */
export function trackServerActionExplainer(
  actionType: string,
  interactionType: 'view' | 'expand' | 'collapse',
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('server_action_explainer', {
    action_type: actionType,
    interaction_type: interactionType,
    ...metadata,
  });
}

/**
 * Track retry attempt with context
 */
export function trackRetryAttempt(
  context: string,
  attemptNumber: number,
  success: boolean,
  errorCode?: string,
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('retry_attempt', {
    context,
    attempt_number: attemptNumber,
    success,
    error_code: errorCode,
    ...metadata,
  });
}

/**
 * Track trust panel interaction
 */
export function trackTrustPanelInteraction(
  interactionType: 'view' | 'compare-clicked' | 'learn-more',
  comparisonType?: string,
  metadata?: Record<string, unknown>
): void {
  telemetryService.track('trust_panel_interaction', {
    interaction_type: interactionType,
    comparison_type: comparisonType,
    ...metadata,
  });
}
