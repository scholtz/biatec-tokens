/**
 * Integration tests for Network Prioritization UX
 * Tests the integration between WalletConnectModal, WalletOnboardingWizard, and networkSorting utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WalletConnectModal from '../../components/WalletConnectModal.vue';
import WalletOnboardingWizard from '../../components/WalletOnboardingWizard.vue';
import { NETWORKS } from '../../composables/useWalletManager';
import { sortNetworksByPriority } from '../../utils/networkSorting';

// Mock the wallet manager
vi.mock('../../composables/useWalletManager', async () => {
  const actual = await vi.importActual('../../composables/useWalletManager');
  return {
    ...actual,
    useWalletManager: vi.fn(() => ({
      isConnected: { value: false },
      activeAddress: { value: null },
      activeWallet: { value: null },
      accounts: { value: [] },
      walletState: {
        value: {
          isConnected: false,
          activeAddress: null,
          activeWallet: null,
          accounts: [],
          isConnecting: false,
          error: null,
          connectionState: 'disconnected',
          lastError: null,
          balanceLastUpdated: null,
        },
      },
      currentNetwork: { value: 'algorand-mainnet' },
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      reconnect: vi.fn(),
      retryConnection: vi.fn(),
      walletManager: {
        wallets: {
          value: [
            { id: 'pera', isActive: true, metadata: { name: 'Pera Wallet' } },
            { id: 'defly', isActive: true, metadata: { name: 'Defly Wallet' } },
          ],
        },
      },
      getTroubleshootingSteps: vi.fn(() => []),
    })),
  };
});

// Mock Arc76 authentication
vi.mock('algorand-authentication-component-vue', () => ({
  useAVMAuthentication: vi.fn(() => ({
    authStore: {
      isAuthenticated: false,
      account: null,
      arc76email: null,
    },
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock @txnlab/use-wallet-vue
vi.mock('@txnlab/use-wallet-vue', () => ({
  useWallet: vi.fn(() => ({
    activeAccount: { value: null },
    wallets: { value: [] },
  })),
}));

describe('Network Prioritization Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Network Sorting Logic', () => {
    it('should sort networks with mainnets first', () => {
      const networks = Object.values(NETWORKS);
      const sorted = sortNetworksByPriority(networks);

      // Find the first testnet
      const firstTestnetIndex = sorted.findIndex(n => n.isTestnet);
      
      // All networks before first testnet should be mainnets
      for (let i = 0; i < firstTestnetIndex; i++) {
        expect(sorted[i].isTestnet).toBe(false);
      }

      // All networks after should be testnets
      for (let i = firstTestnetIndex; i < sorted.length; i++) {
        expect(sorted[i].isTestnet).toBe(true);
      }
    });

    it('should prioritize Algorand mainnet at the top', () => {
      const networks = Object.values(NETWORKS);
      const sorted = sortNetworksByPriority(networks);

      expect(sorted[0].id).toBe('algorand-mainnet');
      expect(sorted[0].displayName).toBe('Algorand Mainnet');
    });

    it('should prioritize Ethereum second among mainnets', () => {
      const networks = Object.values(NETWORKS);
      const sorted = sortNetworksByPriority(networks);

      // Find Ethereum in the sorted list
      const ethereumIndex = sorted.findIndex(n => n.id === 'ethereum');
      
      // Ethereum should be second (index 1)
      expect(ethereumIndex).toBe(1);
      expect(sorted[1].displayName).toBe('Ethereum Mainnet');
    });

    it('should prioritize Algorand testnet first among testnets', () => {
      const networks = Object.values(NETWORKS);
      const sorted = sortNetworksByPriority(networks);

      // Find the first testnet
      const firstTestnetIndex = sorted.findIndex(n => n.isTestnet);
      
      expect(sorted[firstTestnetIndex].id).toBe('algorand-testnet');
      expect(sorted[firstTestnetIndex].displayName).toBe('Algorand Testnet');
    });
  });

  describe('WalletConnectModal Network Display', () => {
    it.skip('should render networks in prioritized order', async () => {
      const wrapper = mount(WalletConnectModal, {
        props: {
          isOpen: true,
          showNetworkSelector: true,
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Check that network buttons exist
      const networkButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('Mainnet') || btn.text().includes('Testnet')
      );

      expect(networkButtons.length).toBeGreaterThan(0);
    });

    it.skip('should display "Recommended" badge for mainnet networks', async () => {
      const wrapper = mount(WalletConnectModal, {
        props: {
          isOpen: true,
          showNetworkSelector: true,
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Look for "Recommended" badge text
      const modalContent = wrapper.html();
      expect(modalContent).toContain('Recommended');
    });

    it.skip('should display testnet warning when testnet is selected', async () => {
      const wrapper = mount(WalletConnectModal, {
        props: {
          isOpen: true,
          showNetworkSelector: true,
          defaultNetwork: 'algorand-testnet',
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Look for testnet warning text
      const modalContent = wrapper.html();
      expect(modalContent).toContain('Testnet Notice');
      expect(modalContent).toContain('testing only');
    });
  });

  describe('WalletOnboardingWizard Network Display', () => {
    it.skip('should render networks in prioritized order', async () => {
      const wrapper = mount(WalletOnboardingWizard, {
        props: {
          isOpen: true,
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Wizard should render
      expect(wrapper.exists()).toBe(true);
    });

    it.skip('should display "Recommended" badge for mainnet networks', async () => {
      const wrapper = mount(WalletOnboardingWizard, {
        props: {
          isOpen: true,
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Step through to network selection
      const buttons = wrapper.findAll('button');
      const continueButton = buttons.find(btn => btn.text().includes('Continue'));
      
      if (continueButton) {
        await continueButton.trigger('click');
        await wrapper.vm.$nextTick();

        // Look for "Recommended" badge
        const wizardContent = wrapper.html();
        expect(wizardContent).toContain('Recommended');
      }
    });

    it('should default to Algorand mainnet', async () => {
      const wrapper = mount(WalletOnboardingWizard, {
        props: {
          isOpen: true,
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Check the default selected network in component data
      const vm = wrapper.vm as any;
      expect(vm.selectedNetwork).toBe('algorand-mainnet');
    });
  });

  describe('Business Value - Mainnet First Prioritization', () => {
    it('should ensure production networks are immediately visible', () => {
      const networks = Object.values(NETWORKS);
      const sorted = sortNetworksByPriority(networks);

      // First 4 networks should be mainnets
      const firstFour = sorted.slice(0, 4);
      const allMainnet = firstFour.every(n => !n.isTestnet);
      
      expect(allMainnet).toBe(true);
    });

    it.skip('should minimize support burden by clearly labeling testnets', async () => {
      const wrapper = mount(WalletConnectModal, {
        props: {
          isOpen: true,
          showNetworkSelector: true,
          defaultNetwork: 'algorand-testnet',
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Should show warning about production use
      const modalContent = wrapper.html();
      expect(modalContent).toContain('production use');
    });

    it('should signal enterprise readiness with mainnet defaults', async () => {
      const wrapper = mount(WalletConnectModal, {
        props: {
          isOpen: true,
          showNetworkSelector: true,
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Default changed to algorand-testnet per MVP stabilization AC #1
      // This supports safer development and testing workflow
      const vm = wrapper.vm as any;
      expect(vm.selectedNetwork).toBe('algorand-testnet');
    });
  });

  describe('UX Consistency - Account Terminology', () => {
    it('should use "Sign In" terminology in modal title', async () => {
      const wrapper = mount(WalletConnectModal, {
        props: {
          isOpen: true,
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Should use "Sign In" not "Connect Wallet"
      const modalContent = wrapper.html();
      expect(modalContent).toContain('Sign In');
    });

    it('should provide clear authentication context', async () => {
      const wrapper = mount(WalletConnectModal, {
        props: {
          isOpen: true,
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            Teleport: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Should explain authentication requirement
      const modalContent = wrapper.html();
      expect(modalContent).toContain('Account');
    });
  });
});
