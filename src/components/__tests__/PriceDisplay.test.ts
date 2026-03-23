import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceDisplay from '../PriceDisplay.vue'

describe('PriceDisplay.vue', () => {
  const baseProps = { price: 1.5 }

  it('renders the price value', () => {
    const wrapper = mount(PriceDisplay, { props: baseProps })
    expect(wrapper.text()).toContain('1.50')
  })

  it('formats price < 0.01 to 6 decimal places', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 0.001234 } })
    expect(wrapper.text()).toContain('0.001234')
  })

  it('formats price < 1 to 4 decimal places', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 0.5678 } })
    expect(wrapper.text()).toContain('0.5678')
  })

  it('formats price >= 1 with 2 decimal places', () => {
    const wrapper = mount(PriceDisplay, { props: { price: 12345 } })
    expect(wrapper.text()).toContain('12,345.00')
  })

  it('shows positive 24h change with green styling', () => {
    const wrapper = mount(PriceDisplay, { props: { ...baseProps, priceChange24h: 5.5, showChanges: true } })
    const el = wrapper.find('.text-green-400')
    expect(el.exists()).toBe(true)
    expect(el.text()).toContain('5.50%')
  })

  it('shows negative 24h change with red styling', () => {
    const wrapper = mount(PriceDisplay, { props: { ...baseProps, priceChange24h: -3.25, showChanges: true } })
    const el = wrapper.find('.text-red-400')
    expect(el.exists()).toBe(true)
    expect(el.text()).toContain('3.25%')
  })

  it('shows 7d change when show7dChange is true', () => {
    const wrapper = mount(PriceDisplay, {
      props: { ...baseProps, priceChange7d: 10.0, showChanges: true, show7dChange: true },
    })
    expect(wrapper.text()).toContain('(7d)')
  })

  it('hides 7d change by default', () => {
    const wrapper = mount(PriceDisplay, { props: { ...baseProps, priceChange7d: 10.0 } })
    expect(wrapper.text()).not.toContain('(7d)')
  })

  it('shows price source when showSource is true', () => {
    const wrapper = mount(PriceDisplay, { props: { ...baseProps, priceSource: 'CoinGecko', showSource: true } })
    expect(wrapper.text()).toContain('CoinGecko')
  })

  it('hides price source by default', () => {
    const wrapper = mount(PriceDisplay, { props: { ...baseProps, priceSource: 'CoinGecko' } })
    expect(wrapper.text()).not.toContain('CoinGecko')
  })

  it('shows metrics section when showMetrics is true', () => {
    const wrapper = mount(PriceDisplay, {
      props: { ...baseProps, volume24h: 1_500_000, marketCap: 500_000_000, showMetrics: true },
    })
    expect(wrapper.text()).toContain('Volume (24h)')
    expect(wrapper.text()).toContain('1.50M')
    expect(wrapper.text()).toContain('Market Cap')
    expect(wrapper.text()).toContain('500.00M')
  })

  it('formats billion values correctly', () => {
    const wrapper = mount(PriceDisplay, {
      props: { ...baseProps, marketCap: 2_000_000_000, showMetrics: true },
    })
    expect(wrapper.text()).toContain('2.00B')
  })

  it('formats thousand values correctly', () => {
    const wrapper = mount(PriceDisplay, {
      props: { ...baseProps, volume24h: 5000, showMetrics: true },
    })
    expect(wrapper.text()).toContain('5.00K')
  })

  it('shows loading indicator when loading is true', () => {
    const wrapper = mount(PriceDisplay, { props: { ...baseProps, loading: true } })
    expect(wrapper.text()).toContain('Updating price...')
  })

  it('shows last updated text when showLastUpdated and lastUpdated provided', () => {
    const recent = new Date(Date.now() - 30 * 1000) // 30 seconds ago
    const wrapper = mount(PriceDisplay, {
      props: { ...baseProps, showLastUpdated: true, lastUpdated: recent },
    })
    expect(wrapper.text()).toContain('Updated')
  })
})
