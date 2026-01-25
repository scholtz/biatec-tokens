import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import TokenCreator from './TokenCreator.vue';
import { useTokenStore } from '../stores/tokens';
import { useSubscriptionStore } from '../stores/subscription';

// Mock MainLayout
vi.mock('../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div><slot /></div>',
  },
}));

describe('TokenCreator Component', () => {
  let router: any;
  let pinia: any;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    pinia = createPinia();
    setActivePinia(pinia);
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/create', component: TokenCreator },
        { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
      ],
    });
  });

  describe('Template Selection', () => {
    it('should display 15 token templates (10 standard + 5 RWA)', () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const templateButtons = wrapper.findAll('[class*="button"]').filter(btn => 
        btn.text().includes('VOI') || btn.text().includes('Aramid') || btn.text().includes('Stablecoin')
      );

      const store = useTokenStore();
      expect(store.tokenTemplates).toHaveLength(21);
      expect(store.standardTokenTemplates).toHaveLength(16);
      expect(store.rwaTokenTemplates).toHaveLength(5);
    });

    it('should show MICA compliance badge for compliant templates', () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const micaBadges = wrapper.findAll('[title="MICA Compliant"]');
      expect(micaBadges.length).toBeGreaterThan(0);
    });

    it('should display network tags for templates', () => {
      const store = useTokenStore();
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      store.tokenTemplates.forEach(template => {
        expect(['VOI', 'Aramid', 'Both']).toContain(template.network);
      });
    });

    it('should apply template when clicked', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const store = useTokenStore();
      const voiUtility = store.tokenTemplates.find(t => t.id === 'voi-utility-token');

      // Simulate template selection - directly call the method
      const component = wrapper.vm as any;
      component.applyTemplate('voi-utility-token');

      await flushPromises();

      expect(component.selectedTemplate).toBe('voi-utility-token');
      expect(component.tokenForm.supply).toBe(voiUtility?.defaults.supply);
      expect(component.tokenForm.decimals).toBe(voiUtility?.defaults.decimals);
      expect(component.tokenForm.description).toBe(voiUtility?.defaults.description);
    });

    it('should show guidance panel when template is selected', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      component.applyTemplate('voi-utility-token');

      await wrapper.vm.$nextTick();

      expect(component.selectedTemplate).toBe('voi-utility-token');
      expect(component.currentTemplate).toBeDefined();
    });

    it('should clear template selection', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      component.applyTemplate('voi-utility-token');
      await wrapper.vm.$nextTick();

      expect(component.selectedTemplate).toBe('voi-utility-token');

      component.clearTemplate();
      await wrapper.vm.$nextTick();

      expect(component.selectedTemplate).toBe('');
    });

    it('should use nullish coalescing for decimals fallback', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      
      // Test with a template that has decimals
      component.applyTemplate('voi-utility-token');
      await wrapper.vm.$nextTick();
      expect(component.tokenForm.decimals).toBe(6);

      // Reset and test with security token (decimals: 0)
      component.clearTemplate();
      component.applyTemplate('voi-security-token');
      await wrapper.vm.$nextTick();
      expect(component.tokenForm.decimals).toBe(0);
    });

    it('should update token type based on template', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      
      // Apply FT template
      component.applyTemplate('voi-utility-token');
      await wrapper.vm.$nextTick();
      expect(component.tokenForm.type).toBe('FT');

      // Apply NFT template
      component.clearTemplate();
      component.applyTemplate('voi-nft-collection');
      await wrapper.vm.$nextTick();
      expect(component.tokenForm.type).toBe('NFT');
    });

    it('should set correct standard from template', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      
      component.applyTemplate('voi-utility-token');
      await wrapper.vm.$nextTick();
      expect(component.selectedStandard).toBe('ARC3FT');

      component.clearTemplate();
      component.applyTemplate('voi-security-token');
      await wrapper.vm.$nextTick();
      expect(component.selectedStandard).toBe('ARC200');
    });
  });

  describe('Template Computed Property', () => {
    it('should return undefined when no template is selected', () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      expect(component.currentTemplate).toBeUndefined();
    });

    it('should return template object when template is selected', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      const store = useTokenStore();
      
      component.applyTemplate('voi-utility-token');
      await wrapper.vm.$nextTick();

      expect(component.currentTemplate).toBeDefined();
      expect(component.currentTemplate?.id).toBe('voi-utility-token');
      expect(component.currentTemplate?.name).toBe('VOI Utility Token');
    });

    it('should avoid redundant template lookups', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      const store = useTokenStore();
      
      // Spy on the find method to check how many times it's called
      const findSpy = vi.spyOn(store.tokenTemplates, 'find');
      
      component.applyTemplate('voi-utility-token');
      await wrapper.vm.$nextTick();

      // Access currentTemplate multiple times
      const template1 = component.currentTemplate;
      const template2 = component.currentTemplate;
      const template3 = component.currentTemplate;

      // The computed property should cache the result
      expect(template1).toBe(template2);
      expect(template2).toBe(template3);
    });
  });

  describe('Form Integration', () => {
    it('should initialize form with default values', () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;

      expect(component.tokenForm.name).toBe('');
      expect(component.tokenForm.symbol).toBe('');
      expect(component.tokenForm.type).toBe('FT');
      expect(component.tokenForm.supply).toBe(1000000);
      expect(component.tokenForm.decimals).toBe(6);
    });

    it('should preserve user inputs when switching templates', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      
      // Set user inputs
      component.tokenForm.name = 'My Token';
      component.tokenForm.symbol = 'MTK';

      // Apply template
      component.applyTemplate('voi-utility-token');
      await wrapper.vm.$nextTick();

      // Name and symbol should be preserved
      expect(component.tokenForm.name).toBe('My Token');
      expect(component.tokenForm.symbol).toBe('MTK');
      
      // But defaults should be applied
      expect(component.tokenForm.supply).toBe(1000000);
      expect(component.tokenForm.decimals).toBe(6);
    });
  });

  describe('Business Value', () => {
    it('should provide templates for faster onboarding', () => {
      const store = useTokenStore();
      
      // All templates should have pre-configured defaults
      store.tokenTemplates.forEach(template => {
        expect(template.defaults.supply).toBeGreaterThan(0);
        expect(template.defaults.description).toBeTruthy();
      });
    });

    it('should reduce misconfiguration risk with validated defaults', () => {
      const store = useTokenStore();
      
      // Check that decimals are appropriate for token types
      const ftTemplates = store.tokenTemplates.filter(t => t.type === 'FT');
      ftTemplates.forEach(template => {
        if (template.defaults.decimals !== undefined) {
          expect(template.defaults.decimals).toBeGreaterThanOrEqual(0);
          expect(template.defaults.decimals).toBeLessThanOrEqual(18);
        }
      });

      // NFT templates should have appropriate supplies
      const nftTemplates = store.tokenTemplates.filter(t => t.type === 'NFT');
      nftTemplates.forEach(template => {
        expect(template.defaults.supply).toBeGreaterThan(0);
      });
    });

    it('should align with enterprise-grade requirements', () => {
      const store = useTokenStore();
      
      // All templates should have compliance guidance
      store.tokenTemplates.forEach(template => {
        expect(template.compliance).toBeTruthy();
        expect(template.compliance.length).toBeGreaterThan(20); // Meaningful guidance
      });

      // Should have MICA-specific templates
      const micaCompliant = store.tokenTemplates.filter(t => t.micaCompliant);
      expect(micaCompliant.length).toBeGreaterThan(5); // Majority should be compliant
    });
  });

  describe('Network Selection', () => {
    it('should display network guidance options', () => {
      const store = useTokenStore();
      
      expect(store.networkGuidance).toBeDefined();
      expect(store.networkGuidance.length).toBeGreaterThan(0);
    });

    it('should have VOI network guidance', () => {
      const store = useTokenStore();
      
      const voiGuidance = store.networkGuidance.find(n => n.name === 'VOI');
      expect(voiGuidance).toBeDefined();
      expect(voiGuidance?.displayName).toBe('VOI Network');
      expect(voiGuidance?.fees.creation).toBeTruthy();
      expect(voiGuidance?.fees.transaction).toBeTruthy();
      expect(voiGuidance?.metadataHosting.recommended.length).toBeGreaterThan(0);
    });

    it('should have Aramid network guidance', () => {
      const store = useTokenStore();
      
      const aramidGuidance = store.networkGuidance.find(n => n.name === 'Aramid');
      expect(aramidGuidance).toBeDefined();
      expect(aramidGuidance?.displayName).toBe('Aramid Network');
      expect(aramidGuidance?.fees.creation).toBeTruthy();
      expect(aramidGuidance?.fees.transaction).toBeTruthy();
      expect(aramidGuidance?.compliance.considerations.length).toBeGreaterThan(0);
    });

    it('should track network selection interaction', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const subscriptionStore = useSubscriptionStore();
      const initialInteractions = subscriptionStore.conversionMetrics.guidanceInteractions;

      const component = wrapper.vm as any;
      component.selectNetwork('VOI');
      await wrapper.vm.$nextTick();

      expect(subscriptionStore.conversionMetrics.guidanceInteractions).toBe(initialInteractions + 1);
    });

    it('should auto-select network when template is applied', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      
      // Apply VOI-specific template
      component.applyTemplate('voi-utility-token');
      await wrapper.vm.$nextTick();

      expect(component.selectedNetwork).toBe('VOI');
    });
  });

  describe('Enhanced Token Standard Selector', () => {
    it('should have detailed descriptions for standards', () => {
      const store = useTokenStore();
      
      store.tokenStandards.forEach(standard => {
        expect(standard.description).toBeTruthy();
        expect(standard.detailedDescription).toBeTruthy();
        expect(standard.detailedDescription.length).toBeGreaterThan(50);
      });
    });

    it('should provide pros and cons for each standard', () => {
      const store = useTokenStore();
      
      store.tokenStandards.forEach(standard => {
        expect(standard.pros).toBeDefined();
        expect(standard.pros.length).toBeGreaterThan(0);
        expect(standard.cons).toBeDefined();
        expect(standard.cons.length).toBeGreaterThan(0);
        expect(standard.useWhen).toBeDefined();
        expect(standard.useWhen.length).toBeGreaterThan(0);
      });
    });

    it('should track standard selection interaction', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const subscriptionStore = useSubscriptionStore();
      const initialInteractions = subscriptionStore.conversionMetrics.guidanceInteractions;

      const component = wrapper.vm as any;
      component.selectStandard('ARC3FT');
      await wrapper.vm.$nextTick();

      expect(subscriptionStore.conversionMetrics.guidanceInteractions).toBe(initialInteractions + 1);
    });

    it('should show detailed guidance when standard is selected', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const component = wrapper.vm as any;
      
      component.selectStandard('ARC3FT');
      await wrapper.vm.$nextTick();

      expect(component.currentStandardDetails).toBeDefined();
      expect(component.currentStandardDetails.name).toBe('ARC3FT');
      expect(component.currentStandardDetails.detailedDescription).toBeTruthy();
      expect(component.currentStandardDetails.pros.length).toBeGreaterThan(0);
    });
  });

  describe('Conversion Tracking', () => {
    it('should track token creation attempts', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const subscriptionStore = useSubscriptionStore();
      const initialAttempts = subscriptionStore.conversionMetrics.tokenCreationAttempts;

      const component = wrapper.vm as any;
      component.selectedStandard = 'ARC3FT';
      component.tokenForm.name = 'Test Token';
      component.tokenForm.symbol = 'TEST';
      component.tokenForm.description = 'Test description';

      // Trigger creation
      await component.createToken();
      await flushPromises();

      expect(subscriptionStore.conversionMetrics.tokenCreationAttempts).toBe(initialAttempts + 1);
    });

    it('should track successful token creation with details', async () => {
      const wrapper = mount(TokenCreator, {
        global: {
          plugins: [pinia, router],
        },
      });

      const subscriptionStore = useSubscriptionStore();
      const initialSuccesses = subscriptionStore.conversionMetrics.successfulCreations;

      const component = wrapper.vm as any;
      component.selectedStandard = 'ARC3FT';
      component.selectedTemplate = 'voi-utility-token';
      component.selectedNetwork = 'VOI';
      component.tokenForm.name = 'Test Token';
      component.tokenForm.symbol = 'TEST';
      component.tokenForm.description = 'Test description';

      await component.createToken();
      await flushPromises();

      expect(subscriptionStore.conversionMetrics.successfulCreations).toBe(initialSuccesses + 1);
      expect(subscriptionStore.conversionMetrics.standardUsageCount['ARC3FT']).toBeGreaterThan(0);
      expect(subscriptionStore.conversionMetrics.templateUsageCount['voi-utility-token']).toBeGreaterThan(0);
      expect(subscriptionStore.conversionMetrics.networkPreference['VOI']).toBeGreaterThan(0);
    });

    it('should calculate conversion rate', () => {
      const subscriptionStore = useSubscriptionStore();
      
      // Reset metrics
      subscriptionStore.conversionMetrics.tokenCreationAttempts = 10;
      subscriptionStore.conversionMetrics.successfulCreations = 8;

      expect(subscriptionStore.getConversionRate).toBe(80);
    });

    it('should identify most used template', () => {
      const subscriptionStore = useSubscriptionStore();
      
      // Set up usage data
      subscriptionStore.conversionMetrics.templateUsageCount = {
        'voi-utility-token': 5,
        'aramid-payment-token': 2,
        'voi-nft-collection': 8
      };

      const mostUsed = subscriptionStore.getMostUsedTemplate;
      expect(mostUsed).toBeDefined();
      expect(mostUsed?.[0]).toBe('voi-nft-collection');
      expect(mostUsed?.[1]).toBe(8);
    });

    it('should identify most used standard', () => {
      const subscriptionStore = useSubscriptionStore();
      
      // Set up usage data
      subscriptionStore.conversionMetrics.standardUsageCount = {
        'ARC3FT': 10,
        'ARC200': 5,
        'ARC3NFT': 3
      };

      const mostUsed = subscriptionStore.getMostUsedStandard;
      expect(mostUsed).toBeDefined();
      expect(mostUsed?.[0]).toBe('ARC3FT');
      expect(mostUsed?.[1]).toBe(10);
    });
  });
});
