import { getApiClient } from './BiatecTokensApiClient';

/**
 * Represents a whitelisted address
 */
export interface WhitelistEntry {
  address: string;
  status: 'active' | 'pending' | 'removed';
  addedAt: string;
  updatedAt?: string;
  addedBy?: string;
  notes?: string;
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
   * Add a single address to the whitelist
   * @param tokenId - The token identifier
   * @param address - The address to whitelist
   * @param notes - Optional notes about the address
   */
  async addAddress(
    tokenId: string,
    address: string,
    notes?: string
  ): Promise<WhitelistEntry> {
    return this.apiClient.post<WhitelistEntry>(`/tokens/${tokenId}/whitelist`, {
      address,
      notes,
    });
  }

  /**
   * Remove an address from the whitelist
   * @param tokenId - The token identifier
   * @param address - The address to remove
   */
  async removeAddress(tokenId: string, address: string): Promise<void> {
    return this.apiClient.delete(`/tokens/${tokenId}/whitelist/${address}`);
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
}

/**
 * Default instance of the whitelist service
 */
export const whitelistService = new WhitelistService();
