import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import WhitelistEntryForm from '../WhitelistEntryForm.vue';
import { nextTick } from 'vue';

function mountForm(props = {}) {
  return mount(WhitelistEntryForm, {
    props,
    global: {
      stubs: {
        Input: {
          template: '<div><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><span v-if="error">{{ error }}</span></div>',
          props: ['modelValue', 'label', 'error', 'hint', 'type', 'required', 'placeholder'],
          emits: ['update:modelValue'],
        },
        Select: {
          template: '<div><select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select><span v-if="error">{{ error }}</span></div>',
          props: ['modelValue', 'label', 'options', 'error', 'required', 'placeholder'],
          emits: ['update:modelValue'],
        },
        Button: {
          template: '<button :type="type" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
          props: ['type', 'variant', 'loading', 'disabled'],
          emits: ['click'],
        },
      },
    },
  });
}

describe('WhitelistEntryForm', () => {
  describe('rendering', () => {
    it('renders create form title when isEdit is false', () => {
      const wrapper = mountForm();
      expect(wrapper.text()).toContain('Create Whitelist Entry');
    });

    it('renders edit form title when isEdit is true', () => {
      const wrapper = mountForm({ isEdit: true });
      expect(wrapper.text()).toContain('Edit Whitelist Entry');
    });

    it('renders form sections', () => {
      const wrapper = mountForm();
      expect(wrapper.text()).toContain('Personal Information');
      expect(wrapper.text()).toContain('Entity Information');
      expect(wrapper.text()).toContain('Risk Assessment');
    });

    it('renders submit button with Create text when not editing', () => {
      const wrapper = mountForm();
      expect(wrapper.text()).toContain('Create Entry');
    });

    it('renders submit button with Update text when editing', () => {
      const wrapper = mountForm({ isEdit: true });
      expect(wrapper.text()).toContain('Update Entry');
    });
  });

  describe('initialData prop', () => {
    it('populates form with initialData on mount', async () => {
      const wrapper = mountForm({
        initialData: { name: 'Jane Doe', email: 'jane@example.com', jurisdictionCode: 'GB', riskLevel: 'medium', entityType: 'corporate' },
      });
      await nextTick();
      const vm = wrapper.vm as any;
      expect(vm.formData.name).toBe('Jane Doe');
      expect(vm.formData.email).toBe('jane@example.com');
    });
  });

  describe('validation', () => {
    it('shows error when name is empty on submit', async () => {
      const wrapper = mountForm();
      await wrapper.find('form').trigger('submit');
      await nextTick();
      const vm = wrapper.vm as any;
      expect(vm.errors.name).toBeTruthy();
    });

    it('shows error when name is too short', async () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.formData.name = 'A';
      vm.formData.email = 'a@b.com';
      vm.formData.jurisdictionCode = 'US';
      vm.formData.riskLevel = 'low';
      vm.formData.entityType = 'individual';
      const valid = vm.validateForm();
      expect(valid).toBe(false);
      expect(vm.errors.name).toContain('at least 2 characters');
    });

    it('shows error for invalid email', async () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.formData.name = 'John Doe';
      vm.formData.email = 'not-an-email';
      vm.formData.jurisdictionCode = 'US';
      vm.formData.riskLevel = 'low';
      vm.formData.entityType = 'individual';
      const valid = vm.validateForm();
      expect(valid).toBe(false);
      expect(vm.errors.email).toContain('Invalid email');
    });

    it('shows error when jurisdiction is missing', () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.formData.name = 'John Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.jurisdictionCode = '';
      vm.formData.riskLevel = 'low';
      vm.formData.entityType = 'individual';
      const valid = vm.validateForm();
      expect(valid).toBe(false);
      expect(vm.errors.jurisdictionCode).toBeTruthy();
    });

    it('returns true for valid form data', () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.formData.name = 'John Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.jurisdictionCode = 'US';
      vm.formData.riskLevel = 'low';
      vm.formData.entityType = 'individual';
      expect(vm.validateForm()).toBe(true);
    });

    it('validates invalid Ethereum wallet address', () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.formData.name = 'John Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.jurisdictionCode = 'US';
      vm.formData.riskLevel = 'low';
      vm.formData.entityType = 'individual';
      vm.formData.walletAddress = 'bad-address';
      const valid = vm.validateForm();
      expect(valid).toBe(false);
      expect(vm.errors.walletAddress).toBeTruthy();
    });

    it('accepts valid Ethereum wallet address', () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.formData.name = 'John Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.jurisdictionCode = 'US';
      vm.formData.riskLevel = 'low';
      vm.formData.entityType = 'individual';
      vm.formData.walletAddress = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
      expect(vm.validateForm()).toBe(true);
    });

    it('skips wallet validation when address is empty', () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.formData.name = 'John Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.jurisdictionCode = 'US';
      vm.formData.riskLevel = 'low';
      vm.formData.entityType = 'individual';
      vm.formData.walletAddress = '';
      expect(vm.validateForm()).toBe(true);
    });

    it('shows generalError when form is invalid', () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.validateForm();
      expect(vm.generalError).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('emits submit with cleaned data when form is valid', async () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.formData.name = '  John Doe  ';
      vm.formData.email = 'JOHN@EXAMPLE.COM';
      vm.formData.jurisdictionCode = 'US';
      vm.formData.riskLevel = 'low';
      vm.formData.entityType = 'individual';
      await vm.handleSubmit();
      await nextTick();
      const emitted = wrapper.emitted('submit');
      expect(emitted).toBeTruthy();
      expect(emitted![0][0].name).toBe('John Doe');
      expect(emitted![0][0].email).toBe('john@example.com');
    });

    it('does not emit submit when form is invalid', async () => {
      const wrapper = mountForm();
      await wrapper.find('form').trigger('submit');
      await nextTick();
      expect(wrapper.emitted('submit')).toBeFalsy();
    });
  });

  describe('cancel', () => {
    it('emits cancel when cancel button clicked', async () => {
      const wrapper = mountForm();
      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();
      expect(wrapper.emitted('cancel')).toBeTruthy();
    });
  });

  describe('error display', () => {
    it('shows general error message when validation fails', async () => {
      const wrapper = mountForm();
      await wrapper.find('form').trigger('submit');
      await nextTick();
      const vm = wrapper.vm as any;
      expect(vm.generalError).toBeTruthy();
    });
  });
});
