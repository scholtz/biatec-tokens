import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useRouter } from 'vue-router'
import TokenComplianceChecklist from './TokenComplianceChecklist.vue'
import { useTokenComplianceStore } from '../stores/tokenCompliance'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

// Stub child components
const stubs = {
  MicaReadinessBadge: {
    template: '<span data-testid="mica-badge">Badge</span>',
    props: ['tokenId', 'size']
  }
}

describe('TokenComplianceChecklist Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should render checklist for a token', () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-1'
      },
      global: {
        stubs
      }
    })

    expect(wrapper.text()).toContain('MICA Compliance Checklist')
    expect(wrapper.text()).toContain('0% Complete')
    expect(wrapper.find('[data-testid="mica-badge"]').exists()).toBe(true)
  })

  it('should display all checklist items', () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-2'
      },
      global: {
        stubs
      }
    })

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-2')

    // Should show all checklist items
    compliance.checklist.forEach(item => {
      expect(wrapper.text()).toContain(item.label)
    })
  })

  it('should toggle checklist item when clicked', async () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-3'
      },
      global: {
        stubs
      }
    })

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-3')
    const firstItem = compliance.checklist[0]

    expect(firstItem.completed).toBe(false)

    // Click the checkbox
    const checkboxes = wrapper.findAll('button').filter(btn => btn.classes().includes('w-5'))
    await checkboxes[0].trigger('click')

    expect(firstItem.completed).toBe(true)
  })

  it('should update completion percentage when items are checked', async () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-4'
      },
      global: {
        stubs
      }
    })

    expect(wrapper.text()).toContain('0% Complete')

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-4')

    // Complete first item
    store.toggleChecklistItem('test-token-4', compliance.checklist[0].id)

    await wrapper.vm.$nextTick()

    // Should show updated percentage
    const percentage = store.getCompletionPercentage('test-token-4')
    expect(wrapper.text()).toContain(`${percentage}% Complete`)
  })

  it('should show progress bar with correct width', async () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-5'
      },
      global: {
        stubs
      }
    })

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-5')

    // Complete 2 items
    store.toggleChecklistItem('test-token-5', compliance.checklist[0].id)
    store.toggleChecklistItem('test-token-5', compliance.checklist[1].id)

    await wrapper.vm.$nextTick()

    const percentage = store.getCompletionPercentage('test-token-5')
    const progressBar = wrapper.find('.bg-gradient-to-r')
    expect(progressBar.attributes('style')).toContain(`width: ${percentage}%`)
  })

  it('should apply completed styles to checked items', async () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-6'
      },
      global: {
        stubs
      }
    })

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-6')

    // Complete first item
    store.toggleChecklistItem('test-token-6', compliance.checklist[0].id)

    await wrapper.vm.$nextTick()

    const labels = wrapper.findAll('label')
    const firstLabel = labels[0]

    expect(firstLabel.classes()).toContain('line-through')
    expect(firstLabel.classes()).toContain('text-gray-400')
  })

  it('should show reset button when items are completed', async () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-7',
        showResetButton: true
      },
      global: {
        stubs
      }
    })

    // Initially no reset button (no completed items)
    expect(wrapper.text()).not.toContain('Reset')

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-7')

    // Complete an item
    store.toggleChecklistItem('test-token-7', compliance.checklist[0].id)

    await wrapper.vm.$nextTick()

    // Reset button should now appear
    expect(wrapper.text()).toContain('Reset')
  })

  it('should reset checklist when reset button clicked', async () => {
    // Mock window.confirm
    global.confirm = vi.fn(() => true)

    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-8',
        showResetButton: true
      },
      global: {
        stubs
      }
    })

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-8')

    // Complete all items
    compliance.checklist.forEach(item => {
      store.toggleChecklistItem('test-token-8', item.id)
    })

    await wrapper.vm.$nextTick()

    expect(compliance.checklist.every(item => item.completed)).toBe(true)

    // Click reset button
    const resetButton = wrapper.findAll('button').find(btn => btn.text().includes('Reset'))
    await resetButton!.trigger('click')

    expect(compliance.checklist.every(item => !item.completed)).toBe(true)
  })

  it('should not reset if user cancels confirmation', async () => {
    // Mock window.confirm to return false
    global.confirm = vi.fn(() => false)

    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-9',
        showResetButton: true
      },
      global: {
        stubs
      }
    })

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-9')

    // Complete an item
    store.toggleChecklistItem('test-token-9', compliance.checklist[0].id)

    await wrapper.vm.$nextTick()

    expect(compliance.checklist[0].completed).toBe(true)

    // Click reset button but cancel
    const resetButton = wrapper.findAll('button').find(btn => btn.text().includes('Reset'))
    await resetButton!.trigger('click')

    // Should still be completed
    expect(compliance.checklist[0].completed).toBe(true)
  })

  it('should navigate to compliance dashboard when link clicked', async () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush
    } as any)

    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-10',
        showComplianceLink: true
      },
      global: {
        stubs
      }
    })

    const complianceButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('View Full Compliance Dashboard')
    )

    await complianceButton!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ name: 'ComplianceDashboard' })
  })

  it('should hide reset button when showResetButton is false', async () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-11',
        showResetButton: false
      },
      global: {
        stubs
      }
    })

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-11')

    // Complete an item
    store.toggleChecklistItem('test-token-11', compliance.checklist[0].id)

    await wrapper.vm.$nextTick()

    // Reset button should not appear
    expect(wrapper.text()).not.toContain('Reset')
  })

  it('should hide compliance link when showComplianceLink is false', () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-12',
        showComplianceLink: false
      },
      global: {
        stubs
      }
    })

    expect(wrapper.text()).not.toContain('View Full Compliance Dashboard')
  })

  it('should show check icon for completed items', async () => {
    const wrapper = mount(TokenComplianceChecklist, {
      props: {
        tokenId: 'test-token-13'
      },
      global: {
        stubs
      }
    })

    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('test-token-13')

    // Complete first item
    store.toggleChecklistItem('test-token-13', compliance.checklist[0].id)

    await wrapper.vm.$nextTick()

    // Should show check icon
    const checkIcons = wrapper.findAll('.pi-check')
    expect(checkIcons.length).toBeGreaterThan(0)
  })
})
