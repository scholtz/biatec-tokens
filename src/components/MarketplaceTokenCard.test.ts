import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MarketplaceTokenCard from './MarketplaceTokenCard.vue';
import type { MarketplaceToken } from '../stores/marketplace';

describe('MarketplaceTokenCard Component', () => {
  const mockToken: MarketplaceToken = {
    id: 'test-1',
    name: 'Test Token',
    symbol: 'TEST',
    description: 'A test token for unit testing',
    standard: 'ARC200',
    type: 'FT',
    supply: 1000000,
    decimals: 6,
    status: 'deployed',
    createdAt: new Date('2024-01-15T10:00:00'),
    price: 10.50,
    priceChange24h: 2.5,
    issuer: 'Test Issuer',
    whitelistStatus: 'enabled',
    complianceBadges: ['MICA Compliant', 'KYC Required'],
    network: 'VOI',
    isMicaCompliant: true,
    kycRequired: true,
    assetId: 123456,
  };

  it('should render token name and symbol', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('Test Token');
    expect(wrapper.text()).toContain('TEST');
  });

  it('should render issuer name', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('by Test Issuer');
  });

  it('should render token description', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('A test token for unit testing');
  });

  it('should render price', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('$10.50');
  });

  it('should render positive price change', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('2.50%');
    const priceChange = wrapper.find('.text-green-400');
    expect(priceChange.exists()).toBe(true);
  });

  it('should render negative price change', () => {
    const tokenWithNegativeChange = {
      ...mockToken,
      priceChange24h: -1.5,
    };

    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: tokenWithNegativeChange },
    });

    expect(wrapper.text()).toContain('1.50%');
    const priceChange = wrapper.find('.text-red-400');
    expect(priceChange.exists()).toBe(true);
  });

  it('should render compliance badges', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('MICA Compliant');
    expect(wrapper.text()).toContain('KYC Required');
  });

  it('should render network information', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('VOI');
  });

  it('should render token standard', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('ARC200');
  });

  it('should render token type', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('FT');
  });

  it('should render formatted supply', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('1.0M');
  });

  it('should format supply in thousands', () => {
    const tokenWithKSupply = {
      ...mockToken,
      supply: 5000,
    };

    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: tokenWithKSupply },
    });

    expect(wrapper.text()).toContain('5.0K');
  });

  it('should not format small supply', () => {
    const tokenWithSmallSupply = {
      ...mockToken,
      supply: 500,
    };

    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: tokenWithSmallSupply },
    });

    expect(wrapper.text()).toContain('500');
  });

  it('should render whitelist status for enabled', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.text()).toContain('Whitelist: Enabled');
  });

  it('should render whitelist status for disabled', () => {
    const tokenWithDisabledWhitelist = {
      ...mockToken,
      whitelistStatus: 'disabled' as const,
    };

    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: tokenWithDisabledWhitelist },
    });

    expect(wrapper.text()).toContain('Whitelist: Disabled');
  });

  it('should render whitelist status for partial', () => {
    const tokenWithPartialWhitelist = {
      ...mockToken,
      whitelistStatus: 'partial' as const,
    };

    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: tokenWithPartialWhitelist },
    });

    expect(wrapper.text()).toContain('Whitelist: Partial');
  });

  it('should emit select event when card is clicked', async () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')?.[0]).toEqual([mockToken]);
  });

  it('should emit view-details event when button is clicked', async () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('view-details')).toBeTruthy();
    expect(wrapper.emitted('view-details')?.[0]).toEqual([mockToken]);
  });

  it('should render image when imageUrl is provided', () => {
    const tokenWithImage = {
      ...mockToken,
      imageUrl: 'https://example.com/image.png',
    };

    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: tokenWithImage },
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/image.png');
  });

  it('should render placeholder icon when no imageUrl', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    const icon = wrapper.find('.pi-image');
    expect(icon.exists()).toBe(true);
  });

  it('should not render price section when price is undefined', () => {
    const tokenWithoutPrice = {
      ...mockToken,
      price: undefined,
      priceChange24h: undefined,
    };

    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: tokenWithoutPrice },
    });

    expect(wrapper.text()).not.toContain('$');
  });

  it('should not render compliance badges section when empty', () => {
    const tokenWithoutBadges = {
      ...mockToken,
      complianceBadges: [],
    };

    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: tokenWithoutBadges },
    });

    const badges = wrapper.findAll('.px-2.py-1.text-xs.font-medium.rounded-full');
    expect(badges.length).toBe(0);
  });

  it('should have hover effect class', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    expect(wrapper.classes()).toContain('marketplace-token-card');
    expect(wrapper.classes()).toContain('hover:shadow-xl');
  });

  it('should render View Details button', () => {
    const wrapper = mount(MarketplaceTokenCard, {
      props: { token: mockToken },
    });

    const button = wrapper.find('button');
    expect(button.text()).toContain('View Details');
  });
});
