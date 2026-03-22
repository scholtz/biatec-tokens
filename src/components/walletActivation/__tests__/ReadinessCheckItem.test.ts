import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReadinessCheckItem from '../ReadinessCheckItem.vue'

describe('ReadinessCheckItem', () => {
  it('renders title and description', () => {
    const w = mount(ReadinessCheckItem, {
      props: { status: true, title: 'Check Title', description: 'Check Desc' },
    })
    expect(w.text()).toContain('Check Title')
    expect(w.text()).toContain('Check Desc')
  })

  it('shows green classes when status is true', () => {
    const w = mount(ReadinessCheckItem, {
      props: { status: true, title: 'T', description: 'D' },
    })
    expect(w.html()).toContain('bg-green-50')
    expect(w.html()).toContain('text-green-600')
  })

  it('shows red classes when status is false', () => {
    const w = mount(ReadinessCheckItem, {
      props: { status: false, title: 'T', description: 'D' },
    })
    expect(w.html()).toContain('bg-red-50')
    expect(w.html()).toContain('text-red-600')
  })

  it('shows blue loading classes when loading', () => {
    const w = mount(ReadinessCheckItem, {
      props: { status: false, title: 'T', description: 'D', loading: true },
    })
    expect(w.html()).toContain('bg-blue-50')
    expect(w.html()).toContain('text-blue-600')
  })

  it('shows spinner when loading', () => {
    const w = mount(ReadinessCheckItem, {
      props: { status: true, title: 'T', description: 'D', loading: true },
    })
    expect(w.html()).toContain('animate-spin')
  })

  it('does not show spinner when not loading', () => {
    const w = mount(ReadinessCheckItem, {
      props: { status: true, title: 'T', description: 'D', loading: false },
    })
    expect(w.html()).not.toContain('animate-spin')
  })

  it('uses different icon component for different status values', () => {
    const loadingW = mount(ReadinessCheckItem, {
      props: { status: false, title: 'T', description: 'D', loading: true },
    })
    const successW = mount(ReadinessCheckItem, {
      props: { status: true, title: 'T', description: 'D', loading: false },
    })
    const failW = mount(ReadinessCheckItem, {
      props: { status: false, title: 'T', description: 'D', loading: false },
    })
    expect((loadingW.vm as any).iconComponent).toBeTruthy()
    expect((successW.vm as any).iconComponent).toBeTruthy()
    expect((failW.vm as any).iconComponent).toBeTruthy()
    // Loading uses a different icon than success
    expect((loadingW.vm as any).iconComponent).not.toBe((successW.vm as any).iconComponent)
    // Success uses a different icon than failure
    expect((successW.vm as any).iconComponent).not.toBe((failW.vm as any).iconComponent)
  })
})
