import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MarketplaceFilters from './MarketplaceFilters.vue';
import type { MarketplaceFilters as Filters } from '../stores/marketplace';

describe('MarketplaceFilters Component', () => {
  const defaultFilters: Filters = {
    network: 'All',
    complianceBadge: 'All',
    assetClass: 'All',
    search: '',
  };

  it('should render search input', () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const searchInput = wrapper.find('input[type="text"]');
    expect(searchInput.exists()).toBe(true);
    expect(searchInput.attributes('placeholder')).toContain('Search');
  });

  it('should render all filter dropdowns', () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const selects = wrapper.findAll('select');
    expect(selects.length).toBe(3);
  });

  it('should display filtered count', () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 5,
        totalTokens: 10,
      },
    });

    expect(wrapper.text()).toContain('5 of 10 tokens');
  });

  it('should emit update:filters when search changes', async () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const searchInput = wrapper.find('input[type="text"]');
    await searchInput.setValue('test');

    expect(wrapper.emitted('update:filters')).toBeTruthy();
    const emittedFilters = wrapper.emitted('update:filters')?.[0]?.[0] as Filters;
    expect(emittedFilters.search).toBe('test');
  });

  it('should emit update:filters when network changes', async () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const selects = wrapper.findAll('select');
    const networkSelect = selects[0];
    await networkSelect.setValue('VOI');

    expect(wrapper.emitted('update:filters')).toBeTruthy();
    const emittedFilters = wrapper.emitted('update:filters')?.[0]?.[0] as Filters;
    expect(emittedFilters.network).toBe('VOI');
  });

  it('should emit update:filters when compliance changes', async () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const selects = wrapper.findAll('select');
    const complianceSelect = selects[1];
    await complianceSelect.setValue('MICA Compliant');

    expect(wrapper.emitted('update:filters')).toBeTruthy();
    const emittedFilters = wrapper.emitted('update:filters')?.[0]?.[0] as Filters;
    expect(emittedFilters.complianceBadge).toBe('MICA Compliant');
  });

  it('should emit update:filters when asset class changes', async () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const selects = wrapper.findAll('select');
    const assetClassSelect = selects[2];
    await assetClassSelect.setValue('FT');

    expect(wrapper.emitted('update:filters')).toBeTruthy();
    const emittedFilters = wrapper.emitted('update:filters')?.[0]?.[0] as Filters;
    expect(emittedFilters.assetClass).toBe('FT');
  });

  it('should show active filter badges', async () => {
    const activeFilters: Filters = {
      network: 'VOI',
      complianceBadge: 'MICA Compliant',
      assetClass: 'FT',
      search: 'test',
    };

    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: activeFilters,
        filteredCount: 2,
        totalTokens: 10,
      },
    });

    expect(wrapper.text()).toContain('VOI');
    expect(wrapper.text()).toContain('MICA Compliant');
    expect(wrapper.text()).toContain('FT');
    expect(wrapper.text()).toContain('"test"');
  });

  it('should show reset button when filters are active', async () => {
    const activeFilters: Filters = {
      network: 'VOI',
      complianceBadge: 'All',
      assetClass: 'All',
      search: '',
    };

    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: activeFilters,
        filteredCount: 5,
        totalTokens: 10,
      },
    });

    const resetButton = wrapper.find('button:has(.pi-filter-slash)');
    expect(resetButton.exists()).toBe(true);
  });

  it('should emit reset when reset button clicked', async () => {
    const activeFilters: Filters = {
      network: 'VOI',
      complianceBadge: 'All',
      assetClass: 'All',
      search: '',
    };

    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: activeFilters,
        filteredCount: 5,
        totalTokens: 10,
      },
    });

    const resetButton = wrapper.find('button:has(.pi-filter-slash)');
    await resetButton.trigger('click');

    expect(wrapper.emitted('reset')).toBeTruthy();
  });

  it('should clear individual filter when close button clicked', async () => {
    const activeFilters: Filters = {
      network: 'VOI',
      complianceBadge: 'All',
      assetClass: 'All',
      search: '',
    };

    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: activeFilters,
        filteredCount: 5,
        totalTokens: 10,
      },
    });

    // Find the close button for network filter
    const closeButtons = wrapper.findAll('button[aria-label="Clear network filter"]');
    expect(closeButtons.length).toBeGreaterThan(0);
    
    await closeButtons[0].trigger('click');

    expect(wrapper.emitted('update:filters')).toBeTruthy();
    const emittedFilters = wrapper.emitted('update:filters')?.[wrapper.emitted('update:filters')!.length - 1]?.[0] as Filters;
    expect(emittedFilters.network).toBe('All');
  });

  it('should update when props change', async () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    await wrapper.setProps({
      filters: { ...defaultFilters, network: 'Aramid' },
    });

    const selects = wrapper.findAll('select');
    const networkSelect = selects[0];
    expect((networkSelect.element as HTMLSelectElement).value).toBe('Aramid');
  });

  it('should not show reset button when no filters are active', () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const resetButton = wrapper.find('button:has(.pi-filter-slash)');
    expect(resetButton.exists()).toBe(false);
  });

  it('should have all network options', () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const selects = wrapper.findAll('select');
    const networkSelect = selects[0];
    const options = networkSelect.findAll('option');
    
    expect(options.length).toBeGreaterThan(1);
    expect(options[0].text()).toBe('All Networks');
  });

  it('should have all compliance options', () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const selects = wrapper.findAll('select');
    const complianceSelect = selects[1];
    const options = complianceSelect.findAll('option');
    
    expect(options.length).toBe(5);
    expect(options.some(opt => opt.text() === 'MICA Compliant')).toBe(true);
  });

  it('should have all asset class options', () => {
    const wrapper = mount(MarketplaceFilters, {
      props: {
        filters: defaultFilters,
        filteredCount: 10,
        totalTokens: 10,
      },
    });

    const selects = wrapper.findAll('select');
    const assetClassSelect = selects[2];
    const options = assetClassSelect.findAll('option');
    
    expect(options.length).toBe(3);
    expect(options[1].text()).toBe('Fungible Tokens');
    expect(options[2].text()).toBe('NFTs');
  });
});
