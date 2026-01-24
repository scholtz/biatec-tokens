import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import TokenCreator from '../../views/TokenCreator.vue';
import { useTokenStore } from '../../stores/tokens';
import { useSubscriptionStore } from '../../stores/subscription';

// Mock MainLayout
vi.mock('../../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div data-testid="main-layout"><slot /></div>',
  },
}));

// Mock ComplianceChecklist
vi.mock('../../components/ComplianceChecklist.vue', () => ({
  default: {
    name: 'ComplianceChecklist',
    template: '<div data-testid="compliance-checklist">ComplianceChecklist</div>',
  },
}));

describe('RWA Preset Selection Integration Tests', () => {
  let pinia: any;
  let router: any;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    pinia = createPinia();
    setActivePinia(pinia);

    // Create a mock router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/create', component: TokenCreator },
        { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
      ],
    });

    // Mock subscription tracking methods
    const subscriptionStore = useSubscriptionStore();
    vi.spyOn(subscriptionStore, 'trackGuidanceInteraction').mockImplementation(() => {});
    vi.spyOn(subscriptionStore, 'trackTokenCreationAttempt').mockImplementation(() => {});
    vi.spyOn(subscriptionStore, 'trackTokenCreationSuccess').mockImplementation(() => {});
  });

  describe('RWA Preset Selection Flow', () => {
    it('should display RWA presets section on token creator page', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('RWA Compliance Presets');
      expect(wrapper.text()).toContain('Pre-configured tokens with MICA-aligned compliance features');
    });

    it('should show all 5 RWA presets', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const tokenStore = useTokenStore();
      expect(tokenStore.rwaTokenTemplates).toHaveLength(5);

      expect(wrapper.text()).toContain('RWA Security Token (Whitelisted)');
      expect(wrapper.text()).toContain('RWA Real Estate Token');
      expect(wrapper.text()).toContain('RWA E-Money Token');
      expect(wrapper.text()).toContain('RWA Carbon Credit Token');
      expect(wrapper.text()).toContain('RWA Supply Chain Asset Token');
    });

    it('should apply RWA preset to token form when selected', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Find and click the Security Token preset button
      const buttons = wrapper.findAll('button');
      const securityTokenButton = buttons.find(btn =>
        btn.text().includes('RWA Security Token (Whitelisted)')
      );

      expect(securityTokenButton).toBeDefined();
      await securityTokenButton!.trigger('click');
      await flushPromises();

      // Apply the preset
      const applyButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Apply This Preset')
      );
      await applyButton!.trigger('click');
      await flushPromises();

      // Check if the token standard was set to ARC200 (Security Token uses ARC200)
      const vm = wrapper.vm as any;
      expect(vm.selectedStandard).toBe('ARC200');
      expect(vm.selectedTemplate).toBe('rwa-security-token');
    });

    it('should populate form fields with RWA preset defaults', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Click Security Token preset
      const buttons = wrapper.findAll('button');
      const securityTokenButton = buttons.find(btn =>
        btn.text().includes('RWA Security Token (Whitelisted)')
      );
      await securityTokenButton!.trigger('click');
      await flushPromises();

      // Apply preset
      const applyButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Apply This Preset')
      );
      await applyButton!.trigger('click');
      await flushPromises();

      const vm = wrapper.vm as any;
      const tokenStore = useTokenStore();
      const securityToken = tokenStore.rwaTokenTemplates.find(t => t.id === 'rwa-security-token');

      // Check defaults were applied
      expect(vm.tokenForm.supply).toBe(securityToken?.defaults.supply);
      expect(vm.tokenForm.decimals).toBe(securityToken?.defaults.decimals);
      expect(vm.tokenForm.description).toBe(securityToken?.defaults.description);
      expect(vm.tokenForm.type).toBe(securityToken?.type);
    });

    it('should track guidance interaction when preset is selected', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const subscriptionStore = useSubscriptionStore();
      const trackSpy = vi.spyOn(subscriptionStore, 'trackGuidanceInteraction');

      // Click a preset
      const buttons = wrapper.findAll('button');
      const securityTokenButton = buttons.find(btn =>
        btn.text().includes('RWA Security Token (Whitelisted)')
      );
      await securityTokenButton!.trigger('click');
      await flushPromises();

      // Apply preset
      const applyButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Apply This Preset')
      );
      await applyButton!.trigger('click');
      await flushPromises();

      expect(trackSpy).toHaveBeenCalled();
    });
  });

  describe('Compliance Implications Display', () => {
    it('should display compliance implications when RWA preset is selected', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Select Security Token
      const buttons = wrapper.findAll('button');
      const securityTokenButton = buttons.find(btn =>
        btn.text().includes('RWA Security Token (Whitelisted)')
      );
      await securityTokenButton!.trigger('click');
      await flushPromises();

      // Should show compliance implications
      expect(wrapper.text()).toContain('Compliance Implications & Requirements');
      expect(wrapper.text()).toContain('KYC/AML verification');
      expect(wrapper.text()).toContain('whitelisted addresses');
    });

    it('should display different compliance implications for different presets', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Select E-Money Token
      const buttons = wrapper.findAll('button');
      const eMoneyButton = buttons.find(btn =>
        btn.text().includes('RWA E-Money Token')
      );
      await eMoneyButton!.trigger('click');
      await flushPromises();

      // Should show E-Money specific implications
      expect(wrapper.text()).toContain('e-money institution authorization');
      expect(wrapper.text()).toContain('1:1 fiat reserves');
    });
  });

  describe('Network-Specific Preset Behavior', () => {
    it('should auto-select network when RWA preset specifies one', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Select Real Estate Token (Aramid only)
      const buttons = wrapper.findAll('button');
      const realEstateButton = buttons.find(btn =>
        btn.text().includes('RWA Real Estate Token')
      );
      await realEstateButton!.trigger('click');
      await flushPromises();

      // Apply preset
      const applyButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Apply This Preset')
      );
      await applyButton!.trigger('click');
      await flushPromises();

      const vm = wrapper.vm as any;
      expect(vm.selectedNetwork).toBe('Aramid');
    });

    it('should not auto-select network for "Both" network presets', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Select Security Token (Both networks)
      const buttons = wrapper.findAll('button');
      const securityTokenButton = buttons.find(btn =>
        btn.text().includes('RWA Security Token (Whitelisted)')
      );
      await securityTokenButton!.trigger('click');
      await flushPromises();

      // Apply preset
      const applyButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Apply This Preset')
      );
      await applyButton!.trigger('click');
      await flushPromises();

      const vm = wrapper.vm as any;
      // Should remain null since preset supports both networks
      expect(vm.selectedNetwork).toBeNull();
    });
  });

  describe('RWA Preset vs Standard Template Separation', () => {
    it('should display RWA presets in separate section from standard templates', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const text = wrapper.text();
      
      // RWA section
      const rwaIndex = text.indexOf('RWA Compliance Presets');
      expect(rwaIndex).toBeGreaterThan(-1);

      // Standard templates section
      const standardIndex = text.indexOf('Quick Start with Standard Templates');
      expect(standardIndex).toBeGreaterThan(-1);

      // RWA section should come before standard templates
      expect(rwaIndex).toBeLessThan(standardIndex);
    });

    it('should display only non-RWA templates in standard section', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const tokenStore = useTokenStore();
      
      // Verify filtering works correctly
      expect(tokenStore.standardTokenTemplates).toHaveLength(10);
      expect(tokenStore.rwaTokenTemplates).toHaveLength(5);
      expect(tokenStore.tokenTemplates).toHaveLength(15);

      // Standard templates should include VOI Utility Token
      expect(tokenStore.standardTokenTemplates.some(t => t.id === 'voi-utility-token')).toBe(true);
      
      // Standard templates should NOT include RWA presets
      expect(tokenStore.standardTokenTemplates.some(t => t.id === 'rwa-security-token')).toBe(false);
    });
  });

  describe('Legal and Compliance Warnings', () => {
    it('should display legal disclaimer for RWA presets', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Legal Disclaimer');
      expect(wrapper.text()).toContain('do not constitute legal advice');
      expect(wrapper.text()).toContain('consult with legal counsel');
    });

    it('should show MICA compliant badge on all RWA presets', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const tokenStore = useTokenStore();
      
      // All RWA presets should be MICA compliant
      tokenStore.rwaTokenTemplates.forEach(preset => {
        expect(preset.micaCompliant).toBe(true);
      });
    });
  });

  describe('Feature Badge Display', () => {
    it('should display feature badges for RWA presets', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Check for various feature badges
      expect(wrapper.text()).toContain('Whitelist');
      expect(wrapper.text()).toContain('Transfer Restrictions');
      expect(wrapper.text()).toContain('Issuer Controls');
      expect(wrapper.text()).toContain('KYC Required');
    });

    it('should show correct features for Security Token', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const tokenStore = useTokenStore();
      const securityToken = tokenStore.rwaTokenTemplates.find(t => t.id === 'rwa-security-token');

      // Security token should have all features
      expect(securityToken?.rwaFeatures?.whitelistEnabled).toBe(true);
      expect(securityToken?.rwaFeatures?.transferRestrictions).toBe(true);
      expect(securityToken?.rwaFeatures?.issuerControls).toBe(true);
      expect(securityToken?.rwaFeatures?.kycRequired).toBe(true);
      expect(securityToken?.rwaFeatures?.jurisdictionRestrictions).toBe(true);
    });

    it('should show correct features for Carbon Credit Token', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const tokenStore = useTokenStore();
      const carbonToken = tokenStore.rwaTokenTemplates.find(t => t.id === 'rwa-carbon-credit');

      // Carbon credit should NOT have whitelist or KYC
      expect(carbonToken?.rwaFeatures?.whitelistEnabled).toBe(false);
      expect(carbonToken?.rwaFeatures?.kycRequired).toBe(false);
      // But should have these
      expect(carbonToken?.rwaFeatures?.transferRestrictions).toBe(true);
      expect(carbonToken?.rwaFeatures?.issuerControls).toBe(true);
    });
  });
});
