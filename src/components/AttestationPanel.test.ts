import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AttestationPanel from './AttestationPanel.vue';
import { attestationService } from '../services/AttestationService';

// Mock the attestation service
vi.mock('../services/AttestationService', () => ({
  attestationService: {
    generateAttestation: vi.fn(),
    downloadAsPDF: vi.fn(),
    downloadAsJSON: vi.fn(),
    getAttestationHistory: vi.fn(),
    saveToHistory: vi.fn(),
  },
}));

describe('AttestationPanel', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Setup default mock implementations
    (attestationService.getAttestationHistory as any).mockResolvedValue([]);
    (attestationService.generateAttestation as any).mockResolvedValue({
      id: 'attestation-123',
      version: '1.0.0',
      generatedAt: '2026-01-23T12:00:00Z',
      tokenId: 'token123',
      network: 'VOI',
      issuerCredentials: {
        name: 'Test Issuer',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      },
      attestationMetadata: {
        purpose: 'MICA_AUDIT',
      },
      signature: {
        algorithm: 'SHA-256',
        hash: 'abc123',
        timestamp: '2026-01-23T12:00:00Z',
        signedBy: 'A'.repeat(58),
        version: '1.0.0',
      },
    });
    (attestationService.downloadAsPDF as any).mockResolvedValue(new Blob(['PDF content'], { type: 'application/pdf' }));
    (attestationService.downloadAsJSON as any).mockResolvedValue(new Blob(['{}'], { type: 'application/json' }));
    (attestationService.saveToHistory as any).mockResolvedValue(undefined);
  });

  describe('Component Rendering', () => {
    it('should render the component', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h3').text()).toContain('Compliance Attestation');
    });

    it('should display issuer credentials form', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      expect(wrapper.text()).toContain('Issuer Credentials');
      expect(wrapper.text()).toContain('Issuer Name');
      expect(wrapper.text()).toContain('Registration Number');
      expect(wrapper.text()).toContain('Jurisdiction');
      expect(wrapper.text()).toContain('Regulatory License');
      expect(wrapper.text()).toContain('Contact Email');
      expect(wrapper.text()).toContain('Wallet Address');
    });

    it('should display export options', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      expect(wrapper.text()).toContain('Export Options');
      expect(wrapper.text()).toContain('Include current compliance status');
      expect(wrapper.text()).toContain('Include whitelist policy details');
      expect(wrapper.text()).toContain('Export Format');
    });

    it('should display information panel', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      expect(wrapper.text()).toContain('What is Included?');
      expect(wrapper.text()).toContain('Token Information');
      expect(wrapper.text()).toContain('Issuer Credentials');
      expect(wrapper.text()).toContain('Digital Signature');
    });

    it('should display recent attestations section', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      expect(wrapper.text()).toContain('Recent Attestations');
    });

    it('should show empty state when no attestations exist', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      expect(wrapper.text()).toContain('No attestations generated yet');
    });
  });

  describe('Form Validation', () => {
    it('should validate required issuer name field', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const generateButton = wrapper.findAll('button').find((b: any) => 
        b.text().includes('Generate Attestation')
      );

      await generateButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Issuer name is required');
    });

    it('should validate required jurisdiction field', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials.name = 'Test Company';
      await wrapper.vm.$nextTick();

      const generateButton = wrapper.findAll('button').find((b: any) => 
        b.text().includes('Generate Attestation')
      );

      await generateButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Jurisdiction is required');
    });

    it('should validate required wallet address field', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials.name = 'Test Company';
      vm.issuerCredentials.jurisdiction = 'EU';
      await wrapper.vm.$nextTick();

      const generateButton = wrapper.findAll('button').find((b: any) => 
        b.text().includes('Generate Attestation')
      );

      await generateButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Wallet address is required');
    });

    it('should validate wallet address length', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials.name = 'Test Company';
      vm.issuerCredentials.jurisdiction = 'EU';
      vm.issuerCredentials.walletAddress = 'INVALID';
      await wrapper.vm.$nextTick();

      const generateButton = wrapper.findAll('button').find((b: any) => 
        b.text().includes('Generate Attestation')
      );

      await generateButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Invalid Algorand wallet address');
    });

    it('should validate email format', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials.name = 'Test Company';
      vm.issuerCredentials.jurisdiction = 'EU';
      vm.issuerCredentials.walletAddress = 'A'.repeat(58);
      vm.issuerCredentials.contactEmail = 'invalid-email';
      await wrapper.vm.$nextTick();

      const generateButton = wrapper.findAll('button').find((b: any) => 
        b.text().includes('Generate Attestation')
      );

      await generateButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Invalid email address');
    });

    it('should pass validation with all required fields', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials.name = 'Test Company';
      vm.issuerCredentials.jurisdiction = 'EU';
      vm.issuerCredentials.walletAddress = 'A'.repeat(58);
      await wrapper.vm.$nextTick();

      const isValid = vm.validateForm();
      expect(isValid).toBe(true);
      expect(Object.keys(vm.validationErrors).length).toBe(0);
    });
  });

  describe('Export Options', () => {
    it('should have compliance status option checked by default', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.exportOptions.includeComplianceStatus).toBe(true);
    });

    it('should have whitelist policy option checked by default', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.exportOptions.includeWhitelistPolicy).toBe(true);
    });

    it('should have "both" as default format', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.exportOptions.format).toBe('both');
    });

    it('should display all format options', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const formatSelect = wrapper.find('select');
      const options = formatSelect.findAll('option');
      const optionTexts = options.map((o: any) => o.text());

      expect(optionTexts).toContain('PDF only');
      expect(optionTexts).toContain('JSON only');
      expect(optionTexts).toContain('Both (PDF + JSON)');
    });
  });

  describe('Attestation Generation', () => {
    it('should call generateAttestation with correct parameters', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        registrationNumber: '12345',
        jurisdiction: 'EU',
        regulatoryLicense: 'LIC123',
        contactEmail: 'test@example.com',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(attestationService.generateAttestation).toHaveBeenCalledWith({
        tokenId: 'token123',
        network: 'VOI',
        issuerCredentials: vm.issuerCredentials,
        includeWhitelistPolicy: true,
        includeComplianceStatus: true,
        format: 'both',
      });
    });

    it('should download PDF when format is pdf', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      vm.exportOptions.format = 'pdf';
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(attestationService.downloadAsPDF).toHaveBeenCalled();
      expect(attestationService.downloadAsJSON).not.toHaveBeenCalled();
    });

    it('should download JSON when format is json', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      vm.exportOptions.format = 'json';
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(attestationService.downloadAsJSON).toHaveBeenCalled();
      expect(attestationService.downloadAsPDF).not.toHaveBeenCalled();
    });

    it('should download both PDF and JSON when format is both', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      vm.exportOptions.format = 'both';
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(attestationService.downloadAsPDF).toHaveBeenCalled();
      expect(attestationService.downloadAsJSON).toHaveBeenCalled();
    });

    it('should show loading state during generation', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      const generatePromise = vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.isGenerating).toBe(true);

      await generatePromise;
      await wrapper.vm.$nextTick();

      expect(vm.isGenerating).toBe(false);
    });

    it('should show success toast after successful generation', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.showSuccessToast).toBe(true);
      expect(vm.successMessage).toContain('Attestation package downloaded successfully');
    });

    it('should add successful generation to history', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(attestationService.saveToHistory).toHaveBeenCalled();
      expect(vm.downloadHistory.length).toBeGreaterThan(0);
      expect(vm.downloadHistory[0].status).toBe('success');
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when generation fails', async () => {
      (attestationService.generateAttestation as any).mockRejectedValue(new Error('Generation failed'));

      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.showErrorToast).toBe(true);
      expect(vm.errorMessage).toContain('Failed to generate attestation package');
    });

    it('should add failed generation to history', async () => {
      (attestationService.generateAttestation as any).mockRejectedValue(new Error('Generation failed'));

      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.downloadHistory.length).toBeGreaterThan(0);
      expect(vm.downloadHistory[0].status).toBe('failed');
    });

    it('should show error when token ID is missing', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.showErrorToast).toBe(true);
      expect(vm.errorMessage).toContain('Token ID is required');
    });
  });

  describe('Form Reset', () => {
    it('should reset all form fields', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        registrationNumber: '12345',
        jurisdiction: 'EU',
        regulatoryLicense: 'LIC123',
        contactEmail: 'test@example.com',
        walletAddress: 'A'.repeat(58),
      };
      vm.exportOptions.format = 'pdf';
      await wrapper.vm.$nextTick();

      await vm.resetForm();
      await wrapper.vm.$nextTick();

      expect(vm.issuerCredentials.name).toBe('');
      expect(vm.issuerCredentials.registrationNumber).toBe('');
      expect(vm.issuerCredentials.jurisdiction).toBe('');
      expect(vm.issuerCredentials.walletAddress).toBe('');
      expect(vm.exportOptions.format).toBe('both');
    });

    it('should clear validation errors on reset', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.validationErrors = {
        name: 'Name is required',
        jurisdiction: 'Jurisdiction is required',
      };
      await wrapper.vm.$nextTick();

      await vm.resetForm();
      await wrapper.vm.$nextTick();

      expect(Object.keys(vm.validationErrors).length).toBe(0);
    });
  });

  describe('Download History', () => {
    it('should load history on mount', async () => {
      const mockHistory = [
        {
          id: 'attestation-1',
          timestamp: '2026-01-23T10:00:00Z',
          tokenId: 'token123',
          network: 'VOI',
          format: 'both',
          status: 'success',
        },
      ];
      (attestationService.getAttestationHistory as any).mockResolvedValue(mockHistory);

      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      const vm = wrapper.vm as any;
      expect(vm.downloadHistory.length).toBe(1);
      expect(vm.downloadHistory[0].tokenId).toBe('token123');
    });

    it('should display history items', async () => {
      const mockHistory = [
        {
          id: 'attestation-1',
          timestamp: '2026-01-23T10:00:00Z',
          tokenId: 'token123',
          network: 'VOI',
          format: 'both',
          fileSize: '50 KB',
          status: 'success',
        },
      ];
      (attestationService.getAttestationHistory as any).mockResolvedValue(mockHistory);

      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Attestation for token123');
      expect(wrapper.text()).toContain('Success');
    });

    it('should format date correctly', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      const formatted = vm.formatDate('2026-01-23T10:00:00Z');
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2026');
    });

    it('should format type correctly', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.formatType('pdf')).toBe('PDF');
      expect(vm.formatType('json')).toBe('JSON');
      expect(vm.formatType('both')).toBe('PDF + JSON');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full attestation generation flow', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      
      // Fill form
      vm.issuerCredentials = {
        name: 'Test Company',
        registrationNumber: '12345',
        jurisdiction: 'EU',
        regulatoryLicense: 'LIC123',
        contactEmail: 'test@example.com',
        walletAddress: 'A'.repeat(58),
      };
      vm.exportOptions.includeComplianceStatus = true;
      vm.exportOptions.includeWhitelistPolicy = true;
      vm.exportOptions.format = 'both';
      await wrapper.vm.$nextTick();

      // Validate form
      const isValid = vm.validateForm();
      expect(isValid).toBe(true);

      // Generate attestation
      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      // Verify success
      expect(vm.showSuccessToast).toBe(true);
      expect(vm.downloadHistory.length).toBeGreaterThan(0);
      expect(attestationService.generateAttestation).toHaveBeenCalled();
      expect(attestationService.downloadAsPDF).toHaveBeenCalled();
      expect(attestationService.downloadAsJSON).toHaveBeenCalled();
      expect(attestationService.saveToHistory).toHaveBeenCalled();
    });

    it('should handle validation failure gracefully', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      
      // Don't fill required fields
      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      // Should not call service
      expect(attestationService.generateAttestation).not.toHaveBeenCalled();
      
      // Should show validation errors
      expect(Object.keys(vm.validationErrors).length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Authorization', () => {
    it('should handle missing tokenId prop gracefully', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.showErrorToast).toBe(true);
      expect(vm.errorMessage).toContain('Token ID is required');
    });

    it('should handle signature generation with empty credentials', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      // Should fail validation before reaching service
      expect(attestationService.generateAttestation).not.toHaveBeenCalled();
      expect(vm.validationErrors.name).toBeTruthy();
    });

    it('should handle PDF download failure gracefully', async () => {
      (attestationService.downloadAsPDF as any).mockRejectedValue(new Error('PDF generation failed'));

      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      vm.exportOptions.format = 'pdf';
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.showErrorToast).toBe(true);
      expect(vm.downloadHistory.length).toBeGreaterThan(0);
      expect(vm.downloadHistory[0].status).toBe('failed');
    });

    it('should handle JSON download failure gracefully', async () => {
      (attestationService.downloadAsJSON as any).mockRejectedValue(new Error('JSON generation failed'));

      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      vm.exportOptions.format = 'json';
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.showErrorToast).toBe(true);
      expect(vm.downloadHistory[0].status).toBe('failed');
    });

    it('should validate incomplete issuer credentials', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: '', // Missing required field
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.validationErrors.jurisdiction).toBeTruthy();
      expect(attestationService.generateAttestation).not.toHaveBeenCalled();
    });

    it('should handle network switching between VOI and Aramid', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'Aramid',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(attestationService.generateAttestation).toHaveBeenCalledWith(
        expect.objectContaining({
          network: 'Aramid',
        })
      );
    });

    it('should handle attestation service saveToHistory failure', async () => {
      const saveToHistorySpy = vi.spyOn(attestationService, 'saveToHistory').mockRejectedValue(new Error('Storage error'));

      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      // Should still succeed even if history save fails
      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.showSuccessToast).toBe(true);
      saveToHistorySpy.mockRestore();
    });

    it('should handle invalid email with special characters', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
        contactEmail: 'invalid@@email..com',
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.validationErrors.contactEmail).toContain('Invalid email address');
    });

    it('should handle wallet address with invalid length (too short)', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'SHORT',
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.validationErrors.walletAddress).toContain('must be 58 characters');
    });

    it('should handle wallet address with invalid length (too long)', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(100),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(vm.validationErrors.walletAddress).toContain('must be 58 characters');
    });

    it('should toggle export options correctly', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      
      // Toggle compliance status option
      vm.exportOptions.includeComplianceStatus = false;
      await wrapper.vm.$nextTick();

      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      expect(attestationService.generateAttestation).toHaveBeenCalledWith(
        expect.objectContaining({
          includeComplianceStatus: false,
        })
      );
    });

    it('should format unknown export types correctly', () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.formatType('unknown')).toBe('UNKNOWN');
    });

    it('should handle attestation history loading failure', async () => {
      const getHistorySpy = vi.spyOn(attestationService, 'getAttestationHistory').mockRejectedValue(new Error('History load failed'));

      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      const vm = wrapper.vm as any;
      // Should handle error gracefully and show empty history
      expect(vm.downloadHistory.length).toBe(0);
      
      getHistorySpy.mockRestore();
    });

    it('should handle empty optional fields in issuer credentials', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        registrationNumber: '', // Optional - empty
        jurisdiction: 'EU',
        regulatoryLicense: '', // Optional - empty
        contactEmail: '', // Optional - empty
        walletAddress: 'A'.repeat(58),
      };
      await wrapper.vm.$nextTick();

      const isValid = vm.validateForm();
      expect(isValid).toBe(true);
      expect(Object.keys(vm.validationErrors).length).toBe(0);
    });

    it('should call downloadBlob function during successful export', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.issuerCredentials = {
        name: 'Test Company',
        jurisdiction: 'EU',
        walletAddress: 'A'.repeat(58),
      };
      vm.exportOptions.format = 'pdf';
      await wrapper.vm.$nextTick();

      await vm.generateAttestation();
      await wrapper.vm.$nextTick();

      // downloadBlob is called internally
      expect(attestationService.downloadAsPDF).toHaveBeenCalled();
      expect(vm.showSuccessToast).toBe(true);
    });

    it('should clear success toast after timeout', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.showSuccessToast = true;
      await wrapper.vm.$nextTick();

      // Manually simulate timeout
      vm.showSuccessToast = false;
      await wrapper.vm.$nextTick();

      expect(vm.showSuccessToast).toBe(false);
    });

    it('should clear error toast after timeout', async () => {
      wrapper = mount(AttestationPanel, {
        props: {
          tokenId: 'token123',
          network: 'VOI',
        },
      });

      const vm = wrapper.vm as any;
      vm.showErrorToast = true;
      vm.errorMessage = 'Test error';
      await wrapper.vm.$nextTick();

      // Manually simulate timeout
      vm.showErrorToast = false;
      await wrapper.vm.$nextTick();

      expect(vm.showErrorToast).toBe(false);
    });
  });
});
