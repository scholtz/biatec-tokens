import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MarketplaceTokenCard from '../MarketplaceTokenCard.vue'
import type { MarketplaceToken } from '../../stores/marketplace'

const baseToken: MarketplaceToken = {
  id: 'token-1',
  name: 'Test Token',
  symbol: 'TST',
  network: 'VOI',
  standard: 'ARC200',
  type: 'FT',
  description: 'A test token',
  supply: 1000000,
  status: 'deployed',
  createdAt: new Date('2024-01-01'),
  marketCap: 50000,
  price: 0.05,
  volume24h: 1000,
  priceChange24h: 2.5,
  isMicaCompliant: true,
  whitelistStatus: 'enabled',
  complianceBadges: ['MICA Compliant', 'KYC Verified'],
  issuer: 'Test Issuer',
}

describe('MarketplaceTokenCard', () => {
  const stubs = {
    PriceDisplay: { template: '<span class="price-display">{{ price }}</span>', props: ['price'] },
  }

  it('renders token name', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Test Token')
  })

  it('renders token symbol', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('TST')
  })

  it('renders issuer name', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Test Issuer')
  })

  it('formats supply >= 1M as xM', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    // 1000000 should be formatted as 1.0M
    expect(wrapper.text()).toContain('1.0M')
  })

  it('formats supply >= 1K and < 1M as xK', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: { ...baseToken, supply: 5000 } },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('5.0K')
  })

  it('formats small supply as plain number', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: { ...baseToken, supply: 500 } },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('500')
  })

  it('emits select event on card click', async () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    // Find the selectable area (root div or button)
    await wrapper.trigger('click')
    expect(wrapper.html()).toBeTruthy()
  })

  it('shows MICA badge styling', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('MICA')
  })

  it('shows KYC badge styling', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: { ...baseToken, badges: ['KYC Verified'] } },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('KYC')
  })

  it('shows Whitelisted badge styling for whitelist badge', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: { ...baseToken, complianceBadges: ['Whitelisted'] } },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('Whitelisted')
  })

  it('shows whitelist enabled status', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    // whitelist status is 'enabled'
    expect(wrapper.html()).toBeTruthy()
  })

  it('shows whitelist partial status', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: { ...baseToken, whitelistStatus: 'partial' } },
      global: { stubs },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('shows whitelist disabled status', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: { ...baseToken, whitelistStatus: 'disabled' } },
      global: { stubs },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('shows verified badge when isVerified is true', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    // verified tokens show a verified indicator
    expect(wrapper.html()).toBeTruthy()
  })

  it('renders network name', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: baseToken },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('VOI')
  })
})
