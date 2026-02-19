/**
 * Wallet Readiness Validation Helpers
 * 
 * Provides utilities for validating wallet readiness state and
 * providing user-friendly status messaging.
 */

import type { AlgorandUser } from '../stores/auth';
import type { AccountProvisioningStatus } from '../types/accountProvisioning';

export interface WalletReadinessState {
  isReady: boolean;
  authenticated: boolean;
  provisioned: boolean;
  canDeploy: boolean;
  status: 'ready' | 'pending' | 'error' | 'not_authenticated';
  message: string;
  actionRequired?: string;
}

/**
 * Validate wallet readiness state
 */
export function validateWalletReadiness(
  user: AlgorandUser | null,
  isAuthenticated: boolean,
  provisioningStatus?: AccountProvisioningStatus
): WalletReadinessState {
  // Not authenticated
  if (!isAuthenticated || !user) {
    return {
      isReady: false,
      authenticated: false,
      provisioned: false,
      canDeploy: false,
      status: 'not_authenticated',
      message: 'Please sign in to continue',
      actionRequired: 'Sign in with your email and password',
    };
  }

  // Authenticated but not provisioned
  if (provisioningStatus !== 'active' && user.provisioningStatus !== 'active') {
    return {
      isReady: false,
      authenticated: true,
      provisioned: false,
      canDeploy: false,
      status: 'pending',
      message: 'Account provisioning in progress',
      actionRequired: 'Wait for account provisioning to complete',
    };
  }

  // Provisioned but cannot deploy
  if (!user.canDeploy) {
    return {
      isReady: false,
      authenticated: true,
      provisioned: true,
      canDeploy: false,
      status: 'error',
      message: 'Account is not ready for token deployment',
      actionRequired: 'Contact support to enable token deployment',
    };
  }

  // Fully ready
  return {
    isReady: true,
    authenticated: true,
    provisioned: true,
    canDeploy: true,
    status: 'ready',
    message: 'Account is ready for token deployment',
  };
}

/**
 * Get user-friendly status message for provisioning state
 */
export function getProvisioningStatusMessage(
  status: AccountProvisioningStatus
): string {
  const messages: Record<AccountProvisioningStatus, string> = {
    not_started: 'Account provisioning not started',
    provisioning: 'Account provisioning in progress...',
    active: 'Account is active and ready',
    suspended: 'Account has been suspended',
    failed: 'Account provisioning failed',
  };

  return messages[status] || 'Unknown provisioning status';
}

/**
 * Get recommended action for provisioning state
 */
export function getProvisioningActionRequired(
  status: AccountProvisioningStatus
): string | undefined {
  const actions: Partial<Record<AccountProvisioningStatus, string>> = {
    not_started: 'Please complete the account setup process',
    provisioning: 'Wait a few moments for provisioning to complete',
    suspended: 'Contact support to reactivate your account',
    failed: 'Contact support for assistance',
  };

  return actions[status];
}

/**
 * Check if user can proceed with token creation
 */
export function canProceedWithCreation(
  readiness: WalletReadinessState
): boolean {
  return readiness.isReady && readiness.canDeploy;
}

/**
 * Get error recovery suggestions based on readiness state
 */
export function getRecoverySuggestions(
  readiness: WalletReadinessState
): string[] {
  const suggestions: string[] = [];

  if (!readiness.authenticated) {
    suggestions.push('Sign in with your email and password');
    suggestions.push('Create a new account if you don\'t have one');
  }

  if (readiness.authenticated && !readiness.provisioned) {
    suggestions.push('Wait for account provisioning to complete (usually takes 1-2 minutes)');
    suggestions.push('Refresh the page to check provisioning status');
    suggestions.push('Contact support if provisioning takes longer than 5 minutes');
  }

  if (readiness.provisioned && !readiness.canDeploy) {
    suggestions.push('Verify your email address');
    suggestions.push('Complete your organization profile');
    suggestions.push('Contact support to enable deployment permissions');
  }

  return suggestions;
}

/**
 * Format readiness state for analytics
 */
export function formatReadinessForAnalytics(
  readiness: WalletReadinessState
): Record<string, unknown> {
  return {
    isReady: readiness.isReady,
    authenticated: readiness.authenticated,
    provisioned: readiness.provisioned,
    canDeploy: readiness.canDeploy,
    status: readiness.status,
  };
}
