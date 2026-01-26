import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MicaComplianceForm from '../MicaComplianceForm.vue';

describe('MicaComplianceForm', () => {
  describe('Component Rendering', () => {
    it('renders the component with proper heading', () => {
      const wrapper = mount(MicaComplianceForm);
      expect(wrapper.find('h2').text()).toContain('MICA Compliance Metadata');
    });

    it('shows required badge when required prop is true', () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { required: true },
      });
      expect(wrapper.text()).toContain('(Required for ARC-200)');
    });

    it('shows enable/disable toggle when not required', () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { required: false },
      });
      expect(wrapper.find('button').text()).toContain('Disabled');
    });

    it('automatically enables form when required prop is true', () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { required: true },
      });
      expect(wrapper.text()).toContain('Issuer Legal Name');
    });
  });

  describe('Form Fields', () => {
    it('renders all required fields', () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });
      
      const labels = wrapper.findAll('label').map(label => label.text());
      expect(labels).toContain('Issuer Legal Name *');
      expect(labels).toContain('Registration Number *');
      expect(labels).toContain('Jurisdiction *');
      expect(labels).toContain('Token Classification *');
      expect(labels).toContain('Token Purpose *');
      expect(labels).toContain('Compliance Contact Email *');
    });

    it('renders optional fields', () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });
      
      const labels = wrapper.findAll('label').map(label => label.text());
      expect(labels.some(l => l.includes('Regulatory License'))).toBe(true);
      expect(labels.some(l => l.includes('Restricted Jurisdictions'))).toBe(true);
      expect(labels.some(l => l.includes('Whitepaper URL'))).toBe(true);
      expect(labels.some(l => l.includes('Terms & Conditions URL'))).toBe(true);
    });

    it('has correct input types for each field', () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });
      
      const textInputs = wrapper.findAll('input[type="text"]');
      expect(textInputs.length).toBeGreaterThan(0);
      
      const emailInput = wrapper.find('input[type="email"]');
      expect(emailInput.exists()).toBe(true);
      
      const urlInputs = wrapper.findAll('input[type="url"]');
      expect(urlInputs.length).toBeGreaterThan(0);
      
      const checkbox = wrapper.find('input[type="checkbox"]');
      expect(checkbox.exists()).toBe(true);
    });
  });

  describe('Validation Logic', () => {
    it('validates required fields are not empty', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      await wrapper.vm.$nextTick();
      
      // Initially should have validation errors
      expect(wrapper.text()).toContain('Issuer legal name is required');
      expect(wrapper.text()).toContain('Registration number is required');
      expect(wrapper.text()).toContain('Jurisdiction is required');
    });

    it('validates email format', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { 
          enabled: true,
          modelValue: {
            issuerLegalName: 'Test Company',
            issuerRegistrationNumber: '12345',
            issuerJurisdiction: 'EU',
            micaTokenClassification: 'utility' as const,
            tokenPurpose: 'This is a test token purpose that is longer than fifty characters to pass validation',
            kycRequired: false,
            complianceContactEmail: 'invalid-email',
          }
        },
      });

      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toContain('Invalid email format');
    });

    it('validates token purpose minimum length', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { 
          enabled: true,
          modelValue: {
            issuerLegalName: 'Test Company',
            issuerRegistrationNumber: '12345',
            issuerJurisdiction: 'EU',
            micaTokenClassification: 'utility' as const,
            tokenPurpose: 'Too short',
            kycRequired: false,
            complianceContactEmail: 'test@example.com',
          }
        },
      });

      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toContain('Token purpose must be at least 50 characters');
    });

    it('shows success message when all fields are valid', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { 
          enabled: true,
          modelValue: {
            issuerLegalName: 'Test Company Ltd.',
            issuerRegistrationNumber: '12345678',
            issuerJurisdiction: 'EU',
            micaTokenClassification: 'utility' as const,
            tokenPurpose: 'This is a comprehensive test token purpose that provides detailed information about the utility and rights conferred to token holders, ensuring it meets the minimum character requirement.',
            kycRequired: false,
            complianceContactEmail: 'compliance@example.com',
          }
        },
      });

      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toContain('All required MICA compliance fields are complete');
    });
  });

  describe('Token Classification Guidance', () => {
    it('shows guidance for utility token', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const select = wrapper.find('select');
      await select.setValue('utility');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Provides access to goods or services');
    });

    it('shows guidance for e-money token', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const select = wrapper.findAll('select').find(s => s.html().includes('Utility Token'));
      await select!.setValue('e-money');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('e-money authorization');
    });

    it('shows guidance for asset-referenced token', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const select = wrapper.findAll('select').find(s => s.html().includes('Utility Token'));
      await select!.setValue('asset-referenced');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('prospectus approval');
    });
  });

  describe('Data Emission', () => {
    it('emits update:modelValue when fields change', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const input = wrapper.find('input[type="text"]');
      await input.setValue('Test Company');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('emits update:enabled when toggle is clicked', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: false, required: false },
      });

      const button = wrapper.find('button');
      await button.trigger('click');

      expect(wrapper.emitted('update:enabled')).toBeTruthy();
      expect(wrapper.emitted('update:enabled')?.[0]).toEqual([true]);
    });

    it('emits update:valid when validation state changes', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { 
          enabled: true,
        },
      });

      // Initially should be invalid
      await wrapper.vm.$nextTick();
      
      // Update to make valid
      const issuerNameInput = wrapper.findAll('input[type="text"]')[0];
      await issuerNameInput.setValue('Test Company Ltd.');
      
      const registrationInput = wrapper.findAll('input[type="text"]')[1];
      await registrationInput.setValue('12345678');
      
      const jurisdictionSelect = wrapper.findAll('select')[0];
      await jurisdictionSelect.setValue('EU');
      
      const classificationSelect = wrapper.findAll('select')[1];
      await classificationSelect.setValue('utility');
      
      const purposeTextarea = wrapper.find('textarea');
      await purposeTextarea.setValue('This is a comprehensive test token purpose that provides detailed information about the utility and rights conferred to token holders.');
      
      const emailInput = wrapper.find('input[type="email"]');
      await emailInput.setValue('compliance@example.com');
      
      await wrapper.vm.$nextTick();

      // Should eventually emit valid=true when all fields are complete
      // The watcher needs time to trigger
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.emitted('update:valid')).toBeTruthy();
      const validEmissions = wrapper.emitted('update:valid') as any[];
      expect(validEmissions[validEmissions.length - 1][0]).toBe(true);
    });
  });

  describe('Restricted Jurisdictions', () => {
    it('parses comma-separated jurisdiction codes', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const input = wrapper.find('input[placeholder*="ISO codes"]');
      await input.setValue('US, CN, KP');
      await wrapper.vm.$nextTick();

      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as any;
      expect(emittedValue?.restrictedJurisdictions).toEqual(['US', 'CN', 'KP']);
    });

    it('converts jurisdiction codes to uppercase', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const input = wrapper.find('input[placeholder*="ISO codes"]');
      await input.setValue('us, cn, kp');
      await wrapper.vm.$nextTick();

      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as any;
      expect(emittedValue?.restrictedJurisdictions).toEqual(['US', 'CN', 'KP']);
    });

    it('filters out empty entries', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const input = wrapper.find('input[placeholder*="ISO codes"]');
      await input.setValue('US,  , CN,  ,KP');
      await wrapper.vm.$nextTick();

      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as any;
      expect(emittedValue?.restrictedJurisdictions).toEqual(['US', 'CN', 'KP']);
    });
  });

  describe('Prop Initialization', () => {
    it('initializes form with provided modelValue', () => {
      const initialData = {
        issuerLegalName: 'Acme Corp',
        issuerRegistrationNumber: '99999',
        issuerJurisdiction: 'US',
        micaTokenClassification: 'utility' as const,
        tokenPurpose: 'Test purpose for initialization that is long enough to pass validation requirements',
        kycRequired: true,
        restrictedJurisdictions: ['CN', 'KP'],
        complianceContactEmail: 'compliance@acme.com',
        whitepaperUrl: 'https://acme.com/whitepaper.pdf',
        termsAndConditionsUrl: 'https://acme.com/terms',
      };

      const wrapper = mount(MicaComplianceForm, {
        props: { 
          enabled: true,
          modelValue: initialData,
        },
      });

      const inputs = wrapper.findAll('input[type="text"]');
      const firstInput = inputs.find(i => (i.element as HTMLInputElement).value === 'Acme Corp');
      expect(firstInput).toBeTruthy();
    });
  });

  describe('Jurisdiction Selection', () => {
    it('provides common jurisdiction options', () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const select = wrapper.find('select');
      const options = select.findAll('option').map(o => o.text());
      
      expect(options).toContain('European Union');
      expect(options).toContain('United States');
      expect(options).toContain('United Kingdom');
      expect(options).toContain('Singapore');
      expect(options).toContain('Switzerland');
    });
  });

  describe('KYC Checkbox', () => {
    it('toggles KYC required status', async () => {
      const wrapper = mount(MicaComplianceForm, {
        props: { enabled: true },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(true);
      await wrapper.vm.$nextTick();

      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as any;
      expect(emittedValue?.kycRequired).toBe(true);
    });
  });
});
