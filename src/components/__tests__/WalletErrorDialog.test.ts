import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import WalletErrorDialog from '../WalletErrorDialog.vue';
import Modal from '../ui/Modal.vue';
import { WalletErrorType } from '../../composables/walletState';

// Mock Modal component
vi.mock('../ui/Modal.vue', () => ({
  default: {
    name: 'Modal',
    template: '<div v-if="show"><slot /></div>',
    props: ['show', 'size'],
    emits: ['close'],
  },
}));

describe('WalletErrorDialog', () => {
  const mockError = {
    title: 'Connection Failed',
    message: 'Unable to connect to wallet',
    actions: ['Retry connection', 'Try another wallet', 'Refresh page'],
    troubleshooting: [
      'Ensure wallet extension is installed',
      'Check internet connection',
      'Try refreshing the page',
    ],
    canRetry: true,
    alternativeWallets: [
      {
        id: 'defly',
        name: 'Defly Wallet',
        available: true,
        installUrl: 'https://defly.app',
        logo: '/wallets/defly.svg',
        chainType: 'AVM' as const,
      },
      {
        id: 'exodus',
        name: 'Exodus Wallet',
        available: false,
        installUrl: 'https://exodus.com',
        logo: '/wallets/exodus.svg',
        chainType: 'AVM' as const,
      },
    ],
  };

  describe('Component Rendering', () => {
    it('should render when show is true', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      expect(wrapper.text()).toContain('Connection Failed');
    });

    it('should not render when show is false', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: false,
          error: mockError,
        },
      });

      expect(wrapper.text()).not.toContain('Connection Failed');
    });

    it('should display error title', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      expect(wrapper.text()).toContain(mockError.title);
    });

    it('should display error message', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      expect(wrapper.text()).toContain(mockError.message);
    });

    it('should display diagnostic code if provided', () => {
      const diagnosticCode = 'ERR_WALLET_001';
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
          diagnosticCode,
        },
      });

      expect(wrapper.text()).toContain(diagnosticCode);
    });

    it('should display quick actions', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      mockError.actions.forEach((action) => {
        expect(wrapper.text()).toContain(action);
      });
    });

    it('should display troubleshooting section', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      expect(wrapper.text()).toContain('Troubleshooting Steps');
    });

    it('should display alternative wallets', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      expect(wrapper.text()).toContain('Try Another Wallet');
      expect(wrapper.text()).toContain('Defly Wallet');
      expect(wrapper.text()).toContain('Exodus Wallet');
    });

    it('should show retry button when canRetry is true', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      const retryButton = wrapper.find('button:has(i.pi-refresh)');
      expect(retryButton.exists()).toBe(true);
    });

    it('should not show retry button when canRetry is false', () => {
      const errorWithoutRetry = { ...mockError, canRetry: false };
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: errorWithoutRetry,
        },
      });

      const retryButton = wrapper.find('button:has(i.pi-refresh)');
      expect(retryButton.exists()).toBe(false);
    });
  });

  describe('User Interactions', () => {
    it('should emit close event when close button is clicked', async () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      const closeButton = wrapper.find('[aria-label="Close dialog"]');
      await closeButton.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit retry event when retry button is clicked', async () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      const retryButton = wrapper.find('button:has(i.pi-refresh)');
      await retryButton.trigger('click');

      expect(wrapper.emitted('retry')).toBeTruthy();
    });

    it('should emit select-wallet event when alternative wallet is clicked', async () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      // Find available wallet button (not disabled)
      const walletButtons = wrapper.findAll('button').filter((button) => {
        return button.text().includes('Defly Wallet') && !button.attributes('disabled');
      });

      if (walletButtons.length > 0) {
        await walletButtons[0].trigger('click');
        expect(wrapper.emitted('select-wallet')).toBeTruthy();
        expect(wrapper.emitted('select-wallet')?.[0]).toEqual(['defly']);
      }
    });

    it('should toggle troubleshooting steps when header is clicked', async () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      const troubleshootingButton = wrapper.find('button:has(.pi-question-circle)');
      expect(troubleshootingButton.exists()).toBe(true);

      // Initially hidden - check for absence of troubleshooting step content
      let troubleshootingSteps = wrapper.findAll('.flex.items-start.gap-3.p-3');
      expect(troubleshootingSteps.length).toBe(0);

      // Click to show
      await troubleshootingButton.trigger('click');

      // Should be visible now - check for presence of troubleshooting steps
      troubleshootingSteps = wrapper.findAll('.flex.items-start.gap-3.p-3');
      expect(troubleshootingSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Alternative Wallets Display', () => {
    it('should show available badge for installed wallets', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      expect(wrapper.text()).toContain('Available');
    });

    it('should show install link for non-installed wallets', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      expect(wrapper.text()).toContain('Not installed');
      expect(wrapper.text()).toContain('Install');
    });

    it('should disable button for unavailable wallets', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      const buttons = wrapper.findAll('button');
      const exodusButton = buttons.find((button) => button.text().includes('Exodus Wallet'));

      if (exodusButton) {
        expect(exodusButton.attributes('disabled')).toBeDefined();
      }
    });

    it('should have external link icon for install links', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      const installLinks = wrapper.findAll('a[target="_blank"]');
      expect(installLinks.length).toBeGreaterThan(0);

      installLinks.forEach((link) => {
        const externalIcon = link.find('.pi-external-link');
        expect(externalIcon.exists()).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for close button', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      const closeButton = wrapper.find('[aria-label="Close dialog"]');
      expect(closeButton.exists()).toBe(true);
    });

    it('should have proper rel attribute for external links', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: mockError,
        },
      });

      const externalLinks = wrapper.findAll('a[target="_blank"]');
      externalLinks.forEach((link) => {
        expect(link.attributes('rel')).toContain('noopener');
        expect(link.attributes('rel')).toContain('noreferrer');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error gracefully', () => {
      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: null,
        },
      });

      // Should show default error message
      expect(wrapper.text()).toContain('Connection Error');
    });

    it('should handle error without troubleshooting steps', () => {
      const errorWithoutTroubleshooting = {
        ...mockError,
        troubleshooting: [],
      };

      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: errorWithoutTroubleshooting,
        },
      });

      // Troubleshooting section should not be visible
      const troubleshootingButton = wrapper.find('button:has(.pi-question-circle)');
      expect(troubleshootingButton.exists()).toBe(false);
    });

    it('should handle error without alternative wallets', () => {
      const errorWithoutAlternatives = {
        ...mockError,
        alternativeWallets: [],
      };

      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: errorWithoutAlternatives,
        },
      });

      // Alternative wallets section should not be visible
      expect(wrapper.text()).not.toContain('Try Another Wallet');
    });

    it('should handle error without actions', () => {
      const errorWithoutActions = {
        ...mockError,
        actions: [],
      };

      const wrapper = mount(WalletErrorDialog, {
        props: {
          show: true,
          error: errorWithoutActions,
        },
      });

      // Quick actions section should not be visible
      expect(wrapper.text()).not.toContain('Quick Actions');
    });
  });
});
