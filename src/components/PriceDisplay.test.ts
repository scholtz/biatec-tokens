import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PriceDisplay from './PriceDisplay.vue';

describe('PriceDisplay', () => {
  describe('Price Formatting', () => {
    it('should display price correctly for values >= 1', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100.50,
        },
      });

      expect(wrapper.text()).toContain('100.50');
    });

    it('should display small prices with more decimals', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 0.005,
        },
      });

      expect(wrapper.text()).toContain('0.005000');
    });

    it('should display very small prices with 6 decimals', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 0.000123,
        },
      });

      expect(wrapper.text()).toContain('0.000123');
    });
  });

  describe('Price Changes', () => {
    it('should display positive 24h price change in green', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          priceChange24h: 5.5,
          showChanges: true,
        },
      });

      expect(wrapper.text()).toContain('5.50%');
      expect(wrapper.html()).toContain('text-green-400');
      expect(wrapper.html()).toContain('pi-arrow-up');
    });

    it('should display negative 24h price change in red', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          priceChange24h: -3.2,
          showChanges: true,
        },
      });

      expect(wrapper.text()).toContain('3.20%');
      expect(wrapper.html()).toContain('text-red-400');
      expect(wrapper.html()).toContain('pi-arrow-down');
    });

    it('should display 7d change when enabled', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          priceChange24h: 5.5,
          priceChange7d: 12.3,
          showChanges: true,
          show7dChange: true,
        },
      });

      expect(wrapper.text()).toContain('12.30%');
      expect(wrapper.text()).toContain('(7d)');
    });

    it('should not display changes when showChanges is false', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          priceChange24h: 5.5,
          showChanges: false,
        },
      });

      expect(wrapper.text()).not.toContain('5.50%');
    });
  });

  describe('Metrics Display', () => {
    it('should display volume and market cap when showMetrics is true', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          volume24h: 1500000,
          marketCap: 50000000,
          showMetrics: true,
        },
      });

      expect(wrapper.text()).toContain('Volume (24h)');
      expect(wrapper.text()).toContain('1.50M');
      expect(wrapper.text()).toContain('Market Cap');
      expect(wrapper.text()).toContain('50.00M');
    });

    it('should not display metrics when showMetrics is false', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          volume24h: 1500000,
          showMetrics: false,
        },
      });

      expect(wrapper.text()).not.toContain('Volume (24h)');
    });

    it('should format large numbers correctly', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          volume24h: 1_500_000_000, // 1.5B
          marketCap: 50_000_000_000, // 50B
          showMetrics: true,
        },
      });

      expect(wrapper.text()).toContain('1.50B');
      expect(wrapper.text()).toContain('50.00B');
    });
  });

  describe('Price Source', () => {
    it('should display price source when showSource is true', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          priceSource: 'CoinGecko',
          showSource: true,
        },
      });

      expect(wrapper.text()).toContain('CoinGecko');
    });

    it('should not display price source when showSource is false', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          priceSource: 'CoinGecko',
          showSource: false,
        },
      });

      expect(wrapper.text()).not.toContain('CoinGecko');
    });
  });

  describe('Last Updated', () => {
    it('should display "just now" for recent updates', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          lastUpdated: new Date(),
          showLastUpdated: true,
        },
      });

      expect(wrapper.text()).toContain('just now');
    });

    it('should display time ago for older updates', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          lastUpdated: fiveMinutesAgo,
          showLastUpdated: true,
        },
      });

      expect(wrapper.text()).toContain('minutes ago');
    });

    it('should not display last updated when showLastUpdated is false', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          lastUpdated: new Date(),
          showLastUpdated: false,
        },
      });

      expect(wrapper.text()).not.toContain('Updated');
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when loading is true', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          loading: true,
        },
      });

      expect(wrapper.text()).toContain('Updating price...');
      expect(wrapper.html()).toContain('pi-spinner');
    });

    it('should not display loading indicator when loading is false', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          loading: false,
        },
      });

      expect(wrapper.text()).not.toContain('Updating price...');
    });
  });

  describe('Default Props', () => {
    it('should use default values for optional props', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
        },
      });

      // showChanges defaults to true
      expect(wrapper.find('.price-value').exists()).toBe(true);
      
      // Other show* props default to false
      expect(wrapper.text()).not.toContain('Volume');
      expect(wrapper.text()).not.toContain('Market Cap');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 0,
        },
      });

      expect(wrapper.text()).toContain('0.000000');
    });

    it('should handle zero price change', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          priceChange24h: 0,
          showChanges: true,
        },
      });

      expect(wrapper.text()).toContain('0.00%');
      expect(wrapper.html()).toContain('text-green-400'); // Zero is non-negative
    });

    it('should handle undefined optional values gracefully', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 100,
          showChanges: true,
          showMetrics: true,
        },
      });

      // Should not crash, just not display undefined values
      expect(wrapper.find('.price-value').exists()).toBe(true);
    });
  });

  describe('Comprehensive Display', () => {
    it('should display all features when all props are provided', () => {
      const wrapper = mount(PriceDisplay, {
        props: {
          price: 2500.75,
          priceChange24h: 5.5,
          priceChange7d: 12.3,
          volume24h: 1500000,
          marketCap: 50000000,
          priceSource: 'CoinGecko',
          lastUpdated: new Date(),
          showChanges: true,
          show7dChange: true,
          showMetrics: true,
          showSource: true,
          showLastUpdated: true,
          loading: false,
        },
      });

      expect(wrapper.text()).toContain('2,500.75');
      expect(wrapper.text()).toContain('5.50%');
      expect(wrapper.text()).toContain('12.30%');
      expect(wrapper.text()).toContain('1.50M');
      expect(wrapper.text()).toContain('50.00M');
      expect(wrapper.text()).toContain('CoinGecko');
      expect(wrapper.text()).toContain('Updated');
    });
  });
});

// Branch coverage: formatLargeNumber K and plain branches; formatTimeAgo hours/days branches
describe('PriceDisplay branch coverage', () => {
  it('formatLargeNumber K branch (>= 1000)', () => {
    const wrapper = mount(PriceDisplay, {
      props: { price: 1.0, volume24h: 5500, showMetrics: true },
    });
    expect(wrapper.text()).toContain('5.50K');
  });

  it('formatLargeNumber plain branch (< 1000)', () => {
    const wrapper = mount(PriceDisplay, {
      props: { price: 1.0, volume24h: 42.5, showMetrics: true },
    });
    expect(wrapper.text()).toContain('42.50');
  });

  it('formatTimeAgo hours branch (1 hour ago)', () => {
    const oneHourAgo = new Date(Date.now() - 65 * 60 * 1000);
    const wrapper = mount(PriceDisplay, {
      props: { price: 1.0, lastUpdated: oneHourAgo, showLastUpdated: true },
    });
    expect(wrapper.text()).toMatch(/1 hour ago/);
  });

  it('formatTimeAgo hours branch (plural, 3 hours ago)', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000 - 60 * 1000);
    const wrapper = mount(PriceDisplay, {
      props: { price: 1.0, lastUpdated: threeHoursAgo, showLastUpdated: true },
    });
    expect(wrapper.text()).toMatch(/3 hours ago/);
  });

  it('formatTimeAgo days branch (1 day ago)', () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const wrapper = mount(PriceDisplay, {
      props: { price: 1.0, lastUpdated: oneDayAgo, showLastUpdated: true },
    });
    expect(wrapper.text()).toMatch(/1 day ago/);
  });

  it('formatTimeAgo days branch (plural, 3 days ago)', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 60 * 1000);
    const wrapper = mount(PriceDisplay, {
      props: { price: 1.0, lastUpdated: threeDaysAgo, showLastUpdated: true },
    });
    expect(wrapper.text()).toMatch(/3 days ago/);
  });

  it('showSource false hides price source', () => {
    const wrapper = mount(PriceDisplay, {
      props: { price: 1.0, priceSource: 'CoinGecko', showSource: false },
    });
    expect(wrapper.text()).not.toContain('CoinGecko');
  });

  it('show7dChange false hides 7d change', () => {
    const wrapper = mount(PriceDisplay, {
      props: { price: 1.0, priceChange7d: 3.5, showChanges: true, show7dChange: false },
    });
    expect(wrapper.text()).not.toContain('(7d)');
  });
});
