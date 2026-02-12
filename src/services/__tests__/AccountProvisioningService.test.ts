import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountProvisioningService, AccountProvisioningError } from '../AccountProvisioningService';
import type { AccountProvisioningRequest } from '../../types/accountProvisioning';

describe('AccountProvisioningService', () => {
  let service: AccountProvisioningService;

  beforeEach(() => {
    service = new AccountProvisioningService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('provisionAccount', () => {
    it('should provision account successfully', async () => {
      const request: AccountProvisioningRequest = {
        email: 'test@example.com',
        derivedAddress: 'TESTADDRESS123456789',
        derivationIndex: 1,
      };

      const response = await service.provisionAccount(request);

      expect(response.status).toBe('active');
      expect(response.account.address).toBe(request.derivedAddress);
      expect(response.account.email).toBe(request.email);
      expect(response.account.entitlements).toContain('token_deployment');
      expect(response.metadata.email).toBe(request.email);
    });

    it('should include provisioning metadata', async () => {
      const request: AccountProvisioningRequest = {
        email: 'test@example.com',
        derivedAddress: 'TESTADDRESS123456789',
      };

      const response = await service.provisionAccount(request);

      expect(response.metadata).toBeDefined();
      expect(response.metadata.derivedAddress).toBe(request.derivedAddress);
      expect(response.metadata.createdAt).toBeDefined();
      expect(response.metadata.updatedAt).toBeDefined();
    });

    it('should use default derivation index if not provided', async () => {
      const request: AccountProvisioningRequest = {
        email: 'test@example.com',
        derivedAddress: 'TESTADDRESS123456789',
      };

      const response = await service.provisionAccount(request);

      expect(response.metadata.derivationIndex).toBe(1);
    });
  });

  describe('getAccountStatus', () => {
    it('should return active status for authenticated user', async () => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TESTADDRESS123456789',
        email: 'test@example.com',
      }));

      const status = await service.getAccountStatus('TESTADDRESS123456789');

      expect(status.status).toBe('active');
      expect(status.isActive).toBe(true);
      expect(status.canDeploy).toBe(true);
      expect(status.entitlements).toContain('token_deployment');
    });

    it('should return not_started status for unauthenticated user', async () => {
      const status = await service.getAccountStatus('TESTADDRESS123456789');

      expect(status.status).toBe('not_started');
      expect(status.isActive).toBe(false);
      expect(status.canDeploy).toBe(false);
      expect(status.entitlements).toEqual([]);
    });

    it('should include balance and last activity', async () => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TESTADDRESS123456789',
      }));

      const status = await service.getAccountStatus('TESTADDRESS123456789');

      expect(status.balance).toBeDefined();
      expect(status.lastActivity).toBeDefined();
    });
  });

  describe('isAccountReady', () => {
    it('should return true for active account', async () => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TESTADDRESS123456789',
      }));

      const isReady = await service.isAccountReady('TESTADDRESS123456789');

      expect(isReady).toBe(true);
    });

    it('should return false for inactive account', async () => {
      const isReady = await service.isAccountReady('TESTADDRESS123456789');

      expect(isReady).toBe(false);
    });
  });

  describe('waitForAccountReady', () => {
    it('should return true when account becomes active', async () => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TESTADDRESS123456789',
      }));

      const result = await service.waitForAccountReady('TESTADDRESS123456789');

      expect(result).toBe(true);
    });

    it('should call progress callback with status updates', async () => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TESTADDRESS123456789',
      }));

      const onProgress = vi.fn();
      await service.waitForAccountReady('TESTADDRESS123456789', onProgress);

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith('active');
    });
  });

  describe('error handling', () => {
    it('should throw AccountProvisioningError on failure', async () => {
      // Mock random to always fail
      const originalRandom = Math.random;
      Math.random = () => 0.01; // Will trigger failure in mock

      const request: AccountProvisioningRequest = {
        email: 'test@example.com',
        derivedAddress: 'TESTADDRESS123456789',
      };

      await expect(service.provisionAccount(request)).rejects.toThrow(
        AccountProvisioningError
      );

      Math.random = originalRandom;
    });

    it('should include error code and recoverable flag', async () => {
      const originalRandom = Math.random;
      Math.random = () => 0.01;

      const request: AccountProvisioningRequest = {
        email: 'test@example.com',
        derivedAddress: 'TESTADDRESS123456789',
      };

      try {
        await service.provisionAccount(request);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AccountProvisioningError);
        const provError = error as AccountProvisioningError;
        expect(provError.code).toBeDefined();
        expect(provError.recoverable).toBeDefined();
      }

      Math.random = originalRandom;
    });
  });
});
