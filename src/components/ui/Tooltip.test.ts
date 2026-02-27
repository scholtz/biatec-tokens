import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Tooltip from './Tooltip.vue'

describe('Tooltip Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should render slot content', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'Test tooltip' },
      slots: { default: '<button>Hover me</button>' },
      attachTo: document.body,
    })
    expect(wrapper.html()).toContain('Hover me')
  })

  it('should not show tooltip initially', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'Test tooltip' },
      attachTo: document.body,
    })
    expect((wrapper.vm as any).visible).toBe(false)
  })

  it('should show tooltip after delay on mouseenter', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'Test tooltip', delay: 200 },
      attachTo: document.body,
    })

    const vm = wrapper.vm as any
    // Call showTooltip directly via the underlying event handler logic
    vm.visible = false
    // Simulate by calling the internal function (uses fake timers)
    const event = { currentTarget: wrapper.element } as unknown as MouseEvent
    vm.showTooltip(event)
    expect(vm.visible).toBe(false) // not shown yet

    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    expect(vm.visible).toBe(true)
  })

  it('should hide tooltip on mouseleave', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'Test tooltip', delay: 0 },
      attachTo: document.body,
    })

    const vm = wrapper.vm as any
    const event = { currentTarget: wrapper.element } as unknown as MouseEvent
    vm.showTooltip(event)
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()

    vm.hideTooltip()
    expect(vm.visible).toBe(false)
  })

  it('should clear timeout on mouseleave before delay elapses', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'Test tooltip', delay: 500 },
      attachTo: document.body,
    })

    const vm = wrapper.vm as any
    const event = { currentTarget: wrapper.element } as unknown as MouseEvent
    vm.showTooltip(event)
    vi.advanceTimersByTime(100)
    vm.hideTooltip()
    vi.advanceTimersByTime(400)
    await wrapper.vm.$nextTick()

    expect(vm.visible).toBe(false)
  })

  it('should compute correct position class for top', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'top' },
      attachTo: document.body,
    })
    expect((wrapper.vm as any).positionClass).toBe('tooltip-top')
  })

  it('should compute correct position class for bottom', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'bottom' },
      attachTo: document.body,
    })
    expect((wrapper.vm as any).positionClass).toBe('tooltip-bottom')
  })

  it('should compute correct position class for left', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'left' },
      attachTo: document.body,
    })
    expect((wrapper.vm as any).positionClass).toBe('tooltip-left')
  })

  it('should compute correct position class for right', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'right' },
      attachTo: document.body,
    })
    expect((wrapper.vm as any).positionClass).toBe('tooltip-right')
  })

  it('should compute correct arrow class', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'right' },
      attachTo: document.body,
    })
    expect((wrapper.vm as any).arrowClass).toBe('arrow-right')
  })

  it('should clean up timer on unmount', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout')
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', delay: 500 },
      attachTo: document.body,
    })

    const vm = wrapper.vm as any
    const event = { currentTarget: wrapper.element } as unknown as MouseEvent
    // Trigger a pending timeout
    vm.showTooltip(event)
    expect(vm.timeoutId).not.toBeNull()

    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
  })

  it('should accept content slot', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'default content' },
      slots: {
        default: '<span>trigger</span>',
        content: '<strong>Custom tip</strong>',
      },
      attachTo: document.body,
    })
    expect(wrapper.html()).toContain('trigger')
  })

  it('should accept maxWidth prop', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', maxWidth: '200px' },
      attachTo: document.body,
    })
    expect(wrapper.props('maxWidth')).toBe('200px')
  })
})
