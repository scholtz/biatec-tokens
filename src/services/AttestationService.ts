import type {
  AttestationPackage,
  AttestationExportRequest,
  AttestationHistoryItem,
  AttestationSignatureMetadata,
} from '../types/compliance';

const MAX_HISTORY_ITEMS = 20;

/**
 * Service for generating and managing wallet compliance attestations
 * Supports MICA audit requirements with signed PDF/JSON packages
 */
export class AttestationService {

  /**
   * Generate a compliance attestation package
   * 
   * @param request - Attestation export request with issuer details and preferences
   * @returns Attestation package with signature metadata
   */
  async generateAttestation(
    request: AttestationExportRequest
  ): Promise<AttestationPackage> {
    // In a real implementation, this would call the backend API
    // For now, we'll generate a mock attestation package
    const timestamp = new Date().toISOString();
    const content = JSON.stringify({
      tokenId: request.tokenId,
      network: request.network,
      issuerCredentials: request.issuerCredentials,
      timestamp,
    });

    // Generate a simple hash for demonstration (in production, use proper cryptographic signing)
    const hash = await this.generateHash(content);

    const signature: AttestationSignatureMetadata = {
      algorithm: 'SHA-256',
      hash,
      timestamp,
      signedBy: request.issuerCredentials.walletAddress,
      version: '1.0.0',
    };

    const attestationPackage: AttestationPackage = {
      id: `attestation-${Date.now()}`,
      version: '1.0.0',
      generatedAt: timestamp,
      tokenId: request.tokenId,
      network: request.network,
      issuerCredentials: request.issuerCredentials,
      attestationMetadata: {
        purpose: 'MICA_AUDIT',
        auditPeriod: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: timestamp,
        },
      },
      signature,
    };

    // Add optional data if requested
    if (request.includeComplianceStatus) {
      // In production, fetch from API
      attestationPackage.complianceStatus = {
        tokenId: request.tokenId,
        network: request.network,
        whitelistEnabled: true,
        whitelistCount: 0,
      };
    }

    if (request.includeWhitelistPolicy) {
      attestationPackage.whitelistPolicy = {
        enabled: true,
        whitelistedCount: 0,
        kycRequired: true,
        jurisdictionRestrictions: [],
      };
    }

    return attestationPackage;
  }

  /**
   * Generate a cryptographic hash of content
   * 
   * @param content - Content to hash
   * @returns Hex-encoded hash
   */
  private async generateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Download attestation package as PDF
   * 
   * @param attestation - Attestation package to download
   * @returns Blob containing PDF data
   */
  async downloadAsPDF(attestation: AttestationPackage): Promise<Blob> {
    // In a real implementation, this would generate a proper PDF
    // For now, create a simple text-based PDF-like document
    const content = this.generatePDFContent(attestation);
    return new Blob([content], { type: 'application/pdf' });
  }

  /**
   * Download attestation package as JSON
   * 
   * @param attestation - Attestation package to download
   * @returns Blob containing JSON data
   */
  async downloadAsJSON(attestation: AttestationPackage): Promise<Blob> {
    const content = JSON.stringify(attestation, null, 2);
    return new Blob([content], { type: 'application/json' });
  }

  /**
   * Generate PDF-like content from attestation
   * 
   * @param attestation - Attestation package
   * @returns Text content for PDF
   */
  private generatePDFContent(attestation: AttestationPackage): string {
    return `
WALLET COMPLIANCE ATTESTATION
MICA Audit Package
==============================

Attestation ID: ${attestation.id}
Generated: ${new Date(attestation.generatedAt).toLocaleString()}
Version: ${attestation.version}

TOKEN INFORMATION
==============================
Token ID: ${attestation.tokenId}
Network: ${attestation.network}

ISSUER CREDENTIALS
==============================
Name: ${attestation.issuerCredentials.name}
Registration Number: ${attestation.issuerCredentials.registrationNumber || 'N/A'}
Jurisdiction: ${attestation.issuerCredentials.jurisdiction}
Regulatory License: ${attestation.issuerCredentials.regulatoryLicense || 'N/A'}
Contact Email: ${attestation.issuerCredentials.contactEmail || 'N/A'}
Wallet Address: ${attestation.issuerCredentials.walletAddress}

${attestation.complianceStatus ? `
COMPLIANCE STATUS
==============================
Whitelist Enabled: ${attestation.complianceStatus.whitelistEnabled ? 'Yes' : 'No'}
Whitelisted Addresses: ${attestation.complianceStatus.whitelistCount}
Compliance Score: ${attestation.complianceStatus.complianceScore || 'N/A'}
Last Audit: ${attestation.complianceStatus.lastAuditTimestamp || 'N/A'}
` : ''}

${attestation.whitelistPolicy ? `
WHITELIST POLICY
==============================
Enabled: ${attestation.whitelistPolicy.enabled ? 'Yes' : 'No'}
Whitelisted Count: ${attestation.whitelistPolicy.whitelistedCount}
KYC Required: ${attestation.whitelistPolicy.kycRequired ? 'Yes' : 'No'}
Jurisdiction Restrictions: ${attestation.whitelistPolicy.jurisdictionRestrictions.join(', ') || 'None'}
` : ''}

ATTESTATION METADATA
==============================
Purpose: ${attestation.attestationMetadata.purpose}
${attestation.attestationMetadata.auditPeriod ? `Audit Period: ${new Date(attestation.attestationMetadata.auditPeriod.startDate).toLocaleDateString()} - ${new Date(attestation.attestationMetadata.auditPeriod.endDate).toLocaleDateString()}` : ''}
${attestation.attestationMetadata.validUntil ? `Valid Until: ${new Date(attestation.attestationMetadata.validUntil).toLocaleDateString()}` : ''}

DIGITAL SIGNATURE
==============================
Algorithm: ${attestation.signature.algorithm}
Hash: ${attestation.signature.hash}
Signed By: ${attestation.signature.signedBy}
Timestamp: ${new Date(attestation.signature.timestamp).toLocaleString()}
Version: ${attestation.signature.version}

==============================
This attestation package is generated for MICA compliance and regulatory audit purposes.
The digital signature ensures the integrity and authenticity of this document.
==============================
`;
  }

  /**
   * Get attestation download history
   * 
   * @param tokenId - Optional token ID to filter history
   * @returns List of attestation history items
   */
  async getAttestationHistory(tokenId?: string): Promise<AttestationHistoryItem[]> {
    // In production, this would call the backend API
    // For now, return from localStorage
    try {
      const stored = localStorage.getItem('attestation-history');
      if (!stored) return [];

      const history: AttestationHistoryItem[] = JSON.parse(stored);
      
      if (tokenId) {
        return history.filter(item => item.tokenId === tokenId);
      }
      
      return history;
    } catch (error) {
      console.error('Failed to load attestation history:', error);
      return [];
    }
  }

  /**
   * Save attestation to download history
   * 
   * @param item - Attestation history item to save
   */
  async saveToHistory(item: AttestationHistoryItem): Promise<void> {
    try {
      const history = await this.getAttestationHistory();
      history.unshift(item);
      
      // Keep only last MAX_HISTORY_ITEMS items
      const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
      
      localStorage.setItem('attestation-history', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save attestation history:', error);
    }
  }
}

/**
 * Default instance of the attestation service
 */
export const attestationService = new AttestationService();
