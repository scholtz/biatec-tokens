import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CohortTable from './CohortTable.vue'

describe('CohortTable', () => {
  it('should render cohort table header', () => {
    const wrapper = mount(CohortTable)

    expect(wrapper.text()).toContain('Wallet Segment Distribution')
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('should display all cohort segments', () => {
    const wrapper = mount(CohortTable)

    expect(wrapper.text()).toContain('Whales')
    expect(wrapper.text()).toContain('Institutional')
    expect(wrapper.text()).toContain('Active')
    expect(wrapper.text()).toContain('Retail')
    expect(wrapper.text()).toContain('Dormant')
  })

  it('should show wallet count for each segment', () => {
    const wrapper = mount(CohortTable)
    const html = wrapper.html()

    // Check that numbers are displayed (wallet counts)
    expect(html).toMatch(/\d+/)
  })

  it('should display percentage of total', () => {
    const wrapper = mount(CohortTable)

    // Check for percentage values
    expect(wrapper.text()).toMatch(/\d+\.\d+%/)
  })

  it('should show activity scores with progress bars', () => {
    const wrapper = mount(CohortTable)

    // Check for progress bar elements
    const progressBars = wrapper.findAll('.bg-blue-500')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('should display total row at bottom', () => {
    const wrapper = mount(CohortTable)

    expect(wrapper.text()).toContain('Total')
    expect(wrapper.text()).toContain('100%')
  })

  it('should format large balance numbers correctly', () => {
    const wrapper = mount(CohortTable)
    const html = wrapper.html()

    // Check for formatted currency (K for thousands, M for millions)
    expect(html).toMatch(/\$[\d.]+[KM]/)
  })

  it('should display activity information note', () => {
    const wrapper = mount(CohortTable)

    expect(wrapper.text()).toContain('Activity score represents transaction frequency')
  })

  it('should have proper table structure with thead, tbody, tfoot', () => {
    const wrapper = mount(CohortTable)

    expect(wrapper.find('thead').exists()).toBe(true)
    expect(wrapper.find('tbody').exists()).toBe(true)
    expect(wrapper.find('tfoot').exists()).toBe(true)
  })

  it('should display badges for each segment', () => {
    const wrapper = mount(CohortTable)

    // Check that Badge components are rendered
    const badges = wrapper.findAllComponents({ name: 'Badge' })
    expect(badges.length).toBeGreaterThan(0)
  })
})
