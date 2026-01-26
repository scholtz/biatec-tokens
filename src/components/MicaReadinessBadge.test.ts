import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MicaReadinessBadge from './MicaReadinessBadge.vue'
import { useTokenComplianceStore } from '../stores/tokenCompliance'

describe('MicaReadinessBadge Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('should render badge with "Incomplete" status for new token', () => {
    const wrapper = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-token-1'
      }
    })

    expect(wrapper.text()).toContain('Incomplete')
    expect(wrapper.html()).toContain('pi-times-circle')
  })

  it('should render badge with "At Risk" status for 40-79% completion', () => {
    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-2')

    // Complete 2 out of 5 items (40%)
    store.toggleChecklistItem('test-token-2', compliance.checklist[0].id)
    store.toggleChecklistItem('test-token-2', compliance.checklist[1].id)

    const wrapper = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-token-2'
      }
    })

    expect(wrapper.text()).toContain('At Risk')
    expect(wrapper.html()).toContain('pi-exclamation-triangle')
  })

  it('should render badge with "Ready" status for 80%+ completion', () => {
    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-3')

    // Complete 4 out of 5 items (80%)
    store.toggleChecklistItem('test-token-3', compliance.checklist[0].id)
    store.toggleChecklistItem('test-token-3', compliance.checklist[1].id)
    store.toggleChecklistItem('test-token-3', compliance.checklist[2].id)
    store.toggleChecklistItem('test-token-3', compliance.checklist[3].id)

    const wrapper = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-token-3'
      }
    })

    expect(wrapper.text()).toContain('Ready')
    expect(wrapper.html()).toContain('pi-check-circle')
  })

  it('should render badge with "Ready" status for 100% completion', () => {
    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-4')

    // Complete all items
    compliance.checklist.forEach(item => {
      store.toggleChecklistItem('test-token-4', item.id)
    })

    const wrapper = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-token-4'
      }
    })

    expect(wrapper.text()).toContain('Ready')
    expect(wrapper.html()).toContain('pi-check-circle')
  })

  it('should apply correct badge variant for each status', () => {
    const store = useTokenComplianceStore()

    // Incomplete status
    const wrapperIncomplete = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-incomplete'
      }
    })
    expect(wrapperIncomplete.html()).toContain('bg-red')

    // At Risk status
    const complianceAtRisk = store.getTokenCompliance('test-at-risk')
    store.toggleChecklistItem('test-at-risk', complianceAtRisk.checklist[0].id)
    store.toggleChecklistItem('test-at-risk', complianceAtRisk.checklist[1].id)

    const wrapperAtRisk = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-at-risk'
      }
    })
    expect(wrapperAtRisk.html()).toContain('bg-yellow')

    // Ready status
    const complianceReady = store.getTokenCompliance('test-ready')
    complianceReady.checklist.forEach(item => {
      store.toggleChecklistItem('test-ready', item.id)
    })

    const wrapperReady = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-ready'
      }
    })
    expect(wrapperReady.html()).toContain('bg-green')
  })

  it('should support different sizes', () => {
    const wrapperSmall = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-token-size',
        size: 'sm'
      }
    })
    expect(wrapperSmall.html()).toContain('text-xs')

    const wrapperMedium = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-token-size',
        size: 'md'
      }
    })
    expect(wrapperMedium.html()).toContain('text-sm')

    const wrapperLarge = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-token-size',
        size: 'lg'
      }
    })
    expect(wrapperLarge.html()).toContain('text-base')
  })

  it('should update badge when compliance status changes', async () => {
    const store = useTokenComplianceStore()
    const wrapper = mount(MicaReadinessBadge, {
      props: {
        tokenId: 'test-token-update'
      }
    })

    // Initially incomplete
    expect(wrapper.text()).toContain('Incomplete')

    // Complete all items to make it "Ready"
    const compliance = store.getTokenCompliance('test-token-update')
    compliance.checklist.forEach(item => {
      store.toggleChecklistItem('test-token-update', item.id)
    })

    // Wait for Vue to update the DOM
    await wrapper.vm.$nextTick()

    // Should now be "Ready"
    expect(wrapper.text()).toContain('Ready')
  })
})
