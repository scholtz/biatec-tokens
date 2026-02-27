import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BoltBadge from '../BoltBadge.vue'

describe('BoltBadge', () => {
  it('should render the component', () => {
    const wrapper = mount(BoltBadge)
    expect(wrapper.exists()).toBe(true)
  })

  it('should be an anchor link to bolt.new', () => {
    const wrapper = mount(BoltBadge)
    const anchor = wrapper.find('a')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toBe('https://bolt.new')
  })

  it('should open in new tab', () => {
    const wrapper = mount(BoltBadge)
    const anchor = wrapper.find('a')
    expect(anchor.attributes('target')).toBe('_blank')
  })

  it('should have noopener noreferrer rel', () => {
    const wrapper = mount(BoltBadge)
    const anchor = wrapper.find('a')
    expect(anchor.attributes('rel')).toBe('noopener noreferrer')
  })

  it('should display "Built with Bolt.new" text', () => {
    const wrapper = mount(BoltBadge)
    expect(wrapper.text()).toContain('Built with Bolt.new')
  })

  it('should have accessible title attribute', () => {
    const wrapper = mount(BoltBadge)
    const anchor = wrapper.find('a')
    expect(anchor.attributes('title')).toBe('Built with Bolt.new')
  })
})
