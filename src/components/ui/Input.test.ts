import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Input from './Input.vue';

describe('Input Component', () => {
  it('should render with default type text', () => {
    const wrapper = mount(Input);
    const input = wrapper.find('input');
    
    expect(input.attributes('type')).toBe('text');
  });

  it('should render with label when provided', () => {
    const wrapper = mount(Input, {
      props: {
        label: 'Email Address'
      }
    });
    
    expect(wrapper.text()).toContain('Email Address');
  });

  it('should show required indicator when required is true', () => {
    const wrapper = mount(Input, {
      props: {
        label: 'Email',
        required: true
      }
    });
    
    expect(wrapper.html()).toContain('*');
    expect(wrapper.find('span.text-red-500').exists()).toBe(true);
  });

  it('should render with placeholder', () => {
    const wrapper = mount(Input, {
      props: {
        placeholder: 'Enter your email'
      }
    });
    
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('Enter your email');
  });

  it('should emit update:modelValue on input', async () => {
    const wrapper = mount(Input);
    const input = wrapper.find('input');
    
    await input.setValue('test@example.com');
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test@example.com']);
  });

  it('should display error message when error prop is provided', () => {
    const wrapper = mount(Input, {
      props: {
        error: 'This field is required'
      }
    });
    
    expect(wrapper.text()).toContain('This field is required');
    expect(wrapper.find('p.text-red-600').exists()).toBe(true);
  });

  it('should display hint message when hint prop is provided', () => {
    const wrapper = mount(Input, {
      props: {
        hint: 'Enter a valid email address'
      }
    });
    
    expect(wrapper.text()).toContain('Enter a valid email address');
    expect(wrapper.find('p.text-gray-500').exists()).toBe(true);
  });

  it('should not display hint when error is present', () => {
    const wrapper = mount(Input, {
      props: {
        error: 'Error message',
        hint: 'Hint message'
      }
    });
    
    expect(wrapper.text()).toContain('Error message');
    expect(wrapper.text()).not.toContain('Hint message');
  });

  it('should apply disabled state when disabled prop is true', () => {
    const wrapper = mount(Input, {
      props: {
        disabled: true
      }
    });
    
    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
    expect(input.classes()).toContain('cursor-not-allowed');
  });

  it('should apply error styles when error prop is provided', () => {
    const wrapper = mount(Input, {
      props: {
        error: 'Error'
      }
    });
    
    const input = wrapper.find('input');
    expect(input.classes()).toContain('border-red-300');
  });

  it('should emit focus event', async () => {
    const wrapper = mount(Input);
    const input = wrapper.find('input');
    
    await input.trigger('focus');
    
    expect(wrapper.emitted('focus')).toBeTruthy();
  });

  it('should emit blur event', async () => {
    const wrapper = mount(Input);
    const input = wrapper.find('input');
    
    await input.trigger('blur');
    
    expect(wrapper.emitted('blur')).toBeTruthy();
  });

  it('should render icon slot when provided', () => {
    const wrapper = mount(Input, {
      slots: {
        icon: '<svg data-testid="icon">icon</svg>'
      }
    });
    
    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true);
  });

  it('should support different input types', () => {
    const wrapper = mount(Input, {
      props: {
        type: 'password'
      }
    });
    
    const input = wrapper.find('input');
    expect(input.attributes('type')).toBe('password');
  });

  it('should bind id attribute', () => {
    const wrapper = mount(Input, {
      props: {
        id: 'email-input'
      }
    });
    
    const input = wrapper.find('input');
    expect(input.attributes('id')).toBe('email-input');
  });

  it('should bind modelValue to input value', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 'test value'
      }
    });
    
    const input = wrapper.find('input');
    expect(input.element.value).toBe('test value');
  });
});
