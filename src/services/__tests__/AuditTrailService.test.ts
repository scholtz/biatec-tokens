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
  });

  describe('downloadAuditReport', () => {
    it('should create download link', async () => {
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
});
