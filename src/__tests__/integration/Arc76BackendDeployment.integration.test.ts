/**
 * Integration test for ARC76 backend-only token deployment flow
 * Tests integration between authentication, account provisioning, and audit trail services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import { accountProvisioningService } from '../../services/AccountProvisioningService';
import { auditTrailService } from '../../services/AuditTrailService';

describe('ARC76 Backend-Only Deployment Integration', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Authentication & Account Provisioning Integration', () => {
    it('should auto-provision account after ARC76 authentication', async () => {
      const email = 'test@example.com';
      const password = 'testPassword1234567890'; // ARC76 requires 16+ chars
      
      const user = await authStore.authenticateWithARC76(email, password);
      
      expect(user).toBeDefined();
      expect(user.address).toBeDefined();
      expect(user.email).toBe(email);
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.provisioningStatus).toBe('active');
      expect(user.canDeploy).toBe(true);
      expect(authStore.isAccountReady).toBe(true);
      
      const accountStatus = await accountProvisioningService.getAccountStatus(user.address);
      expect(accountStatus.status).toBe('active');
      expect(accountStatus.canDeploy).toBe(true);
      expect(accountStatus.entitlements).toContain('token_deployment');
    });

    it('should handle provisioning errors gracefully', async () => {
      const provisionSpy = vi.spyOn(accountProvisioningService as any, 'mockProvisionAccount');
      provisionSpy.mockRejectedValueOnce(new Error('Provisioning failed'));

      const email = 'error@example.com';
      const password = 'testPassword1234567890';
      const user = await authStore.authenticateWithARC76(email, password);

      expect(user).toBeDefined();
      expect(authStore.isAuthenticated).toBe(true);
      expect(user.canDeploy).toBe(false);
      expect(authStore.provisioningStatus).toBe('failed');
      expect(authStore.provisioningError).toBeDefined();

      provisionSpy.mockRestore();
    });

    it('should support status refresh', async () => {
      const email = 'refresh@example.com';
      const password = 'testPassword1234567890';
      
      const user = await authStore.authenticateWithARC76(email, password);
      expect(user.canDeploy).toBe(true);
      
      const isReady = await authStore.refreshProvisioningStatus();
      expect(isReady).toBe(true);
      expect(authStore.provisioningStatus).toBe('active');
    });
  });

  describe('Audit Trail Integration', () => {
    it('should log events in audit trail', async () => {
      const email = 'audit@example.com';
      
      await auditTrailService.logEvent(
        'account_created',
        'info',
        { address: 'TESTADDRESS', email, name: 'audit' },
        { type: 'account', id: 'TESTADDRESS' },
        'ARC76 account created',
        { status: 'active' }
      );
      
      const auditTrail = await auditTrailService.getDeploymentAuditTrail('TESTADDRESS', 1, 50);
      expect(auditTrail.entries.length).toBeGreaterThan(0);
      expect(auditTrail.entries[0].eventType).toBe('account_created');
      expect(auditTrail.entries[0].actor.email).toBe(email);
    });

    it('should generate audit reports', async () => {
      const deploymentId = 'test-deployment-123';
      
      await auditTrailService.logEvent(
        'deployment_initiated',
        'info',
        { address: 'TESTADDRESS', email: 'test@example.com', name: 'test' },
        { type: 'token', id: deploymentId, network: 'algorand', standard: 'ARC3' },
        'Token deployment initiated',
        { status: 'initiated' }
      );
      
      const report = await auditTrailService.generateAuditReport({
        deploymentId,
        format: 'json',
        includeMetadata: true,
      });
      
      expect(report).toBeDefined();
      expect(report.deploymentId).toBe(deploymentId);
      expect(report.data).toBeInstanceOf(Array);
      expect(report.summary.totalEvents).toBeGreaterThan(0);
    });
  });

  describe('Security & Session', () => {
    it('should not expose private keys', async () => {
      const email = 'security@example.com';
      const password = 'testPassword1234567890';
      const user = await authStore.authenticateWithARC76(email, password);
      
      expect(user).not.toHaveProperty('privateKey');
      expect(user).not.toHaveProperty('sk');
      expect(user.address).toBeDefined();
    });

    it('should restore session on page reload', async () => {
      const email = 'session@example.com';
      const password = 'testPassword1234567890';
      
      const user = await authStore.authenticateWithARC76(email, password);
      expect(authStore.isAuthenticated).toBe(true);
      
      const newAuthStore = useAuthStore();
      await newAuthStore.initialize();
      const restored = await newAuthStore.restoreARC76Session();
      
      expect(restored).toBe(true);
      expect(newAuthStore.isAuthenticated).toBe(true);
      expect(newAuthStore.account).toBe(user.address);
      expect(newAuthStore.provisioningStatus).toBe('active');
    });
  });
});
