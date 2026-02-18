/**
 * Unit tests for transaction state manager
 * Tests deployment stage messages, context tracking, and progress calculation
 */

import { describe, it, expect } from 'vitest';
import {
  getStageMessage,
  getStageTechnicalDetails,
  getStageEstimatedTime,
  getDeploymentContext,
  addTransactionChanges,
  getTransactionStateInfo,
  formatTransactionChanges,
  requiresUserAction,
  getDeploymentErrorMessage,
  calculateDeploymentProgress,
} from '../transactionStateManager';
import type { DeploymentStageId, DeploymentStageStatus } from '../../services/DeploymentStatusService';

describe('transactionStateManager', () => {
  describe('getStageMessage', () => {
    const stages: DeploymentStageId[] = ['preparing', 'uploading', 'deploying', 'confirming', 'indexing'];
    const statuses: DeploymentStageStatus[] = ['pending', 'in-progress', 'completed', 'failed'];

    stages.forEach(stage => {
      statuses.forEach(status => {
        it(`should return message for ${stage} - ${status}`, () => {
          const message = getStageMessage(stage, status);
          expect(message).toBeDefined();
          expect(message.length).toBeGreaterThan(0);
        });
      });
    });

    it('should return Processing... for unknown stage/status', () => {
      const message = getStageMessage('unknown' as DeploymentStageId, 'completed');
      expect(message).toBe('Processing...');
    });

    it('should include stage name in message', () => {
      expect(getStageMessage('deploying', 'in-progress')).toContain('Deploy');
      expect(getStageMessage('uploading', 'in-progress')).toContain('Uploading');
      expect(getStageMessage('confirming', 'in-progress')).toContain('Confirming');
    });

    it('should indicate completion clearly', () => {
      expect(getStageMessage('deploying', 'completed')).toContain('success');
      expect(getStageMessage('uploading', 'completed')).toContain('success');
    });

    it('should indicate failure clearly', () => {
      expect(getStageMessage('deploying', 'failed').toLowerCase()).toContain('failed');
      expect(getStageMessage('uploading', 'failed').toLowerCase()).toContain('failed');
    });
  });

  describe('getStageTechnicalDetails', () => {
    it('should return technical details for preparing', () => {
      const details = getStageTechnicalDetails('preparing');
      expect(details).toContain('Validating');
      expect(details).toContain('transaction');
    });

    it('should return technical details for uploading', () => {
      const details = getStageTechnicalDetails('uploading');
      expect(details).toContain('metadata');
      expect(details).toContain('IPFS');
    });

    it('should return technical details for deploying', () => {
      const details = getStageTechnicalDetails('deploying');
      expect(details).toContain('transaction');
      expect(details).toContain('blockchain');
    });

    it('should return technical details for confirming', () => {
      const details = getStageTechnicalDetails('confirming');
      expect(details).toContain('block');
      expect(details).toContain('finality');
    });

    it('should return technical details for indexing', () => {
      const details = getStageTechnicalDetails('indexing');
      expect(details).toContain('database');
      expect(details).toContain('indexer');
    });

    it('should return empty string for unknown stage', () => {
      const details = getStageTechnicalDetails('unknown' as DeploymentStageId);
      expect(details).toBe('');
    });

    it('should provide actionable technical information', () => {
      const stages: DeploymentStageId[] = ['preparing', 'uploading', 'deploying', 'confirming', 'indexing'];
      stages.forEach(stage => {
        const details = getStageTechnicalDetails(stage);
        expect(details.length).toBeGreaterThan(20);
      });
    });
  });

  describe('getStageEstimatedTime', () => {
    it('should return 5 seconds for preparing', () => {
      expect(getStageEstimatedTime('preparing')).toBe(5);
    });

    it('should return 15 seconds for uploading', () => {
      expect(getStageEstimatedTime('uploading')).toBe(15);
    });

    it('should return 30 seconds for deploying', () => {
      expect(getStageEstimatedTime('deploying')).toBe(30);
    });

    it('should return 20 seconds for confirming', () => {
      expect(getStageEstimatedTime('confirming')).toBe(20);
    });

    it('should return 10 seconds for indexing', () => {
      expect(getStageEstimatedTime('indexing')).toBe(10);
    });

    it('should return 10 seconds for unknown stage', () => {
      expect(getStageEstimatedTime('unknown' as DeploymentStageId)).toBe(10);
    });

    it('should return positive values for all stages', () => {
      const stages: DeploymentStageId[] = ['preparing', 'uploading', 'deploying', 'confirming', 'indexing'];
      stages.forEach(stage => {
        expect(getStageEstimatedTime(stage)).toBeGreaterThan(0);
      });
    });
  });

  describe('getDeploymentContext', () => {
    it('should create context with intent', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      expect(context.intent).toContain('MyToken');
      expect(context.intent).toContain('MTK');
    });

    it('should create context with expected outcome', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      expect(context.expectedOutcome).toContain('ERC20');
      expect(context.expectedOutcome).toContain('Ethereum');
    });

    it('should create context with current state', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      expect(context.currentState).toBeDefined();
      expect(context.currentState.length).toBeGreaterThan(0);
    });

    it('should not have changes initially', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      expect(context.changes).toBeUndefined();
    });

    it('should handle different token standards', () => {
      const standards = ['ERC20', 'ARC3', 'ARC200', 'ERC721'];
      standards.forEach(standard => {
        const context = getDeploymentContext('Token', 'TKN', standard, 'Network');
        expect(context.expectedOutcome).toContain(standard);
      });
    });

    it('should handle different networks', () => {
      const networks = ['Ethereum', 'Algorand', 'VOI', 'Aramid'];
      networks.forEach(network => {
        const context = getDeploymentContext('Token', 'TKN', 'ERC20', network);
        expect(context.expectedOutcome).toContain(network);
      });
    });
  });

  describe('addTransactionChanges', () => {
    it('should add before/after changes to context', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      const before = { balance: 1000 };
      const after = { balance: 900, tokenBalance: 100 };
      
      const updated = addTransactionChanges(context, before, after);
      
      expect(updated.changes).toBeDefined();
      expect(updated.changes?.before).toEqual(before);
      expect(updated.changes?.after).toEqual(after);
    });

    it('should update current state to completed', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      const updated = addTransactionChanges(context, {}, {});
      
      expect(updated.currentState).toBe('Transaction completed');
    });

    it('should preserve original context fields', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      const updated = addTransactionChanges(context, {}, {});
      
      expect(updated.intent).toBe(context.intent);
      expect(updated.expectedOutcome).toBe(context.expectedOutcome);
    });

    it('should handle complex change objects', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      const before = {
        balance: 1000,
        tokens: [],
        metadata: { name: 'Old Name' },
      };
      const after = {
        balance: 900,
        tokens: ['token1'],
        metadata: { name: 'New Name' },
      };
      
      const updated = addTransactionChanges(context, before, after);
      
      expect(updated.changes?.before).toEqual(before);
      expect(updated.changes?.after).toEqual(after);
    });
  });

  describe('getTransactionStateInfo', () => {
    it('should create complete state info', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      const info = getTransactionStateInfo('deploying', 'in-progress', context, 50);
      
      expect(info.stage).toBe('deploying');
      expect(info.status).toBe('in-progress');
      expect(info.userMessage).toBeDefined();
      expect(info.technicalDetails).toBeDefined();
      expect(info.progress).toBe(50);
      expect(info.estimatedTimeRemaining).toBeDefined();
      expect(info.context).toEqual(context);
    });

    it('should include estimated time for in-progress stages', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      const info = getTransactionStateInfo('deploying', 'in-progress', context);
      
      expect(info.estimatedTimeRemaining).toBe(30); // deploying takes 30s
    });

    it('should not include estimated time for non in-progress stages', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      
      const pending = getTransactionStateInfo('deploying', 'pending', context);
      expect(pending.estimatedTimeRemaining).toBeUndefined();
      
      const completed = getTransactionStateInfo('deploying', 'completed', context);
      expect(completed.estimatedTimeRemaining).toBeUndefined();
      
      const failed = getTransactionStateInfo('deploying', 'failed', context);
      expect(failed.estimatedTimeRemaining).toBeUndefined();
    });

    it('should include progress when provided', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      const info = getTransactionStateInfo('uploading', 'in-progress', context, 75);
      
      expect(info.progress).toBe(75);
    });

    it('should work without progress', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      const info = getTransactionStateInfo('uploading', 'in-progress', context);
      
      expect(info.progress).toBeUndefined();
    });
  });

  describe('formatTransactionChanges', () => {
    it('should format changed fields', () => {
      const changes = {
        before: { balance: 1000, name: 'Test' },
        after: { balance: 900, name: 'Test' },
      };
      
      const formatted = formatTransactionChanges(changes);
      
      expect(formatted).toHaveLength(1);
      expect(formatted[0].field).toBe('balance');
      expect(formatted[0].before).toBe('1000');
      expect(formatted[0].after).toBe('900');
    });

    it('should not include unchanged fields', () => {
      const changes = {
        before: { balance: 1000, name: 'Test' },
        after: { balance: 1000, name: 'Test' },
      };
      
      const formatted = formatTransactionChanges(changes);
      
      expect(formatted).toHaveLength(0);
    });

    it('should handle new fields in after', () => {
      const changes = {
        before: {},
        after: { tokenBalance: 100 },
      };
      
      const formatted = formatTransactionChanges(changes);
      
      expect(formatted).toHaveLength(1);
      expect(formatted[0].field).toBe('tokenBalance');
      expect(formatted[0].before).toBe('None');
      expect(formatted[0].after).toBe('100');
    });

    it('should handle removed fields from before', () => {
      const changes = {
        before: { oldField: 'value' },
        after: {},
      };
      
      const formatted = formatTransactionChanges(changes);
      
      expect(formatted).toHaveLength(1);
      expect(formatted[0].field).toBe('oldField');
      expect(formatted[0].before).toBe('value');
      expect(formatted[0].after).toBe('None');
    });

    it('should handle multiple changed fields', () => {
      const changes = {
        before: { a: 1, b: 2, c: 3 },
        after: { a: 10, b: 2, c: 30 },
      };
      
      const formatted = formatTransactionChanges(changes);
      
      expect(formatted).toHaveLength(2);
      const fields = formatted.map(f => f.field);
      expect(fields).toContain('a');
      expect(fields).toContain('c');
      expect(fields).not.toContain('b');
    });
  });

  describe('requiresUserAction', () => {
    it('should return action for failed preparing', () => {
      const action = requiresUserAction('preparing', 'failed');
      expect(action).toBeDefined();
      expect(action).toContain('parameters');
    });

    it('should return action for failed uploading', () => {
      const action = requiresUserAction('uploading', 'failed');
      expect(action).toBeDefined();
      expect(action).toContain('connection');
    });

    it('should return action for failed deploying', () => {
      const action = requiresUserAction('deploying', 'failed');
      expect(action).toBeDefined();
      expect(action).toContain('balance');
    });

    it('should return action for failed confirming', () => {
      const action = requiresUserAction('confirming', 'failed');
      expect(action).toBeDefined();
      expect(action!.toLowerCase()).toContain('wait');
    });

    it('should return action for failed indexing', () => {
      const action = requiresUserAction('indexing', 'failed');
      expect(action).toBeDefined();
      expect(action).toContain('support');
    });

    it('should return undefined for non-failed statuses', () => {
      expect(requiresUserAction('deploying', 'pending')).toBeUndefined();
      expect(requiresUserAction('deploying', 'in-progress')).toBeUndefined();
      expect(requiresUserAction('deploying', 'completed')).toBeUndefined();
    });

    it('should provide actionable guidance for all failed stages', () => {
      const stages: DeploymentStageId[] = ['preparing', 'uploading', 'deploying', 'confirming', 'indexing'];
      stages.forEach(stage => {
        const action = requiresUserAction(stage, 'failed');
        expect(action).toBeDefined();
        expect(action!.length).toBeGreaterThan(10);
      });
    });
  });

  describe('getDeploymentErrorMessage', () => {
    it('should return error message for each stage', () => {
      const stages: DeploymentStageId[] = ['preparing', 'uploading', 'deploying', 'confirming', 'indexing'];
      stages.forEach(stage => {
        const message = getDeploymentErrorMessage(stage);
        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(20);
      });
    });

    it('should include specific guidance for INSUFFICIENT_BALANCE', () => {
      const message = getDeploymentErrorMessage('deploying', 'INSUFFICIENT_BALANCE');
      expect(message).toContain('balance');
      expect(message).toContain('fees');
    });

    it('should include specific guidance for NETWORK_ERROR', () => {
      const message = getDeploymentErrorMessage('uploading', 'NETWORK_ERROR');
      expect(message).toContain('connection');
      expect(message).toContain('internet');
    });

    it('should include specific guidance for INVALID_PARAMETERS', () => {
      const message = getDeploymentErrorMessage('preparing', 'INVALID_PARAMETERS');
      expect(message).toContain('parameters');
      expect(message).toContain('invalid');
    });

    it('should include specific guidance for TIMEOUT', () => {
      const message = getDeploymentErrorMessage('confirming', 'TIMEOUT');
      expect(message).toContain('timed out');
      expect(message).toContain('try again');
    });

    it('should include specific guidance for RATE_LIMIT', () => {
      const message = getDeploymentErrorMessage('deploying', 'RATE_LIMIT');
      expect(message).toContain('many requests');
      expect(message).toContain('wait');
    });

    it('should work without error code', () => {
      const message = getDeploymentErrorMessage('deploying');
      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(10);
    });

    it('should handle unknown error codes gracefully', () => {
      const message = getDeploymentErrorMessage('deploying', 'UNKNOWN_ERROR_CODE');
      expect(message).toBeDefined();
      // Should just return base message without additional guidance
    });
  });

  describe('calculateDeploymentProgress', () => {
    it('should return 0 for all pending stages', () => {
      const stages = [
        { stage: 'preparing' as DeploymentStageId, status: 'pending' as DeploymentStageStatus },
        { stage: 'uploading' as DeploymentStageId, status: 'pending' as DeploymentStageStatus },
        { stage: 'deploying' as DeploymentStageId, status: 'pending' as DeploymentStageStatus },
      ];
      
      expect(calculateDeploymentProgress(stages)).toBe(0);
    });

    it('should return 100 for all completed stages', () => {
      const stages = [
        { stage: 'preparing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'uploading' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'deploying' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'confirming' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'indexing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
      ];
      
      expect(calculateDeploymentProgress(stages)).toBe(100);
    });

    it('should calculate partial progress for in-progress stage', () => {
      const stages = [
        { stage: 'preparing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'uploading' as DeploymentStageId, status: 'in-progress' as DeploymentStageStatus, progress: 50 },
        { stage: 'deploying' as DeploymentStageId, status: 'pending' as DeploymentStageStatus },
      ];
      
      const progress = calculateDeploymentProgress(stages);
      expect(progress).toBeGreaterThan(10); // preparing (10%) complete
      expect(progress).toBeLessThan(30); // not yet uploaded (20%)
    });

    it('should ignore failed stages in progress calculation', () => {
      const stages = [
        { stage: 'preparing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'uploading' as DeploymentStageId, status: 'failed' as DeploymentStageStatus },
      ];
      
      // preparing (10%) + uploading (20%) = 30% total weight, 10% complete = 33% overall
      expect(calculateDeploymentProgress(stages)).toBe(33);
    });

    it('should weight deploying stage highest', () => {
      const stages = [
        { stage: 'deploying' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
      ];
      
      // deploying alone (40 weight) out of itself (40 weight) = 100%
      const progress = calculateDeploymentProgress(stages);
      expect(progress).toBe(100);
    });

    it('should handle empty stages array', () => {
      expect(calculateDeploymentProgress([])).toBe(0);
    });

    it('should round progress to integer', () => {
      const stages = [
        { stage: 'preparing' as DeploymentStageId, status: 'in-progress' as DeploymentStageStatus, progress: 33 },
      ];
      
      const progress = calculateDeploymentProgress(stages);
      expect(Number.isInteger(progress)).toBe(true);
    });

    it('should handle realistic deployment flow', () => {
      // Simulate a typical deployment flow
      const flow1 = [
        { stage: 'preparing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
      ];
      expect(calculateDeploymentProgress(flow1)).toBe(100); // 100% of its own weight

      const flow2 = [
        { stage: 'preparing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'uploading' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
      ];
      expect(calculateDeploymentProgress(flow2)).toBe(100); // Both complete

      const flow3 = [
        { stage: 'preparing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'uploading' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'deploying' as DeploymentStageId, status: 'in-progress' as DeploymentStageStatus, progress: 50 },
      ];
      // 10 + 20 + (40 * 0.5) = 50 out of 70 = 71%
      expect(calculateDeploymentProgress(flow3)).toBe(71);

      const flow4 = [
        { stage: 'preparing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'uploading' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'deploying' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'confirming' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'indexing' as DeploymentStageId, status: 'in-progress' as DeploymentStageStatus, progress: 50 },
      ];
      // 10 + 20 + 40 + 20 + (10 * 0.5) = 95 out of 100 = 95%
      expect(calculateDeploymentProgress(flow4)).toBe(95);
    });
  });

  describe('Integration: Complete deployment flow', () => {
    it('should provide complete context through deployment lifecycle', () => {
      // 1. Create initial context
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      expect(context.intent).toContain('MyToken');
      
      // 2. Get state info for preparing stage
      const preparing = getTransactionStateInfo('preparing', 'in-progress', context, 50);
      expect(preparing.userMessage).toContain('Preparing');
      expect(preparing.estimatedTimeRemaining).toBe(5);
      
      // 3. Move to uploading stage
      const uploading = getTransactionStateInfo('uploading', 'in-progress', context, 75);
      expect(uploading.userMessage).toContain('Uploading');
      expect(uploading.estimatedTimeRemaining).toBe(15);
      
      // 4. Complete deployment with changes
      const before = { balance: 1000, tokens: [] };
      const after = { balance: 900, tokens: ['MTK'] };
      const updatedContext = addTransactionChanges(context, before, after);
      
      // 5. Get final state
      const completed = getTransactionStateInfo('indexing', 'completed', updatedContext);
      expect(completed.userMessage).toContain('ready');
      expect(completed.context.changes).toBeDefined();
      
      // 6. Format changes for display
      const changes = formatTransactionChanges(updatedContext.changes!);
      expect(changes.length).toBeGreaterThan(0);
    });

    it('should handle failure scenario with user guidance', () => {
      const context = getDeploymentContext('MyToken', 'MTK', 'ERC20', 'Ethereum');
      
      // Deployment fails
      const failed = getTransactionStateInfo('deploying', 'failed', context);
      expect(failed.userMessage.toLowerCase()).toContain('failed');
      
      // Get error message with specific code
      const errorMsg = getDeploymentErrorMessage('deploying', 'INSUFFICIENT_BALANCE');
      expect(errorMsg).toContain('balance');
      
      // Get user action required
      const action = requiresUserAction('deploying', 'failed');
      expect(action).toBeDefined();
      expect(action).toContain('balance');
    });

    it('should calculate realistic progress through full flow', () => {
      const stages = [
        { stage: 'preparing' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'uploading' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'deploying' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'confirming' as DeploymentStageId, status: 'completed' as DeploymentStageStatus },
        { stage: 'indexing' as DeploymentStageId, status: 'in-progress' as DeploymentStageStatus, progress: 50 },
      ];
      
      const progress = calculateDeploymentProgress(stages);
      expect(progress).toBeGreaterThan(90);
      expect(progress).toBeLessThan(100);
    });
  });
});
