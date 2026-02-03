import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { ref } from 'vue';
import WalletNetworkPanel from './WalletNetworkPanel.vue';

// Mock the wallet manager composable
vi.mock('../composables/useWalletManager', () => ({
  useWalletManager: vi.fn(() => ({
    isConnected: ref(false),
    activeAddress: ref(''),
    formattedAddress: ref(''),
    networkInfo: ref(null),
    currentNetwork: ref('algorand-testnet'),
    switchNetwork: vi.fn(),
  })),
  AVM_NETWORKS: {
    'algorand-mainnet': {
      id: 'algorand-mainnet',
      name: 'algorand-mainnet',
      displayName: 'Algorand MainNet',
      isTestnet: false,
      chainType: 'AVM',
      algodUrl: 'https://mainnet-api.algonode.cloud',
      genesisId: 'mainnet-v1.0',
    },
    'algorand-testnet': {
      id: 'algorand-testnet',
      name: 'algorand-testnet',
      displayName: 'Algorand TestNet',
      isTestnet: true,
      chainType: 'AVM',
      algodUrl: 'https://testnet-api.algonode.cloud',
      genesisId: 'testnet-v1.0',
    },
    'voi-mainnet': {
      id: 'voi-mainnet',
      name: 'voi-mainnet',
      displayName: 'VOI MainNet',
      isTestnet: false,
      chainType: 'AVM',
      algodUrl: 'https://mainnet-api.voi.network',
      genesisId: 'voi-mainnet-v1.0',
    },
  },
  EVM_NETWORKS: {
    ethereum: {
      id: 'ethereum',
      name: 'ethereum',
      displayName: 'Ethereum',
      isTestnet: false,
      chainType: 'EVM',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      chainId: 1,
    },
    sepolia: {
      id: 'sepolia',
      name: 'sepolia',
      displayName: 'Sepolia',
      isTestnet: true,
      chainType: 'EVM',
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
      chainId: 11155111,
    },
  },
}));

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

describe('WalletNetworkPanel', () => {
  let mockUseWalletManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseWalletManager = {
      isConnected: ref(false),
      activeAddress: ref(''),
      formattedAddress: ref(''),
      networkInfo: ref(null),
      currentNetwork: ref('algorand-testnet'),
      switchNetwork: vi.fn(),
    };

    const { useWalletManager } = await import('../composables/useWalletManager');
    useWalletManager.mockReturnValue(mockUseWalletManager);
  });

  describe('Component Rendering', () => {
    it('should render disconnected state correctly', async () => {
      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.find('h3').text()).toContain('Wallet & Network');
      expect(wrapper.find('button[data-testid="connect-wallet-btn"]').text()).toContain('Sign In');
      expect(wrapper.find('.pi-wallet').exists()).toBe(true);
      expect(wrapper.text()).toContain('Sign in to deploy tokens');
    });

    it('should render connected state correctly', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.activeAddress.value = 'ALGO123...XYZ789';
      mockUseWalletManager.formattedAddress.value = 'ALGO...XYZ789';
      mockUseWalletManager.networkInfo.value = {
        displayName: 'Algorand TestNet',
        isTestnet: true,
        chainType: 'AVM',
        algodUrl: 'https://testnet-api.algonode.cloud',
        genesisId: 'testnet-v1.0',
        name: 'algorand-testnet',
      };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.find('.text-green-400').text()).toContain('Connected');
      expect(wrapper.text()).toContain('ALGO...XYZ789');
      expect(wrapper.text()).toContain('Algorand TestNet');
      expect(wrapper.text()).toContain('Testnet');
    });

    it('should show network switcher when button is clicked', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = {
        displayName: 'Algorand TestNet',
        isTestnet: true,
        name: 'algorand-testnet',
      };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      const switchBtn = wrapper.findAll('button').find(btn => btn.text().includes('Switch Network'));
      expect(switchBtn).toBeTruthy();

      await switchBtn.trigger('click');

      expect(wrapper.text()).toContain('AVM Chains (Algorand-based)');
      expect(wrapper.text()).toContain('EVM Chains (Ethereum-based)');
    });
  });

  describe('Computed Properties', () => {
    it('should return correct compliance label for mainnet networks', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = { name: 'voi-mainnet' };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      // The compliance label is computed based on networkInfo
      expect(wrapper.vm.complianceLabel).toBe('Enterprise Ready');
    });

    it('should return correct compliance label for test networks', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = { name: 'algorand-testnet' };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.vm.complianceLabel).toBe('Test Network');
    });

    it('should return correct compliance label for standard networks', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = { name: 'ethereum' };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.vm.complianceLabel).toBe('Standard');
    });

    it('should return correct compliance badge class for enterprise ready networks', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = { name: 'voi-mainnet' };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.vm.complianceBadgeClass).toBe('bg-green-500/20 text-green-400');
    });

    it('should return correct compliance badge class for test networks', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = { name: 'sepolia' };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.vm.complianceBadgeClass).toBe('bg-yellow-500/20 text-yellow-400');
    });

    it('should return correct compliance badge class for standard networks', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = { name: 'ethereum' };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.vm.complianceBadgeClass).toBe('bg-gray-500/20 text-gray-400');
    });

    it('should return AVM networks array', async () => {
      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      const avmNets = wrapper.vm.avmNetworks;
      expect(Array.isArray(avmNets)).toBe(true);
      expect(avmNets.length).toBeGreaterThan(0);
      expect(avmNets[0]).toHaveProperty('chainType', 'AVM');
    });

    it('should return EVM networks array', async () => {
      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      const evmNets = wrapper.vm.evmNetworks;
      expect(Array.isArray(evmNets)).toBe(true);
      expect(evmNets.length).toBeGreaterThan(0);
      expect(evmNets[0]).toHaveProperty('chainType', 'EVM');
    });
  });

  describe('Functions', () => {
    it('should handle network switch successfully', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.switchNetwork.mockResolvedValue(undefined);

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      await wrapper.vm.handleNetworkSwitch('voi-mainnet');

      expect(mockUseWalletManager.switchNetwork).toHaveBeenCalledWith('voi-mainnet');
      expect(wrapper.emitted('network-switched')).toBeTruthy();
      expect(wrapper.emitted('network-switched')[0]).toEqual(['voi-mainnet']);
    });

    it('should not switch to same network', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.currentNetwork.value = 'algorand-testnet';

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      await wrapper.vm.handleNetworkSwitch('algorand-testnet');

      expect(mockUseWalletManager.switchNetwork).not.toHaveBeenCalled();
      expect(wrapper.emitted('network-switched')).toBeFalsy();
    });

    it('should handle network switch error', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.switchNetwork.mockRejectedValue(new Error('Network switch failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      await wrapper.vm.handleNetworkSwitch('voi-mainnet');

      expect(mockUseWalletManager.switchNetwork).toHaveBeenCalledWith('voi-mainnet');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to switch network:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should copy address to clipboard', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.activeAddress.value = 'ALGO123456789';

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      await wrapper.vm.copyAddress();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ALGO123456789');
    });

    it('should handle copy address error', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.activeAddress.value = 'ALGO123456789';

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Clipboard error'));

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      await wrapper.vm.copyAddress();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy address:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should not copy address when not connected', async () => {
      mockUseWalletManager.isConnected.value = false;
      mockUseWalletManager.activeAddress.value = '';

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      await wrapper.vm.copyAddress();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('Event Emissions', () => {
    it('should emit connect-wallet event', async () => {
      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      const connectBtn = wrapper.findAll('button').find(btn => btn.text().includes('Sign In'));
      await connectBtn.trigger('click');

      expect(wrapper.emitted('connect-wallet')).toBeTruthy();
    });

    it('should emit disconnect-wallet event', async () => {
      mockUseWalletManager.isConnected.value = true;

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      const disconnectBtn = wrapper.findAll('button').find(btn => btn.text().includes('Disconnect'));
      await disconnectBtn.trigger('click');

      expect(wrapper.emitted('disconnect-wallet')).toBeTruthy();
    });
  });

  describe('Network Display', () => {
    it('should display AVM network details correctly', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = {
        displayName: 'VOI MainNet',
        isTestnet: false,
        chainType: 'AVM',
        algodUrl: 'https://mainnet-api.voi.network',
        genesisId: 'voi-mainnet-v1.0',
        name: 'voi-mainnet',
      };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.text()).toContain('VOI MainNet');
      expect(wrapper.text()).toContain('Mainnet');
      expect(wrapper.text()).toContain('voi-mainnet-v1.0');
      expect(wrapper.text()).toContain('Enterprise Ready');
    });

    it('should display EVM network details correctly', async () => {
      mockUseWalletManager.isConnected.value = true;
      mockUseWalletManager.networkInfo.value = {
        displayName: 'Ethereum',
        isTestnet: false,
        chainType: 'EVM',
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        chainId: 1,
        name: 'ethereum',
      };

      const wrapper = mount(WalletNetworkPanel, {
        global: {
          plugins: [createTestingPinia()],
        },
      });

      expect(wrapper.text()).toContain('Ethereum');
      expect(wrapper.text()).toContain('Mainnet');
      expect(wrapper.text()).toContain('Chain ID: 1');
      expect(wrapper.text()).toContain('Standard');
    });
  });
});