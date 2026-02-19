import { describe, it, expect } from 'vitest';
import type { AlgorandUser } from '../../stores/auth';
import type { AccountProvisioningStatus } from '../../types/accountProvisioning';
import {
  validateWalletReadiness,
  getProvisioningStatusMessage,
  getProvisioningActionRequired,
  canProceedWithCreation,
  getRecoverySuggestions,
  formatReadinessForAnalytics,
} from '../walletReadiness';

describe('Wallet Readiness Validation Helpers', () => {
  describe('validateWalletReadiness', () => {
    it('should return not_authenticated status when user is null', () => {
      const result = validateWalletReadiness(null, false);

      expect(result.isReady).toBe(false);
      expect(result.authenticated).toBe(false);
      expect(result.provisioned).toBe(false);
      expect(result.canDeploy).toBe(false);
      expect(result.status).toBe('not_authenticated');
      expect(result.message).toBe('Please sign in to continue');
      expect(result.actionRequired).toBe('Sign in with your email and password');
    });

    it('should return not_authenticated status when isAuthenticated is false', () => {
      const user: AlgorandUser = {
        address: 'ABC123',
        email: 'test@example.com',
      };
      const result = validateWalletReadiness(user, false);

      expect(result.status).toBe('not_authenticated');
      expect(result.isReady).toBe(false);
    });

    it('should return pending status when provisioning is not active', () => {
      const user: AlgorandUser = {
        address: 'ABC123',
        email: 'test@example.com',
        provisioningStatus: 'provisioning',
      };
      const result = validateWalletReadiness(user, true, 'provisioning');

      expect(result.isReady).toBe(false);
      expect(result.authenticated).toBe(true);
      expect(result.provisioned).toBe(false);
      expect(result.canDeploy).toBe(false);
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Account provisioning in progress');
    });

    it('should return pending status when user provisioning status is not active', () => {
      const user: AlgorandUser = {
        address: 'ABC123',
        email: 'test@example.com',
        provisioningStatus: 'not_started',
      };
      const result = validateWalletReadiness(user, true);

      expect(result.status).toBe('pending');
      expect(result.provisioned).toBe(false);
    });

    it('should return error status when user cannot deploy', () => {
      const user: AlgorandUser = {
        address: 'ABC123',
        email: 'test@example.com',
        provisioningStatus: 'active',
        canDeploy: false,
      };
      const result = validateWalletReadiness(user, true, 'active');

      expect(result.isReady).toBe(false);
      expect(result.authenticated).toBe(true);
      expect(result.provisioned).toBe(true);
      expect(result.canDeploy).toBe(false);
      expect(result.status).toBe('error');
      expect(result.message).toBe('Account is not ready for token deployment');
      expect(result.actionRequired).toBe('Contact support to enable token deployment');
    });

    it('should return ready status when all conditions are met', () => {
      const user: AlgorandUser = {
        address: 'ABC123',
        email: 'test@example.com',
        provisioningStatus: 'active',
        canDeploy: true,
      };
      const result = validateWalletReadiness(user, true, 'active');

      expect(result.isReady).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(result.provisioned).toBe(true);
      expect(result.canDeploy).toBe(true);
      expect(result.status).toBe('ready');
      expect(result.message).toBe('Account is ready for token deployment');
      expect(result.actionRequired).toBeUndefined();
    });
  });

  describe('getProvisioningStatusMessage', () => {
    it('should return correct message for not_started status', () => {
      expect(getProvisioningStatusMessage('not_started')).toBe(
        'Account provisioning not started'
      );
    });

    it('should return correct message for provisioning status', () => {
      expect(getProvisioningStatusMessage('provisioning')).toBe(
        'Account provisioning in progress...'
      );
    });

    it('should return correct message for active status', () => {
      expect(getProvisioningStatusMessage('active')).toBe(
        'Account is active and ready'
      );
    });

    it('should return correct message for suspended status', () => {
      expect(getProvisioningStatusMessage('suspended')).toBe(
        'Account has been suspended'
      );
    });

    it('should return correct message for failed status', () => {
      expect(getProvisioningStatusMessage('failed')).toBe(
        'Account provisioning failed'
      );
    });
  });

  describe('getProvisioningActionRequired', () => {
    it('should return action for not_started status', () => {
      expect(getProvisioningActionRequired('not_started')).toBe(
        'Please complete the account setup process'
      );
    });

    it('should return action for provisioning status', () => {
      expect(getProvisioningActionRequired('provisioning')).toBe(
        'Wait a few moments for provisioning to complete'
      );
    });

    it('should return undefined for active status', () => {
      expect(getProvisioningActionRequired('active')).toBeUndefined();
    });

    it('should return action for suspended status', () => {
      expect(getProvisioningActionRequired('suspended')).toBe(
        'Contact support to reactivate your account'
      );
    });

    it('should return action for failed status', () => {
      expect(getProvisioningActionRequired('failed')).toBe(
        'Contact support for assistance'
      );
    });
  });

  describe('canProceedWithCreation', () => {
    it('should return true when wallet is ready and can deploy', () => {
      const readiness = {
        isReady: true,
        authenticated: true,
        provisioned: true,
        canDeploy: true,
        status: 'ready' as const,
        message: 'Ready',
      };

      expect(canProceedWithCreation(readiness)).toBe(true);
    });

    it('should return false when wallet is not ready', () => {
      const readiness = {
        isReady: false,
        authenticated: true,
        provisioned: false,
        canDeploy: false,
        status: 'pending' as const,
        message: 'Pending',
      };

      expect(canProceedWithCreation(readiness)).toBe(false);
    });

    it('should return false when cannot deploy', () => {
      const readiness = {
        isReady: false,
        authenticated: true,
        provisioned: true,
        canDeploy: false,
        status: 'error' as const,
        message: 'Error',
      };

      expect(canProceedWithCreation(readiness)).toBe(false);
    });
  });

  describe('getRecoverySuggestions', () => {
    it('should return authentication suggestions when not authenticated', () => {
      const readiness = {
        isReady: false,
        authenticated: false,
        provisioned: false,
        canDeploy: false,
        status: 'not_authenticated' as const,
        message: 'Not authenticated',
      };

      const suggestions = getRecoverySuggestions(readiness);

      expect(suggestions).toHaveLength(2);
      expect(suggestions).toContain('Sign in with your email and password');
      expect(suggestions).toContain("Create a new account if you don't have one");
    });

    it('should return provisioning suggestions when authenticated but not provisioned', () => {
      const readiness = {
        isReady: false,
        authenticated: true,
        provisioned: false,
        canDeploy: false,
        status: 'pending' as const,
        message: 'Pending',
      };

      const suggestions = getRecoverySuggestions(readiness);

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toContain('Wait for account provisioning');
      expect(suggestions[1]).toContain('Refresh the page');
      expect(suggestions[2]).toContain('Contact support');
    });

    it('should return deployment suggestions when provisioned but cannot deploy', () => {
      const readiness = {
        isReady: false,
        authenticated: true,
        provisioned: true,
        canDeploy: false,
        status: 'error' as const,
        message: 'Error',
      };

      const suggestions = getRecoverySuggestions(readiness);

      expect(suggestions).toHaveLength(3);
      expect(suggestions).toContain('Verify your email address');
      expect(suggestions).toContain('Complete your organization profile');
      expect(suggestions).toContain('Contact support to enable deployment permissions');
    });

    it('should return empty suggestions when fully ready', () => {
      const readiness = {
        isReady: true,
        authenticated: true,
        provisioned: true,
        canDeploy: true,
        status: 'ready' as const,
        message: 'Ready',
      };

      const suggestions = getRecoverySuggestions(readiness);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('formatReadinessForAnalytics', () => {
    it('should format readiness state for analytics correctly', () => {
      const readiness = {
        isReady: true,
        authenticated: true,
        provisioned: true,
        canDeploy: true,
        status: 'ready' as const,
        message: 'Account is ready',
        actionRequired: undefined,
      };

      const formatted = formatReadinessForAnalytics(readiness);

      expect(formatted).toEqual({
        isReady: true,
        authenticated: true,
        provisioned: true,
        canDeploy: true,
        status: 'ready',
      });
    });

    it('should format not ready state correctly', () => {
      const readiness = {
        isReady: false,
        authenticated: false,
        provisioned: false,
        canDeploy: false,
        status: 'not_authenticated' as const,
        message: 'Not authenticated',
      };

      const formatted = formatReadinessForAnalytics(readiness);

      expect(formatted).toEqual({
        isReady: false,
        authenticated: false,
        provisioned: false,
        canDeploy: false,
        status: 'not_authenticated',
      });
    });
  });
});
