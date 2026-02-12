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
      // Create a new service instance and spy on the mock method
      const service = new AccountProvisioningService();
      const mockFn = vi.spyOn(service as any, 'mockProvisionAccount');
      mockFn.mockRejectedValueOnce(new Error('Provisioning failed'));

      const request: AccountProvisioningRequest = {
        email: 'test@example.com',
        derivedAddress: 'TESTADDRESS123456789',
      };

      await expect(service.provisionAccount(request)).rejects.toThrow(
        AccountProvisioningError
      );

      mockFn.mockRestore();
    });

    it('should include error code and recoverable flag', async () => {
      const service = new AccountProvisioningService();
      const mockFn = vi.spyOn(service as any, 'mockProvisionAccount');
      mockFn.mockRejectedValueOnce(new Error('Provisioning failed'));

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

      mockFn.mockRestore();
    });

    it('should handle AccountProvisioningError pass-through', async () => {
      const service = new AccountProvisioningService();
      const mockFn = vi.spyOn(service as any, 'mockProvisionAccount');
      const customError = new AccountProvisioningError('Custom error', 'CUSTOM_CODE', 400, false);
      mockFn.mockRejectedValueOnce(customError);

      try {
        await service.provisionAccount({
          email: 'test@example.com',
          derivedAddress: 'VALIDADDRESS1234567890',  // Valid address to pass validation
        });
      } catch (error) {
        expect(error).toBe(customError); // Should be the same instance
        expect((error as AccountProvisioningError).code).toBe('CUSTOM_CODE');
      }

      mockFn.mockRestore();
    });

    it('should handle non-Error objects', async () => {
      const service = new AccountProvisioningService();
      const mockFn = vi.spyOn(service as any, 'mockProvisionAccount');
      mockFn.mockRejectedValueOnce('string error');

      try {
        await service.provisionAccount({
          email: 'test@example.com',
          derivedAddress: 'VALIDADDRESS1234567890',  // Valid address to pass validation
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AccountProvisioningError);
        expect((error as AccountProvisioningError).message).toContain('unknown error');
        expect((error as AccountProvisioningError).code).toBe('UNKNOWN_ERROR');
      }

      mockFn.mockRestore();
    });
  });

  describe('input validation', () => {
    it('should reject provisioning with invalid email', async () => {
      const invalidEmails = [
        '',
        ' ',
        'not-an-email',
        'missing@',
        '@missing.com',
        'spaces in@email.com',
      ];

      for (const invalidEmail of invalidEmails) {
        try {
          await service.provisionAccount({
            email: invalidEmail,
            derivedAddress: 'VALIDADDRESS123',
            derivationIndex: 1,
          });
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(AccountProvisioningError);
          expect((error as AccountProvisioningError).code).toBe('INVALID_INPUT');
          expect((error as AccountProvisioningError).message).toMatch(/email/i);
        }
      }
    });

    it('should reject provisioning with invalid address', async () => {
      const invalidAddresses = [
        '',
        ' ',
        'TOO_SHORT',
        'a'.repeat(100), // Too long
      ];

      for (const invalidAddress of invalidAddresses) {
        try {
          await service.provisionAccount({
            email: 'valid@example.com',
            derivedAddress: invalidAddress,
            derivationIndex: 1,
          });
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(AccountProvisioningError);
          expect((error as AccountProvisioningError).code).toBe('INVALID_INPUT');
          expect((error as AccountProvisioningError).message).toMatch(/address/i);
        }
      }
    });

    it('should reject provisioning with invalid derivation index', async () => {
      const invalidIndexes = [-1, 0, 1000000]; // Negative, zero, too large

      for (const invalidIndex of invalidIndexes) {
        try {
          await service.provisionAccount({
            email: 'valid@example.com',
            derivedAddress: 'VALIDADDRESS123',
            derivationIndex: invalidIndex,
          });
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(AccountProvisioningError);
          expect((error as AccountProvisioningError).code).toBe('INVALID_INPUT');
          expect((error as AccountProvisioningError).message).toMatch(/derivation/i);
        }
      }
    });

    it('should reject provisioning with missing required fields', async () => {
      // Test missing email
      try {
        await service.provisionAccount({
          email: undefined as any,
          derivedAddress: 'VALIDADDRESS123',
          derivationIndex: 1,
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AccountProvisioningError);
        expect((error as AccountProvisioningError).code).toBe('INVALID_INPUT');
      }

      // Test missing address
      try {
        await service.provisionAccount({
          email: 'valid@example.com',
          derivedAddress: undefined as any,
          derivationIndex: 1,
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AccountProvisioningError);
        expect((error as AccountProvisioningError).code).toBe('INVALID_INPUT');
      }
    });

    it('should accept valid inputs', async () => {
      const validInputs = [
        {
          email: 'user@example.com',
          derivedAddress: 'VALIDADDRESS1234567890',
          derivationIndex: 1,
        },
        {
          email: 'another.user+tag@example.co.uk',
          derivedAddress: 'ANOTHERVALIDADDRESS123',
          derivationIndex: 42,
        },
      ];

      for (const input of validInputs) {
        const response = await service.provisionAccount(input);
        expect(response.status).toBe('active');
        expect(response.account.address).toBe(input.derivedAddress);
      }
    });
  });
});
