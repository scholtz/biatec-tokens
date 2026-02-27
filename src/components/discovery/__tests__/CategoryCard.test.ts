import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CategoryCard from '../CategoryCard.vue';

describe('CategoryCard Component', () => {
  const mockCategory = {
    id: 'rwa',
    name: 'Real-World Assets',
    description: 'Tokenize real estate, securities, and commodities with full compliance.',
    icon: 'building',
    standards: ['ARC1400', 'ARC200', 'ARC3'],
    rwaRelevance: 'high' as const,
  };

  it('should render category name and description', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: mockCategory,
        selected: false,
      },
    });

    expect(wrapper.text()).toContain('Real-World Assets');
    expect(wrapper.text()).toContain('Tokenize real estate');
  });

  it('should display all standards as badges', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: mockCategory,
      },
    });

    expect(wrapper.text()).toContain('ARC1400');
    expect(wrapper.text()).toContain('ARC200');
  });

  it('should emit select event with category id when clicked', async () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: mockCategory,
      },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')?.[0]).toEqual(['rwa']);
  });

  it('should not show RWA Ready badge when rwaRelevance is medium', () => {
    const mediumCategory = { ...mockCategory, rwaRelevance: 'medium' as const };
    const wrapper = mount(CategoryCard, {
      props: { category: mediumCategory },
    });
    expect(wrapper.text()).not.toContain('RWA Ready');
  });

  it('should not show RWA Ready badge when rwaRelevance is low', () => {
    const lowCategory = { ...mockCategory, rwaRelevance: 'low' as const };
    const wrapper = mount(CategoryCard, {
      props: { category: lowCategory },
    });
    expect(wrapper.text()).not.toContain('RWA Ready');
  });

  it('should show selected ring styling when selected is true', () => {
    const wrapper = mount(CategoryCard, {
      props: { category: mockCategory, selected: true },
    });
    expect(wrapper.html()).toContain('ring-2');
  });

  it('should not show selected ring when selected is false', () => {
    const wrapper = mount(CategoryCard, {
      props: { category: mockCategory, selected: false },
    });
    expect(wrapper.html()).not.toContain('ring-2');
  });
});
