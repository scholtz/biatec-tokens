/**
 * Provisioning State Manager
 * Provides deterministic state transitions and error handling for account provisioning
 * Ensures clear user feedback and recovery guidance throughout the provisioning lifecycle
 */

import type { AccountProvisioningStatus } from '../types/accountProvisioning';

export interface ProvisioningState {
  status: AccountProvisioningStatus;
  message: string;
  canRetry: boolean;
  nextAction?: string;
  estimatedWaitTime?: number; // in seconds
}

export interface ProvisioningError {
  code: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  remediation: string;
}

/**
 * Maps provisioning status to user-friendly state information
 */
export function getProvisioningState(status: AccountProvisioningStatus): ProvisioningState {
  switch (status) {
    case 'not_started':
      return {
        status,
        message: 'Account provisioning not started',
        canRetry: false,
        nextAction: 'Sign in with email and password to begin',
      };
    
    case 'provisioning':
      return {
        status,
        message: 'Setting up your account...',
        canRetry: false,
        nextAction: 'Please wait while we prepare your account',
        estimatedWaitTime: 30,
      };
    
    case 'active':
      return {
        status,
        message: 'Account is ready for token deployment',
        canRetry: false,
      };
    
    case 'failed':
      return {
        status,
        message: 'Account provisioning failed',
        canRetry: true,
        nextAction: 'Try signing in again or contact support',
      };
    
    case 'suspended':
      return {
        status,
        message: 'Account is temporarily suspended',
        canRetry: false,
        nextAction: 'Please contact support for assistance',
      };
    
    default:
      return {
        status: 'not_started',
        message: 'Unknown status',
        canRetry: true,
        nextAction: 'Try signing in again',
      };
  }
}

/**
 * Maps provisioning errors to user-friendly error information
 */
export function mapProvisioningError(errorCode: string, errorMessage?: string): ProvisioningError {
  const errorMap: Record<string, Omit<ProvisioningError, 'code'>> = {
    'INVALID_INPUT': {
      message: errorMessage || 'Invalid email or password',
      userMessage: 'The information you provided is invalid. Please check your email and password.',
      recoverable: true,
      remediation: 'Verify your email address is correct and try again.',
    },
    'ACCOUNT_NOT_READY': {
      message: errorMessage || 'Account provisioning failed or suspended',
      userMessage: 'We encountered an issue setting up your account.',
      recoverable: false,
      remediation: 'Please contact support at support@biatec.io for assistance.',
    },
    'PROVISIONING_TIMEOUT': {
      message: errorMessage || 'Account provisioning timeout',
      userMessage: 'Account setup is taking longer than expected.',
      recoverable: true,
      remediation: 'This may be due to network congestion. Please try signing in again in a few minutes.',
    },
    'NETWORK_ERROR': {
      message: errorMessage || 'Network connection error',
      userMessage: 'Unable to connect to the server.',
      recoverable: true,
      remediation: 'Check your internet connection and try again.',
    },
    'RATE_LIMIT_EXCEEDED': {
      message: errorMessage || 'Too many requests',
      userMessage: 'Too many sign-in attempts.',
      recoverable: true,
      remediation: 'Please wait a few minutes before trying again.',
    },
    'DUPLICATE_ACCOUNT': {
      message: errorMessage || 'Account already exists',
      userMessage: 'An account with this email already exists.',
      recoverable: true,
      remediation: 'Try signing in instead of creating a new account.',
    },
    'UNKNOWN_ERROR': {
      message: errorMessage || 'An unknown error occurred',
      userMessage: 'Something unexpected happened.',
      recoverable: true,
      remediation: 'Please try again. If the problem persists, contact support.',
    },
  };

  const errorInfo = errorMap[errorCode] || errorMap['UNKNOWN_ERROR'];
  
  return {
    code: errorCode,
    ...errorInfo,
  };
}

/**
 * Determines if a state transition is valid
 */
export function isValidStateTransition(
  from: AccountProvisioningStatus,
  to: AccountProvisioningStatus
): boolean {
  const validTransitions: Record<AccountProvisioningStatus, AccountProvisioningStatus[]> = {
    'not_started': ['provisioning'],
    'provisioning': ['active', 'failed'],
    'active': ['suspended'], // Only admin actions can suspend
    'failed': ['provisioning', 'not_started'], // Can retry
    'suspended': ['active'], // Only admin actions can reactivate
  };

  return validTransitions[from]?.includes(to) ?? false;
}

/**
 * Gets the next expected state(s) from current status
 */
export function getNextExpectedStates(current: AccountProvisioningStatus): AccountProvisioningStatus[] {
  const transitions: Record<AccountProvisioningStatus, AccountProvisioningStatus[]> = {
    'not_started': ['provisioning'],
    'provisioning': ['active', 'failed'],
    'active': [], // Terminal success state
    'failed': ['provisioning'], // Can retry
    'suspended': [], // Requires admin intervention
  };

  return transitions[current] || [];
}

/**
 * Determines if provisioning should be retried based on error
 */
export function shouldRetryProvisioning(errorCode: string, attemptCount: number): boolean {
  const maxRetries = 3;
  const retryableErrors = ['PROVISIONING_TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT_EXCEEDED'];
  
  return attemptCount < maxRetries && retryableErrors.includes(errorCode);
}

/**
 * Calculates exponential backoff delay for retry attempts
 */
export function getRetryDelay(attemptCount: number): number {
  const baseDelay = 2000; // 2 seconds
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  return delay;
}
