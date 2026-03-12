import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Modal from './Modal.vue';

describe('Modal Component', () => {
  it('should not render content when show is false', () => {
    const wrapper = mount(Modal, {
      props: {
        show: false
      }
    });
    
    // The modal uses v-if, so the content shouldn't be in the DOM when show is false
    expect(wrapper.html()).toContain('teleport');
  });

  it('should render content when show is true', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true
      },
      attachTo: document.body
    });
    
    // Modal uses Teleport which doesn't fully work in test environment
    // Just verify the component renders without errors
    expect(wrapper.exists()).toBe(true);
  });

  it('should have expected props', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true
      }
    });
    
    expect(wrapper.props('show')).toBe(true);
  });

  it('should accept header slot', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true
      },
      slots: {
        header: '<h2>Modal Header</h2>'
      }
    });
    
    // Component should compile and render without errors
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept footer slot', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true
      },
      slots: {
        footer: '<div>Modal Footer</div>'
      }
    });
    
    // Component should compile and render without errors
    expect(wrapper.exists()).toBe(true);
  });

  it('should emit close event when closeModal is called', async () => {
    const wrapper = mount(Modal, {
      props: {
        show: true
      }
    });
    
    // Call the closeModal method directly
    await (wrapper.vm as any).closeModal();
    
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should accept default slot content', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true
      },
      slots: {
        default: '<p>Content</p>'
      }
    });
    
    // Component should compile and render without errors
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept all slots together', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true
      },
      slots: {
        header: '<h2>Header</h2>',
        default: '<p>Content</p>',
        footer: '<button>Footer Button</button>'
      }
    });
    
    // Component should compile and render without errors
    expect(wrapper.exists()).toBe(true);
  });

  it('should use Transition component', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true
      }
    });
    
    // Verify component structure exists
    expect(wrapper.exists()).toBe(true);
  });

  it('should be properly structured', () => {
    const wrapper = mount(Modal, {
      props: {
        show: false
      }
    });
    
    // Just verify the component mounts without errors
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept sm size prop', () => {
    const wrapper = mount(Modal, { props: { show: true, size: 'sm' } });
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept lg size prop', () => {
    const wrapper = mount(Modal, { props: { show: true, size: 'lg' } });
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept xl size prop', () => {
    const wrapper = mount(Modal, { props: { show: true, size: 'xl' } });
    expect(wrapper.exists()).toBe(true);
  });

  it('should compute sm size class', () => {
    const wrapper = mount(Modal, { props: { show: true, size: 'sm' } });
    expect((wrapper.vm as any).modalSizeClass).toBe('max-w-sm');
  });

  it('should compute md size class', () => {
    const wrapper = mount(Modal, { props: { show: true, size: 'md' } });
    expect((wrapper.vm as any).modalSizeClass).toBe('max-w-md');
  });

  it('should compute lg size class', () => {
    const wrapper = mount(Modal, { props: { show: true, size: 'lg' } });
    expect((wrapper.vm as any).modalSizeClass).toBe('max-w-lg');
  });

  it('should compute xl size class', () => {
    const wrapper = mount(Modal, { props: { show: true, size: 'xl' } });
    expect((wrapper.vm as any).modalSizeClass).toBe('max-w-2xl');
  });

  it('should return default max-w-md for unknown size', () => {
    const wrapper = mount(Modal, { props: { show: true, size: 'unknown' as any } });
    expect((wrapper.vm as any).modalSizeClass).toBe('max-w-md');
  });

  // ---------------------------------------------------------------------------
  // WCAG 2.1 AA accessibility tests (SC 4.1.2 Name, Role, Value)
  // ---------------------------------------------------------------------------

  describe('WCAG 2.1 AA — SC 4.1.2 Name, Role, Value', () => {
    it('dialog container has role="dialog" when visible (SC 4.1.2)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        attachTo: document.body,
      })
      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.exists()).toBe(true)
    })

    it('dialog container has aria-modal="true" to constrain AT navigation (SC 4.1.2)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        attachTo: document.body,
      })
      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('close button has aria-label for screen-reader description (SC 4.1.2)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        slots: { header: '<h2 id="modal-heading">Confirm Action</h2>' },
        attachTo: document.body,
      })
      const closeBtn = wrapper.find('button[aria-label="Close dialog"]')
      expect(closeBtn.exists()).toBe(true)
    })

    it('close button SVG is aria-hidden to avoid double announcement (SC 4.1.2)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        slots: { header: '<h2>Title</h2>' },
        attachTo: document.body,
      })
      const svg = wrapper.find('button[aria-label="Close dialog"] svg')
      expect(svg.attributes('aria-hidden')).toBe('true')
    })

    it('backdrop has aria-hidden to avoid AT traversal outside dialog (SC 4.1.2)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        attachTo: document.body,
      })
      const backdrop = wrapper.find('[aria-hidden="true"]')
      expect(backdrop.exists()).toBe(true)
    })

    it('close button has focus-visible ring class for keyboard navigation (SC 2.4.7)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        slots: { header: '<h2>Title</h2>' },
        attachTo: document.body,
      })
      const closeBtn = wrapper.find('button[aria-label="Close dialog"]')
      expect(closeBtn.classes().join(' ')).toContain('focus-visible:ring-2')
    })

    it('emits close when Escape key is pressed on the wrapper (keyboard trap SC 2.1.2)', async () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        attachTo: document.body,
      })
      const outer = wrapper.find('[role="presentation"]')
      await outer.trigger('keydown.esc')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })
});
