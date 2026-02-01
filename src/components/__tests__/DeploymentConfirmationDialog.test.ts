import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DeploymentConfirmationDialog from '../DeploymentConfirmationDialog.vue';

describe('DeploymentConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    tokenName: 'Test Token',
    tokenSymbol: 'TEST',
    standard: 'ARC200',
    tokenType: 'FT' as const,
    supply: 1000000,
    decimals: 6,
    networkDisplayName: 'VOI Mainnet',
    networkGenesisId: 'voimain-v1.0',
    isTestnet: false,
    fees: {
      creation: '1.0 VOI',
      transaction: '0.001 VOI',
      description: 'Network fees',
    },
    attestationsCount: 2,
    hasComplianceMetadata: true,
    isDeploying: false,
  };

  it('renders the dialog when isOpen is true', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Review Deployment');
  });

  it('displays token details correctly', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Test Token');
    expect(wrapper.text()).toContain('TEST');
    expect(wrapper.text()).toContain('ARC200');
    expect(wrapper.text()).toContain('FT');
    expect(wrapper.text()).toContain('1,000,000'); // Formatted supply
  });

  it('displays network information correctly', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('VOI Mainnet');
    expect(wrapper.text()).toContain('voimain-v1.0');
    expect(wrapper.text()).toContain('Mainnet');
  });

  it('displays testnet badge for testnet networks', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: {
        ...defaultProps,
        isTestnet: true,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Testnet');
  });

  it('calculates total fee correctly', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    // 1.0 + 0.001 = 1.001 VOI
    expect(wrapper.text()).toContain('1.0010 VOI');
  });

  it('shows compliance status when attestations are present', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('MICA Compliance Status');
    expect(wrapper.text()).toContain('2 attestation(s) included');
  });

  it('hides compliance section when no attestations or metadata', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: {
        ...defaultProps,
        attestationsCount: 0,
        hasComplianceMetadata: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).not.toContain('MICA Compliance Status');
  });

  it('requires all checklist items to be checked before confirming', async () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    const confirmButton = wrapper.findAll('button').find(btn => btn.text().includes('Confirm'));
    expect(confirmButton?.element.disabled).toBe(true);

    // Check all boxes
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[0].setValue(true);
    await checkboxes[1].setValue(true);
    await checkboxes[2].setValue(true);

    expect(confirmButton?.element.disabled).toBe(false);
  });

  it('emits confirm event when confirm button is clicked', async () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    // Check all boxes
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[0].setValue(true);
    await checkboxes[1].setValue(true);
    await checkboxes[2].setValue(true);

    const confirmButton = wrapper.findAll('button').find(btn => btn.text().includes('Confirm'));
    await confirmButton?.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('confirm');
  });

  it('emits close event when cancel button is clicked', async () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'));
    await cancelButton?.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('close');
  });

  it('disables buttons when isDeploying is true', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: {
        ...defaultProps,
        isDeploying: true,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'));
    const confirmButton = wrapper.findAll('button').find(btn => btn.text().includes('Deploying'));
    
    expect(cancelButton?.element.disabled).toBe(true);
    expect(confirmButton?.element.disabled).toBe(true);
  });

  it('shows deploying state in confirm button', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: {
        ...defaultProps,
        isDeploying: true,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Deploying...');
  });

  it('displays important warnings', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Important Reminders');
    expect(wrapper.text()).toContain('Deployment is irreversible once confirmed');
    expect(wrapper.text()).toContain('Your wallet will prompt you to sign the transaction');
  });

  it('shows mainnet warning for mainnet deployments', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: {
        ...defaultProps,
        isTestnet: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain("You're deploying to mainnet - real assets will be used");
  });

  it('hides mainnet warning for testnet deployments', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: {
        ...defaultProps,
        isTestnet: true,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).not.toContain("You're deploying to mainnet - real assets will be used");
  });

  it('displays decimals for FT tokens', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: {
        ...defaultProps,
        tokenType: 'FT' as const,
        decimals: 6,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Decimals');
    expect(wrapper.text()).toContain('6');
  });

  it('hides decimals for NFT tokens', () => {
    const wrapper = mount(DeploymentConfirmationDialog, {
      props: {
        ...defaultProps,
        tokenType: 'NFT' as const,
        decimals: undefined,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    // Decimals should not be displayed
    const text = wrapper.text();
    const hasDecimalsLabel = text.includes('Decimals') && text.split('Decimals')[0].split('\n').pop()?.trim() === '';
    expect(hasDecimalsLabel).toBeFalsy();
  });
});
