import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MicaSummaryWidget from '../MicaSummaryWidget.vue'

function mountWidget(props = {}) {
  return mount(MicaSummaryWidget, {
    props: {
      title: 'Test Widget',
      icon: 'pi pi-check',
      ...props,
    },
    global: { stubs: { Teleport: false } },
  })
}

describe('MicaSummaryWidget', () => {
  it('renders title', () => {
    const w = mountWidget({ title: 'My Widget' })
    expect(w.text()).toContain('My Widget')
  })

  it('renders subtitle when provided', () => {
    const w = mountWidget({ subtitle: 'Some subtitle' })
    expect(w.text()).toContain('Some subtitle')
  })

  it('renders value when provided', () => {
    const w = mountWidget({ value: 42 })
    expect(w.text()).toContain('42')
  })

  it('renders description when provided', () => {
    const w = mountWidget({ description: 'A description' })
    expect(w.text()).toContain('A description')
  })

  it('applies blue icon color by default', () => {
    const w = mountWidget()
    expect(w.html()).toContain('text-blue-400')
    expect(w.html()).toContain('bg-blue-500/10')
  })

  it('applies green icon color', () => {
    const w = mountWidget({ iconColor: 'green' })
    expect(w.html()).toContain('text-green-400')
    expect(w.html()).toContain('bg-green-500/10')
  })

  it('applies yellow icon color', () => {
    const w = mountWidget({ iconColor: 'yellow' })
    expect(w.html()).toContain('text-yellow-400')
    expect(w.html()).toContain('bg-yellow-500/10')
  })

  it('applies purple icon color', () => {
    const w = mountWidget({ iconColor: 'purple' })
    expect(w.html()).toContain('text-purple-400')
    expect(w.html()).toContain('bg-purple-500/10')
  })

  it('applies orange icon color', () => {
    const w = mountWidget({ iconColor: 'orange' })
    expect(w.html()).toContain('text-orange-400')
    expect(w.html()).toContain('bg-orange-500/10')
  })

  it('applies pink icon color', () => {
    const w = mountWidget({ iconColor: 'pink' })
    expect(w.html()).toContain('text-pink-400')
    expect(w.html()).toContain('bg-pink-500/10')
  })

  it('does not show view-details button when hasDetails is false', () => {
    const w = mountWidget({ hasDetails: false })
    const btn = w.find('button[title="View details"]')
    expect(btn.exists()).toBe(false)
  })

  it('shows view-details button when hasDetails is true', () => {
    const w = mountWidget({ hasDetails: true })
    const btn = w.find('button[title="View details"]')
    expect(btn.exists()).toBe(true)
  })

  it('emits view-details when button clicked', async () => {
    const w = mountWidget({ hasDetails: true })
    await w.find('button[title="View details"]').trigger('click')
    expect(w.emitted('view-details')).toBeTruthy()
  })

  it('does not render lastUpdated section when not provided', () => {
    const w = mountWidget()
    expect(w.text()).not.toContain('Last updated:')
  })

  it('renders lastUpdated section when provided', () => {
    const w = mountWidget({ lastUpdated: '2024-01-15T10:30:00Z' })
    expect(w.text()).toContain('Last updated:')
  })
})
