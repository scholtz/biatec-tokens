import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Select from './Select.vue';

describe('Select Component', () => {
  const stringOptions = ['Option 1', 'Option 2', 'Option 3'];
  const objectOptions = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' }
  ];

  it('should render with string options', () => {
    const wrapper = mount(Select, {
      props: {
        options: stringOptions
      }
    });
    
    const options = wrapper.findAll('option');
    expect(options).toHaveLength(3);
    expect(options[0].text()).toBe('Option 1');
  });

  it('should render with object options', () => {
    const wrapper = mount(Select, {
      props: {
        options: objectOptions
      }
    });
    
    const options = wrapper.findAll('option');
    expect(options).toHaveLength(3);
    expect(options[0].text()).toBe('Option 1');
    expect(options[0].attributes('value')).toBe('1');
  });

  it('should render with label when provided', () => {
    const wrapper = mount(Select, {
      props: {
        label: 'Choose an option',
        options: stringOptions
      }
    });
    
    expect(wrapper.text()).toContain('Choose an option');
  });

  it('should show required indicator when required is true', () => {
    const wrapper = mount(Select, {
      props: {
        label: 'Select',
        required: true,
        options: stringOptions
      }
    });
    
    expect(wrapper.html()).toContain('*');
    expect(wrapper.find('span.text-red-500').exists()).toBe(true);
  });

  it('should render with placeholder', () => {
    const wrapper = mount(Select, {
      props: {
        placeholder: 'Select an option',
        options: stringOptions
      }
    });
    
    const placeholderOption = wrapper.find('option[disabled]');
    expect(placeholderOption.text()).toBe('Select an option');
    expect(placeholderOption.attributes('value')).toBe('');
  });

  it('should emit update:modelValue on change', async () => {
    const wrapper = mount(Select, {
      props: {
        options: stringOptions
      }
    });
    
    const select = wrapper.find('select');
    await select.setValue('Option 2');
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Option 2']);
  });

  it('should display error message when error prop is provided', () => {
    const wrapper = mount(Select, {
      props: {
        error: 'Please select an option',
        options: stringOptions
      }
    });
    
    expect(wrapper.text()).toContain('Please select an option');
    expect(wrapper.find('p.text-red-600').exists()).toBe(true);
  });

  it('should display hint message when hint prop is provided', () => {
    const wrapper = mount(Select, {
      props: {
        hint: 'Choose the best option',
        options: stringOptions
      }
    });
    
    expect(wrapper.text()).toContain('Choose the best option');
    expect(wrapper.find('p.text-gray-500').exists()).toBe(true);
  });

  it('should not display hint when error is present', () => {
    const wrapper = mount(Select, {
      props: {
        error: 'Error message',
        hint: 'Hint message',
        options: stringOptions
      }
    });
    
    expect(wrapper.text()).toContain('Error message');
    expect(wrapper.text()).not.toContain('Hint message');
  });

  it('should apply disabled state when disabled prop is true', () => {
    const wrapper = mount(Select, {
      props: {
        disabled: true,
        options: stringOptions
      }
    });
    
    const select = wrapper.find('select');
    expect(select.attributes('disabled')).toBeDefined();
    expect(select.classes()).toContain('cursor-not-allowed');
  });

  it('should apply error styles when error prop is provided', () => {
    const wrapper = mount(Select, {
      props: {
        error: 'Error',
        options: stringOptions
      }
    });
    
    const select = wrapper.find('select');
    expect(select.classes()).toContain('border-red-300');
  });

  it('should bind id attribute', () => {
    const wrapper = mount(Select, {
      props: {
        id: 'my-select',
        options: stringOptions
      }
    });
    
    const select = wrapper.find('select');
    expect(select.attributes('id')).toBe('my-select');
  });

  it('should bind modelValue to select value', () => {
    const wrapper = mount(Select, {
      props: {
        modelValue: 'Option 2',
        options: stringOptions
      }
    });
    
    const select = wrapper.find('select');
    expect(select.element.value).toBe('Option 2');
  });

  it('should handle numeric option values', () => {
    const numericOptions = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 }
    ];
    
    const wrapper = mount(Select, {
      props: {
        options: numericOptions
      }
    });
    
    const options = wrapper.findAll('option');
    expect(options[0].attributes('value')).toBe('1');
    expect(options[1].attributes('value')).toBe('2');
  });

  it('should set required attribute on select element', () => {
    const wrapper = mount(Select, {
      props: {
        required: true,
        options: stringOptions
      }
    });
    
    const select = wrapper.find('select');
    expect(select.attributes('required')).toBeDefined();
  });
});
