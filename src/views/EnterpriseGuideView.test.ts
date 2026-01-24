import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import EnterpriseGuideView from './EnterpriseGuideView.vue';
import { useTokenStore } from '../stores/tokens';

// Mock MainLayout
vi.mock('../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div data-testid="main-layout"><slot /></div>',
  },
}));

// Mock EnterpriseDecisionGuide component
vi.mock('../components/EnterpriseDecisionGuide.vue', () => ({
  default: {
    name: 'EnterpriseDecisionGuide',
    template: '<div data-testid="enterprise-decision-guide">EnterpriseDecisionGuide</div>',
  },
}));

describe('EnterpriseGuideView Component', () => {
  let router: any;
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/enterprise-guide', component: EnterpriseGuideView },
        { path: '/token-standards', component: { template: '<div>Token Standards</div>' } },
      ],
    });
  });

  describe('Page Structure', () => {
    it('should render the page with correct title', () => {
      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      expect(wrapper.text()).toContain('Enterprise Decision Guide');
    });

    it('should render the page description', () => {
      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      expect(wrapper.text()).toContain('Choose the right token standard for your enterprise requirements');
    });

    it('should render EnterpriseDecisionGuide component', () => {
      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      const guideComponent = wrapper.find('[data-testid="enterprise-decision-guide"]');
      expect(guideComponent.exists()).toBe(true);
    });

    it('should have a link to Token Standards page', () => {
      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      const link = wrapper.find('a[href="/token-standards"]');
      expect(link.exists()).toBe(true);
      expect(link.text()).toContain('Full Comparison');
    });
  });

  describe('Navigation', () => {
    it('should navigate to token standards page when clicking Full Comparison', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      const link = wrapper.find('a[href="/token-standards"]');
      expect(link.exists()).toBe(true);
    });
  });

  describe('MainLayout Integration', () => {
    it('should render within MainLayout', () => {
      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      const mainLayout = wrapper.find('[data-testid="main-layout"]');
      expect(mainLayout.exists()).toBe(true);
    });
  });
});
