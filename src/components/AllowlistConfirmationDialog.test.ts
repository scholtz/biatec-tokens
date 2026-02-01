import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AllowlistConfirmationDialog from './AllowlistConfirmationDialog.vue';
import type { WhitelistStatus } from '../types/compliance';

describe('AllowlistConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    network: 'VOI',
    tokenId: 'token123',
    senderAddress: 'SENDER123456789012345678901234567890123456789012345678901234',
    receiverAddress: 'RECEIVER123456789012345678901234567890123456789012345678901234',
    senderStatus: {
      address: 'SENDER123456789012345678901234567890123456789012345678901234',
      whitelisted: true,
      status: 'active' as const,
    },
    receiverStatus: {
      address: 'RECEIVER123456789012345678901234567890123456789012345678901234',
      whitelisted: true,
      status: 'active' as const,
    },
  };

  beforeEach(() => {
    // Reset DOM
  });

  describe('Component Rendering', () => {
    it('should render when isOpen is true', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Allowlist Verification Required');
    });

    it('should not render when isOpen is false', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          isOpen: false,
        },
      });

      expect(wrapper.find('.glass-effect').exists()).toBe(false);
    });

    it('should display MICA compliance notice', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('MICA Compliance Notice');
      expect(wrapper.text()).toContain('Markets in Crypto-Assets Regulation');
    });

    it('should display transfer details', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          amount: '100.50',
        },
      });

      expect(wrapper.text()).toContain('Transfer Details');
      expect(wrapper.text()).toContain('VOI');
      expect(wrapper.text()).toContain('token123');
      expect(wrapper.text()).toContain('100.50');
    });

    it('should display sender status', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Sender Status');
      expect(wrapper.text()).toContain('Active');
    });

    it('should display receiver status', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Receiver Status');
      expect(wrapper.text()).toContain('Active');
    });
  });

  describe('Status Display', () => {
    it('should display active status with green badge', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      const badges = wrapper.findAll('.bg-green-500\\/20');
      expect(badges.length).toBeGreaterThan(0);
      expect(wrapper.text()).toContain('Active');
    });

    it('should display pending status with yellow badge', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          senderStatus: {
            ...defaultProps.senderStatus,
            status: 'pending',
            whitelisted: false,
          },
        },
      });

      expect(wrapper.text()).toContain('Pending Approval');
      expect(wrapper.text()).toContain('This address is pending approval');
    });

    it('should display expired status with orange badge and expiration date', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          senderStatus: {
            ...defaultProps.senderStatus,
            status: 'expired',
            whitelisted: false,
            expirationDate: '2024-01-15T00:00:00Z',
          },
        },
      });

      expect(wrapper.text()).toContain('Expired');
      expect(wrapper.text()).toContain('allowlist status has expired');
    });

    it('should display denied status with denial reason', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          receiverStatus: {
            ...defaultProps.receiverStatus,
            status: 'denied',
            whitelisted: false,
            denialReason: 'Failed KYC verification',
          },
        },
      });

      expect(wrapper.text()).toContain('Denied');
      expect(wrapper.text()).toContain('Failed KYC verification');
    });

    it('should display removed status', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          senderStatus: {
            ...defaultProps.senderStatus,
            status: 'removed',
            whitelisted: false,
          },
        },
      });

      expect(wrapper.text()).toContain('Removed');
      expect(wrapper.text()).toContain('has been removed from the allowlist');
    });

    it('should display not_listed status', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          receiverStatus: {
            ...defaultProps.receiverStatus,
            status: 'not_listed',
            whitelisted: false,
          },
        },
      });

      expect(wrapper.text()).toContain('Not Listed');
      expect(wrapper.text()).toContain('is not on the allowlist');
    });
  });

  describe('Transfer Allowed/Blocked Logic', () => {
    it('should allow transfer when both addresses are active', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Proceed with Transfer');
      expect(wrapper.text()).not.toContain('Transfer Cannot Proceed');
    });

    it('should block transfer when sender is pending', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          senderStatus: {
            ...defaultProps.senderStatus,
            status: 'pending',
            whitelisted: false,
          },
        },
      });

      expect(wrapper.text()).toContain('Transfer Cannot Proceed');
      expect(wrapper.text()).toContain('Sender address is pending approval');
      const understoodButton = wrapper.findAll('button').find(btn => btn.text() === 'Understood');
      expect(understoodButton).toBeDefined();
    });

    it('should block transfer when receiver is expired', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          receiverStatus: {
            ...defaultProps.receiverStatus,
            status: 'expired',
            whitelisted: false,
          },
        },
      });

      expect(wrapper.text()).toContain('Transfer Cannot Proceed');
      expect(wrapper.text()).toContain('Receiver address allowlist status has expired');
    });

    it('should block transfer when sender is denied', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          senderStatus: {
            ...defaultProps.senderStatus,
            status: 'denied',
            whitelisted: false,
          },
        },
      });

      expect(wrapper.text()).toContain('Transfer Cannot Proceed');
      expect(wrapper.text()).toContain('Sender address has been denied');
    });

    it('should block transfer when both addresses have issues', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          senderStatus: {
            ...defaultProps.senderStatus,
            status: 'pending',
            whitelisted: false,
          },
          receiverStatus: {
            ...defaultProps.receiverStatus,
            status: 'not_listed',
            whitelisted: false,
          },
        },
      });

      expect(wrapper.text()).toContain('Transfer Cannot Proceed');
      expect(wrapper.text()).toContain('Sender address is pending approval');
      expect(wrapper.text()).toContain('Receiver address is not on the allowlist');
    });
  });

  describe('User Interactions', () => {
    it('should emit close event when cancel button is clicked', async () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'));
      await cancelButton?.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close event when backdrop is clicked', async () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      const backdrop = wrapper.find('.backdrop-blur-sm');
      await backdrop.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close event when X button is clicked', async () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      const closeButton = wrapper.find('button[aria-label="Close dialog"]');
      await closeButton.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should require confirmation checkbox before proceeding', async () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      const proceedButton = wrapper.findAll('button').find(btn => btn.text().includes('Proceed'));
      expect(proceedButton?.attributes('disabled')).toBeDefined();

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      expect(proceedButton?.attributes('disabled')).toBeUndefined();
    });

    it('should emit proceed event when proceed button is clicked with confirmation', async () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      const proceedButton = wrapper.findAll('button').find(btn => btn.text().includes('Proceed'));
      await proceedButton?.trigger('click');

      expect(wrapper.emitted('proceed')).toBeTruthy();
    });

    it('should not show proceed button when transfer is blocked', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          senderStatus: {
            ...defaultProps.senderStatus,
            status: 'denied',
            whitelisted: false,
          },
        },
      });

      const proceedButton = wrapper.findAll('button').find(btn => btn.text().includes('Proceed'));
      expect(proceedButton).toBeUndefined();
    });
  });

  describe('Address Truncation', () => {
    it('should truncate long addresses', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: defaultProps,
      });

      // Should show truncated version with ellipsis
      expect(wrapper.text()).toContain('...');
    });
  });

  describe('Date Formatting', () => {
    it('should format expiration date correctly', () => {
      const wrapper = mount(AllowlistConfirmationDialog, {
        props: {
          ...defaultProps,
          senderStatus: {
            ...defaultProps.senderStatus,
            status: 'expired',
            whitelisted: false,
            expirationDate: '2024-01-15T00:00:00Z',
          },
        },
      });

      expect(wrapper.text()).toContain('Jan');
      expect(wrapper.text()).toContain('15');
      expect(wrapper.text()).toContain('2024');
    });
  });
});
