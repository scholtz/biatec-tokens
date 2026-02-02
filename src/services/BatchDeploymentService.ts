/**
 * Batch Token Deployment Service
 * 
 * Orchestrates batch deployment of multiple tokens with status tracking and error handling
 */

import { BiatecTokensApiClient } from './BiatecTokensApiClient';
import { TokenDeploymentService } from './TokenDeploymentService';
import type {
  BatchDeploymentConfig,
  BatchTokenEntry,
  BatchStatusSummary,
  CreateBatchRequest,
  CreateBatchResponse,
  StartBatchDeploymentRequest,
  StartBatchDeploymentResponse,
  RetryBatchTokensRequest,
  RetryBatchTokensResponse,
  BatchAuditEntry,
  BatchAuditExportFormat,
} from '../types/batch';
import { validateBatchDeployment } from '../utils/batchValidation';

/**
 * Service for batch token deployment operations
 */
export class BatchDeploymentService {
  private apiClient: BiatecTokensApiClient;
  private tokenService: TokenDeploymentService;
  private batches: Map<string, BatchDeploymentConfig>;

  constructor(apiClient?: BiatecTokensApiClient, tokenService?: TokenDeploymentService) {
    this.apiClient = apiClient || new BiatecTokensApiClient();
    this.tokenService = tokenService || new TokenDeploymentService(this.apiClient);
    this.batches = new Map();
  }

  /**
   * Create a new batch deployment
   */
  async createBatch(request: CreateBatchRequest): Promise<CreateBatchResponse> {
    // Validate batch
    const validation = validateBatchDeployment(request.tokens);
    
    // Generate batch ID
    const batchId = this.generateBatchId();
    
    // Create batch entries
    const tokens: BatchTokenEntry[] = request.tokens.map((token, index) => ({
      id: `${batchId}-token-${index}`,
      request: token,
      status: 'pending' as const,
      retryCount: 0,
    }));

    // Create batch config
    const batch: BatchDeploymentConfig = {
      batchId,
      name: request.name,
      description: request.description,
      walletAddress: request.walletAddress,
      tokens,
      status: validation.valid ? 'draft' : 'failed',
      createdAt: Date.now(),
      completedCount: 0,
      failedCount: 0,
      deployingCount: 0,
      totalCount: tokens.length,
    };

    // Store batch
    this.batches.set(batchId, batch);

    // Generate summary
    const summary = this.generateStatusSummary(batch);

    return {
      success: validation.valid,
      batchId,
      validation,
      summary,
    };
  }

  /**
   * Start deploying a batch
   */
  async startBatchDeployment(request: StartBatchDeploymentRequest): Promise<StartBatchDeploymentResponse> {
    const batch = this.batches.get(request.batchId);
    
    if (!batch) {
      throw new Error(`Batch ${request.batchId} not found`);
    }

    if (batch.status !== 'draft' && batch.status !== 'partial') {
      throw new Error(`Batch ${request.batchId} cannot be started (current status: ${batch.status})`);
    }

    // Update batch status
    batch.status = 'deploying';
    batch.startedAt = Date.now();

    // Start deployment in background (don't await)
    this.executeBatchDeployment(batch).catch(error => {
      console.error('Batch deployment failed:', error);
      batch.status = 'failed';
    });

    return {
      success: true,
      batchId: batch.batchId,
      message: 'Batch deployment started',
    };
  }

  /**
   * Execute batch deployment (sequential)
   */
  private async executeBatchDeployment(batch: BatchDeploymentConfig): Promise<void> {
    const pendingTokens = batch.tokens.filter(t => t.status === 'pending' || t.status === 'failed');

    for (const token of pendingTokens) {
      // Skip if already deployed or currently deploying
      if (token.status === 'completed' || token.status === 'deploying') {
        continue;
      }

      try {
        // Update token status
        token.status = 'deploying';
        token.startedAt = Date.now();
        batch.deployingCount++;

        // Deploy token
        const response = await this.tokenService.deployToken(token.request);

        // Update token with success
        token.status = 'completed';
        token.response = response;
        token.transactionId = response.transactionId;
        token.tokenId = response.tokenId || response.assetId?.toString() || response.contractAddress;
        token.completedAt = Date.now();
        
        batch.completedCount++;
        batch.deployingCount--;
      } catch (error) {
        // Update token with error
        token.status = 'failed';
        token.error = error instanceof Error ? error.message : 'Unknown error';
        token.completedAt = Date.now();
        
        batch.failedCount++;
        batch.deployingCount--;
      }
    }

    // Update overall batch status
    batch.completedAt = Date.now();
    
    if (batch.failedCount === 0) {
      batch.status = 'completed';
    } else if (batch.completedCount > 0) {
      batch.status = 'partial';
    } else {
      batch.status = 'failed';
    }
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<BatchStatusSummary> {
    const batch = this.batches.get(batchId);
    
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    return this.generateStatusSummary(batch);
  }

  /**
   * Get full batch configuration
   */
  async getBatch(batchId: string): Promise<BatchDeploymentConfig> {
    const batch = this.batches.get(batchId);
    
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    return batch;
  }

  /**
   * Retry failed tokens in a batch
   */
  async retryFailedTokens(request: RetryBatchTokensRequest): Promise<RetryBatchTokensResponse> {
    const batch = this.batches.get(request.batchId);
    
    if (!batch) {
      throw new Error(`Batch ${request.batchId} not found`);
    }

    // Find tokens to retry
    let tokensToRetry = batch.tokens.filter(t => t.status === 'failed');
    
    if (request.tokenIds && request.tokenIds.length > 0) {
      tokensToRetry = tokensToRetry.filter(t => request.tokenIds!.includes(t.id));
    }

    // Reset token status to pending and increment retry count
    tokensToRetry.forEach(token => {
      token.status = 'pending';
      token.retryCount++;
      token.error = undefined;
      batch.failedCount--;
    });

    // Update batch status
    if (batch.status === 'failed' || batch.status === 'partial') {
      batch.status = 'draft';
    }

    return {
      success: true,
      batchId: batch.batchId,
      retriedCount: tokensToRetry.length,
      message: `${tokensToRetry.length} token(s) marked for retry`,
    };
  }

  /**
   * Export batch audit data
   */
  async exportBatchAudit(batchId: string, format: BatchAuditExportFormat): Promise<string> {
    const batch = this.batches.get(batchId);
    
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const auditEntries: BatchAuditEntry[] = batch.tokens.map((token, index) => {
      // Extract token symbol
      let tokenSymbol = '';
      if ('symbol' in token.request) {
        tokenSymbol = token.request.symbol;
      } else if ('unitName' in token.request) {
        tokenSymbol = token.request.unitName;
      }

      return {
        batchId: batch.batchId,
        tokenId: token.id,
        tokenIndex: index,
        tokenName: token.request.name,
        tokenSymbol,
        standard: token.request.standard,
        network: 'walletAddress' in token.request ? 'multi-chain' : 'unknown',
        status: token.status,
        transactionId: token.transactionId,
        deployedTokenId: token.tokenId,
        error: token.error,
        startedAt: token.startedAt ? new Date(token.startedAt).toISOString() : undefined,
        completedAt: token.completedAt ? new Date(token.completedAt).toISOString() : undefined,
        durationMs: token.startedAt && token.completedAt ? token.completedAt - token.startedAt : undefined,
        retryCount: token.retryCount,
      };
    });

    if (format === 'json') {
      return JSON.stringify({
        batchId: batch.batchId,
        batchName: batch.name,
        batchDescription: batch.description,
        createdAt: new Date(batch.createdAt).toISOString(),
        startedAt: batch.startedAt ? new Date(batch.startedAt).toISOString() : undefined,
        completedAt: batch.completedAt ? new Date(batch.completedAt).toISOString() : undefined,
        status: batch.status,
        totalCount: batch.totalCount,
        completedCount: batch.completedCount,
        failedCount: batch.failedCount,
        tokens: auditEntries,
      }, null, 2);
    } else {
      // CSV format
      const headers = [
        'Batch ID', 'Token Index', 'Token ID', 'Token Name', 'Token Symbol',
        'Standard', 'Status', 'Transaction ID', 'Deployed Token ID',
        'Error', 'Started At', 'Completed At', 'Duration (ms)', 'Retry Count'
      ];
      
      const rows = auditEntries.map(entry => [
        entry.batchId,
        entry.tokenIndex.toString(),
        entry.tokenId,
        entry.tokenName,
        entry.tokenSymbol,
        entry.standard,
        entry.status,
        entry.transactionId || '',
        entry.deployedTokenId || '',
        entry.error || '',
        entry.startedAt || '',
        entry.completedAt || '',
        entry.durationMs?.toString() || '',
        entry.retryCount.toString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;
    }
  }

  /**
   * Generate batch ID
   */
  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate status summary
   */
  private generateStatusSummary(batch: BatchDeploymentConfig): BatchStatusSummary {
    const pendingCount = batch.tokens.filter(t => t.status === 'pending').length;
    const progress = batch.totalCount > 0
      ? Math.round(((batch.completedCount + batch.failedCount) / batch.totalCount) * 100)
      : 0;

    let estimatedTimeRemaining: number | undefined;
    if (batch.startedAt && batch.deployingCount > 0) {
      const elapsed = Date.now() - batch.startedAt;
      const completed = batch.completedCount + batch.failedCount;
      if (completed > 0) {
        const avgTimePerToken = elapsed / completed;
        const remaining = batch.totalCount - completed;
        estimatedTimeRemaining = Math.round(avgTimePerToken * remaining);
      }
    }

    return {
      batchId: batch.batchId,
      status: batch.status,
      totalCount: batch.totalCount,
      completedCount: batch.completedCount,
      failedCount: batch.failedCount,
      deployingCount: batch.deployingCount,
      pendingCount,
      progress,
      createdAt: batch.createdAt,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
      estimatedTimeRemaining,
    };
  }

  /**
   * List all batches for a wallet (mock - would typically come from backend)
   */
  async listBatches(walletAddress: string): Promise<BatchStatusSummary[]> {
    const batches = Array.from(this.batches.values())
      .filter(b => b.walletAddress === walletAddress)
      .map(b => this.generateStatusSummary(b));

    return batches;
  }
}

/**
 * Default instance of batch deployment service
 */
export const batchDeploymentService = new BatchDeploymentService();
