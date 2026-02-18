/**
 * Transaction State Manager
 * Provides clear user-facing messages and state management for token deployment transactions
 * Includes before/after context to help users understand transaction outcomes
 */

import type { DeploymentStageId, DeploymentStageStatus } from '../services/DeploymentStatusService';

export interface TransactionContext {
  /**
   * What the user is trying to do
   */
  intent: string;
  
  /**
   * Expected outcome after successful transaction
   */
  expectedOutcome: string;
  
  /**
   * Current state description
   */
  currentState: string;
  
  /**
   * What changed (for completed transactions)
   */
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
}

export interface TransactionStateInfo {
  stage: DeploymentStageId;
  status: DeploymentStageStatus;
  userMessage: string;
  technicalDetails?: string;
  progress?: number;
  estimatedTimeRemaining?: number; // in seconds
  actionRequired?: string;
  context: TransactionContext;
}

/**
 * Get user-friendly message for deployment stage
 */
export function getStageMessage(
  stage: DeploymentStageId,
  status: DeploymentStageStatus
): string {
  const messages: Record<DeploymentStageId, Record<DeploymentStageStatus, string>> = {
    preparing: {
      pending: 'Waiting to prepare your token...',
      'in-progress': 'Preparing your token for deployment',
      completed: 'Token preparation complete',
      failed: 'Failed to prepare token',
    },
    uploading: {
      pending: 'Waiting to upload metadata...',
      'in-progress': 'Uploading token metadata and assets',
      completed: 'Metadata uploaded successfully',
      failed: 'Failed to upload metadata',
    },
    deploying: {
      pending: 'Waiting to deploy to blockchain...',
      'in-progress': 'Deploying your token to the blockchain',
      completed: 'Token deployed successfully',
      failed: 'Deployment transaction failed',
    },
    confirming: {
      pending: 'Waiting for confirmation...',
      'in-progress': 'Confirming deployment on the blockchain',
      completed: 'Deployment confirmed',
      failed: 'Failed to confirm deployment',
    },
    indexing: {
      pending: 'Waiting to index token...',
      'in-progress': 'Indexing your token for discovery',
      completed: 'Token indexed and ready',
      failed: 'Failed to index token',
    },
  };

  return messages[stage]?.[status] || 'Processing...';
}

/**
 * Get technical details for deployment stage (for advanced users/debugging)
 */
export function getStageTechnicalDetails(stage: DeploymentStageId): string {
  const details: Record<DeploymentStageId, string> = {
    preparing: 'Validating token parameters and preparing deployment transaction',
    uploading: 'Uploading metadata to IPFS or backend storage',
    deploying: 'Broadcasting signed transaction to blockchain network',
    confirming: 'Waiting for transaction to be included in a block and reach finality',
    indexing: 'Registering token in platform database and indexer',
  };

  return details[stage] || '';
}

/**
 * Get estimated time remaining for stage (in seconds)
 */
export function getStageEstimatedTime(stage: DeploymentStageId): number {
  const times: Record<DeploymentStageId, number> = {
    preparing: 5,
    uploading: 15,
    deploying: 30,
    confirming: 20,
    indexing: 10,
  };

  return times[stage] || 10;
}

/**
 * Get transaction context for deployment
 */
export function getDeploymentContext(
  tokenName: string,
  tokenSymbol: string,
  standard: string,
  network: string
): TransactionContext {
  return {
    intent: `Deploy ${tokenName} (${tokenSymbol}) token`,
    expectedOutcome: `Your ${standard} token will be live on ${network} and ready for distribution`,
    currentState: 'Initiating token deployment',
  };
}

/**
 * Update transaction context with before/after changes
 */
export function addTransactionChanges(
  context: TransactionContext,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): TransactionContext {
  return {
    ...context,
    currentState: 'Transaction completed',
    changes: { before, after },
  };
}

/**
 * Get complete transaction state info
 */
export function getTransactionStateInfo(
  stage: DeploymentStageId,
  status: DeploymentStageStatus,
  context: TransactionContext,
  progress?: number
): TransactionStateInfo {
  const userMessage = getStageMessage(stage, status);
  const technicalDetails = getStageTechnicalDetails(stage);
  const estimatedTimeRemaining = status === 'in-progress' 
    ? getStageEstimatedTime(stage) 
    : undefined;

  return {
    stage,
    status,
    userMessage,
    technicalDetails,
    progress,
    estimatedTimeRemaining,
    context,
  };
}

/**
 * Format transaction changes for display
 */
export function formatTransactionChanges(changes: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}): { field: string; before: string; after: string }[] {
  const allKeys = new Set([
    ...Object.keys(changes.before),
    ...Object.keys(changes.after),
  ]);

  return Array.from(allKeys)
    .filter(key => changes.before[key] !== changes.after[key])
    .map(key => ({
      field: key,
      before: String(changes.before[key] ?? 'None'),
      after: String(changes.after[key] ?? 'None'),
    }));
}

/**
 * Determine if user action is required based on stage and status
 */
export function requiresUserAction(
  stage: DeploymentStageId,
  status: DeploymentStageStatus
): string | undefined {
  if (status === 'failed') {
    const actions: Record<DeploymentStageId, string> = {
      preparing: 'Review token parameters and try again',
      uploading: 'Check your internet connection and retry',
      deploying: 'Ensure you have sufficient balance and retry',
      confirming: 'Wait a few minutes and check transaction status',
      indexing: 'Contact support if issue persists',
    };
    return actions[stage];
  }

  return undefined;
}

/**
 * Get user-friendly error message for deployment failure
 */
export function getDeploymentErrorMessage(
  stage: DeploymentStageId,
  errorCode?: string
): string {
  const baseMessages: Record<DeploymentStageId, string> = {
    preparing: 'Token preparation failed. Please check your token parameters.',
    uploading: 'Metadata upload failed. Please check your connection and try again.',
    deploying: 'Blockchain deployment failed. Please ensure you have sufficient balance.',
    confirming: 'Transaction confirmation timed out. Your transaction may still be processing.',
    indexing: 'Token indexing failed. Your token is deployed but may not appear immediately.',
  };

  let message = baseMessages[stage] || 'Deployment failed. Please try again.';

  // Add specific error code guidance
  if (errorCode) {
    const errorGuidance: Record<string, string> = {
      INSUFFICIENT_BALANCE: 'You do not have enough balance to cover transaction fees.',
      NETWORK_ERROR: 'Network connection error. Please check your internet and try again.',
      INVALID_PARAMETERS: 'Some token parameters are invalid. Please review and correct them.',
      TIMEOUT: 'The operation timed out. Please try again.',
      RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
    };

    if (errorGuidance[errorCode]) {
      message += ` ${errorGuidance[errorCode]}`;
    }
  }

  return message;
}

/**
 * Calculate overall deployment progress percentage
 */
export function calculateDeploymentProgress(
  stages: Array<{ stage: DeploymentStageId; status: DeploymentStageStatus; progress?: number }>
): number {
  const stageWeights: Record<DeploymentStageId, number> = {
    preparing: 10,
    uploading: 20,
    deploying: 40,
    confirming: 20,
    indexing: 10,
  };

  let totalProgress = 0;
  let totalWeight = 0;

  stages.forEach(({ stage, status, progress }) => {
    const weight = stageWeights[stage] || 0;
    totalWeight += weight;

    if (status === 'completed') {
      totalProgress += weight;
    } else if (status === 'in-progress' && progress !== undefined) {
      totalProgress += weight * (progress / 100);
    }
    // pending and failed contribute 0
  });

  return totalWeight > 0 ? Math.round((totalProgress / totalWeight) * 100) : 0;
}
