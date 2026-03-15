import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import Sidebar from '../Sidebar.vue';
import { useTokenStore } from '../../../stores/tokens';
import Badge from '../../ui/Badge.vue';

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
  ShieldCheckIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  ShieldExclamationIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  UsersIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  ClipboardDocumentCheckIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  CurrencyDollarIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
  PhotoIcon: {
    template: '<svg class="h-5 w-5"></svg>',
  },
}));

// Mock router-link — passes 'to' as a prop; class and other attributes fall through naturally
// (inheritAttrs: true by default) so that :class bindings on router-link appear on the <a>
const RouterLinkStub = {
  template: '<a :to="to" @click="$emit(\'click\')"><slot /></a>',
  props: ['to', 'aria-current'],
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
        { path: '/launch/workspace', name: 'GuidedLaunchWorkspace' },
        { path: '/launch/guided', name: 'GuidedTokenLaunch' },
        { path: '/enterprise/onboarding', name: 'EnterpriseOnboarding' },
        { path: '/compliance-monitoring', name: 'ComplianceMonitoring' },
        { path: '/compliance/whitelists', name: 'WhitelistManagement' },
        { path: '/compliance/risk-report', name: 'EnterpriseRiskReportBuilder' },
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
      expect(links).toHaveLength(10); // Includes Release Evidence, Compliance Monitoring, Whitelist Management, Risk Report

      // Check link texts and routes
      expect(links[0].text()).toContain('Guided Token Launch');
      expect(links[0].attributes('to')).toBe('/launch/workspace');

      expect(links[1].text()).toContain('Create Token');
      expect(links[1].attributes('to')).toBe('/launch/guided');

      expect(links[2].text()).toContain('View Dashboard');
      expect(links[2].attributes('to')).toBe('/dashboard');

      expect(links[3].text()).toContain('Token Standards');
      expect(links[3].attributes('to')).toBe('/token-standards');

      expect(links[4].text()).toContain('Enterprise Guide');
      expect(links[4].attributes('to')).toBe('/enterprise-guide');
      
      expect(links[5].text()).toContain('Onboarding Center');
      expect(links[5].attributes('to')).toBe('/enterprise/onboarding');

      expect(links[6].text()).toContain('Release Evidence');
      expect(links[6].attributes('to')).toBe('/compliance/evidence');
      
      expect(links[7].text()).toContain('Risk Report Builder');
      expect(links[7].attributes('to')).toBe('/compliance/risk-report');

      expect(links[8].text()).toContain('Compliance Monitoring');
      expect(links[8].attributes('to')).toBe('/compliance-monitoring');
      
      expect(links[9].text()).toContain('Whitelist Management');
      expect(links[9].attributes('to')).toBe('/compliance/whitelists');
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
      // 10 links each with an SVG icon
      expect(svgs).toHaveLength(10);
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

    it('empty state has role="status" and aria-live="polite" for screen readers (WCAG SC 4.1.3)', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const emptyState = wrapper.find('[role="status"]');
      expect(emptyState.exists()).toBe(true);
      expect(emptyState.attributes('aria-live')).toBe('polite');
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

    it('sidebar nav has aria-label for landmark disambiguation (WCAG SC 2.4.3)', () => {
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
      expect(nav.exists()).toBe(true);
      // aria-label distinguishes sidebar nav from the primary "Main navigation" landmark
      expect(nav.attributes('aria-label')).toBe('Sidebar navigation');
    });
  });

  // ---------------------------------------------------------------------------
  // WCAG 2.1 AA Accessibility Tests
  // ---------------------------------------------------------------------------
  describe('WCAG 2.1 AA Accessibility', () => {
    it('all quick action links have focus-visible ring classes (WCAG SC 2.4.7)', () => {
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
      links.forEach((link) => {
        const classes = link.classes().join(' ');
        // Each link must have keyboard focus-visible ring classes
        expect(classes).toMatch(/focus-visible:ring-2/);
        expect(classes).toMatch(/focus-visible:ring-blue-500/);
        expect(classes).toMatch(/focus:outline-none/);
      });
    });

    it('status dots have aria-hidden="true" to prevent screen reader redundancy (WCAG SC 1.1.1)', () => {
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

      // Status dots are decorative; aria-hidden prevents screen reader confusion
      const dot = wrapper.find('.w-2.h-2.rounded-full');
      expect(dot.exists()).toBe(true);
      expect(dot.attributes('aria-hidden')).toBe('true');
    });

    it('aside has supplemental aria-label (WCAG SC 1.3.6 landmark disambiguation)', () => {
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
      expect(aside.attributes('aria-label')).toBe('Supplemental navigation');
    });

    it('nav has aria-label "Sidebar navigation" for accessible name (WCAG SC 1.3.1)', () => {
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
      // aria-label provides the accessible name for the nav landmark.
      // aria-labelledby is NOT used here because the nearby heading ("Quick Actions") describes
      // a section within the nav, not the nav landmark itself. Using aria-label is therefore
      // more precise and avoids attributing the wrong label.
      expect(nav.attributes('aria-label')).toBe('Sidebar navigation');
      expect(nav.attributes('aria-labelledby')).toBeUndefined();
    });

    it('whitelist management link uses SVG icon (not icon font) for accessibility (WCAG SC 1.1.1)', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      // Should NOT have an <i> element (icon font) — replaced with SVG UsersIcon
      const iconFonts = wrapper.findAll('i.pi');
      expect(iconFonts).toHaveLength(0);

      // WhitelistManagement link should contain an SVG
      const whitelistLink = wrapper.find('a[to="/compliance/whitelists"]');
      expect(whitelistLink.find('svg').exists()).toBe(true);
    });

    it('section headings use higher-contrast gray-600 (not gray-500) for WCAG AA compliance', () => {
      const wrapper = mount(Sidebar, {
        global: {
          plugins: [router, pinia],
          components: {
            'router-link': RouterLinkStub,
            Badge,
          },
        },
      });

      const headers = wrapper.findAll('h3');
      headers.forEach((header) => {
        // text-gray-600 (#4b5563) has 7.0:1 contrast on white — passes WCAG AA
        // text-gray-500 (#6b7280) has only 4.5:1 — borderline
        expect(header.classes()).toContain('text-gray-600');
        // Must NOT use text-gray-500 for section headings (risk of WCAG AA failure on tinted surfaces)
        expect(header.classes()).not.toContain('text-gray-500');
      });
    });
  });
});
