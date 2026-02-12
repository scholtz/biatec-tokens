import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import WhitelistStatusPanel from '../WhitelistStatusPanel.vue';

describe('WhitelistStatusPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component header', () => {
      const wrapper = mount(WhitelistStatusPanel, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
      });

      expect(wrapper.find('h2').text()).toContain('Whitelist Status');
      expect(wrapper.text()).toContain('Address whitelist enforcement and coverage');
    });
  });

  describe('Status Display', () => {
    it('should display enforcement status', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Enforcement Status');
      expect(wrapper.text()).toContain('Enabled');
    });

    it('should display last updated timestamp', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Last Updated');
    });

    it('should show explanation text for enabled status', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Only whitelisted addresses can receive tokens');
    });
  });

  describe('Metrics Display', () => {
    it('should display total addresses metric', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Total Addresses');
    });

    it('should display active addresses metric', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Active');
    });

    it('should display pending addresses metric', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Pending');
    });

    it('should display coverage percentage', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Coverage');
      expect(wrapper.text()).toMatch(/\d+%/);
    });
  });

  describe('Recent Activity', () => {
    it('should display recently added count', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Recently Added');
    });

    it('should display recently removed count', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Recently Removed');
    });
  });

  describe('Navigation Buttons', () => {
    it('should render manage whitelist button', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      const manageButton = wrapper.find('button[aria-label="Manage whitelist addresses"]');
      expect(manageButton.exists()).toBe(true);
      expect(manageButton.text()).toContain('Manage Whitelist');
    });

    it('should render jurisdiction rules button', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      const jurisdictionButton = wrapper.find('button[aria-label="Configure jurisdiction rules"]');
      expect(jurisdictionButton.exists()).toBe(true);
      expect(jurisdictionButton.text()).toContain('Jurisdiction Rules');
    });

    it('should render bulk import button', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      const bulkButton = wrapper.find('button[aria-label="Bulk import addresses"]');
      expect(bulkButton.exists()).toBe(true);
      expect(bulkButton.text()).toContain('Bulk Import');
    });

    it('should emit navigateToWhitelist event', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      const manageButton = wrapper.find('button[aria-label="Manage whitelist addresses"]');
      await manageButton.trigger('click');

      expect(wrapper.emitted('navigateToWhitelist')).toBeTruthy();
    });

    it('should emit navigateToJurisdiction event', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      const jurisdictionButton = wrapper.find('button[aria-label="Configure jurisdiction rules"]');
      await jurisdictionButton.trigger('click');

      expect(wrapper.emitted('navigateToJurisdiction')).toBeTruthy();
    });

    it('should emit navigateToBulkImport event', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      const bulkButton = wrapper.find('button[aria-label="Bulk import addresses"]');
      await bulkButton.trigger('click');

      expect(wrapper.emitted('navigateToBulkImport')).toBeTruthy();
    });
  });

  describe('Info Box', () => {
    it('should display whitelist compliance information', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(wrapper.text()).toContain('Whitelist Compliance');
      expect(wrapper.text()).toContain('KYC/AML requirements');
    });
  });

  describe('Empty State', () => {
    it('should display empty state template', () => {
      const wrapper = mount(WhitelistStatusPanel);

      expect(wrapper.html()).toContain('No Whitelist Data');
    });

    it('should have setup button in empty state', () => {
      const wrapper = mount(WhitelistStatusPanel);

      expect(wrapper.html()).toContain('Set Up Whitelist');
    });
  });

  describe('Error Handling', () => {
    it('should handle data loading flow', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      // Component should gracefully handle all states
      const hasContent = wrapper.text().length > 50;
      expect(hasContent).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on action buttons', async () => {
      const wrapper = mount(WhitelistStatusPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 600));

      const manageButton = wrapper.find('button[aria-label="Manage whitelist addresses"]');
      expect(manageButton.attributes('aria-label')).toBe('Manage whitelist addresses');

      const jurisdictionButton = wrapper.find('button[aria-label="Configure jurisdiction rules"]');
      expect(jurisdictionButton.attributes('aria-label')).toBe('Configure jurisdiction rules');

      const bulkButton = wrapper.find('button[aria-label="Bulk import addresses"]');
      expect(bulkButton.attributes('aria-label')).toBe('Bulk import addresses');
    });

    it('should use semantic HTML headings', () => {
      const wrapper = mount(WhitelistStatusPanel);

      expect(wrapper.find('h2').exists()).toBe(true);
    });
  });
});
