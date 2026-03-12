import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from './Button.vue';

describe('Button Component', () => {
  it('should render with default props', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me',
      },
    });

    expect(wrapper.text()).toContain('Click me');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('should emit click event when clicked', async () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me',
      },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')?.[0]).toBeTruthy();
  });

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true,
      },
      slots: {
        default: 'Click me',
      },
    });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('should show loading state', () => {
    const wrapper = mount(Button, {
      props: {
        loading: true,
      },
      slots: {
        default: 'Click me',
      },
    });

    expect(wrapper.find('.animate-spin').exists()).toBe(true);
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('should apply primary variant classes', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
      },
      slots: {
        default: 'Click me',
      },
    });

    expect(wrapper.find('button').classes()).toContain('from-blue-600');
  });

  it('should apply danger variant classes', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'danger',
      },
      slots: {
        default: 'Delete',
      },
    });

    expect(wrapper.find('button').classes()).toContain('bg-red-600');
  });

  it('should apply size classes correctly', () => {
    const wrapperSm = mount(Button, {
      props: {
        size: 'sm',
      },
      slots: {
        default: 'Small',
      },
    });

    const wrapperLg = mount(Button, {
      props: {
        size: 'lg',
      },
      slots: {
        default: 'Large',
      },
    });

    expect(wrapperSm.find('button').classes()).toContain('px-3');
    expect(wrapperLg.find('button').classes()).toContain('px-6');
  });

  it('should apply full width class when fullWidth is true', () => {
    const wrapper = mount(Button, {
      props: {
        fullWidth: true,
      },
      slots: {
        default: 'Full Width',
      },
    });

    expect(wrapper.find('button').classes()).toContain('w-full');
  });

  it('should render icon slot when provided', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'With Icon',
        icon: '<svg class="test-icon"></svg>',
      },
    });

    expect(wrapper.find('.test-icon').exists()).toBe(true);
  });

  it('should not render icon when loading', () => {
    const wrapper = mount(Button, {
      props: {
        loading: true,
      },
      slots: {
        default: 'Loading',
        icon: '<svg class="test-icon"></svg>',
      },
    });

    expect(wrapper.find('.test-icon').exists()).toBe(false);
    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // WCAG 2.1 AA accessibility tests (SC 4.1.2 Name, Role, Value)
  // ---------------------------------------------------------------------------

  describe('WCAG 2.1 AA — SC 4.1.2 Name, Role, Value', () => {
    it('has aria-busy="true" when loading (SC 4.1.2)', () => {
      const wrapper = mount(Button, { props: { loading: true }, slots: { default: 'Save' } })
      expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
    })

    it('does NOT set aria-busy when not loading (SC 4.1.2)', () => {
      const wrapper = mount(Button, { props: { loading: false }, slots: { default: 'Save' } })
      expect(wrapper.find('button').attributes('aria-busy')).toBeUndefined()
    })

    it('exposes ariaLoadingLabel as aria-label during loading (SC 4.1.2)', () => {
      const wrapper = mount(Button, {
        props: { loading: true, ariaLoadingLabel: 'Saving changes…' },
        slots: { default: 'Save' },
      })
      expect(wrapper.find('button').attributes('aria-label')).toBe('Saving changes…')
    })

    it('does NOT set aria-label when not loading even if ariaLoadingLabel provided (SC 4.1.2)', () => {
      const wrapper = mount(Button, {
        props: { loading: false, ariaLoadingLabel: 'Saving changes…' },
        slots: { default: 'Save' },
      })
      expect(wrapper.find('button').attributes('aria-label')).toBeUndefined()
    })

    it('loading spinner has aria-hidden to avoid duplicate announcement (SC 4.1.2)', () => {
      const wrapper = mount(Button, { props: { loading: true }, slots: { default: 'Save' } })
      const spinner = wrapper.find('.animate-spin')
      expect(spinner.attributes('aria-hidden')).toBe('true')
    })

    it('has visible focus ring classes for keyboard navigation (SC 2.4.7)', () => {
      const wrapper = mount(Button, { props: { variant: 'primary' }, slots: { default: 'Next' } })
      const html = wrapper.find('button').classes().join(' ')
      expect(html).toContain('focus:ring-2')
    })
  })
});
