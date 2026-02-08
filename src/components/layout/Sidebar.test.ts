import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import Sidebar from './Sidebar.vue';
import { useTokenStore } from '../../stores/tokens';
import Badge from '../ui/Badge.vue';

// Mock Heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  PlusCircleIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  ChartBarIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  CubeIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  BuildingOfficeIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  CurrencyDollarIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  PhotoIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
}));

// Mock router-link
const RouterLinkStub = {
  template: '<a :to="to" @click="$emit(\'click\')"><slot /></a>',
  props: ['to'],
};

describe('Sidebar Component', () => {
  let router: any;
  let pinia: any;

  beforeEach(() => {
    // Create router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/create', name: 'create' },
        { path: '/dashboard', name: 'dashboard' },
        { path: '/token-standards', name: 'token-standards' },
        { path: '/enterprise-guide', name: 'enterprise-guide' },
      ],
    });

    // Create pinia
    pinia = createPinia();
    setActivePinia(pinia);
  });

  describe('Rendering', () => {
    it('should render the sidebar container', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const aside = wrapper.find('aside');
      expect(aside.exists()).toBe(true);
      expect(aside.classes()).toContain('hidden');
      expect(aside.classes()).toContain('lg:flex');
      expect(aside.classes()).toContain('lg:w-64');
    });

    it('should render navigation sections', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      // Check section headers
      const headers = wrapper.findAll('h3');
      expect(headers).toHaveLength(3);
      expect(headers[0].text()).toBe('Quick Actions');
      expect(headers[1].text()).toBe('Your Tokens');
      expect(headers[2].text()).toBe('Recent Activity');
    });

    it('should render quick action links', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const links = wrapper.findAll('a');
      expect(links).toHaveLength(5);

      // Check link texts and routes
      expect(links[0].text()).toContain('Create Token (Wizard)');
      expect(links[0].attributes('to')).toBe('/create/wizard');

      expect(links[1].text()).toContain('Create Token (Advanced)');
      expect(links[1].attributes('to')).toBe('/create');

      expect(links[2].text()).toContain('View Dashboard');
      expect(links[2].attributes('to')).toBe('/dashboard');

      expect(links[3].text()).toContain('Token Standards');
      expect(links[3].attributes('to')).toBe('/token-standards');

      expect(links[4].text()).toContain('Enterprise Guide');
      expect(links[4].attributes('to')).toBe('/enterprise-guide');
    });

    it('should render icons for quick actions', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const svgs = wrapper.findAll('svg');
      expect(svgs).toHaveLength(5); // 5 icons for quick actions
    });
  });

  describe('Token Standards Display', () => {
    it('should display token standards from store', () => {
      const tokenStore = useTokenStore();
      // Mock token standards data
      vi.mocked(tokenStore).tokenStandards = [
        { name: 'ASA', count: 5, bgClass: 'bg-blue-500' },
        { name: 'ARC200', count: 3, bgClass: 'bg-green-500' },
        { name: 'ERC20', count: 2, bgClass: 'bg-purple-500' },
      ];

      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const standardItems = wrapper.findAll('.flex.items-center.justify-between');
      expect(standardItems).toHaveLength(3);

      // Check first standard
      expect(standardItems[0].text()).toContain('ASA');
      expect(standardItems[0].text()).toContain('5');

      // Check second standard
      expect(standardItems[1].text()).toContain('ARC200');
      expect(standardItems[1].text()).toContain('3');

      // Check third standard
      expect(standardItems[2].text()).toContain('ERC20');
      expect(standardItems[2].text()).toContain('2');
    });

    it('should display colored indicators for token standards', () => {
      const tokenStore = useTokenStore();
      vi.mocked(tokenStore).tokenStandards = [
        { name: 'ASA', count: 1, bgClass: 'bg-blue-500' },
      ];

      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const indicator = wrapper.find('.w-2.h-2.rounded-full');
      expect(indicator.exists()).toBe(true);
      expect(indicator.classes()).toContain('bg-blue-500');
    });

    it('should render badges for token counts', () => {
      const tokenStore = useTokenStore();
      vi.mocked(tokenStore).tokenStandards = [
        { name: 'ASA', count: 10, bgClass: 'bg-blue-500' },
      ];

      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      // Badge component should be rendered
      const badge = wrapper.findComponent({ name: 'Badge' });
      expect(badge.exists()).toBe(true);
      expect(badge.text()).toBe('10');
    });
  });

  describe('Recent Activity', () => {
    it('should display empty state when no activity', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      // Should show empty state message per AC #6: Mock data removed
      expect(wrapper.text()).toContain('No recent activity');
      expect(wrapper.text()).toContain('Activity will appear here as you use the platform');
    });

    it('should have Recent Activity section header', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      // Verify Recent Activity section exists
      expect(wrapper.text()).toContain('Recent Activity');
    });
  });

  describe('Responsive Design', () => {
    it('should be hidden on mobile and tablet', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const aside = wrapper.find('aside');
      expect(aside.classes()).toContain('hidden');
      expect(aside.classes()).toContain('lg:flex');
    });

    it('should have proper positioning and sizing', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const aside = wrapper.find('aside');
      expect(aside.classes()).toContain('lg:fixed');
      expect(aside.classes()).toContain('lg:inset-y-0');
      expect(aside.classes()).toContain('lg:w-64');
      expect(aside.classes()).toContain('lg:pt-16');
    });
  });

  describe('Styling', () => {
    it('should have proper background and border styling', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const aside = wrapper.find('aside');
      expect(aside.classes()).toContain('lg:bg-white');
      expect(aside.classes()).toContain('lg:dark:bg-gray-900');
      expect(aside.classes()).toContain('lg:border-r');
      expect(aside.classes()).toContain('lg:border-gray-200');
      expect(aside.classes()).toContain('lg:dark:border-gray-800');
    });

    it('should have proper spacing and layout', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const nav = wrapper.find('nav');
      expect(nav.classes()).toContain('px-4');
      expect(nav.classes()).toContain('space-y-1');
    });
  });
});