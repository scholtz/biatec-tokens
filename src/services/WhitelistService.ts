import { getApiClient } from './BiatecTokensApiClient';

/**
 * Represents a whitelisted address with MICA compliance metadata
 */
export interface WhitelistEntry {
  address: string;
  status: 'active' | 'pending' | 'removed';
  addedAt: string;
  updatedAt?: string;
  addedBy?: string;
  notes?: string;
  // MICA compliance metadata
  reason?: string;
  requester?: string;
  kycVerified?: boolean;
  jurisdictionCode?: string;
  complianceChecks?: {
    sanctionsScreening?: boolean;
    amlVerification?: boolean;
    accreditedInvestor?: boolean;
  };
  documentIds?: string[];
}

/**
 * Result of CSV upload validation
 */
export interface CsvValidationResult {
  valid: boolean;
  row: number;
  address: string;
  error?: string;
}

/**
 * Response from bulk upload
 */
export interface BulkUploadResponse {
  success: number;
  failed: number;
  results: CsvValidationResult[];
}

/**
 * MICA compliance report for export
 */
export interface MicaComplianceReport {
  reportId: string;
  tokenId: string;
  network: string;
  generatedAt: string;
  generatedBy: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalWhitelisted: number;
    activeAddresses: number;
    pendingAddresses: number;
    removedAddresses: number;
    kycVerifiedCount: number;
    complianceScore: number;
  };
  entries: WhitelistEntry[];
  auditTrail: AuditEntry[];
  complianceMetrics: {
    sanctionsScreeningRate: number;
    amlVerificationRate: number;
    jurisdictionCoverage: Record<string, number>;
  };
}

/**
 * Audit entry for tracking whitelist changes
 */
export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'add' | 'remove' | 'update' | 'bulk_import';
  address: string;
  performedBy: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for managing RWA token whitelist
 */
export class WhitelistService {
  private apiClient = getApiClient();

  /**
   * Get all whitelisted addresses for a token
   * @param tokenId - The token identifier
   * @param filters - Optional filters (search, status)
   */
  async getWhitelist(
    tokenId: string,
    filters?: { search?: string; status?: string }
  ): Promise<WhitelistEntry[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.apiClient.get<WhitelistEntry[]>(`/tokens/${tokenId}/whitelist${query}`);
  }

  /**
   * Add a single address to the whitelist with MICA compliance metadata
   * @param tokenId - The token identifier
   * @param address - The address to whitelist
   * @param metadata - MICA compliance metadata
   */
  async addAddress(
    tokenId: string,
    address: string,
    metadata?: {
      notes?: string;
      reason?: string;
      requester?: string;
      kycVerified?: boolean;
      jurisdictionCode?: string;
      complianceChecks?: {
        sanctionsScreening?: boolean;
        amlVerification?: boolean;
        accreditedInvestor?: boolean;
      };
      documentIds?: string[];
    }
  ): Promise<WhitelistEntry> {
    return this.apiClient.post<WhitelistEntry>(`/tokens/${tokenId}/whitelist`, {
      address,
      ...metadata,
    });
  }

  /**
   * Remove an address from the whitelist with audit metadata
   * @param tokenId - The token identifier
   * @param address - The address to remove
   * @param reason - Reason for removal (MICA compliance requirement)
   */
  async removeAddress(
    tokenId: string,
    address: string,
    reason?: string
  ): Promise<void> {
    return this.apiClient.delete(`/tokens/${tokenId}/whitelist/${address}`, {
      data: { reason },
    });
  }

  /**
   * Upload multiple addresses via CSV
   * @param tokenId - The token identifier
   * @param csvData - CSV content with addresses
   */
  async bulkUpload(tokenId: string, csvData: string): Promise<BulkUploadResponse> {
    return this.apiClient.post<BulkUploadResponse>(`/tokens/${tokenId}/whitelist/bulk`, {
      csvData,
    });
  }

  /**
   * Validate CSV format without uploading
   * @param csvData - CSV content to validate
   */
  async validateCsv(csvData: string): Promise<CsvValidationResult[]> {
    const results: CsvValidationResult[] = [];
    const lines = csvData.split('\n').filter(line => line.trim());
    
    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes('address') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      const address = line.split(',')[0].trim();
      
      if (!address) {
        results.push({
          valid: false,
          row: i + 1,
          address: '',
          error: 'Empty address',
        });
        continue;
      }
      
      // Basic Algorand address validation (58 characters)
      const isValidAlgorand = /^[A-Z2-7]{58}$/.test(address);
      // Basic Ethereum address validation (42 characters starting with 0x)
      const isValidEthereum = /^0x[a-fA-F0-9]{40}$/.test(address);
      
      if (!isValidAlgorand && !isValidEthereum) {
        results.push({
          valid: false,
          row: i + 1,
          address,
          error: 'Invalid address format',
        });
      } else {
        results.push({
          valid: true,
          row: i + 1,
          address,
        });
      }
    }
    
    return results;
  }

  /**
   * Export MICA-compliant compliance report
   * @param tokenId - The token identifier
   * @param network - Network identifier
   * @param format - Export format (json or csv)
   */
  async exportComplianceReport(
    tokenId: string,
    network: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<MicaComplianceReport | string> {
    try {
      const report = await this.apiClient.get<MicaComplianceReport>(
        `/tokens/${tokenId}/whitelist/export?network=${network}&format=${format}`
      );
      return report;
    } catch (error) {
      // Fallback: Generate report locally if API is not available
      const entries = await this.getWhitelist(tokenId);
      const report = this.generateLocalReport(tokenId, network, entries);
      
      if (format === 'csv') {
        return this.convertReportToCsv(report);
      }
      return report;
    }
  }

  /**
   * Import addresses from CSV with MICA metadata
   * @param tokenId - The token identifier
   * @param csvData - CSV content with MICA compliance columns
   */
  async importFromCsv(tokenId: string, csvData: string): Promise<BulkUploadResponse> {
    const results: CsvValidationResult[] = [];
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { success: 0, failed: 0, results: [] };
    }

    // Parse header to detect MICA metadata columns
    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const addressIndex = header.findIndex(h => h === 'address');
    const reasonIndex = header.findIndex(h => h === 'reason');
    const requesterIndex = header.findIndex(h => h === 'requester');
    const notesIndex = header.findIndex(h => h === 'notes');
    const kycVerifiedIndex = header.findIndex(h => h === 'kyc_verified' || h === 'kycverified');
    const jurisdictionIndex = header.findIndex(h => h === 'jurisdiction' || h === 'jurisdiction_code');

    if (addressIndex === -1) {
      throw new Error('CSV must contain an "address" column');
    }

    let successCount = 0;
    let failedCount = 0;

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',').map(c => c.trim());
      const address = columns[addressIndex];

      if (!address) {
        results.push({
          valid: false,
          row: i + 1,
          address: '',
          error: 'Empty address',
        });
        failedCount++;
        continue;
      }

      // Basic address validation
      const isValidAlgorand = /^[A-Z2-7]{58}$/.test(address);
      const isValidEthereum = /^0x[a-fA-F0-9]{40}$/.test(address);

      if (!isValidAlgorand && !isValidEthereum) {
        results.push({
          valid: false,
          row: i + 1,
          address,
          error: 'Invalid address format',
        });
        failedCount++;
        continue;
      }

      try {
        // Extract MICA metadata from CSV
        const metadata = {
          reason: reasonIndex >= 0 ? columns[reasonIndex] : undefined,
          requester: requesterIndex >= 0 ? columns[requesterIndex] : undefined,
          notes: notesIndex >= 0 ? columns[notesIndex] : undefined,
          kycVerified: kycVerifiedIndex >= 0 ? columns[kycVerifiedIndex]?.toLowerCase() === 'true' : undefined,
          jurisdictionCode: jurisdictionIndex >= 0 ? columns[jurisdictionIndex] : undefined,
        };

        await this.addAddress(tokenId, address, metadata);
        
        results.push({
          valid: true,
          row: i + 1,
          address,
        });
        successCount++;
      } catch (err: any) {
        results.push({
          valid: false,
          row: i + 1,
          address,
          error: err.message || 'Failed to add address',
        });
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, results };
  }

  /**
   * Generate a local compliance report
   * @private
   */
  private generateLocalReport(
    tokenId: string,
    network: string,
    entries: WhitelistEntry[]
  ): MicaComplianceReport {
    const now = new Date().toISOString();
    const activeEntries = entries.filter(e => e.status === 'active');
    const pendingEntries = entries.filter(e => e.status === 'pending');
    const removedEntries = entries.filter(e => e.status === 'removed');
    const kycVerifiedEntries = entries.filter(e => e.kycVerified);

    // Calculate compliance metrics
    const sanctionsScreeningRate = entries.filter(
      e => e.complianceChecks?.sanctionsScreening
    ).length / entries.length * 100;
    
    const amlVerificationRate = entries.filter(
      e => e.complianceChecks?.amlVerification
    ).length / entries.length * 100;

    // Jurisdiction coverage
    const jurisdictionCoverage: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.jurisdictionCode) {
        jurisdictionCoverage[entry.jurisdictionCode] = 
          (jurisdictionCoverage[entry.jurisdictionCode] || 0) + 1;
      }
    });

    // Calculate compliance score (0-100)
    const complianceScore = Math.round(
      (kycVerifiedEntries.length / entries.length * 0.4 +
       sanctionsScreeningRate * 0.3 +
       amlVerificationRate * 0.3)
    );

    return {
      reportId: `report_${Date.now()}`,
      tokenId,
      network,
      generatedAt: now,
      generatedBy: 'system',
      reportPeriod: {
        startDate: entries[0]?.addedAt || now,
        endDate: now,
      },
      summary: {
        totalWhitelisted: entries.length,
        activeAddresses: activeEntries.length,
        pendingAddresses: pendingEntries.length,
        removedAddresses: removedEntries.length,
        kycVerifiedCount: kycVerifiedEntries.length,
        complianceScore,
      },
      entries,
      auditTrail: [],
      complianceMetrics: {
        sanctionsScreeningRate,
        amlVerificationRate,
        jurisdictionCoverage,
      },
    };
  }

  /**
   * Convert compliance report to CSV format
   * @private
   */
  private convertReportToCsv(report: MicaComplianceReport): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Address,Status,Added At,Added By,Reason,Requester,KYC Verified,Jurisdiction,Notes');
    
    // Data rows
    report.entries.forEach(entry => {
      const row = [
        entry.address,
        entry.status,
        entry.addedAt,
        entry.addedBy || '',
        entry.reason || '',
        entry.requester || '',
        entry.kycVerified ? 'true' : 'false',
        entry.jurisdictionCode || '',
        entry.notes || '',
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      
      lines.push(row);
    });
    
    return lines.join('\n');
  }
}

/**
 * Default instance of the whitelist service
 */
export const whitelistService = new WhitelistService();
