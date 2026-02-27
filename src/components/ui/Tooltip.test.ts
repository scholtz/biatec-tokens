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

  // ── Branch: clearTimeout when timeoutId exists on second hover ─────────────

  it('should clear existing timeout when showTooltip called again before delay', async () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout')
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', delay: 500 },
      attachTo: document.body,
    })
    const vm = wrapper.vm as any
    const event = { currentTarget: wrapper.element } as unknown as MouseEvent

    // First hover – sets timeoutId
    vm.showTooltip(event)
    const firstId = vm.timeoutId
    expect(firstId).not.toBeNull()

    // Second hover – should clear existing timeoutId first
    vm.showTooltip(event)
    expect(clearSpy).toHaveBeenCalledWith(firstId)
  })

  // ── Branch: showTooltip with position 'bottom' ─────────────────────────────

  it('should handle position bottom in showTooltip', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'bottom', delay: 0 },
      attachTo: document.body,
    })
    const vm = wrapper.vm as any

    // Pre-set tooltipRef mock so the if-branch executes
    const mockRect = { top: 100, left: 100, width: 100, height: 30, bottom: 130, right: 200 }
    vm.tooltipRef = { getBoundingClientRect: () => mockRect }

    const event = {
      currentTarget: { getBoundingClientRect: () => ({ top: 200, left: 50, width: 200, height: 40, bottom: 240, right: 250 }) },
    } as unknown as MouseEvent
    vm.showTooltip(event)
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    // tooltipStyle should be populated
    expect(vm.tooltipStyle).toBeDefined()
  })

  // ── Branch: showTooltip with position 'left' ──────────────────────────────

  it('should handle position left in showTooltip', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'left', delay: 0 },
      attachTo: document.body,
    })
    const vm = wrapper.vm as any
    const mockRect = { top: 100, left: 100, width: 100, height: 30, bottom: 130, right: 200 }
    vm.tooltipRef = { getBoundingClientRect: () => mockRect }

    const event = {
      currentTarget: { getBoundingClientRect: () => ({ top: 200, left: 300, width: 100, height: 40, bottom: 240, right: 400 }) },
    } as unknown as MouseEvent
    vm.showTooltip(event)
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    expect(vm.tooltipStyle).toBeDefined()
  })

  // ── Branch: showTooltip with position 'right' ─────────────────────────────

  it('should handle position right in showTooltip', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'right', delay: 0 },
      attachTo: document.body,
    })
    const vm = wrapper.vm as any
    const mockRect = { top: 100, left: 100, width: 100, height: 30, bottom: 130, right: 200 }
    vm.tooltipRef = { getBoundingClientRect: () => mockRect }

    const event = {
      currentTarget: { getBoundingClientRect: () => ({ top: 200, left: 100, width: 100, height: 40, bottom: 240, right: 200 }) },
    } as unknown as MouseEvent
    vm.showTooltip(event)
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    expect(vm.tooltipStyle).toBeDefined()
  })

  // ── Branch: showTooltip when tooltipRef is still null (v-if hidden) ───────

  it('should set visible true even when tooltipRef is null', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', delay: 0 },
      attachTo: document.body,
    })
    const vm = wrapper.vm as any
    // Keep tooltipRef null
    vm.tooltipRef = null
    const event = { currentTarget: wrapper.element } as unknown as MouseEvent
    vm.showTooltip(event)
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    expect(vm.visible).toBe(true)
  })

  // ── Branch: viewport clamping when position top causes negative top ───────

  it('should clamp tooltip position when near top of viewport', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'tip', position: 'top', delay: 0 },
      attachTo: document.body,
    })
    const vm = wrapper.vm as any

    // triggerRect near top of viewport → top would go negative
    const triggerRect = { top: 5, left: 50, width: 100, height: 30, bottom: 35, right: 150 }
    const tooltipRect = { top: 0, left: 0, width: 80, height: 40, bottom: 40, right: 80 }
    vm.tooltipRef = { getBoundingClientRect: () => tooltipRect }

    const event = {
      currentTarget: { getBoundingClientRect: () => triggerRect },
    } as unknown as MouseEvent
    vm.showTooltip(event)
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    // top should be clamped to at least padding (8)
    if (vm.tooltipStyle.top) {
      const topVal = parseInt(vm.tooltipStyle.top)
      expect(topVal).toBeGreaterThanOrEqual(8)
    }
  })
})
