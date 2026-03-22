import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ActionCard from '../ActionCard.vue'

const stubs = { Card: { template: '<div @click="$emit(\'click\')"><slot /></div>', props: ['variant', 'hover', 'clickable'], emits: ['click'] } }

describe('ActionCard', () => {
  it('renders title and description', () => {
    const w = mount(ActionCard, {
      props: { title: 'My Title', description: 'My Description', icon: 'rocket' },
      global: { stubs },
    })
    expect(w.text()).toContain('My Title')
    expect(w.text()).toContain('My Description')
  })

  it('applies ring class when selected', () => {
    const w = mount(ActionCard, {
      props: { title: 'T', description: 'D', icon: 'rocket', selected: true },
      global: { stubs },
    })
    expect(w.html()).toContain('ring-2')
  })

  it('does not apply ring class when not selected', () => {
    const w = mount(ActionCard, {
      props: { title: 'T', description: 'D', icon: 'rocket', selected: false },
      global: { stubs },
    })
    expect(w.html()).not.toContain('ring-2')
  })

  it('uses gradient background when selected', () => {
    const w = mount(ActionCard, {
      props: { title: 'T', description: 'D', icon: 'compare', selected: true },
      global: { stubs },
    })
    expect(w.html()).toContain('from-blue-600')
  })

  it('uses gray background when not selected', () => {
    const w = mount(ActionCard, {
      props: { title: 'T', description: 'D', icon: 'rocket', selected: false },
      global: { stubs },
    })
    expect(w.html()).toContain('bg-gray-200')
  })

  it('emits select event on click', async () => {
    const w = mount(ActionCard, {
      props: { title: 'T', description: 'D', icon: 'rocket' },
      global: { stubs },
    })
    await w.find('div').trigger('click')
    expect(w.emitted('select')).toBeTruthy()
  })

  it('uses different icon component for rocket vs compare', () => {
    const rocketW = mount(ActionCard, {
      props: { title: 'T', description: 'D', icon: 'rocket' },
      global: { stubs },
    })
    const compareW = mount(ActionCard, {
      props: { title: 'T', description: 'D', icon: 'compare' },
      global: { stubs },
    })
    expect((rocketW.vm as any).iconComponent).toBeTruthy()
    expect((compareW.vm as any).iconComponent).toBeTruthy()
    expect((rocketW.vm as any).iconComponent).not.toBe((compareW.vm as any).iconComponent)
  })
})
