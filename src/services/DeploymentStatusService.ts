/**
 * Service for managing token deployment status and real-time updates
 * Handles backend API integration, polling, and status tracking
 * Now includes audit trail logging for compliance
 */

import { TokenDeploymentService } from './TokenDeploymentService';
import { auditTrailService } from './AuditTrailService';
import type { TokenDeploymentRequest, TokenDeploymentResponse } from '../types/api';
import type { AuditEventType } from '../types/auditTrail';

/**
 * Deployment stage identifiers
 */
export type DeploymentStageId =
  | 'preparing'
  | 'uploading'
  | 'deploying'
  | 'confirming'
  | 'indexing';

/**
 * Deployment stage status
 */
export type DeploymentStageStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed';

/**
 * Deployment stage information
 */
export interface DeploymentStage {
  id: DeploymentStageId;
  title: string;
  description: string;
  icon: string;
  status: DeploymentStageStatus;
  progress?: number;
  details?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Overall deployment status
 */
export type DeploymentStatus = 'idle' | 'in-progress' | 'completed' | 'failed';

/**
 * Deployment result
 */
export interface DeploymentResult {
  tokenName: string;
  tokenSymbol: string;
  network: string;
  standard: string;
  assetId: string;
  txId: string;
  contractAddress?: string;
  explorerUrl?: string;
}

/**
 * Deployment state
 */
export interface DeploymentState {
  status: DeploymentStatus;
  stages: DeploymentStage[];
  result?: DeploymentResult;
  error?: {
    message: string;
    code?: string;
    recoverable: boolean;
    remediation: string;
  };
  transactionId?: string;
}

/**
 * Service for managing deployment lifecycle
 */
export class DeploymentStatusService {
  private deploymentService: TokenDeploymentService;
  private pollingInterval?: ReturnType<typeof setInterval>;
  private pollingIntervalMs = 2000; // Poll every 2 seconds
  private maxPollingAttempts = 150; // Max 5 minutes (150 * 2s)
  private pollingAttempts = 0;
  private deploymentId?: string;

  constructor(deploymentService?: TokenDeploymentService) {
    this.deploymentService = deploymentService || new TokenDeploymentService();
  }

  /**
   * Log audit event for deployment stage
   */
  private async logDeploymentAudit(
    eventType: AuditEventType,
    request: TokenDeploymentRequest,
    status: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Get user info from localStorage
      const savedUser = localStorage.getItem('algorand_user');
      const user = savedUser ? JSON.parse(savedUser) : null;

      // Extract network from request - handle different request types
      let network: string = 'unknown';
      if ('network' in request && typeof request.network === 'string') {
        network = request.network;
      } else if ('standard' in request && typeof request.standard === 'string' && request.standard.includes('ERC')) {
        network = 'ethereum';
      } else {
        network = 'algorand';
      }

      await auditTrailService.logEvent(
        eventType,
        eventType.includes('failed') ? 'error' : 'info',
        {
          address: user?.address || 'unknown',
          email: user?.email,
          name: user?.name,
        },
        {
          type: 'token',
          id: this.deploymentId || `deployment-${Date.now()}`,
          network: network || 'unknown',
          standard: request.standard || 'unknown',
        },
        `Token deployment ${status}`,
        {
          status,
          ...details,
        }
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't fail deployment if audit logging fails
    }
  }

  /**
   * Create initial deployment stages
   */
  createInitialStages(): DeploymentStage[] {
    return [
      {
        id: 'preparing',
        title: 'Preparing Token',
        description: 'Validating token parameters and configuration',
        icon: 'pi-cog',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'uploading',
        title: 'Uploading Metadata',
        description: 'Uploading token metadata to decentralized storage (IPFS/Arweave)',
        icon: 'pi-cloud-upload',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'deploying',
        title: 'Deploying to Blockchain',
        description: 'Submitting transaction to the blockchain network',
        icon: 'pi-send',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'confirming',
        title: 'Confirming Transaction',
        description: 'Waiting for blockchain confirmation and finalization',
        icon: 'pi-check-circle',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'indexing',
        title: 'Indexing Token',
        description: 'Registering token in explorers and indexing services',
        icon: 'pi-database',
        status: 'pending',
        progress: 0,
      },
    ];
  }

  /**
   * Start deployment process
   */
  async startDeployment(
    request: TokenDeploymentRequest,
    onStateChange: (state: DeploymentState) => void
  ): Promise<void> {
    const stages = this.createInitialStages();
    let state: DeploymentState = {
      status: 'in-progress',
      stages,
    };

    // Generate deployment ID for audit trail
    this.deploymentId = `deployment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update state with initial stages
    onStateChange(state);

    // Log deployment initiation
    await this.logDeploymentAudit('deployment_initiated', request, 'initiated');

    try {
      // Stage 1: Preparing - validation
      this.updateStage(stages, 'preparing', 'in-progress', 0);
      onStateChange(state);

      await this.simulateProgress(stages, 'preparing', (progress) => {
        this.updateStage(stages, 'preparing', 'in-progress', progress);
        onStateChange(state);
      });

      this.updateStage(stages, 'preparing', 'completed', 100);
      stages[0].completedAt = new Date();
      onStateChange(state);

      // Stage 2: Uploading metadata (if applicable)
      this.updateStage(stages, 'uploading', 'in-progress', 0);
      onStateChange(state);

      await this.simulateProgress(stages, 'uploading', (progress) => {
        this.updateStage(stages, 'uploading', 'in-progress', progress);
        onStateChange(state);
      });

      this.updateStage(stages, 'uploading', 'completed', 100);
      stages[1].completedAt = new Date();
      onStateChange(state);

      // Stage 3: Deploying - call real API
      this.updateStage(stages, 'deploying', 'in-progress', 0);
      stages[2].startedAt = new Date();
      onStateChange(state);

      let response: TokenDeploymentResponse;
      try {
        response = await this.deploymentService.deployToken(request);
        
        // Log successful submission
        await this.logDeploymentAudit(
          'deployment_submitted',
          request,
          'submitted',
          { transactionId: response.transactionId }
        );
      } catch (error: any) {
        // Handle deployment API error
        this.updateStage(stages, 'deploying', 'failed', 0);
        stages[2].error = error.message || 'Failed to deploy token';
        state.status = 'failed';
        state.error = this.mapErrorToUserMessage(error);
        
        // Log deployment failure
        await this.logDeploymentAudit(
          'deployment_failed',
          request,
          'failed',
          { 
            errorCode: error.code,
            errorMessage: error.message 
          }
        );
        onStateChange(state);
        return;
      }

      if (!response.success) {
        // Deployment failed
        this.updateStage(stages, 'deploying', 'failed', 0);
        stages[2].error = response.error || 'Deployment failed';
        state.status = 'failed';
        state.error = this.mapErrorToUserMessage(
          new Error(response.error || 'Unknown deployment error'),
          response.errorCode
        );
        onStateChange(state);
        return;
      }

      // Store transaction ID for status polling
      state.transactionId = response.transactionId;

      this.updateStage(stages, 'deploying', 'completed', 100);
      stages[2].completedAt = new Date();
      stages[2].details = `Transaction ID: ${response.transactionId}`;
      onStateChange(state);

      // Stage 4 & 5: Confirming and Indexing - poll status
      await this.pollDeploymentStatus(
        response.transactionId!,
        stages,
        state,
        onStateChange,
        request
      );
    } catch (error: any) {
      console.error('Deployment process failed:', error);
      state.status = 'failed';
      state.error = this.mapErrorToUserMessage(error);
      onStateChange(state);
    }
  }

  /**
   * Poll deployment status from backend
   */
  private async pollDeploymentStatus(
    transactionId: string,
    stages: DeploymentStage[],
    state: DeploymentState,
    onStateChange: (state: DeploymentState) => void,
    request: TokenDeploymentRequest
  ): Promise<void> {
    this.pollingAttempts = 0;

    return new Promise((resolve, reject) => {
      this.updateStage(stages, 'confirming', 'in-progress', 0);
      stages[3].startedAt = new Date();
      onStateChange(state);

      this.pollingInterval = setInterval(async () => {
        this.pollingAttempts++;

        if (this.pollingAttempts >= this.maxPollingAttempts) {
          clearInterval(this.pollingInterval!);
          this.updateStage(stages, 'confirming', 'failed', 0);
          stages[3].error = 'Timeout waiting for confirmation';
          state.status = 'failed';
          state.error = {
            message: 'Deployment timed out',
            code: 'TIMEOUT',
            recoverable: true,
            remediation:
              'The transaction may still be processing. Please check the blockchain explorer using the transaction ID, or contact support if the issue persists.',
          };
          onStateChange(state);
          reject(new Error('Deployment timeout'));
          return;
        }

        try {
          const statusResponse = await this.deploymentService.checkDeploymentStatus(
            transactionId
          );

          // Update progress based on status
          const progress = this.calculateProgressFromStatus(statusResponse);
          this.updateStage(stages, 'confirming', 'in-progress', progress);
          onStateChange(state);

          // Check if deployment is complete
          if (statusResponse.status === 'confirmed' || statusResponse.status === 'completed') {
            clearInterval(this.pollingInterval!);

            // Mark confirming as complete
            this.updateStage(stages, 'confirming', 'completed', 100);
            stages[3].completedAt = new Date();
            onStateChange(state);

            // Start indexing stage
            this.updateStage(stages, 'indexing', 'in-progress', 0);
            stages[4].startedAt = new Date();
            onStateChange(state);

            // Simulate indexing progress
            await this.simulateProgress(stages, 'indexing', (progress) => {
              this.updateStage(stages, 'indexing', 'in-progress', progress);
              onStateChange(state);
            });

            this.updateStage(stages, 'indexing', 'completed', 100);
            stages[4].completedAt = new Date();

            // Build final result
            state.status = 'completed';
            state.result = {
              tokenName: request.name,
              tokenSymbol: this.getSymbolFromRequest(request),
              network: this.getNetworkFromRequest(request),
              standard: request.standard,
              assetId: statusResponse.assetId?.toString() || statusResponse.tokenId || '',
              txId: transactionId,
              contractAddress: statusResponse.contractAddress,
              explorerUrl: this.buildExplorerUrl(
                transactionId,
                this.getNetworkFromRequest(request)
              ),
            };

            onStateChange(state);
            
            // Log successful deployment completion
            await this.logDeploymentAudit(
              'deployment_completed',
              request,
              'completed',
              {
                transactionId,
                assetId: statusResponse.assetId,
                contractAddress: statusResponse.contractAddress,
              }
            );
            resolve();
          } else if (statusResponse.status === 'failed') {
            clearInterval(this.pollingInterval!);
            this.updateStage(stages, 'confirming', 'failed', 0);
            stages[3].error = statusResponse.error || 'Transaction failed';
            state.status = 'failed';
            state.error = this.mapErrorToUserMessage(
              new Error(statusResponse.error || 'Transaction failed'),
              statusResponse.errorCode
            );
            onStateChange(state);
            reject(new Error(statusResponse.error || 'Transaction failed'));
          }
        } catch (error: any) {
          console.error('Error polling deployment status:', error);
          // Don't fail immediately on polling errors - the transaction might still be processing
          // Just log and continue polling
        }
      }, this.pollingIntervalMs);
    });
  }

  /**
   * Calculate progress percentage from status response
   */
  private calculateProgressFromStatus(statusResponse: any): number {
    // Map various status indicators to progress percentage
    if (statusResponse.confirmations !== undefined) {
      const required = statusResponse.requiredConfirmations || 6;
      return Math.min(100, (statusResponse.confirmations / required) * 100);
    }

    if (statusResponse.progress !== undefined) {
      return statusResponse.progress;
    }

    // Default progress based on status string
    switch (statusResponse.status) {
      case 'pending':
        return 10;
      case 'submitted':
        return 30;
      case 'processing':
        return 60;
      case 'confirming':
        return 80;
      case 'confirmed':
      case 'completed':
        return 100;
      default:
        return 50;
    }
  }

  /**
   * Simulate progress for a stage (used for stages without real-time updates)
   */
  private async simulateProgress(
    _stages: DeploymentStage[],
    _stageId: DeploymentStageId,
    onProgress: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          onProgress(progress);
          resolve();
        } else {
          onProgress(progress);
        }
      }, 300);
    });
  }

  /**
   * Update a specific stage
   */
  private updateStage(
    stages: DeploymentStage[],
    stageId: DeploymentStageId,
    status: DeploymentStageStatus,
    progress?: number
  ): void {
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      stage.status = status;
      if (progress !== undefined) {
        stage.progress = progress;
      }
      if (status === 'completed') {
        stage.details = `Completed at ${new Date().toLocaleTimeString()}`;
      }
    }
  }

  /**
   * Map backend error to user-friendly message
   */
  private mapErrorToUserMessage(
    error: Error,
    errorCode?: string
  ): {
    message: string;
    code?: string;
    recoverable: boolean;
    remediation: string;
  } {
    const errorMessage = error.message?.toLowerCase() || '';

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        message: 'Network connection error',
        code: errorCode || 'NETWORK_ERROR',
        recoverable: true,
        remediation:
          'Please check your internet connection and try again. If the problem persists, contact support.',
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return {
        message: 'Token configuration validation failed',
        code: errorCode || 'VALIDATION_ERROR',
        recoverable: true,
        remediation:
          'Please review your token parameters and ensure all required fields are correctly filled. Check the validation errors in previous steps.',
      };
    }

    // Insufficient funds
    if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
      return {
        message: 'Insufficient funds for deployment',
        code: errorCode || 'INSUFFICIENT_FUNDS',
        recoverable: true,
        remediation:
          'The wallet does not have enough funds to cover the deployment transaction fees. Please add funds to your wallet and try again.',
      };
    }

    // Authentication errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('auth')) {
      return {
        message: 'Authentication error',
        code: errorCode || 'AUTH_ERROR',
        recoverable: true,
        remediation: 'Your session may have expired. Please log in again and retry deployment.',
      };
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return {
        message: 'Too many requests',
        code: errorCode || 'RATE_LIMIT',
        recoverable: true,
        remediation: 'Please wait a few minutes before trying again.',
      };
    }

    // Generic error
    return {
      message: error.message || 'An unexpected error occurred during deployment',
      code: errorCode || 'UNKNOWN_ERROR',
      recoverable: true,
      remediation:
        'Please try again. If the problem persists, contact support with the transaction details.',
    };
  }

  /**
   * Get symbol from request (different standards have different fields)
   */
  private getSymbolFromRequest(request: TokenDeploymentRequest): string {
    if ('symbol' in request) {
      return request.symbol;
    }
    if ('unitName' in request) {
      return request.unitName;
    }
    return 'N/A';
  }

  /**
   * Get network from request (would need to be passed or inferred)
   */
  private getNetworkFromRequest(_request: TokenDeploymentRequest): string {
    // This should ideally be passed as part of the request or stored in context
    // For now, infer from standard
    if (_request.standard === 'ERC20') {
      return 'Ethereum';
    }
    return 'Algorand';
  }

  /**
   * Build explorer URL for transaction
   */
  private buildExplorerUrl(transactionId: string, network: string): string {
    const explorers: Record<string, string> = {
      Ethereum: `https://etherscan.io/tx/${transactionId}`,
      'Ethereum Sepolia': `https://sepolia.etherscan.io/tx/${transactionId}`,
      Arbitrum: `https://arbiscan.io/tx/${transactionId}`,
      Base: `https://basescan.org/tx/${transactionId}`,
      Algorand: `https://algoexplorer.io/tx/${transactionId}`,
      'Algorand Testnet': `https://testnet.algoexplorer.io/tx/${transactionId}`,
      VOI: `https://voi.observer/tx/${transactionId}`,
      Aramid: `https://aramid.observer/tx/${transactionId}`,
    };

    return explorers[network] || `https://algoexplorer.io/tx/${transactionId}`;
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  /**
   * Reset service state
   */
  reset(): void {
    this.stopPolling();
    this.pollingAttempts = 0;
  }
}
