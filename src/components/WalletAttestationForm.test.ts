import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import WalletAttestationForm from './WalletAttestationForm.vue';
import { AttestationType } from '../types/compliance';

describe('WalletAttestationForm Component', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL for file upload tests
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(WalletAttestationForm);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Wallet Attestation (Optional)');
    });

    it('should show disabled state by default', () => {
      const wrapper = mount(WalletAttestationForm);
      expect(wrapper.find('button').text()).toBe('Disabled');
    });

    it('should show informational text about optional feature', () => {
      const wrapper = mount(WalletAttestationForm);
      expect(wrapper.text()).toContain('Optional Feature:');
      expect(wrapper.text()).toContain('Wallet attestations provide proof');
    });
  });

  describe('Enable/Disable Toggle', () => {
    it('should toggle to enabled state when button clicked', async () => {
      const wrapper = mount(WalletAttestationForm);
      const toggleButton = wrapper.findAll('button').find(btn => 
        btn.text() === 'Disabled' || btn.text() === 'Enabled'
      );
      
      await toggleButton?.trigger('click');
      expect(wrapper.text()).toContain('Enabled');
    });

    it('should emit update:enabled event when toggled', async () => {
      const wrapper = mount(WalletAttestationForm);
      const toggleButton = wrapper.findAll('button')[0];
      
      await toggleButton.trigger('click');
      expect(wrapper.emitted('update:enabled')).toBeTruthy();
      expect(wrapper.emitted('update:enabled')?.[0]).toEqual([true]);
    });

    it('should show attestation form when enabled', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: {
          enabled: true
        }
      });
      
      expect(wrapper.text()).toContain('Add Attestations');
      expect(wrapper.text()).toContain('Attestation Type');
    });
  });

  describe('Attestation Form Fields', () => {
    it('should have all attestation type options', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const select = wrapper.find('select');
      const options = select.findAll('option');
      
      expect(options).toHaveLength(5);
      expect(options[0].text()).toBe('KYC/AML Verification');
      expect(options[1].text()).toBe('Accredited Investor Status');
      expect(options[2].text()).toBe('Jurisdiction Approval');
      expect(options[3].text()).toBe('Issuer Verification');
      expect(options[4].text()).toBe('Other');
    });

    it('should have proof hash input field', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const proofHashInput = wrapper.findAll('input[type="text"]').find(input =>
        input.attributes('placeholder')?.includes('0x')
      );
      
      expect(proofHashInput).toBeTruthy();
    });

    it('should have notes textarea', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const textarea = wrapper.find('textarea');
      expect(textarea.exists()).toBe(true);
      expect(textarea.attributes('placeholder')).toContain('Additional information');
    });

    it('should have file upload area', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      expect(wrapper.text()).toContain('Click to upload document');
      expect(wrapper.text()).toContain('Max file size: 10MB');
    });
  });

  describe('Add Attestation Button', () => {
    it('should be disabled when no proof hash or document', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const addButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Add Attestation')
      );
      
      expect(addButton?.attributes('disabled')).toBeDefined();
    });

    it('should be enabled when proof hash is provided', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const proofHashInput = wrapper.findAll('input[type="text"]').find(input =>
        input.attributes('placeholder')?.includes('0x')
      );
      
      await proofHashInput?.setValue('0x1234567890abcdef');
      await wrapper.vm.$nextTick();
      
      const addButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Add Attestation')
      );
      
      expect(addButton?.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Adding Attestations', () => {
    it('should add attestation when form is submitted', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const proofHashInput = wrapper.findAll('input[type="text"]').find(input =>
        input.attributes('placeholder')?.includes('0x')
      );
      await proofHashInput?.setValue('0x1234567890abcdef1234567890abcdef');
      
      const notesTextarea = wrapper.find('textarea');
      await notesTextarea.setValue('Test notes');
      
      const addButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Add Attestation')
      );
      await addButton?.trigger('click');
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as any[];
      expect(emittedValue).toHaveLength(1);
      expect(emittedValue[0].type).toBe(AttestationType.KYC_AML);
      expect(emittedValue[0].proofHash).toBe('0x1234567890abcdef1234567890abcdef');
      expect(emittedValue[0].notes).toBe('Test notes');
      expect(emittedValue[0].status).toBe('pending');
    });

    it('should generate unique ID for each attestation', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const proofHashInput = wrapper.findAll('input[type="text"]').find(input =>
        input.attributes('placeholder')?.includes('0x')
      );
      
      await proofHashInput?.setValue('0x1234');
      const addButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Add Attestation')
      );
      await addButton?.trigger('click');
      
      const emittedValue1 = wrapper.emitted('update:modelValue')?.[0]?.[0] as any[];
      
      await proofHashInput?.setValue('0x5678');
      await addButton?.trigger('click');
      
      const emittedValue2 = wrapper.emitted('update:modelValue')?.[1]?.[0] as any[];
      
      expect(emittedValue1[0].id).not.toBe(emittedValue2[1].id);
    });

    it('should reset form after adding attestation', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const proofHashInput = wrapper.findAll('input[type="text"]').find(input =>
        input.attributes('placeholder')?.includes('0x')
      );
      await proofHashInput?.setValue('0x1234567890abcdef');
      
      const notesTextarea = wrapper.find('textarea');
      await notesTextarea.setValue('Test notes');
      
      const addButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Add Attestation')
      );
      await addButton?.trigger('click');
      
      // Check form is reset
      expect((proofHashInput?.element as HTMLInputElement).value).toBe('');
      expect((notesTextarea.element as HTMLTextAreaElement).value).toBe('');
    });
  });

  describe('Displaying Existing Attestations', () => {
    it('should display existing attestations from props', () => {
      const attestations = [{
        id: 'att-1',
        type: AttestationType.KYC_AML,
        proofHash: '0xabcdef',
        status: 'pending' as const,
        notes: 'Test attestation'
      }];
      
      const wrapper = mount(WalletAttestationForm, {
        props: {
          enabled: true,
          modelValue: attestations
        }
      });
      
      expect(wrapper.text()).toContain('KYC/AML Verification');
      expect(wrapper.text()).toContain('0xabcdef');
      expect(wrapper.text()).toContain('Test attestation');
      expect(wrapper.text()).toContain('pending');
    });

    it('should show compliance summary when attestations exist', () => {
      const attestations = [{
        id: 'att-1',
        type: AttestationType.KYC_AML,
        proofHash: '0xabcdef',
        status: 'pending' as const
      }];
      
      const wrapper = mount(WalletAttestationForm, {
        props: {
          enabled: true,
          modelValue: attestations
        }
      });
      
      expect(wrapper.text()).toContain('Compliance Summary');
      expect(wrapper.text()).toContain('KYC/AML');
      expect(wrapper.text()).toContain('Added');
    });

    it('should show "Not Added" for missing attestation types', () => {
      const attestations = [{
        id: 'att-1',
        type: AttestationType.KYC_AML,
        proofHash: '0xabcdef',
        status: 'pending' as const
      }];
      
      const wrapper = mount(WalletAttestationForm, {
        props: {
          enabled: true,
          modelValue: attestations
        }
      });
      
      expect(wrapper.text()).toContain('Accredited Investor');
      expect(wrapper.text()).toContain('Not Added');
      expect(wrapper.text()).toContain('Jurisdiction');
      expect(wrapper.text()).toContain('Not Added');
    });
  });

  describe('Removing Attestations', () => {
    it('should remove attestation when delete button clicked', async () => {
      const attestations = [{
        id: 'att-1',
        type: AttestationType.KYC_AML,
        proofHash: '0xabcdef',
        status: 'pending' as const
      }];
      
      const wrapper = mount(WalletAttestationForm, {
        props: {
          enabled: true,
          modelValue: attestations
        }
      });
      
      const deleteButton = wrapper.findAll('button').find(btn => 
        btn.html().includes('pi-trash')
      );
      
      await deleteButton?.trigger('click');
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as any[];
      expect(emittedValue).toHaveLength(0);
    });
  });

  describe('File Upload', () => {
    it('should handle file selection', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const fileInput = wrapper.find('input[type="file"]');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      });
      
      await fileInput.trigger('change');
      
      expect(wrapper.text()).toContain('test.pdf');
    });

    it('should enable add button when file is uploaded', async () => {
      const wrapper = mount(WalletAttestationForm, {
        props: { enabled: true }
      });
      
      const fileInput = wrapper.find('input[type="file"]');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      });
      
      await fileInput.trigger('change');
      await wrapper.vm.$nextTick();
      
      const addButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Add Attestation')
      );
      
      expect(addButton?.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Attestation Count Display', () => {
    it('should display correct attestation count', () => {
      const attestations = [
        {
          id: 'att-1',
          type: AttestationType.KYC_AML,
          proofHash: '0xabcdef',
          status: 'pending' as const
        },
        {
          id: 'att-2',
          type: AttestationType.ACCREDITED_INVESTOR,
          proofHash: '0x123456',
          status: 'pending' as const
        }
      ];
      
      const wrapper = mount(WalletAttestationForm, {
        props: {
          enabled: true,
          modelValue: attestations
        }
      });
      
      expect(wrapper.text()).toContain('2 attestation(s)');
    });
  });
});
