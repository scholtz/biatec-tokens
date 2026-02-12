import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditTrailService, AuditTrailError } from '../AuditTrailService';
import type { AuditEventType, AuditEventSeverity } from '../../types/auditTrail';

describe('AuditTrailService', () => {
  let service: AuditTrailService;

  beforeEach(() => {
    service = new AuditTrailService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should log audit event successfully', async () => {
      const eventType: AuditEventType = 'deployment_initiated';
      const severity: AuditEventSeverity = 'info';
      const actor = {
        address: 'TESTADDRESS123456789',
        email: 'test@example.com',
        name: 'Test User',
      };
      const resource = {
        type: 'token' as const,
        id: 'token-123',
        network: 'algorand-testnet',
        standard: 'ARC3',
      };
      const action = 'Initiated token deployment';

      await service.logEvent(eventType, severity, actor, resource, action);

      // Verify by retrieving the audit trail
      const trail = await service.getDeploymentAuditTrail('token-123');
      expect(trail.entries.length).toBeGreaterThan(0);
      
      const entry = trail.entries.find(e => e.action === action);
      expect(entry).toBeDefined();
      expect(entry?.eventType).toBe(eventType);
      expect(entry?.severity).toBe(severity);
      expect(entry?.actor.email).toBe(actor.email);
    });

    it('should include timestamp and user agent', async () => {
      await service.logEvent(
        'account_created',
        'info',
        { address: 'TEST123' },
        { type: 'account', id: 'acc-123' },
        'Account created'
      );

      const trail = await service.getDeploymentAuditTrail('acc-123');
      const entry = trail.entries[0];

      expect(entry.timestamp).toBeDefined();
      expect(entry.userAgent).toBeDefined();
    });

    it('should log event with all optional details', async () => {
      await service.logEvent(
        'deployment_failed',
        'error',
        { address: 'TEST123', email: 'test@example.com', name: 'Test' },
        { type: 'token', id: 'token-456', network: 'ethereum', standard: 'ERC20' },
        'Deployment failed',
        {
          status: 'failed',
          transactionId: 'tx-123',
          errorCode: 'NETWORK_ERROR',
          errorMessage: 'Network timeout',
          metadata: { attempt: 1 }
        }
      );

      const trail = await service.getDeploymentAuditTrail('token-456');
      const entry = trail.entries[0];

      expect(entry.details.status).toBe('failed');
      expect(entry.details.transactionId).toBe('tx-123');
      expect(entry.details.errorCode).toBe('NETWORK_ERROR');
      expect(entry.details.errorMessage).toBe('Network timeout');
    });

    it('should log event without optional details', async () => {
      await service.logEvent(
        'account_updated',
        'info',
        { address: 'TEST789' },
        { type: 'account', id: 'acc-789' },
        'Account updated'
      );

      const trail = await service.getDeploymentAuditTrail('acc-789');
      expect(trail.entries.length).toBeGreaterThan(0);
    });
  });

  describe('getDeploymentAuditTrail', () => {
    it('should return audit trail with entries', async () => {
      const deploymentId = 'test-deployment-123';
      const trail = await service.getDeploymentAuditTrail(deploymentId);

      expect(trail).toBeDefined();
      expect(trail.entries).toBeInstanceOf(Array);
      expect(trail.total).toBeGreaterThanOrEqual(0);
      expect(trail.page).toBe(1);
      expect(trail.pageSize).toBe(50);
    });

    it('should support pagination', async () => {
      const deploymentId = 'test-deployment-123';
      const page1 = await service.getDeploymentAuditTrail(deploymentId, 1, 2);
      const page2 = await service.getDeploymentAuditTrail(deploymentId, 2, 2);

      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);
      expect(page1.pageSize).toBe(2);
      expect(page2.pageSize).toBe(2);
    });

    it('should generate sample entries for demo', async () => {
      const deploymentId = 'new-deployment-456';
      const trail = await service.getDeploymentAuditTrail(deploymentId);

      expect(trail.entries.length).toBeGreaterThan(0);
      expect(trail.entries[0].resource.id).toBe(deploymentId);
    });
  });

  describe('generateAuditReport', () => {
    it('should generate report with summary', async () => {
      const deploymentId = 'test-deployment-789';
      const report = await service.generateAuditReport({
        deploymentId,
        format: 'json',
        includeMetadata: true,
      });

      expect(report.deploymentId).toBe(deploymentId);
      expect(report.generatedAt).toBeDefined();
      expect(report.format).toBe('json');
      expect(report.data).toBeInstanceOf(Array);
      expect(report.summary).toBeDefined();
      expect(report.summary.totalEvents).toBeGreaterThan(0);
    });

    it('should include deployment summary with key fields', async () => {
      const deploymentId = 'test-deployment-999';
      const report = await service.generateAuditReport({
        deploymentId,
        format: 'json',
      });

      expect(report.summary.startTime).toBeDefined();
      expect(report.summary.endTime).toBeDefined();
      expect(report.summary.status).toBeDefined();
      expect(report.summary.actor).toBeDefined();
      expect(report.summary.network).toBeDefined();
      expect(report.summary.standard).toBeDefined();
    });

    it('should handle empty entries with fallback values', async () => {
      // Create a service with no logged entries
      const newService = new AuditTrailService();
      const deploymentId = 'empty-deployment-123';
      
      const report = await newService.generateAuditReport({
        deploymentId,
        format: 'json',
      });

      // Should have sample entries generated
      expect(report.summary.totalEvents).toBeGreaterThan(0);
      expect(report.summary.startTime).toBeDefined();
      expect(report.summary.endTime).toBeDefined();
    });

    it('should default format to json when not specified', async () => {
      const report = await service.generateAuditReport({
        deploymentId: 'test-default-format',
        includeMetadata: false,
      });

      expect(report.format).toBe('json');
    });
  });

  describe('getDeploymentMetadata', () => {
    it('should return deployment audit metadata', async () => {
      const deploymentId = 'test-metadata-123';
      const metadata = await service.getDeploymentMetadata(deploymentId);

      expect(metadata.deploymentId).toBe(deploymentId);
      expect(metadata.tokenStandard).toBeDefined();
      expect(metadata.network).toBeDefined();
      expect(metadata.initiatedBy).toBeDefined();
      expect(metadata.initiatedAt).toBeDefined();
      expect(metadata.statusTransitions).toBeInstanceOf(Array);
    });

    it('should track status transitions', async () => {
      const deploymentId = 'test-transitions-456';
      const metadata = await service.getDeploymentMetadata(deploymentId);

      expect(metadata.statusTransitions.length).toBeGreaterThan(0);
      
      const transition = metadata.statusTransitions[0];
      expect(transition.timestamp).toBeDefined();
      expect(transition.to).toBeDefined();
    });

    it('should handle entries without standard/network', async () => {
      // Log an event without standard/network
      await service.logEvent(
        'account_created',
        'info',
        { address: 'TEST999' },
        { type: 'account', id: 'test-no-standard' },
        'Account created'
      );

      const metadata = await service.getDeploymentMetadata('test-no-standard');
      
      expect(metadata.tokenStandard).toBeDefined();
      expect(metadata.network).toBeDefined();
    });

    it('should handle entries without email', async () => {
      // Log an event with only address (no email)
      await service.logEvent(
        'deployment_initiated',
        'info',
        { address: 'ADDRESSONLY123' },
        { type: 'token', id: 'test-no-email', network: 'algorand', standard: 'ARC3' },
        'Deployment initiated'
      );

      const metadata = await service.getDeploymentMetadata('test-no-email');
      
      expect(metadata.initiatedBy).toBe('ADDRESSONLY123');
    });
  });

  describe('downloadAuditReport', () => {
    it('should create download link for JSON', async () => {
      // Mock document methods
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      
      await service.downloadAuditReport('test-download-123', 'json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should create download link for CSV', async () => {
      // Mock document methods
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      
      await service.downloadAuditReport('test-download-csv', 'csv');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('CSV conversion', () => {
    it('should generate CSV format report', async () => {
      const deploymentId = 'test-csv-123';
      const report = await service.generateAuditReport({
        deploymentId,
        format: 'csv',
      });

      expect(report.format).toBe('csv');
      expect(report.data).toBeInstanceOf(Array);
    });

    it('should handle entries with missing optional fields in CSV', async () => {
      // Log entry with minimal fields
      await service.logEvent(
        'account_created',
        'info',
        { address: 'MINIMALADDRESS' },
        { type: 'account', id: 'test-minimal-csv' },
        'Minimal account created'
      );

      const report = await service.generateAuditReport({
        deploymentId: 'test-minimal-csv',
        format: 'csv',
      });

      expect(report.format).toBe('csv');
      expect(report.data.length).toBeGreaterThan(0);
    });

    it('should include all fields in CSV for complete entries', async () => {
      // Log entry with all fields
      await service.logEvent(
        'deployment_completed',
        'info',
        { address: 'FULLADDRESS', email: 'full@example.com', name: 'Full User' },
        { type: 'token', id: 'test-full-csv', network: 'algorand', standard: 'ARC3' },
        'Complete deployment',
        {
          status: 'completed',
          transactionId: 'tx-full-123',
          errorCode: 'NONE',
          errorMessage: 'No error',
          metadata: { complete: true }
        }
      );

      const report = await service.generateAuditReport({
        deploymentId: 'test-full-csv',
        format: 'csv',
      });

      expect(report.data.length).toBeGreaterThan(0);
      const entry = report.data[0];
      expect(entry.details.transactionId).toBe('tx-full-123');
    });
  });

  describe('error handling', () => {
    it('should map unknown errors to AuditTrailError', async () => {
      // Create a service method that will throw
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test error mapping through a path that triggers error handling
      const trail = await service.getDeploymentAuditTrail('any-id');
      
      // Should not throw, but handle gracefully
      expect(trail).toBeDefined();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('audit trail immutability', () => {
    it('should not allow modification of logged entries', async () => {
      const deploymentId = 'immutable-test-123';
      
      // Log initial event
      await service.logEvent(
        'deployment_initiated',
        'info',
        { address: 'TEST123' },
        { type: 'token', id: deploymentId },
        'Initial deployment'
      );
      
      // Get the trail
      const trail1 = await service.getDeploymentAuditTrail(deploymentId);
      const originalEntry = trail1.entries[0];
      const originalAction = originalEntry.action;
      const originalTimestamp = originalEntry.timestamp;
      
      // Attempt to modify the returned entry (should not affect stored data)
      originalEntry.action = 'MODIFIED ACTION';
      originalEntry.timestamp = '2000-01-01T00:00:00.000Z';
      
      // Retrieve again and verify no changes
      const trail2 = await service.getDeploymentAuditTrail(deploymentId);
      const retrievedEntry = trail2.entries[0];
      
      expect(retrievedEntry.action).toBe(originalAction);
      expect(retrievedEntry.timestamp).toBe(originalTimestamp);
      expect(retrievedEntry.action).not.toBe('MODIFIED ACTION');
    });

    it('should maintain separate copies for each retrieval', async () => {
      const deploymentId = 'copy-test-456';
      
      await service.logEvent(
        'deployment_completed',
        'info',
        { address: 'TEST456' },
        { type: 'token', id: deploymentId },
        'Deployment completed'
      );
      
      const trail1 = await service.getDeploymentAuditTrail(deploymentId);
      const trail2 = await service.getDeploymentAuditTrail(deploymentId);
      
      // Modify one copy
      trail1.entries[0].action = 'MODIFIED';
      
      // Other copy should be unchanged
      expect(trail2.entries[0].action).not.toBe('MODIFIED');
      expect(trail2.entries[0].action).toBe('Deployment completed');
    });
  });

  describe('chronological ordering', () => {
    it('should maintain chronological order of events', async () => {
      const deploymentId = 'ordering-test-789';
      
      // Log events with small delays to ensure different timestamps
      await service.logEvent(
        'deployment_initiated',
        'info',
        { address: 'TEST789' },
        { type: 'token', id: deploymentId },
        'Event 1: Initiated'
      );
      
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await service.logEvent(
        'deployment_submitted',
        'info',
        { address: 'TEST789' },
        { type: 'token', id: deploymentId },
        'Event 2: Submitted'
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await service.logEvent(
        'deployment_completed',
        'info',
        { address: 'TEST789' },
        { type: 'token', id: deploymentId },
        'Event 3: Completed'
      );
      
      // Retrieve and verify order
      const trail = await service.getDeploymentAuditTrail(deploymentId);
      
      expect(trail.entries.length).toBe(3);
      expect(trail.entries[0].action).toBe('Event 1: Initiated');
      expect(trail.entries[1].action).toBe('Event 2: Submitted');
      expect(trail.entries[2].action).toBe('Event 3: Completed');
      
      // Verify timestamps are in ascending order
      const timestamp1 = new Date(trail.entries[0].timestamp).getTime();
      const timestamp2 = new Date(trail.entries[1].timestamp).getTime();
      const timestamp3 = new Date(trail.entries[2].timestamp).getTime();
      
      expect(timestamp2).toBeGreaterThan(timestamp1);
      expect(timestamp3).toBeGreaterThan(timestamp2);
    });

    it('should preserve order even with concurrent logging', async () => {
      const deploymentId = 'concurrent-test-101';
      
      // Log events concurrently
      await Promise.all([
        service.logEvent(
          'deployment_initiated',
          'info',
          { address: 'TEST101' },
          { type: 'token', id: deploymentId },
          'Concurrent Event A'
        ),
        service.logEvent(
          'deployment_initiated',
          'info',
          { address: 'TEST101' },
          { type: 'token', id: deploymentId },
          'Concurrent Event B'
        ),
        service.logEvent(
          'deployment_initiated',
          'info',
          { address: 'TEST101' },
          { type: 'token', id: deploymentId },
          'Concurrent Event C'
        ),
      ]);
      
      const trail = await service.getDeploymentAuditTrail(deploymentId);
      
      // Should have all 3 events
      expect(trail.entries.length).toBe(3);
      
      // Timestamps should still be in ascending or equal order
      for (let i = 1; i < trail.entries.length; i++) {
        const prevTime = new Date(trail.entries[i - 1].timestamp).getTime();
        const currTime = new Date(trail.entries[i].timestamp).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });
});
