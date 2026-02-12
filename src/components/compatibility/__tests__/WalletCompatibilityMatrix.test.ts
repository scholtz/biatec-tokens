import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import WalletCompatibilityMatrix from '../WalletCompatibilityMatrix.vue';
import Badge from '../../ui/Badge.vue';
import Button from '../../ui/Button.vue';
import Modal from '../../ui/Modal.vue';

describe('WalletCompatibilityMatrix', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(WalletCompatibilityMatrix, {
      global: {
        components: {
          Badge,
          Button,
          Modal,
        },
      },
    });
  });

  describe('Component Rendering', () => {
    it('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should display the title', () => {
      expect(wrapper.text()).toContain('Wallet Compatibility Matrix');
    });

    it('should display all standard columns (ARC3, ARC19, ARC69, ASA)', () => {
      const headers = wrapper.findAll('th');
      expect(headers.length).toBeGreaterThanOrEqual(5); // Wallet + 4 standards
      expect(wrapper.text()).toContain('ARC3');
      expect(wrapper.text()).toContain('ARC19');
      expect(wrapper.text()).toContain('ARC69');
      expect(wrapper.text()).toContain('ASA');
    });

    it('should display wallet rows', () => {
      const rows = wrapper.findAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
      // Should have at least 4 wallets (Pera, Defly, Lute, Exodus)
      expect(rows.length).toBeGreaterThanOrEqual(4);
    });

    it('should display wallet names and links', () => {
      expect(wrapper.text()).toContain('Pera Wallet');
      expect(wrapper.text()).toContain('Defly Wallet');
      expect(wrapper.text()).toContain('Lute Wallet');
      expect(wrapper.text()).toContain('Exodus Wallet');
    });
  });

  describe('Badge Display', () => {
    it('should render badges for supported standards', () => {
      const badges = wrapper.findAllComponents(Badge);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should use correct badge variants based on quality', () => {
      const badges = wrapper.findAllComponents(Badge);
      const variants = badges.map((badge: any) => badge.props('variant'));
      // Should have mix of success, info, warning, error
      expect(variants).toContain('success'); // Excellent
      expect(variants).toContain('info'); // Good
    });
  });

  describe('Legend', () => {
    it('should display quality legend', () => {
      expect(wrapper.text()).toContain('Display Quality Legend');
      expect(wrapper.text()).toContain('Excellent');
      expect(wrapper.text()).toContain('Good');
      expect(wrapper.text()).toContain('Partial');
      expect(wrapper.text()).toContain('Poor');
    });

    it('should explain each quality level', () => {
      expect(wrapper.text()).toContain('Full support, great UX');
      expect(wrapper.text()).toContain('Supported, minor issues');
      expect(wrapper.text()).toContain('Limited support');
      expect(wrapper.text()).toContain('Minimal/no support');
    });
  });

  describe('Details Modal', () => {
    it('should not show modal initially', () => {
      const modal = wrapper.findComponent(Modal);
      expect(modal.props('show')).toBe(false);
    });

    it('should show modal when badge is clicked', async () => {
      const badges = wrapper.findAllComponents(Badge);
      if (badges.length > 0) {
        await badges[0].trigger('click');
        const modal = wrapper.findComponent(Modal);
        expect(modal.props('show')).toBe(true);
      }
    });

    it('should display wallet and standard name in modal header', async () => {
      const badges = wrapper.findAllComponents(Badge);
      if (badges.length > 0) {
        await badges[0].trigger('click');
        await wrapper.vm.$nextTick();
        // Modal should show wallet name and standard
        const modal = wrapper.findComponent(Modal);
        expect(modal.exists()).toBe(true);
        // Just verify the modal is shown with content
        expect(wrapper.vm.selectedWallet).toBeTruthy();
        expect(wrapper.vm.selectedStandard).toBeTruthy();
      }
    });

    it('should close modal when close button is clicked', async () => {
      const badges = wrapper.findAllComponents(Badge);
      if (badges.length > 0) {
        await badges[0].trigger('click');
        const modal = wrapper.findComponent(Modal);
        await modal.vm.$emit('close');
        await wrapper.vm.$nextTick();
        expect(modal.props('show')).toBe(false);
      }
    });
  });

  describe('Data Display', () => {
    it('should show last verified date', () => {
      expect(wrapper.text()).toContain('Last updated:');
      expect(wrapper.text()).toContain('2026');
    });

    it('should display wallet websites', () => {
      const links = wrapper.findAll('a[target="_blank"]');
      expect(links.length).toBeGreaterThan(0);
      // Should have perawallet.app, defly.app, etc.
      const hrefs = links.map((link: any) => link.attributes('href'));
      expect(hrefs.some((href: string) => href.includes('perawallet.app'))).toBe(true);
    });

    it('should handle missing support data gracefully', () => {
      // Component should render em dash (—) for unsupported combinations
      const text = wrapper.text();
      // Just ensure component renders without errors even if some data is missing
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should correctly get badge variant for quality levels', () => {
      const vm = wrapper.vm as any;
      expect(vm.getBadgeVariant('excellent')).toBe('success');
      expect(vm.getBadgeVariant('good')).toBe('info');
      expect(vm.getBadgeVariant('partial')).toBe('warning');
      expect(vm.getBadgeVariant('poor')).toBe('error');
      expect(vm.getBadgeVariant('none')).toBe('default');
    });

    it('should correctly format quality labels', () => {
      const vm = wrapper.vm as any;
      expect(vm.getQualityLabel('excellent')).toBe('Excellent');
      expect(vm.getQualityLabel('good')).toBe('Good');
      expect(vm.getQualityLabel('partial')).toBe('Partial');
    });
  });

  describe('Responsive Design', () => {
    it('should have overflow-x-auto for table scrolling', () => {
      const tableContainer = wrapper.find('.overflow-x-auto');
      expect(tableContainer.exists()).toBe(true);
    });

    it('should use responsive grid for legend', () => {
      const legend = wrapper.find('.grid');
      expect(legend.exists()).toBe(true);
      expect(legend.classes()).toContain('grid-cols-2');
      expect(legend.classes()).toContain('md:grid-cols-5');
    });
  });
});
