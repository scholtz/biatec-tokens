/**
 * Account Provisioning Service
 * Handles ARC76 account provisioning and status tracking for backend-only deployment
 */

import type {
  AccountProvisioningRequest,
  AccountProvisioningResponse,
  AccountStatusResponse,
  AccountProvisioningStatus,
} from '../types/accountProvisioning';

export class AccountProvisioningError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AccountProvisioningError';
  }
}

export class AccountProvisioningService {
  private pollingInterval: number = 2000; // 2 seconds
  private maxPollingDuration: number = 60000; // 60 seconds

  /**
   * Provision a new account for the given email and derived address
   * This is called after ARC76 account derivation
   */
  async provisionAccount(
    request: AccountProvisioningRequest
  ): Promise<AccountProvisioningResponse> {
    try {
      // Validate inputs
      this.validateProvisioningRequest(request);
      
      // For MVP, use mock implementation
      // In production, this would call the backend API
      const response = await this.mockProvisionAccount(request);
      
      // Log audit event
      this.logAuditEvent('account_provisioned', {
        email: request.email,
        address: request.derivedAddress,
      });

      return response;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Get current account status
   */
  async getAccountStatus(address: string): Promise<AccountStatusResponse> {
    try {
      // For MVP, use mock implementation
      const response = await this.mockGetAccountStatus(address);
      return response;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Poll account status until it's active or fails
   * Returns true if account is ready for deployment
   */
  async waitForAccountReady(
    address: string,
    onProgress?: (status: AccountProvisioningStatus) => void
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.maxPollingDuration) {
      const status = await this.getAccountStatus(address);
      
      if (onProgress) {
        onProgress(status.status);
      }

      if (status.status === 'active' && status.canDeploy) {
        return true;
      }

      if (status.status === 'failed' || status.status === 'suspended') {
        throw new AccountProvisioningError(
          'Account provisioning failed or suspended',
          'ACCOUNT_NOT_READY',
          400,
          false
        );
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
    }

    throw new AccountProvisioningError(
      'Account provisioning timeout',
      'PROVISIONING_TIMEOUT',
      408,
      true
    );
  }

  /**
   * Check if account is ready for deployment
   */
  async isAccountReady(address: string): Promise<boolean> {
    try {
      const status = await this.getAccountStatus(address);
      return status.status === 'active' && status.canDeploy;
    } catch {
      return false;
    }
  }

  /**
   * Validate provisioning request inputs
   */
  private validateProvisioningRequest(request: AccountProvisioningRequest): void {
    // Validate email
    if (!request.email || typeof request.email !== 'string' || request.email.trim() === '') {
      throw new AccountProvisioningError(
        'Valid email address is required',
        'INVALID_INPUT'
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email.trim())) {
      throw new AccountProvisioningError(
        'Invalid email format',
        'INVALID_INPUT'
      );
    }

    // Validate derived address
    if (!request.derivedAddress || typeof request.derivedAddress !== 'string' || request.derivedAddress.trim() === '') {
      throw new AccountProvisioningError(
        'Valid derived address is required',
        'INVALID_INPUT'
      );
    }

    // Address should be reasonable length (Algorand addresses are 58 chars, Ethereum are 42)
    const addressLength = request.derivedAddress.trim().length;
    if (addressLength < 10 || addressLength > 90) {
      throw new AccountProvisioningError(
        'Derived address length is invalid',
        'INVALID_INPUT'
      );
    }

    // Validate derivation index if provided
    if (request.derivationIndex !== undefined) {
      if (typeof request.derivationIndex !== 'number' || 
          request.derivationIndex < 1 || 
          request.derivationIndex > 999999) {
        throw new AccountProvisioningError(
          'Derivation index must be between 1 and 999999',
          'INVALID_INPUT'
        );
      }
    }
  }

  /**
   * Mock implementation for MVP
   * In production, this would call POST /api/accounts/provision
   */
  private async mockProvisionAccount(
    request: AccountProvisioningRequest
  ): Promise<AccountProvisioningResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Always succeed in tests (check if we're in test environment)
    const shouldSucceed = import.meta.env.MODE === 'test' || Math.random() > 0.05;

    if (!shouldSucceed) {
      throw new Error('Provisioning failed');
    }

    return {
      status: 'active',
      account: {
        address: request.derivedAddress,
        email: request.email,
        balance: 0,
        entitlements: ['token_deployment', 'compliance_reporting'],
      },
      metadata: {
        email: request.email,
        derivedAddress: request.derivedAddress,
        derivationIndex: request.derivationIndex || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: 'Account provisioned successfully',
    };
  }

  /**
   * Mock implementation for MVP
   * In production, this would call GET /api/accounts/{address}/status
   */
  private async mockGetAccountStatus(address: string): Promise<AccountStatusResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check localStorage for existing account data
    const savedUser = localStorage.getItem('algorand_user');
    const isAuthenticated = !!savedUser;

    return {
      address,
      status: isAuthenticated ? 'active' : 'not_started',
      balance: 0,
      isActive: isAuthenticated,
      canDeploy: isAuthenticated,
      entitlements: isAuthenticated ? ['token_deployment', 'compliance_reporting'] : [],
      lastActivity: new Date().toISOString(),
    };
  }

  /**
   * Log audit event (to be integrated with AuditTrailService)
   */
  private logAuditEvent(eventType: string, data: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      console.log('[AccountProvisioning] Audit Event:', eventType, data);
    }
  }

  /**
   * Map error to AccountProvisioningError
   */
  private mapError(error: unknown): AccountProvisioningError {
    if (error instanceof AccountProvisioningError) {
      return error;
    }

    if (error instanceof Error) {
      return new AccountProvisioningError(
        error.message,
        'UNKNOWN_ERROR',
        500,
        true
      );
    }

    return new AccountProvisioningError(
      'An unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      true
    );
  }
}

// Export singleton instance
export const accountProvisioningService = new AccountProvisioningService();
