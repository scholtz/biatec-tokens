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
    expect(wrapper.find('p.text-gray-600').exists()).toBe(true);
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

  // ---------------------------------------------------------------------------
  // WCAG 2.1 AA accessibility tests (SC 1.3.1, SC 3.3.1, SC 4.1.2)
  // ---------------------------------------------------------------------------

  describe('WCAG 2.1 AA — SC 3.3.1 Error Identification & SC 4.1.2 Name, Role, Value', () => {
    it('sets aria-invalid="true" when error prop is provided (SC 3.3.1)', () => {
      const wrapper = mount(Input, { props: { error: 'Required field' } })
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('does NOT set aria-invalid when no error (SC 3.3.1)', () => {
      const wrapper = mount(Input, { props: {} })
      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })

    it('links input to error message via aria-describedby (SC 3.3.1)', () => {
      const wrapper = mount(Input, { props: { id: 'email', error: 'Invalid email' } })
      const input = wrapper.find('input')
      const describedBy = input.attributes('aria-describedby')
      expect(describedBy).toBe('email-error')
      // The referenced element must exist in DOM
      expect(wrapper.find(`#${describedBy}`).exists()).toBe(true)
    })

    it('links input to hint via aria-describedby when no error (SC 3.3.2)', () => {
      const wrapper = mount(Input, { props: { id: 'email', hint: 'Enter company email' } })
      const input = wrapper.find('input')
      const describedBy = input.attributes('aria-describedby')
      expect(describedBy).toBe('email-hint')
      expect(wrapper.find(`#${describedBy}`).exists()).toBe(true)
    })

    it('removes aria-describedby when neither error nor hint is present', () => {
      const wrapper = mount(Input, { props: { id: 'email' } })
      expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined()
    })

    it('error message has role="alert" for screen-reader announcement (SC 4.1.3)', () => {
      const wrapper = mount(Input, { props: { error: 'This is required' } })
      const errorEl = wrapper.find('p.text-red-600')
      expect(errorEl.attributes('role')).toBe('alert')
    })

    it('sets aria-required="true" when required prop is true (SC 4.1.2)', () => {
      const wrapper = mount(Input, { props: { required: true } })
      expect(wrapper.find('input').attributes('aria-required')).toBe('true')
    })

    it('does NOT set aria-required when not required (SC 4.1.2)', () => {
      const wrapper = mount(Input, { props: { required: false } })
      expect(wrapper.find('input').attributes('aria-required')).toBeUndefined()
    })

    it('required asterisk is aria-hidden to avoid duplication (SC 1.3.1)', () => {
      const wrapper = mount(Input, { props: { label: 'Name', required: true } })
      const asterisk = wrapper.find('span.text-red-500')
      expect(asterisk.attributes('aria-hidden')).toBe('true')
    })

    it('uses provided id for aria-describedby linkage (SC 4.1.2)', () => {
      const wrapper = mount(Input, { props: { id: 'org-name', error: 'Too short' } })
      expect(wrapper.find('input').attributes('id')).toBe('org-name')
      expect(wrapper.find('input').attributes('aria-describedby')).toBe('org-name-error')
    })

    it('has visible focus ring classes for keyboard navigation (SC 2.4.7)', () => {
      const wrapper = mount(Input, {})
      const classes = wrapper.find('input').classes().join(' ')
      expect(classes).toContain('focus:ring-2')
    })
  })
});
