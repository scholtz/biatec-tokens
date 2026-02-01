import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DeploymentProgressDialog from '../DeploymentProgressDialog.vue';

describe('DeploymentProgressDialog', () => {
  const defaultProps = {
    isOpen: true,
    currentStep: 'preparing' as const,
    status: 'processing' as const,
    errorMessage: undefined,
    errorType: undefined,
    transactionId: undefined,
    canCancel: false,
  };

  it('renders the dialog when isOpen is true', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Deploying Token');
  });

  it('displays all deployment steps', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Preparing Transaction');
    expect(wrapper.text()).toContain('Waiting for Wallet Signature');
    expect(wrapper.text()).toContain('Submitting to Network');
    expect(wrapper.text()).toContain('Confirming Transaction');
  });

  it('shows active step with spinner', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        currentStep: 'signing',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    // Find the signing step and check for spinner
    const html = wrapper.html();
    expect(html).toContain('pi-spinner');
  });

  it('shows completed steps with check icon', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        currentStep: 'confirming',
        status: 'processing',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    // Previous steps should show check marks
    const html = wrapper.html();
    expect(html).toContain('pi-check');
  });

  it('displays success state when deployment succeeds', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'success',
        transactionId: 'TX-12345',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Deployment Complete');
    expect(wrapper.text()).toContain('Token Deployed Successfully!');
    expect(wrapper.text()).toContain('TX-12345');
  });

  it('displays error state when deployment fails', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'error',
        errorMessage: 'Insufficient funds',
        errorType: 'insufficient_funds',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Deployment Failed');
    expect(wrapper.text()).toContain('Insufficient funds');
  });

  it('shows specific troubleshooting for insufficient funds error', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'error',
        errorMessage: 'Insufficient funds',
        errorType: 'insufficient_funds',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Ensure you have sufficient funds to cover transaction fees');
  });

  it('shows specific troubleshooting for wallet rejected error', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'error',
        errorMessage: 'User rejected transaction',
        errorType: 'wallet_rejected',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('The transaction was rejected in your wallet');
  });

  it('shows specific troubleshooting for network error', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'error',
        errorMessage: 'Network connection failed',
        errorType: 'network_error',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Network connection issue');
  });

  it('shows retry button on error', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'error',
        errorMessage: 'Something went wrong',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    const retryButton = wrapper.findAll('button').find(btn => btn.text().includes('Retry'));
    expect(retryButton).toBeTruthy();
  });

  it('emits retry event when retry button is clicked', async () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'error',
        errorMessage: 'Something went wrong',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    const retryButton = wrapper.findAll('button').find(btn => btn.text().includes('Retry'));
    await retryButton?.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('retry');
  });

  it('emits close event when close/done button is clicked', async () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'success',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    const doneButton = wrapper.findAll('button').find(btn => btn.text().includes('Done'));
    await doneButton?.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('close');
  });

  it('shows cancel button when canCancel is true', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'processing',
        canCancel: true,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'));
    expect(cancelButton).toBeTruthy();
  });

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'processing',
        canCancel: true,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'));
    await cancelButton?.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('cancel');
  });

  it('shows processing message based on current step', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        currentStep: 'signing',
        status: 'processing',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Waiting for wallet signature...');
  });

  it('displays transaction ID with copy button on success', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'success',
        transactionId: 'TX-ABCDEF123456',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Transaction ID:');
    expect(wrapper.text()).toContain('TX-ABCDEF123456');
    expect(wrapper.html()).toContain('pi-copy');
  });

  it('shows correct header title based on status', () => {
    const processingWrapper = mount(DeploymentProgressDialog, {
      props: { ...defaultProps, status: 'processing' },
      global: { stubs: { Teleport: true } },
    });
    expect(processingWrapper.text()).toContain('Deploying Token');

    const successWrapper = mount(DeploymentProgressDialog, {
      props: { ...defaultProps, status: 'success' },
      global: { stubs: { Teleport: true } },
    });
    expect(successWrapper.text()).toContain('Deployment Complete');

    const errorWrapper = mount(DeploymentProgressDialog, {
      props: { ...defaultProps, status: 'error' },
      global: { stubs: { Teleport: true } },
    });
    expect(errorWrapper.text()).toContain('Deployment Failed');
  });

  it('shows wallet signature prompt during signing step', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        currentStep: 'signing',
        status: 'processing',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Please approve the transaction in your wallet');
    expect(wrapper.text()).toContain('Check your wallet app for the signature request');
  });

  it('shows all steps as complete in success state', () => {
    const wrapper = mount(DeploymentProgressDialog, {
      props: {
        ...defaultProps,
        status: 'success',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });

    // All steps should have check icons
    const html = wrapper.html();
    const checkCount = (html.match(/pi-check/g) || []).length;
    expect(checkCount).toBeGreaterThanOrEqual(4); // At least 4 check icons for steps
  });
});
