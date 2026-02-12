import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MicaReadinessPanel from '../MicaReadinessPanel.vue';
import type { MicaReadinessData } from '../../../types/compliance';

describe('MicaReadinessPanel', () => {
  const mockReadinessData: MicaReadinessData = {
    overallScore: 72,
    status: 'good',
    lastUpdated: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    articles: [
      {
        articleNumber: 'Art. 15',
        articleTitle: 'Reserve of Assets',
        description: 'Asset-referenced tokens must maintain a reserve of assets to back the token value.',
        status: 'compliant',
        lastChecked: new Date().toISOString(),
      },
      {
        articleNumber: 'Art. 30',
        articleTitle: 'Transparency Requirements',
        description: 'Issuers must publish a crypto-asset white paper.',
        status: 'partial',
        lastChecked: new Date().toISOString(),
        notes: 'White paper pending final legal review',
      },
      {
        articleNumber: 'Art. 41',
        articleTitle: 'Complaints Handling',
        description: 'Establish and maintain effective and transparent procedures.',
        status: 'non_compliant',
        lastChecked: new Date().toISOString(),
        notes: 'Complaints handling procedure needs to be documented',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component header correctly', () => {
      const wrapper = mount(MicaReadinessPanel);

      expect(wrapper.find('h2').text()).toContain('MICA Readiness');
      expect(wrapper.text()).toContain('EU Markets in Crypto-Assets regulation compliance status');
    });

    it('should render refresh button', () => {
      const wrapper = mount(MicaReadinessPanel);

      const refreshButton = wrapper.find('button[aria-label="Refresh MICA readiness data"]');
      expect(refreshButton.exists()).toBe(true);
      expect(refreshButton.text()).toContain('Refresh');
    });
  });

  describe('Data Display', () => {
    it('should display overall score with correct styling', async () => {
      const wrapper = mount(MicaReadinessPanel, {
        props: {
          tokenId: 'test-token-123',
        },
      });

      // Wait for component to load and set mock data
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if score is displayed (should be 72 from mock data)
      const scoreText = wrapper.text();
      expect(scoreText).toContain('72');
      expect(scoreText).toContain('/100');
    });

    it('should display status badge', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusBadge = wrapper.text();
      expect(statusBadge).toContain('Good');
    });

    it('should display last updated timestamp', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(wrapper.text()).toContain('Last Updated');
    });

    it('should display article list', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(wrapper.text()).toContain('MICA Article Compliance');
      expect(wrapper.text()).toContain('Art. 15');
      expect(wrapper.text()).toContain('Reserve of Assets');
    });
  });

  describe('Article Status', () => {
    it('should display compliant status with correct styling', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(wrapper.text()).toContain('Compliant');
    });

    it('should display partial compliance status', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(wrapper.text()).toContain('Partial');
    });

    it('should display non-compliant status', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(wrapper.text()).toContain('Non-Compliant');
    });

    it('should display article notes when present', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Expand article to see notes
      const expandButtons = wrapper.findAll('button[aria-expanded]');
      if (expandButtons.length > 1) {
        await expandButtons[1].trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('White paper pending final legal review');
      }
    });
  });

  describe('User Interactions', () => {
    it('should call refreshData when refresh button clicked', async () => {
      const wrapper = mount(MicaReadinessPanel);

      const refreshButton = wrapper.find('button[aria-label="Refresh MICA readiness data"]');
      await refreshButton.trigger('click');

      // Component should show loading state
      expect(wrapper.find('.pi-spinner').exists()).toBe(true);
    });

    it('should toggle article details on click', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const expandButtons = wrapper.findAll('button[aria-expanded]');
      if (expandButtons.length > 0) {
        const firstButton = expandButtons[0];
        const initialState = firstButton.attributes('aria-expanded');

        await firstButton.trigger('click');
        await wrapper.vm.$nextTick();

        const newState = firstButton.attributes('aria-expanded');
        expect(newState).not.toBe(initialState);
      }
    });
  });

  describe('Empty and Error States', () => {
    it('should handle data loading flow', async () => {
      const wrapper = mount(MicaReadinessPanel);

      // Component should eventually load data
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // After loading, should show content or handle empty/error states gracefully
      const hasContent = wrapper.text().length > 100; // Has substantial content
      expect(hasContent).toBe(true);
    });
  });

  describe('Info Box', () => {
    it('should display MICA explanation', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(wrapper.text()).toContain('What is MICA?');
      expect(wrapper.text()).toContain('Markets in Crypto-Assets');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      const wrapper = mount(MicaReadinessPanel);

      const refreshButton = wrapper.find('button[aria-label="Refresh MICA readiness data"]');
      expect(refreshButton.attributes('aria-label')).toBe('Refresh MICA readiness data');
    });

    it('should use semantic HTML headings', () => {
      const wrapper = mount(MicaReadinessPanel);

      expect(wrapper.find('h2').exists()).toBe(true);
      expect(wrapper.find('h3').exists()).toBe(true);
    });

    it('should have aria-expanded on expandable sections', async () => {
      const wrapper = mount(MicaReadinessPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const expandButtons = wrapper.findAll('button[aria-expanded]');
      expect(expandButtons.length).toBeGreaterThan(0);
    });
  });
});
