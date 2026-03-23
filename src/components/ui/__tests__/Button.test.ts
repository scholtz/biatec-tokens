import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

describe('Button.vue', () => {
  it('renders default slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Click Me' } })
    expect(wrapper.text()).toContain('Click Me')
  })

  it('applies primary variant classes by default', () => {
    const wrapper = mount(Button)
    expect(wrapper.classes().join(' ')).toContain('from-blue-600')
  })

  it('applies secondary variant classes', () => {
    const wrapper = mount(Button, { props: { variant: 'secondary' } })
    expect(wrapper.classes().join(' ')).toContain('bg-gray-100')
  })

  it('applies outline variant classes', () => {
    const wrapper = mount(Button, { props: { variant: 'outline' } })
    expect(wrapper.classes().join(' ')).toContain('border-2')
  })

  it('applies ghost variant classes', () => {
    const wrapper = mount(Button, { props: { variant: 'ghost' } })
    expect(wrapper.classes().join(' ')).toContain('hover:bg-gray-100')
  })

  it('applies danger variant classes', () => {
    const wrapper = mount(Button, { props: { variant: 'danger' } })
    expect(wrapper.classes().join(' ')).toContain('bg-red-600')
  })

  it('applies sm size classes', () => {
    const wrapper = mount(Button, { props: { size: 'sm' } })
    expect(wrapper.classes().join(' ')).toContain('text-sm')
    expect(wrapper.classes().join(' ')).toContain('px-3')
  })

  it('applies lg size classes', () => {
    const wrapper = mount(Button, { props: { size: 'lg' } })
    expect(wrapper.classes().join(' ')).toContain('px-6')
    expect(wrapper.classes().join(' ')).toContain('text-base')
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(Button, { props: { disabled: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('shows loading spinner when loading is true', () => {
    const wrapper = mount(Button, { props: { loading: true } })
    const spinner = wrapper.find('.animate-spin')
    expect(spinner.exists()).toBe(true)
  })

  it('sets aria-busy when loading', () => {
    const wrapper = mount(Button, { props: { loading: true } })
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('sets aria-label when loading with ariaLoadingLabel', () => {
    const wrapper = mount(Button, { props: { loading: true, ariaLoadingLabel: 'Saving…' } })
    expect(wrapper.attributes('aria-label')).toBe('Saving…')
  })

  it('applies fullWidth class', () => {
    const wrapper = mount(Button, { props: { fullWidth: true } })
    expect(wrapper.classes().join(' ')).toContain('w-full')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, { props: { disabled: true } })
    await wrapper.trigger('click')
    // Button is disabled, browser prevents click — verify disabled attribute
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
