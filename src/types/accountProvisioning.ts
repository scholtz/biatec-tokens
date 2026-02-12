/**
 * Types for ARC76 account provisioning and status tracking
 */

export type AccountProvisioningStatus =
  | 'not_started'
  | 'provisioning'
  | 'active'
  | 'suspended'
  | 'failed';

export interface AccountProvisioningMetadata {
  email: string;
  derivedAddress: string;
  derivationIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountProvisioningRequest {
  email: string;
  derivedAddress: string;
  derivationIndex?: number;
}

export interface AccountProvisioningResponse {
  status: AccountProvisioningStatus;
  account: {
    address: string;
    email: string;
    balance?: number;
    entitlements?: string[];
  };
  metadata: AccountProvisioningMetadata;
  message?: string;
  error?: string;
}

export interface AccountStatusResponse {
  address: string;
  status: AccountProvisioningStatus;
  balance: number;
  isActive: boolean;
  canDeploy: boolean;
  entitlements: string[];
  lastActivity?: string;
  metadata?: AccountProvisioningMetadata;
}
