import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import WalletConnectSessionPanel from '../WalletConnectSessionPanel.vue';
import type { WalletConnectSession, WalletConnectSessionStats } from '../../services/WalletConnectService';

describe('WalletConnectSessionPanel', () => {
  const mockSession: WalletConnectSession = {
    topic: 'test-topic-123',
    walletId: 'walletconnect',
    networkId: 'algorand-mainnet',
    address: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQ',
    connectedAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
    lastActivityAt: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000, // 6 days from now
  };

  const mockStats: WalletConnectSessionStats = {
    activeSessions: 1,
    expiredSessions: 0,
    totalSessions: 1,
  };

  describe('Active Session Display', () => {
    it('should display active session information', () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: mockSession,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).toContain('WalletConnect Active');
      expect(wrapper.text()).toContain('Session established');
      expect(wrapper.text()).toContain('Disconnect');
    });

    it('should display network name', () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: mockSession,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).toContain('Algorand Mainnet');
    });

    it('should format address correctly', () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: mockSession,
          stats: mockStats,
          error: null,
        },
      });

      // Should show first 6 and last 4 characters
      expect(wrapper.text()).toMatch(/ABCDEF\.\.\.NOPQ/);
    });

    it('should display session timestamps', () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: mockSession,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).toContain('Connected');
      expect(wrapper.text()).toContain('Last Activity');
      expect(wrapper.text()).toContain('Expires');
    });

    it('should emit disconnect event on button click', async () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: mockSession,
          stats: mockStats,
          error: null,
        },
      });

      const buttons = wrapper.findAll('button');
      const disconnectButton = buttons.find(b => b.text().includes('Disconnect'));
      expect(disconnectButton).toBeDefined();
      await disconnectButton!.trigger('click');

      expect(wrapper.emitted('disconnect')).toBeTruthy();
      expect(wrapper.emitted('disconnect')).toHaveLength(1);
    });
  });

  describe('No Session State', () => {
    it('should display no session message when not connected', () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: false,
          currentSession: null,
          stats: { activeSessions: 0, expiredSessions: 0, totalSessions: 0 },
          error: null,
        },
      });

      expect(wrapper.text()).toContain('No Active Session');
      expect(wrapper.text()).toContain('Connect with WalletConnect');
    });

    it('should emit connect event when connect button clicked', async () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: false,
          currentSession: null,
          stats: { activeSessions: 0, expiredSessions: 0, totalSessions: 0 },
          error: null,
        },
      });

      const buttons = wrapper.findAll('button');
      const connectButton = buttons.find(b => b.text().includes('Connect WalletConnect'));
      expect(connectButton).toBeDefined();
      await connectButton!.trigger('click');

      expect(wrapper.emitted('connect')).toBeTruthy();
      expect(wrapper.emitted('connect')).toHaveLength(1);
    });
  });

  describe('Session Statistics', () => {
    it('should display session statistics when sessions exist', () => {
      const stats: WalletConnectSessionStats = {
        activeSessions: 2,
        expiredSessions: 1,
        totalSessions: 3,
      };

      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: mockSession,
          stats,
          error: null,
        },
      });

      expect(wrapper.text()).toContain('Session Statistics');
      expect(wrapper.text()).toContain('2'); // Active
      expect(wrapper.text()).toContain('1'); // Expired
      expect(wrapper.text()).toContain('3'); // Total
    });

    it('should not display statistics when no sessions exist', () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: false,
          currentSession: null,
          stats: { activeSessions: 0, expiredSessions: 0, totalSessions: 0 },
          error: null,
        },
      });

      expect(wrapper.text()).not.toContain('Session Statistics');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      const errorMessage = 'Connection timeout';
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: false,
          currentSession: null,
          stats: mockStats,
          error: errorMessage,
        },
      });

      expect(wrapper.text()).toContain('Connection Error');
      expect(wrapper.text()).toContain(errorMessage);
    });

    it('should emit clearError event when dismiss clicked', async () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: false,
          currentSession: null,
          stats: mockStats,
          error: 'Test error',
        },
      });

      const buttons = wrapper.findAll('button');
      const dismissButton = buttons.find(b => b.text().includes('Dismiss'));
      expect(dismissButton).toBeDefined();
      await dismissButton!.trigger('click');

      expect(wrapper.emitted('clearError')).toBeTruthy();
      expect(wrapper.emitted('clearError')).toHaveLength(1);
    });

    it('should not display error section when no error', () => {
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: false,
          currentSession: null,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).not.toContain('Connection Error');
    });
  });

  describe('Network Display', () => {
    it('should display correct network name for each network', () => {
      const networks = [
        { id: 'algorand-mainnet', name: 'Algorand Mainnet' },
        { id: 'algorand-testnet', name: 'Algorand Testnet' },
        { id: 'voi-mainnet', name: 'VOI Mainnet' },
        { id: 'aramidmain', name: 'Aramid Mainnet' },
        { id: 'ethereum', name: 'Ethereum' },
        { id: 'arbitrum', name: 'Arbitrum' },
        { id: 'base', name: 'Base' },
        { id: 'sepolia', name: 'Sepolia' },
      ];

      networks.forEach(({ id, name }) => {
        const session = { ...mockSession, networkId: id };
        const wrapper = mount(WalletConnectSessionPanel, {
          props: {
            isConnected: true,
            currentSession: session,
            stats: mockStats,
            error: null,
          },
        });

        expect(wrapper.text()).toContain(name);
      });
    });

    it('should display raw network ID for unknown networks', () => {
      const session = { ...mockSession, networkId: 'unknown-network' };
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: session,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).toContain('unknown-network');
    });
  });

  describe('Time Formatting', () => {
    it('should format recent time as "Just now"', () => {
      const session = {
        ...mockSession,
        lastActivityAt: Date.now(),
      };
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: session,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).toContain('Just now');
    });

    it('should format time in minutes', () => {
      const session = {
        ...mockSession,
        lastActivityAt: Date.now() - 30 * 60 * 1000, // 30 minutes ago
      };
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: session,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).toMatch(/30m ago/);
    });

    it('should format time in hours', () => {
      const session = {
        ...mockSession,
        connectedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      };
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: session,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).toMatch(/2h ago/);
    });

    it('should format time in days', () => {
      const session = {
        ...mockSession,
        connectedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      };
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: session,
          stats: mockStats,
          error: null,
        },
      });

      expect(wrapper.text()).toMatch(/3d ago/);
    });

    it('should format expiry time', () => {
      const session = {
        ...mockSession,
        expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
      };
      const wrapper = mount(WalletConnectSessionPanel, {
        props: {
          isConnected: true,
          currentSession: session,
          stats: mockStats,
          error: null,
        },
      });

      // Match either "in 2d" or "in 1d 23h" (depending on exact milliseconds)
      expect(wrapper.text()).toMatch(/in (1|2)d/);
    });
  });
});
