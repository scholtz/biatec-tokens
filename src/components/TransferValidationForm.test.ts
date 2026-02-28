import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TransferValidationForm from './TransferValidationForm.vue';
import { complianceService } from '../services/ComplianceService';
import type { TransferValidationResponse } from '../types/compliance';

// Mock the compliance service
vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    validateTransfer: vi.fn(),
  },
}));

// Mock useToast composable
vi.mock('../composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('TransferValidationForm', () => {
  const defaultProps = {
    tokenId: 'token123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h3').text()).toContain('Transfer Validation');
    });

    it('should render network selection buttons', () => {
      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const networkButtons = wrapper.findAll('button');
      const voiButton = networkButtons.find(btn => btn.text() === 'VOI');
      const aramidButton = networkButtons.find(btn => btn.text() === 'Aramid');

      expect(voiButton).toBeDefined();
      expect(aramidButton).toBeDefined();
    });

    it('should render sender and receiver address inputs', () => {
      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should render optional amount input', () => {
      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Amount (Optional)');
    });

    it('should disable submit button when addresses are empty', () => {
      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Network Selection', () => {
    it('should select VOI network by default', () => {
      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const networkButtons = wrapper.findAll('button');
      const voiButton = networkButtons.find(btn => btn.text() === 'VOI');
      
      expect(voiButton?.classes()).toContain('bg-biatec-accent');
    });

    it('should switch to Aramid network when clicked', async () => {
      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const networkButtons = wrapper.findAll('button');
      const aramidButton = networkButtons.find(btn => btn.text() === 'Aramid');
      
      await aramidButton?.trigger('click');
      await flushPromises();

      expect(aramidButton?.classes()).toContain('bg-biatec-accent');
    });
  });

  describe('Form Validation', () => {
    it('should enable submit button when addresses are provided', async () => {
      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      await flushPromises();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Transfer Validation', () => {
    it('should call validation service on form submit and show dialog', async () => {
      const mockResponse: TransferValidationResponse = {
        allowed: true,
        reasons: ['Both addresses are whitelisted'],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: true,
          status: 'active',
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          whitelisted: true,
          status: 'active',
        },
        timestamp: '2024-01-15T10:00:00Z',
        details: {
          senderCompliant: true,
          receiverCompliant: true,
        },
      };

      vi.mocked(complianceService.validateTransfer).mockResolvedValue(mockResponse);

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(complianceService.validateTransfer).toHaveBeenCalledWith({
        tokenId: 'token123',
        network: 'VOI',
        sender: 'A23456723456723456723456723456723456723456723456723456723A',
        receiver: 'B23456723456723456723456723456723456723456723456723456723B',
        amount: undefined,
      });

      // Dialog should be shown
      expect(wrapper.text()).toContain('Allowlist Verification Required');
    });

    it('should display allowed validation result', async () => {
      const mockResponse: TransferValidationResponse = {
        allowed: true,
        reasons: ['Both addresses are whitelisted'],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: true,
          status: 'active',
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          whitelisted: true,
          status: 'active',
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      vi.mocked(complianceService.validateTransfer).mockResolvedValue(mockResponse);

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      // Check the confirmation checkbox and proceed
      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(true);
      
      const proceedButton = wrapper.findAll('button').find(btn => btn.text().includes('Proceed'));
      await proceedButton?.trigger('click');
      await flushPromises();

      expect(wrapper.text()).toContain('Transfer Allowed');
    });

    it('should display denied validation result', async () => {
      const mockResponse: TransferValidationResponse = {
        allowed: false,
        reasons: ['Sender is not whitelisted'],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: false,
          status: 'not_listed',
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          whitelisted: true,
          status: 'active',
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      vi.mocked(complianceService.validateTransfer).mockResolvedValue(mockResponse);

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      // The dialog should show transfer cannot proceed
      expect(wrapper.text()).toContain('Transfer Cannot Proceed');
      expect(wrapper.text()).toContain('Sender address is not on the allowlist');
    });

    it('should display validation reasons', async () => {
      const mockResponse: TransferValidationResponse = {
        allowed: false,
        reasons: ['Sender is not whitelisted', 'Receiver is sanctioned'],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: false,
          status: 'not_listed',
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          whitelisted: true,
          status: 'active',
          sanctioned: true,
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      vi.mocked(complianceService.validateTransfer).mockResolvedValue(mockResponse);

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      // The dialog should show transfer cannot proceed with reasons
      expect(wrapper.text()).toContain('Transfer Cannot Proceed');
      expect(wrapper.text()).toContain('Sender address is not on the allowlist');
    });

    it('should display sender and receiver status', async () => {
      const mockResponse: TransferValidationResponse = {
        allowed: true,
        reasons: [],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: true,
          status: 'active',
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          whitelisted: true,
          status: 'active',
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      vi.mocked(complianceService.validateTransfer).mockResolvedValue(mockResponse);

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Sender Status');
      expect(wrapper.text()).toContain('Receiver Status');
    });

    it('should handle validation error', async () => {
      const errorMessage = 'Network error';
      vi.mocked(complianceService.validateTransfer).mockRejectedValue(new Error(errorMessage));

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Validation Error');
    });

    it('should include amount in validation request when provided', async () => {
      const mockResponse: TransferValidationResponse = {
        allowed: true,
        reasons: [],
        senderStatus: {
          address: 'A23456723456723456723456723456723456723456723456723456723A',
          whitelisted: true,
          status: 'active',
        },
        receiverStatus: {
          address: 'B23456723456723456723456723456723456723456723456723456723B',
          whitelisted: true,
          status: 'active',
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      vi.mocked(complianceService.validateTransfer).mockResolvedValue(mockResponse);

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      await inputs[2].setValue('100.50');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(complianceService.validateTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '100.50',
        })
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during validation', async () => {
      vi.mocked(complianceService.validateTransfer).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      expect(wrapper.text()).toContain('Validating...');
    });

    it('should disable submit button during validation', async () => {
      vi.mocked(complianceService.validateTransfer).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const wrapper = mount(TransferValidationForm, {
        props: defaultProps,
      });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');
      
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Branch coverage - statusBadgeClass', () => {
    function mountWrapper() {
      return mount(TransferValidationForm, { props: defaultProps });
    }

    it('statusBadgeClass("pending") contains yellow', () => {
      const vm = mountWrapper().vm as any;
      expect(vm.statusBadgeClass('pending')).toContain('yellow');
    });

    it('statusBadgeClass("expired") contains orange', () => {
      const vm = mountWrapper().vm as any;
      expect(vm.statusBadgeClass('expired')).toContain('orange');
    });

    it('statusBadgeClass("denied") contains red', () => {
      const vm = mountWrapper().vm as any;
      expect(vm.statusBadgeClass('denied')).toContain('red');
    });

    it('statusBadgeClass("removed") contains red', () => {
      const vm = mountWrapper().vm as any;
      expect(vm.statusBadgeClass('removed')).toContain('red');
    });

    it('statusBadgeClass("not_listed") contains gray', () => {
      const vm = mountWrapper().vm as any;
      expect(vm.statusBadgeClass('not_listed')).toContain('gray');
    });

    it('statusBadgeClass("unknown_status") contains gray (default)', () => {
      const vm = mountWrapper().vm as any;
      expect(vm.statusBadgeClass('unknown_status')).toContain('gray');
    });

    it('should show error message in rendered output when validation throws', async () => {
      vi.mocked(complianceService.validateTransfer).mockRejectedValue(new Error('Service unavailable'));

      const wrapper = mount(TransferValidationForm, { props: defaultProps });

      const inputs = wrapper.findAll('input[type="text"]');
      await inputs[0].setValue('A23456723456723456723456723456723456723456723456723456723A');
      await inputs[1].setValue('B23456723456723456723456723456723456723456723456723456723B');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Validation Error');
    });
  });
});
