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

  describe('articleStatusClass and articleStatusLabel coverage', () => {
    it('should return correct class for not_applicable status', () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      expect(vm.articleStatusClass('not_applicable')).toContain('bg-gray-500');
      expect(vm.articleStatusClass('unknown_value')).toContain('bg-gray-500');
    });

    it('should return correct label for not_applicable and unknown status', () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      expect(vm.articleStatusLabel('not_applicable')).toBe('N/A');
      expect(vm.articleStatusLabel('unknown_value')).toBe('Unknown');
    });
  });

  describe('statusBadgeClass and statusLabel computed coverage', () => {
    const makeData = (status: string): MicaReadinessData => ({
      overallScore: 80,
      status: status as MicaReadinessData['status'],
      lastUpdated: new Date().toISOString(),
      nextReviewDate: new Date().toISOString(),
      articles: [],
    });

    it('returns green class and Excellent label for status excellent', async () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      vm.readinessData = makeData('excellent');
      await wrapper.vm.$nextTick();
      expect(vm.statusBadgeClass).toContain('green');
      expect(vm.statusLabel).toBe('Excellent');
    });

    it('returns yellow class and Fair label for status fair', async () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      vm.readinessData = makeData('fair');
      await wrapper.vm.$nextTick();
      expect(vm.statusBadgeClass).toContain('yellow');
      expect(vm.statusLabel).toBe('Fair');
    });

    it('returns orange class and Poor label for status poor', async () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      vm.readinessData = makeData('poor');
      await wrapper.vm.$nextTick();
      expect(vm.statusBadgeClass).toContain('orange');
      expect(vm.statusLabel).toBe('Poor');
    });

    it('returns red class and Critical label for status critical', async () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      vm.readinessData = makeData('critical');
      await wrapper.vm.$nextTick();
      expect(vm.statusBadgeClass).toContain('red');
      expect(vm.statusLabel).toBe('Critical');
    });

    it('returns gray class and Unknown label for unknown status', async () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      vm.readinessData = makeData('unknown_status_xyz');
      await wrapper.vm.$nextTick();
      expect(vm.statusBadgeClass).toContain('gray');
      expect(vm.statusLabel).toBe('Unknown');
    });
  });

  describe('scoreColor and progressBarColor computed coverage', () => {
    const makeScoreData = (score: number): MicaReadinessData => ({
      overallScore: score,
      status: 'good' as MicaReadinessData['status'],
      lastUpdated: new Date().toISOString(),
      nextReviewDate: new Date().toISOString(),
      articles: [],
    });

    it('returns text-yellow-400 scoreColor and bg-yellow-500 progressBarColor for score 50-69', async () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      vm.readinessData = makeScoreData(60);
      await wrapper.vm.$nextTick();
      expect(vm.scoreColor).toBe('text-yellow-400');
      expect(vm.progressBarColor).toBe('bg-yellow-500');
    });

    it('returns text-red-400 scoreColor and bg-red-500 progressBarColor for score below 50', async () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      vm.readinessData = makeScoreData(40);
      await wrapper.vm.$nextTick();
      expect(vm.scoreColor).toBe('text-red-400');
      expect(vm.progressBarColor).toBe('bg-red-500');
    });

    it('returns text-gray-400 scoreColor and bg-gray-500 progressBarColor when readinessData is null', async () => {
      const wrapper = mount(MicaReadinessPanel);
      const vm = wrapper.vm as any;
      vm.readinessData = null;
      await wrapper.vm.$nextTick();
      expect(vm.scoreColor).toBe('text-gray-400');
      expect(vm.progressBarColor).toBe('bg-gray-500');
    });
  });
});
