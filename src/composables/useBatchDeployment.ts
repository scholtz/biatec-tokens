/**
 * Batch Deployment Composable
 * 
 * Manages batch deployment state and operations
 */

import { ref, computed } from 'vue';
import { batchDeploymentService } from '../services/BatchDeploymentService';
import type {
  BatchDeploymentConfig,
  BatchStatusSummary,
  CreateBatchRequest,
  BatchValidationResult,
  BatchAuditExportFormat,
} from '../types/batch';

/**
 * Composable for managing batch token deployments
 */
export function useBatchDeployment() {
  // State
  const currentBatch = ref<BatchDeploymentConfig | null>(null);
  const batchSummary = ref<BatchStatusSummary | null>(null);
  const isCreating = ref(false);
  const isDeploying = ref(false);
  const isPolling = ref(false);
  const validationResult = ref<BatchValidationResult | null>(null);
  const error = ref<string | null>(null);

  // Polling interval ID
  let pollingInterval: number | null = null;

  // Computed
  const hasBatch = computed(() => currentBatch.value !== null);
  const isValidBatch = computed(() => validationResult.value?.valid === true);
  const canStartDeployment = computed(() => 
    hasBatch.value && 
    isValidBatch.value && 
    !isDeploying.value &&
    (currentBatch.value?.status === 'draft' || currentBatch.value?.status === 'partial')
  );
  const hasErrors = computed(() => error.value !== null);
  const progressPercentage = computed(() => batchSummary.value?.progress || 0);

  /**
   * Create a new batch
   */
  async function createBatch(request: CreateBatchRequest): Promise<boolean> {
    isCreating.value = true;
    error.value = null;

    try {
      const response = await batchDeploymentService.createBatch(request);
      
      validationResult.value = response.validation;
      batchSummary.value = response.summary;

      if (response.success) {
        currentBatch.value = await batchDeploymentService.getBatch(response.batchId);
        return true;
      } else {
        error.value = 'Batch validation failed';
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create batch';
      return false;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Start batch deployment
   */
  async function startDeployment(): Promise<boolean> {
    if (!currentBatch.value) {
      error.value = 'No batch available to deploy';
      return false;
    }

    isDeploying.value = true;
    error.value = null;

    try {
      const response = await batchDeploymentService.startBatchDeployment({
        batchId: currentBatch.value.batchId,
      });

      if (response.success) {
        // Start polling for status updates
        startPolling();
        return true;
      } else {
        error.value = 'Failed to start deployment';
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start deployment';
      isDeploying.value = false;
      return false;
    }
  }

  /**
   * Start polling for batch status updates
   */
  function startPolling() {
    if (pollingInterval !== null || !currentBatch.value) {
      return;
    }

    isPolling.value = true;
    
    pollingInterval = window.setInterval(async () => {
      await updateBatchStatus();
    }, 2000); // Poll every 2 seconds
  }

  /**
   * Stop polling for status updates
   */
  function stopPolling() {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    isPolling.value = false;
  }

  /**
   * Update batch status
   */
  async function updateBatchStatus(): Promise<void> {
    if (!currentBatch.value) {
      return;
    }

    try {
      const summary = await batchDeploymentService.getBatchStatus(currentBatch.value.batchId);
      batchSummary.value = summary;

      // Update full batch config
      currentBatch.value = await batchDeploymentService.getBatch(currentBatch.value.batchId);

      // Stop polling if batch is complete
      if (summary.status === 'completed' || summary.status === 'failed') {
        stopPolling();
        isDeploying.value = false;
      }
    } catch (err) {
      console.error('Failed to update batch status:', err);
      // Don't stop polling on error, might be temporary
    }
  }

  /**
   * Retry failed tokens
   */
  async function retryFailedTokens(tokenIds?: string[]): Promise<boolean> {
    if (!currentBatch.value) {
      error.value = 'No batch available';
      return false;
    }

    error.value = null;

    try {
      const response = await batchDeploymentService.retryFailedTokens({
        batchId: currentBatch.value.batchId,
        tokenIds,
      });

      if (response.success) {
        // Update batch status
        await updateBatchStatus();
        return true;
      } else {
        error.value = 'Failed to retry tokens';
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to retry tokens';
      return false;
    }
  }

  /**
   * Export batch audit data
   */
  async function exportAudit(format: BatchAuditExportFormat): Promise<string | null> {
    if (!currentBatch.value) {
      error.value = 'No batch available';
      return null;
    }

    error.value = null;

    try {
      const auditData = await batchDeploymentService.exportBatchAudit(
        currentBatch.value.batchId,
        format
      );
      return auditData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export audit';
      return null;
    }
  }

  /**
   * Download audit data as file
   */
  async function downloadAudit(format: BatchAuditExportFormat): Promise<void> {
    const auditData = await exportAudit(format);
    
    if (!auditData || !currentBatch.value) {
      return;
    }

    // Create download link
    const blob = new Blob([auditData], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-${currentBatch.value.batchId}-audit.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Reset batch state
   */
  function reset(): void {
    stopPolling();
    currentBatch.value = null;
    batchSummary.value = null;
    validationResult.value = null;
    error.value = null;
    isCreating.value = false;
    isDeploying.value = false;
  }

  /**
   * Load existing batch by ID
   */
  async function loadBatch(batchId: string): Promise<boolean> {
    error.value = null;

    try {
      const batch = await batchDeploymentService.getBatch(batchId);
      currentBatch.value = batch;
      
      const summary = await batchDeploymentService.getBatchStatus(batchId);
      batchSummary.value = summary;

      // If batch is still deploying, start polling
      if (summary.status === 'deploying') {
        isDeploying.value = true;
        startPolling();
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load batch';
      return false;
    }
  }

  return {
    // State
    currentBatch,
    batchSummary,
    isCreating,
    isDeploying,
    isPolling,
    validationResult,
    error,

    // Computed
    hasBatch,
    isValidBatch,
    canStartDeployment,
    hasErrors,
    progressPercentage,

    // Actions
    createBatch,
    startDeployment,
    updateBatchStatus,
    retryFailedTokens,
    exportAudit,
    downloadAudit,
    reset,
    loadBatch,
    startPolling,
    stopPolling,
  };
}
