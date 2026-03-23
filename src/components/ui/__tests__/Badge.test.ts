import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from '../Badge.vue'

describe('Badge.vue', () => {
  it('renders slot content', () => {
    const wrapper = mount(Badge, { slots: { default: 'Active' } })
    expect(wrapper.text()).toContain('Active')
  })

  it('applies default variant classes', () => {
    const wrapper = mount(Badge)
    expect(wrapper.classes().join(' ')).toContain('bg-gray-100')
  })

  it('applies success variant classes', () => {
    const wrapper = mount(Badge, { props: { variant: 'success' } })
    expect(wrapper.classes().join(' ')).toContain('bg-green-100')
    expect(wrapper.classes().join(' ')).toContain('text-green-800')
  })

  it('applies warning variant classes', () => {
    const wrapper = mount(Badge, { props: { variant: 'warning' } })
    expect(wrapper.classes().join(' ')).toContain('bg-yellow-100')
    expect(wrapper.classes().join(' ')).toContain('text-yellow-800')
  })

  it('applies error variant classes', () => {
    const wrapper = mount(Badge, { props: { variant: 'error' } })
    expect(wrapper.classes().join(' ')).toContain('bg-red-100')
    expect(wrapper.classes().join(' ')).toContain('text-red-800')
  })

  it('applies info variant classes', () => {
    const wrapper = mount(Badge, { props: { variant: 'info' } })
    expect(wrapper.classes().join(' ')).toContain('bg-blue-100')
    expect(wrapper.classes().join(' ')).toContain('text-blue-800')
  })

  it('applies sm size classes', () => {
    const wrapper = mount(Badge, { props: { size: 'sm' } })
    expect(wrapper.classes().join(' ')).toContain('text-xs')
    expect(wrapper.classes().join(' ')).toContain('px-2')
  })

  it('applies md size classes by default', () => {
    const wrapper = mount(Badge)
    expect(wrapper.classes().join(' ')).toContain('px-2.5')
    expect(wrapper.classes().join(' ')).toContain('text-sm')
  })

  it('applies lg size classes', () => {
    const wrapper = mount(Badge, { props: { size: 'lg' } })
    expect(wrapper.classes().join(' ')).toContain('px-3')
    expect(wrapper.classes().join(' ')).toContain('text-base')
  })

  it('renders as span element', () => {
    const wrapper = mount(Badge)
    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
  })

  it('sets role="status" when provided', () => {
    const wrapper = mount(Badge, { props: { role: 'status' } })
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('sets role="alert" when provided', () => {
    const wrapper = mount(Badge, { props: { role: 'alert' } })
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('has no role attribute when role is undefined', () => {
    const wrapper = mount(Badge)
    expect(wrapper.attributes('role')).toBeUndefined()
  })
})
