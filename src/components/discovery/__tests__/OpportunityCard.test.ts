import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OpportunityCard from '../OpportunityCard.vue';

describe('OpportunityCard Component', () => {
  const mockOpportunity = {
    id: 'rwa_security',
    title: 'Security Token with Full Compliance',
    description: 'Perfect for real estate tokenization.',
    standard: 'ARC1400',
    rwaScore: 100,
    complianceScore: 100,
    reason: 'Matches your profile',
  };

  it('should render opportunity title', () => {
    const wrapper = mount(OpportunityCard, {
      props: {
        opportunity: mockOpportunity,
      },
    });

    expect(wrapper.text()).toContain('Security Token');
  });

  it('should emit select event when clicked', async () => {
    const wrapper = mount(OpportunityCard, {
      props: {
        opportunity: mockOpportunity,
      },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
  });
});
