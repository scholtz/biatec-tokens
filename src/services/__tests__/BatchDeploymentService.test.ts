import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchDeploymentService, batchDeploymentService } from '../BatchDeploymentService';
import type { CreateBatchRequest } from '../../types/batch';
import { TokenStandard } from '../../types/api';

// Valid 40-char hex Ethereum address
const VALID_ETH_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

// Minimal mock token for tests — an ERC20 request
function makeToken(name: string, symbol = 'TEST') {
  return {
    standard: TokenStandard.ERC20,
    name,
    symbol,
    decimals: 18,
    totalSupply: '1000000',
    walletAddress: VALID_ETH_ADDRESS,
  };
}

function makeBatchRequest(overrides: Partial<CreateBatchRequest> = {}): CreateBatchRequest {
  return {
    name: 'Test Batch',
    description: 'Unit test batch',
    walletAddress: VALID_ETH_ADDRESS,
    tokens: [makeToken('TokenA'), makeToken('TokenB', 'TKB')],
    ...overrides,
  };
}

describe('BatchDeploymentService', () => {
  let service: BatchDeploymentService;

  beforeEach(() => {
    service = new BatchDeploymentService();
  });

  // ==================== createBatch ====================
  describe('createBatch', () => {
    it('creates a batch and returns a batchId', async () => {
      const result = await service.createBatch(makeBatchRequest());
      expect(result.batchId).toBeTruthy();
      expect(result.batchId).toMatch(/^batch-/);
    });

    it('returns success=true for valid tokens', async () => {
      const result = await service.createBatch(makeBatchRequest());
      expect(result.success).toBe(true);
    });

    it('returns a summary with totalCount matching token count', async () => {
      const result = await service.createBatch(makeBatchRequest());
      expect(result.summary.totalCount).toBe(2);
    });

    it('returns a summary with initial pending counts', async () => {
      const result = await service.createBatch(makeBatchRequest());
      expect(result.summary.pendingCount).toBe(2);
      expect(result.summary.completedCount).toBe(0);
      expect(result.summary.failedCount).toBe(0);
    });

    it('summary.progress is 0 for a fresh batch', async () => {
      const result = await service.createBatch(makeBatchRequest());
      expect(result.summary.progress).toBe(0);
    });

    it('sets batch status to "draft" for valid tokens', async () => {
      const result = await service.createBatch(makeBatchRequest());
      expect(result.summary.status).toBe('draft');
    });

    it('includes validation result', async () => {
      const result = await service.createBatch(makeBatchRequest());
      expect(result.validation).toBeDefined();
      expect(typeof result.validation.valid).toBe('boolean');
    });

    it('creates batch with empty token list (validates empty batch)', async () => {
      const result = await service.createBatch(makeBatchRequest({ tokens: [] }));
      // empty batch — validation may fail but should still return a result
      expect(result.batchId).toBeTruthy();
    });
  });

  // ==================== getBatchStatus ====================
  describe('getBatchStatus', () => {
    it('returns summary for an existing batch', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const summary = await service.getBatchStatus(created.batchId);
      expect(summary.batchId).toBe(created.batchId);
    });

    it('throws for unknown batchId', async () => {
      await expect(service.getBatchStatus('batch-does-not-exist')).rejects.toThrow(
        'Batch batch-does-not-exist not found'
      );
    });

    it('status is "draft" for newly created batch', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const summary = await service.getBatchStatus(created.batchId);
      expect(summary.status).toBe('draft');
    });
  });

  // ==================== getBatch ====================
  describe('getBatch', () => {
    it('returns full batch config for an existing batch', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);
      expect(batch.batchId).toBe(created.batchId);
      expect(batch.tokens).toHaveLength(2);
    });

    it('throws for unknown batchId', async () => {
      await expect(service.getBatch('no-such-batch')).rejects.toThrow('Batch no-such-batch not found');
    });

    it('batch tokens carry the request data', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);
      expect(batch.tokens[0].request.name).toBe('TokenA');
      expect(batch.tokens[1].request.name).toBe('TokenB');
    });

    it('each token starts with status=pending and retryCount=0', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);
      for (const token of batch.tokens) {
        expect(token.status).toBe('pending');
        expect(token.retryCount).toBe(0);
      }
    });
  });

  // ==================== startBatchDeployment ====================
  describe('startBatchDeployment', () => {
    it('throws for an unknown batchId', async () => {
      await expect(service.startBatchDeployment({ batchId: 'ghost-batch' })).rejects.toThrow(
        'Batch ghost-batch not found'
      );
    });

    it('transitions batch status from draft to deploying/partial/completed/failed', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const response = await service.startBatchDeployment({ batchId: created.batchId });
      expect(response.success).toBe(true);
      expect(response.batchId).toBe(created.batchId);
      // After execution, status has left 'draft' (deployment was initiated)
      const status = await service.getBatchStatus(created.batchId);
      expect(['deploying', 'partial', 'completed', 'failed']).toContain(status.status);
    });

    it('throws when batch is not in startable state', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);
      // Directly set the batch to completed so re-starting is deterministically blocked
      batch.status = 'completed';

      await expect(service.startBatchDeployment({ batchId: created.batchId })).rejects.toThrow(
        `Batch ${created.batchId} cannot be started (current status: completed)`
      );
    });
  });

  // ==================== retryFailedTokens ====================
  describe('retryFailedTokens', () => {
    it('throws for unknown batchId', async () => {
      await expect(service.retryFailedTokens({ batchId: 'ghost-batch' })).rejects.toThrow(
        'Batch ghost-batch not found'
      );
    });

    it('returns retriedCount=0 when no failed tokens', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const result = await service.retryFailedTokens({ batchId: created.batchId });
      expect(result.success).toBe(true);
      expect(result.retriedCount).toBe(0);
    });

    it('retries only specified token IDs', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);

      // Manually mark first token as failed
      batch.tokens[0].status = 'failed';
      batch.tokens[1].status = 'failed';
      batch.failedCount = 2;
      batch.status = 'failed';

      const result = await service.retryFailedTokens({
        batchId: created.batchId,
        tokenIds: [batch.tokens[0].id],
      });
      expect(result.retriedCount).toBe(1);
      expect(result.success).toBe(true);
    });

    it('retries all failed tokens when no tokenIds specified', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);

      batch.tokens[0].status = 'failed';
      batch.tokens[1].status = 'failed';
      batch.failedCount = 2;
      batch.status = 'failed';

      const result = await service.retryFailedTokens({ batchId: created.batchId });
      expect(result.retriedCount).toBe(2);
    });

    it('resets batch status to draft after retry', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);
      batch.tokens[0].status = 'failed';
      batch.failedCount = 1;
      batch.status = 'failed';

      await service.retryFailedTokens({ batchId: created.batchId });
      const status = await service.getBatchStatus(created.batchId);
      expect(status.status).toBe('draft');
    });

    it('increments retryCount on retried tokens', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);
      batch.tokens[0].status = 'failed';
      batch.failedCount = 1;

      await service.retryFailedTokens({ batchId: created.batchId });
      expect(batch.tokens[0].retryCount).toBe(1);
    });

    it('clears error on retried tokens', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const batch = await service.getBatch(created.batchId);
      batch.tokens[0].status = 'failed';
      batch.tokens[0].error = 'Some error';
      batch.failedCount = 1;

      await service.retryFailedTokens({ batchId: created.batchId });
      expect(batch.tokens[0].error).toBeUndefined();
    });
  });

  // ==================== exportBatchAudit ====================
  describe('exportBatchAudit', () => {
    it('throws for unknown batchId', async () => {
      await expect(service.exportBatchAudit('ghost', 'json')).rejects.toThrow('Batch ghost not found');
    });

    it('returns a valid JSON string for json format', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const result = await service.exportBatchAudit(created.batchId, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.batchId).toBe(created.batchId);
      expect(parsed.totalCount).toBe(2);
      expect(Array.isArray(parsed.tokens)).toBe(true);
    });

    it('returns CSV string for csv format', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const result = await service.exportBatchAudit(created.batchId, 'csv');
      expect(result).toContain('Batch ID');
      expect(result).toContain('Token Name');
    });

    it('CSV includes a row per token', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const result = await service.exportBatchAudit(created.batchId, 'csv');
      const lines = result.split('\n').filter((l) => l.trim().length > 0);
      // Header + 2 token rows = at least 3 non-empty lines
      expect(lines.length).toBeGreaterThanOrEqual(3);
    });

    it('JSON export includes batch name', async () => {
      const created = await service.createBatch(makeBatchRequest({ name: 'My Batch Name' }));
      const result = await service.exportBatchAudit(created.batchId, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.batchName).toBe('My Batch Name');
    });

    it('JSON export includes createdAt timestamp', async () => {
      const created = await service.createBatch(makeBatchRequest());
      const result = await service.exportBatchAudit(created.batchId, 'json');
      const parsed = JSON.parse(result);
      expect(typeof parsed.createdAt).toBe('string');
      expect(new Date(parsed.createdAt).getTime()).toBeGreaterThan(0);
    });
  });

  // ==================== listBatches ====================
  describe('listBatches', () => {
    it('returns empty array when no batches for wallet', async () => {
      const results = await service.listBatches('0x0000000000000000000000000000000000000000');
      expect(results).toEqual([]);
    });

    it('returns batches for the given wallet', async () => {
      const walletA = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
      const walletB = '0x1234567890123456789012345678901234567890';
      await service.createBatch(makeBatchRequest({ walletAddress: walletA, tokens: [makeToken('T1')] }));
      await service.createBatch(makeBatchRequest({ walletAddress: walletA, tokens: [makeToken('T2', 'TT2')] }));
      await service.createBatch(makeBatchRequest({ walletAddress: walletB, tokens: [makeToken('T3', 'TT3')] }));

      const resultsA = await service.listBatches(walletA);
      const resultsB = await service.listBatches(walletB);

      expect(resultsA).toHaveLength(2);
      expect(resultsB).toHaveLength(1);
    });

    it('each result is a BatchStatusSummary shape', async () => {
      await service.createBatch(makeBatchRequest());
      const results = await service.listBatches(VALID_ETH_ADDRESS);
      expect(results.length).toBeGreaterThan(0);
      const summary = results[0];
      expect(typeof summary.batchId).toBe('string');
      expect(typeof summary.totalCount).toBe('number');
      expect(typeof summary.progress).toBe('number');
    });
  });

  // ==================== exported singleton ====================
  describe('batchDeploymentService singleton', () => {
    it('is an instance of BatchDeploymentService', () => {
      expect(batchDeploymentService).toBeInstanceOf(BatchDeploymentService);
    });

    it('can create a batch', async () => {
      const result = await batchDeploymentService.createBatch(makeBatchRequest());
      expect(result.batchId).toBeTruthy();
    });
  });
});
