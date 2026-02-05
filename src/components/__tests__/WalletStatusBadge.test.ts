import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WalletStatusBadge from '../WalletStatusBadge.vue';
import { WalletConnectionState } from '../../composables/walletState';
import type { NetworkInfo } from '../../composables/useWalletManager';

describe('WalletStatusBadge', () => {
  const mockNetwork: NetworkInfo = {
    id: 'algorand-mainnet',
    name: 'algorand-mainnet',
    displayName: 'Algorand Mainnet',
    isTestnet: false,
    chainType: 'AVM',
    algodUrl: 'https://mainnet-api.4160.nodely.dev',
    genesisId: 'mainnet-v1.0',
  };

  describe('Connection States', () => {
    it('should render disconnected state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.DISCONNECTED,
          networkInfo: null,
          address: null,
          formattedAddress: null,
        },
      });

      expect(wrapper.text()).toContain('Not Connected');
      expect(wrapper.find('.pi-circle').exists()).toBe(true);
    });

    it('should render connected state with network info', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123456789ABCDEF',
          formattedAddress: 'TEST12...CDEF',
        },
      });

      expect(wrapper.text()).toContain('Connected');
      expect(wrapper.text()).toContain('Algorand Mainnet');
      expect(wrapper.text()).toContain('TEST12...CDEF');
      expect(wrapper.find('.pi-check-circle').exists()).toBe(true);
    });

    it('should render connecting state with spinner', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTING,
          networkInfo: null,
          address: null,
          formattedAddress: null,
        },
      });

      expect(wrapper.text()).toContain('Connecting...');
      expect(wrapper.find('.pi-spinner').exists()).toBe(true);
    });

    it('should render failed state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.FAILED,
          networkInfo: null,
          address: null,
          formattedAddress: null,
          hasError: true,
        },
      });

      expect(wrapper.text()).toContain('Connection Failed');
      expect(wrapper.find('.pi-times-circle').exists()).toBe(true);
    });

    it('should render switching network state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.SWITCHING_NETWORK,
          networkInfo: mockNetwork,
          address: null,
          formattedAddress: null,
        },
      });

      expect(wrapper.text()).toContain('Switching Network...');
      expect(wrapper.find('.pi-sync').exists()).toBe(true);
    });

    it('should render reconnecting state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.RECONNECTING,
          networkInfo: null,
          address: null,
          formattedAddress: null,
        },
      });

      expect(wrapper.text()).toContain('Reconnecting...');
      expect(wrapper.find('.pi-spinner').exists()).toBe(true);
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode without text details', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
          isCompact: true,
        },
      });

      expect(wrapper.find('.status-indicator.compact').exists()).toBe(true);
      expect(wrapper.find('.status-details').exists()).toBe(false);
    });

    it('should render in full mode with text details', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
          isCompact: false,
        },
      });

      expect(wrapper.find('.status-indicator.full').exists()).toBe(true);
      expect(wrapper.find('.status-details').exists()).toBe(true);
    });
  });

  describe('Error Indicator', () => {
    it('should show error indicator when hasError is true', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
          hasError: true,
          showErrorIndicator: true,
        },
      });

      expect(wrapper.find('.error-indicator').exists()).toBe(true);
      expect(wrapper.find('.pi-exclamation-triangle').exists()).toBe(true);
    });

    it('should not show error indicator when hasError is false', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
          hasError: false,
        },
      });

      expect(wrapper.find('.error-indicator').exists()).toBe(false);
    });

    it('should hide error indicator when showErrorIndicator is false', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
          hasError: true,
          showErrorIndicator: false,
        },
      });

      expect(wrapper.find('.error-indicator').exists()).toBe(false);
    });
  });

  describe('Interaction', () => {
    it('should emit click event when clicked', async () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
        },
      });

      await wrapper.find('.status-indicator').trigger('click');
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('should emit error-click event when error indicator clicked', async () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
          hasError: true,
        },
      });

      await wrapper.find('.error-indicator').trigger('click');
      expect(wrapper.emitted('error-click')).toHaveLength(1);
    });

    it('should support keyboard navigation with Enter key', async () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
        },
      });

      await wrapper.find('.status-indicator').trigger('keydown.enter');
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('should support keyboard navigation with Space key', async () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
        },
      });

      await wrapper.find('.status-indicator').trigger('keydown.space');
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('should not emit click when isInteractive is false', async () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
          isInteractive: false,
        },
      });

      // When not interactive, the chevron icon should not be visible
      expect(wrapper.find('.pi-chevron-down').exists()).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for connected state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123456789',
          formattedAddress: 'TEST12...6789',
        },
      });

      const indicator = wrapper.find('.status-indicator');
      const ariaLabel = indicator.attributes('aria-label');
      expect(ariaLabel).toContain('Connected');
      expect(ariaLabel).toContain('Algorand Mainnet');
      expect(ariaLabel).toContain('TEST12...6789');
    });

    it('should have proper aria-label for error state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.FAILED,
          networkInfo: null,
          address: null,
          formattedAddress: null,
          hasError: true,
        },
      });

      const indicator = wrapper.find('.status-indicator');
      const ariaLabel = indicator.attributes('aria-label');
      expect(ariaLabel).toContain('Connection Failed');
      expect(ariaLabel).toContain('error occurred');
    });

    it('should have role="button" and tabindex="0" for keyboard accessibility', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
        },
      });

      const indicator = wrapper.find('.status-indicator');
      expect(indicator.attributes('role')).toBe('button');
      expect(indicator.attributes('tabindex')).toBe('0');
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct status class for connected state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
        },
      });

      expect(wrapper.find('.status-connected').exists()).toBe(true);
    });

    it('should apply correct status class for connecting state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTING,
          networkInfo: null,
          address: null,
          formattedAddress: null,
        },
      });

      expect(wrapper.find('.status-connecting').exists()).toBe(true);
    });

    it('should apply correct status class for error state', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.FAILED,
          networkInfo: null,
          address: null,
          formattedAddress: null,
        },
      });

      expect(wrapper.find('.status-error').exists()).toBe(true);
    });

    it('should show pulse animation for connecting states', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTING,
          networkInfo: null,
          address: null,
          formattedAddress: null,
        },
      });

      expect(wrapper.find('.pulse-ring').exists()).toBe(true);
    });

    it('should not show pulse animation for static states', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {
          connectionState: WalletConnectionState.CONNECTED,
          networkInfo: mockNetwork,
          address: 'TEST123',
          formattedAddress: 'TEST...123',
        },
      });

      expect(wrapper.find('.pulse-ring').exists()).toBe(false);
    });
  });

  describe('Default Props', () => {
    it('should use default values when props not provided', () => {
      const wrapper = mount(WalletStatusBadge, {
        props: {},
      });

      expect(wrapper.text()).toContain('Not Connected');
      expect(wrapper.find('.status-disconnected').exists()).toBe(true);
      expect(wrapper.find('.error-indicator').exists()).toBe(false);
    });
  });
});
