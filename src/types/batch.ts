/**
 * Batch Token Deployment Type Definitions
 * 
 * Type-safe interfaces for batch deployment operations across multiple chains
 */

import type { TokenDeploymentRequest, TokenDeploymentResponse } from './api';

/**
 * Status of individual token within a batch
 */
export type BatchTokenStatus = 'pending' | 'deploying' | 'completed' | 'failed' | 'retrying';

/**
 * Overall batch status
 */
export type BatchStatus = 'draft' | 'validating' | 'deploying' | 'partial' | 'completed' | 'failed';

/**
 * Single token entry within a batch deployment
 */
export interface BatchTokenEntry {
  /** Unique identifier for this token within the batch */
  id: string;
  /** Token deployment request configuration */
  request: TokenDeploymentRequest;
  /** Current deployment status */
  status: BatchTokenStatus;
  /** Deployment response (if completed or failed) */
  response?: TokenDeploymentResponse;
  /** Error message if deployment failed */
  error?: string;
  /** Transaction ID if deployment started */
  transactionId?: string;
  /** Token ID if deployment completed */
  tokenId?: string;
  /** Timestamp when deployment started */
  startedAt?: number;
  /** Timestamp when deployment completed or failed */
  completedAt?: number;
  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Batch deployment configuration
 */
export interface BatchDeploymentConfig {
  /** Unique batch identifier */
  batchId: string;
  /** User-provided batch name */
  name?: string;
  /** User-provided batch description */
  description?: string;
  /** Wallet address initiating the batch */
  walletAddress: string;
  /** List of tokens to deploy */
  tokens: BatchTokenEntry[];
  /** Overall batch status */
  status: BatchStatus;
  /** Timestamp when batch was created */
  createdAt: number;
  /** Timestamp when batch deployment started */
  startedAt?: number;
  /** Timestamp when batch completed */
  completedAt?: number;
  /** Number of tokens successfully deployed */
  completedCount: number;
  /** Number of tokens that failed */
  failedCount: number;
  /** Number of tokens currently deploying */
  deployingCount: number;
  /** Total number of tokens in batch */
  totalCount: number;
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  /** Whether the batch is valid */
  valid: boolean;
  /** Validation errors (blocking issues) */
  errors: BatchValidationError[];
  /** Validation warnings (non-blocking issues) */
  warnings: BatchValidationWarning[];
}

/**
 * Batch validation error
 */
export interface BatchValidationError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Index of token in batch (if applicable) */
  tokenIndex?: number;
  /** Field that caused the error (if applicable) */
  field?: string;
}

/**
 * Batch validation warning
 */
export interface BatchValidationWarning {
  /** Warning code */
  code: string;
  /** Human-readable warning message */
  message: string;
  /** Index of token in batch (if applicable) */
  tokenIndex?: number;
}

/**
 * Batch status summary for API responses
 */
export interface BatchStatusSummary {
  batchId: string;
  status: BatchStatus;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  deployingCount: number;
  pendingCount: number;
  progress: number; // 0-100
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedTimeRemaining?: number; // milliseconds
}

/**
 * Request to create a batch deployment
 */
export interface CreateBatchRequest {
  name?: string;
  description?: string;
  walletAddress: string;
  tokens: TokenDeploymentRequest[];
}

/**
 * Response from creating a batch deployment
 */
export interface CreateBatchResponse {
  success: boolean;
  batchId: string;
  validation: BatchValidationResult;
  summary: BatchStatusSummary;
}

/**
 * Request to start batch deployment execution
 */
export interface StartBatchDeploymentRequest {
  batchId: string;
}

/**
 * Response from starting batch deployment
 */
export interface StartBatchDeploymentResponse {
  success: boolean;
  batchId: string;
  message: string;
}

/**
 * Request to retry failed tokens in a batch
 */
export interface RetryBatchTokensRequest {
  batchId: string;
  tokenIds?: string[]; // If specified, only retry these tokens; otherwise retry all failed
}

/**
 * Response from retrying batch tokens
 */
export interface RetryBatchTokensResponse {
  success: boolean;
  batchId: string;
  retriedCount: number;
  message: string;
}

/**
 * Batch audit entry for export
 */
export interface BatchAuditEntry {
  batchId: string;
  tokenId: string;
  tokenIndex: number;
  tokenName: string;
  tokenSymbol: string;
  standard: string;
  network: string;
  status: BatchTokenStatus;
  transactionId?: string;
  deployedTokenId?: string;
  error?: string;
  startedAt?: string; // ISO 8601
  completedAt?: string; // ISO 8601
  durationMs?: number;
  retryCount: number;
}

/**
 * Batch audit export format
 */
export type BatchAuditExportFormat = 'csv' | 'json';

/**
 * Request to export batch audit data
 */
export interface ExportBatchAuditRequest {
  batchId: string;
  format: BatchAuditExportFormat;
}
