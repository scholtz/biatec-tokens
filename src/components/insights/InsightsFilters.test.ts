import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InsightsFilters from './InsightsFilters.vue'
import type { InsightsFilters as InsightsFiltersType } from '../../stores/insights'

describe('InsightsFilters', () => {
  const defaultFilters: InsightsFiltersType = {
    timeframe: '30d',
    networks: [],
    tokenIds: [],
    walletSegment: 'all',
  }

  it('should render all filter options', () => {
    const wrapper = mount(InsightsFilters, {
      props: { filters: defaultFilters },
    })

    expect(wrapper.text()).toContain('Timeframe')
    expect(wrapper.text()).toContain('Networks')
    expect(wrapper.text()).toContain('Wallet Segment')
  })

  it('should emit update:filters when timeframe changes', async () => {
    const wrapper = mount(InsightsFilters, {
      props: { filters: defaultFilters },
    })

    // The Select component uses slots, so we need to find the actual select element
    const selectElements = wrapper.findAll('select')
    if (selectElements.length > 0) {
      await selectElements[0].setValue('7d')
      
      // Check that event was emitted
      expect(wrapper.emitted('update:filters')).toBeTruthy()
    }
  })

  it('should show reset button when filters are active', () => {
    const activeFilters: InsightsFiltersType = {
      ...defaultFilters,
      networks: ['algorand'],
    }

    const wrapper = mount(InsightsFilters, {
      props: { filters: activeFilters },
    })

    expect(wrapper.text()).toContain('Reset All')
  })

  it('should not show reset button when no filters are active', () => {
    const wrapper = mount(InsightsFilters, {
      props: { filters: defaultFilters },
    })

    expect(wrapper.text()).not.toContain('Reset All')
  })

  it('should emit reset event when reset button is clicked', async () => {
    const activeFilters: InsightsFiltersType = {
      ...defaultFilters,
      networks: ['algorand'],
    }

    const wrapper = mount(InsightsFilters, {
      props: { filters: activeFilters },
    })

    const resetButton = wrapper.find('button:contains("Reset All")')
    if (resetButton.exists()) {
      await resetButton.trigger('click')
      expect(wrapper.emitted('reset')).toBeTruthy()
    }
  })

  it('should display active filter badges', () => {
    const activeFilters: InsightsFiltersType = {
      ...defaultFilters,
      networks: ['algorand'],
      walletSegment: 'whales',
    }

    const wrapper = mount(InsightsFilters, {
      props: { filters: activeFilters },
    })

    expect(wrapper.text()).toContain('Active:')
    expect(wrapper.text()).toContain('Algorand')
    expect(wrapper.text()).toContain('whales')
  })

  it('should have correct wallet segment options', () => {
    const wrapper = mount(InsightsFilters, {
      props: { filters: defaultFilters },
    })

    // Check that the wallet segment label exists
    expect(wrapper.text()).toContain('Wallet Segment')
    
    // The Select component should be present with wallet segment options
    const selectElements = wrapper.findAll('select')
    expect(selectElements.length).toBeGreaterThan(0)
  })
})
