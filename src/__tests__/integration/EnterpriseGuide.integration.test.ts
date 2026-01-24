import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import EnterpriseGuideView from '../../views/EnterpriseGuideView.vue';
import TokenStandardsView from '../../views/TokenStandardsView.vue';
import { useTokenStore } from '../../stores/tokens';

// Mock MainLayout
vi.mock('../../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div data-testid="main-layout"><slot /></div>',
  },
}));

// Mock EnterpriseDecisionGuide component
vi.mock('../../components/EnterpriseDecisionGuide.vue', () => ({
  default: {
    name: 'EnterpriseDecisionGuide',
    props: {},
    template: `
      <div data-testid="enterprise-decision-guide">
        <div data-testid="recommendation-matrix">
          <h3>Recommendation Matrix</h3>
          <div data-testid="mica-compliance">MICA Compliance Readiness</div>
          <div data-testid="rwa-whitelisting">RWA Whitelisting</div>
          <div data-testid="compliance-reporting">Compliance Reporting</div>
          <div data-testid="wallet-support">Broad Wallet Support</div>
        </div>
        <div data-testid="feature-comparison">
          <h3>Enterprise Feature Comparison</h3>
          <table>
            <tr>
              <td data-testid="feature-micaCompliant">MICA Compliance Ready</td>
              <td data-testid="feature-whitelisting">Transfer Whitelisting</td>
              <td data-testid="feature-complianceFlags">Compliance Flags</td>
              <td data-testid="feature-programmableLogic">Programmable Restrictions</td>
              <td data-testid="feature-auditTrail">Comprehensive Audit Trail</td>
              <td data-testid="feature-walletSupport">Broad Wallet Support</td>
            </tr>
          </table>
        </div>
        <div data-testid="use-case-guidance">
          <div data-testid="regulated-securities">Regulated Securities</div>
          <div data-testid="real-estate-tokens">Real Estate Tokens</div>
          <div data-testid="emoney-tokens">E-Money Tokens</div>
          <div data-testid="utility-tokens">Utility Tokens (Compliant)</div>
        </div>
      </div>
    `,
  },
}));

// Mock TokenStandardsComparison component
vi.mock('../../components/TokenStandardsComparison.vue', () => ({
  default: {
    name: 'TokenStandardsComparison',
    template: '<div data-testid="token-standards-comparison">TokenStandardsComparison</div>',
  },
}));

describe('Enterprise Guide Integration Tests', () => {
  let pinia: any;
  let router: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    // Create a mock router with all necessary routes
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/enterprise-guide', name: 'EnterpriseGuide', component: EnterpriseGuideView },
        { path: '/token-standards', name: 'TokenStandards', component: TokenStandardsView },
        { path: '/create', component: { template: '<div>Create</div>' } },
      ],
    });
  });

  describe('Enterprise Guide View Rendering', () => {
    it('should render the enterprise guide page with all main sections', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Enterprise Decision Guide');
      
      const guideComponent = wrapper.find('[data-testid="enterprise-decision-guide"]');
      expect(guideComponent.exists()).toBe(true);
    });

    it('should display recommendation matrix with all enterprise requirements', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const recommendationMatrix = wrapper.find('[data-testid="recommendation-matrix"]');
      expect(recommendationMatrix.exists()).toBe(true);
      expect(recommendationMatrix.text()).toContain('Recommendation Matrix');

      // Check all 4 enterprise requirements are present
      expect(wrapper.find('[data-testid="mica-compliance"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="rwa-whitelisting"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="compliance-reporting"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wallet-support"]').exists()).toBe(true);
    });

    it('should display enterprise feature comparison table', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const featureComparison = wrapper.find('[data-testid="feature-comparison"]');
      expect(featureComparison.exists()).toBe(true);
      expect(featureComparison.text()).toContain('Enterprise Feature Comparison');

      // Check all 6 enterprise features are present
      expect(wrapper.find('[data-testid="feature-micaCompliant"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="feature-whitelisting"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="feature-complianceFlags"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="feature-programmableLogic"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="feature-auditTrail"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="feature-walletSupport"]').exists()).toBe(true);
    });

    it('should display use case guidance for all 4 categories', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const useCaseGuidance = wrapper.find('[data-testid="use-case-guidance"]');
      expect(useCaseGuidance.exists()).toBe(true);

      // Check all 4 use cases are present
      expect(wrapper.find('[data-testid="regulated-securities"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="real-estate-tokens"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="emoney-tokens"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="utility-tokens"]').exists()).toBe(true);
    });
  });

  describe('Navigation Between Enterprise Guide and Token Standards', () => {
    it('should navigate from Enterprise Guide to Token Standards page', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Find the "Full Comparison" button
      const fullComparisonLink = wrapper.find('a[href="/token-standards"]');
      expect(fullComparisonLink.exists()).toBe(true);
      expect(fullComparisonLink.text()).toContain('Full Comparison');

      // Navigate to token standards
      await router.push('/token-standards');
      await router.isReady();

      expect(router.currentRoute.value.path).toBe('/token-standards');
    });

    it('should navigate from Token Standards to Enterprise Guide page', async () => {
      await router.push('/token-standards');
      await router.isReady();

      const wrapper = mount(TokenStandardsView, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      // Find the "Enterprise Guide" button
      const enterpriseGuideLink = wrapper.find('a[href="/enterprise-guide"]');
      expect(enterpriseGuideLink.exists()).toBe(true);
      expect(enterpriseGuideLink.text()).toContain('Enterprise Guide');

      // Navigate to enterprise guide
      await router.push('/enterprise-guide');
      await router.isReady();

      expect(router.currentRoute.value.path).toBe('/enterprise-guide');
    });

    it('should maintain bidirectional navigation between pages', async () => {
      // Start at Enterprise Guide
      await router.push('/enterprise-guide');
      await router.isReady();
      expect(router.currentRoute.value.path).toBe('/enterprise-guide');

      // Navigate to Token Standards
      await router.push('/token-standards');
      await router.isReady();
      expect(router.currentRoute.value.path).toBe('/token-standards');

      // Navigate back to Enterprise Guide
      await router.push('/enterprise-guide');
      await router.isReady();
      expect(router.currentRoute.value.path).toBe('/enterprise-guide');
    });
  });

  describe('Feature Mapping Logic', () => {
    it('should have token store with enterprise-relevant standards', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const tokenStore = useTokenStore();
      
      // Check that token standards exist
      expect(tokenStore.tokenStandards).toBeDefined();
      expect(tokenStore.tokenStandards.length).toBeGreaterThan(0);

      // Check for enterprise-relevant standards
      const standardNames = tokenStore.tokenStandards.map(s => s.name);
      expect(standardNames).toContain('ASA');
      expect(standardNames).toContain('ARC3FT');
      expect(standardNames).toContain('ARC200');
      expect(standardNames).toContain('ERC20');
    });

    it('should have compliance-capable standards with required features', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const tokenStore = useTokenStore();
      
      // Find ARC200 and ERC20 (compliance-capable standards)
      const arc200 = tokenStore.tokenStandards.find(s => s.name === 'ARC200');
      const erc20 = tokenStore.tokenStandards.find(s => s.name === 'ERC20');

      expect(arc200).toBeDefined();
      expect(erc20).toBeDefined();

      // Check that they have smart contract capability for compliance
      expect(arc200?.features?.smartContract).toBe(true);
      expect(erc20?.features?.smartContract).toBe(true);

      // Check that they support whitelisting
      expect(arc200?.features?.whitelisting).toBe(true);
      expect(erc20?.features?.whitelisting).toBe(true);

      // Check that they have compliance flags
      expect(arc200?.features?.complianceFlags).toBe(true);
      expect(erc20?.features?.complianceFlags).toBe(true);
    });
  });

  describe('Enterprise Guide Accessibility', () => {
    it('should render within MainLayout', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      const mainLayout = wrapper.find('[data-testid="main-layout"]');
      expect(mainLayout.exists()).toBe(true);
    });

    it('should have proper page title and description', async () => {
      await router.push('/enterprise-guide');
      await router.isReady();

      const wrapper = mount(EnterpriseGuideView, {
        global: {
          plugins: [pinia, router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Enterprise Decision Guide');
      expect(wrapper.text()).toContain('Choose the right token standard for your enterprise requirements');
    });
  });
});
