import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Badge from './Badge.vue';

describe('Badge Component', () => {
  it('should render with default variant and size', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'Badge text'
      }
    });
    
    expect(wrapper.text()).toBe('Badge text');
    expect(wrapper.classes()).toContain('rounded-full');
    expect(wrapper.classes()).toContain('px-2.5');
  });

  it('should render with success variant', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'success'
      },
      slots: {
        default: 'Success'
      }
    });
    
    expect(wrapper.classes()).toContain('bg-green-100');
  });

  it('should render with warning variant', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'warning'
      },
      slots: {
        default: 'Warning'
      }
    });
    
    expect(wrapper.classes()).toContain('bg-yellow-100');
  });

  it('should render with error variant', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'error'
      },
      slots: {
        default: 'Error'
      }
    });
    
    expect(wrapper.classes()).toContain('bg-red-100');
  });

  it('should render with info variant', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'info'
      },
      slots: {
        default: 'Info'
      }
    });
    
    expect(wrapper.classes()).toContain('bg-blue-100');
  });

  it('should render with small size', () => {
    const wrapper = mount(Badge, {
      props: {
        size: 'sm'
      },
      slots: {
        default: 'Small'
      }
    });
    
    expect(wrapper.classes()).toContain('text-xs');
    expect(wrapper.classes()).toContain('px-2');
  });

  it('should render with large size', () => {
    const wrapper = mount(Badge, {
      props: {
        size: 'lg'
      },
      slots: {
        default: 'Large'
      }
    });
    
    expect(wrapper.classes()).toContain('text-base');
    expect(wrapper.classes()).toContain('px-3');
  });

  it('should combine variant and size props correctly', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'success',
        size: 'lg'
      },
      slots: {
        default: 'Large Success'
      }
    });
    
    expect(wrapper.classes()).toContain('bg-green-100');
    expect(wrapper.classes()).toContain('px-3');
  });

  // ---------------------------------------------------------------------------
  // WCAG 2.1 AA accessibility tests (SC 1.3.1, SC 4.1.3)
  // ---------------------------------------------------------------------------

  describe('WCAG 2.1 AA — SC 4.1.3 Status Messages', () => {
    it('sets role="status" when role prop is "status" (SC 4.1.3 polite announcement)', () => {
      const wrapper = mount(Badge, { props: { variant: 'success', role: 'status' }, slots: { default: 'Active' } })
      expect(wrapper.attributes('role')).toBe('status')
    })

    it('sets role="alert" when role prop is "alert" (SC 4.1.3 assertive announcement)', () => {
      const wrapper = mount(Badge, { props: { variant: 'error', role: 'alert' }, slots: { default: 'Failed' } })
      expect(wrapper.attributes('role')).toBe('alert')
    })

    it('does NOT set a role attribute by default (purely decorative badge)', () => {
      const wrapper = mount(Badge, { props: {}, slots: { default: 'Default' } })
      expect(wrapper.attributes('role')).toBeUndefined()
    })
  })
});
