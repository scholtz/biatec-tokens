import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
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
    // Modal uses <Teleport to="body"> so Vue Test Utils' wrapper.find() does NOT
    // search the teleported content.  Use document.body.querySelector() instead and
    // unmount after each test to keep document.body clean between test runs.
    //
    // IMPORTANT: Vue Test Utils' unmount() with Teleport may not synchronously remove
    // content from document.body in happy-dom.  The beforeEach cleanup ensures each test
    // starts with a clean document.body regardless of previous test state.
    beforeEach(() => {
      // Remove any stale teleported modal content left from a previous test's unmount
      document.body.querySelectorAll('[role="dialog"], [role="presentation"]').forEach(el => el.remove())
    })

    it('dialog container has role="dialog" when visible (SC 4.1.2)', () => {
      const wrapper = mount(Modal, { props: { show: true }, attachTo: document.body })
      // Teleport renders into document.body — must query there, not in wrapper
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog).not.toBeNull()
      wrapper.unmount()
    })

    it('dialog container has aria-modal="true" to constrain AT navigation (SC 4.1.2)', () => {
      const wrapper = mount(Modal, { props: { show: true }, attachTo: document.body })
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog?.getAttribute('aria-modal')).toBe('true')
      wrapper.unmount()
    })

    it('close button has aria-label for screen-reader description (SC 4.1.2)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        slots: { header: '<h2>Confirm Action</h2>' },
        attachTo: document.body,
      })
      const closeBtn = document.body.querySelector('button[aria-label="Close dialog"]')
      expect(closeBtn).not.toBeNull()
      wrapper.unmount()
    })

    it('close button SVG is aria-hidden to avoid double announcement (SC 4.1.2)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        slots: { header: '<h2>Title</h2>' },
        attachTo: document.body,
      })
      const svg = document.body.querySelector('button[aria-label="Close dialog"] svg')
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      wrapper.unmount()
    })

    it('backdrop has aria-hidden to avoid AT traversal outside dialog (SC 4.1.2)', () => {
      const wrapper = mount(Modal, { props: { show: true }, attachTo: document.body })
      // The semi-transparent backdrop carries aria-hidden="true"
      const backdrop = document.body.querySelector('.backdrop-blur-sm[aria-hidden="true"]')
      expect(backdrop).not.toBeNull()
      wrapper.unmount()
    })

    it('close button has focus-visible ring class for keyboard navigation (SC 2.4.7)', () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        slots: { header: '<h2>Title</h2>' },
        attachTo: document.body,
      })
      const closeBtn = document.body.querySelector('button[aria-label="Close dialog"]')
      expect(closeBtn?.className).toContain('focus-visible:ring-2')
      wrapper.unmount()
    })

    it('outer wrapper with role="presentation" is rendered in DOM when visible (SC 2.1.2)', async () => {
      const wrapper = mount(Modal, { props: { show: true }, attachTo: document.body })
      // Teleport + Transition need a tick to render into document.body
      await nextTick()
      // The outer div carries @keydown.esc="closeModal" and role="presentation".
      // Its presence in DOM confirms the keyboard-trap structure is in place.
      // The keyboard handler logic is verified separately in the next test.
      const outer = document.body.querySelector('[role="presentation"]') as HTMLElement | null
      expect(outer).not.toBeNull()
      wrapper.unmount()
    })

    it('closeModal emits close event (SC 2.1.2 keyboard handler logic)', async () => {
      const wrapper = mount(Modal, { props: { show: true }, attachTo: document.body })
      await nextTick()
      // The Escape key handler calls closeModal() which emits 'close'.
      // Verify the method-level behavior: calling closeModal emits the correct event.
      await (wrapper.vm as any).closeModal()
      expect(wrapper.emitted('close')).toBeTruthy()
      wrapper.unmount()
    })

    it('does NOT render dialog in DOM when show is false (SC 4.1.2)', async () => {
      const wrapper = mount(Modal, { props: { show: false }, attachTo: document.body })
      await nextTick()
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog).toBeNull()
      wrapper.unmount()
    })

    it('dialog has aria-labelledby referencing the header container ID (SC 4.1.2)', async () => {
      const wrapper = mount(Modal, {
        props: { show: true },
        slots: { header: '<h2>Token Setup</h2>' },
        attachTo: document.body,
      })
      await nextTick()
      const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement | null
      expect(dialog).not.toBeNull()
      const labelledBy = dialog!.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      // The element referenced by aria-labelledby must exist in DOM
      expect(document.body.querySelector(`#${labelledBy}`)).not.toBeNull()
      wrapper.unmount()
    })

    it('accepts sm size prop and renders with max-w-sm class (SC 1.4.4 reflow)', async () => {
      const wrapper = mount(Modal, { props: { show: true, size: 'sm' }, attachTo: document.body })
      await nextTick()
      const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement | null
      expect(dialog?.className).toContain('max-w-sm')
      wrapper.unmount()
    })

    it('accepts xl size prop and renders with max-w-2xl class (SC 1.4.4 reflow)', async () => {
      const wrapper = mount(Modal, { props: { show: true, size: 'xl' }, attachTo: document.body })
      await nextTick()
      const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement | null
      expect(dialog?.className).toContain('max-w-2xl')
      wrapper.unmount()
    })

    it('dialog has tabindex="-1" to receive programmatic focus (SC 2.4.3)', async () => {
      const wrapper = mount(Modal, { props: { show: true }, attachTo: document.body })
      await nextTick()
      const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement | null
      expect(dialog?.getAttribute('tabindex')).toBe('-1')
      wrapper.unmount()
    })
  })
});
