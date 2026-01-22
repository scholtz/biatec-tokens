import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WalletConnectModal from '../WalletConnectModal.vue'

// Mock the @txnlab/use-wallet-vue module
vi.mock('@txnlab/use-wallet-vue', () => ({
  useWallet: vi.fn(() => ({
    activeAccount: { value: null },
    activeWallet: { value: null },
    accounts: { value: [] },
    wallets: {
      value: [
        {
          id: 'pera',
          isActive: true,
          connect: vi.fn().mockResolvedValue(undefined),
        },
        {
          id: 'defly',
          isActive: true,
          connect: vi.fn().mockResolvedValue(undefined),
        },
        {
          id: 'kibisis',
          isActive: true,
          connect: vi.fn().mockResolvedValue(undefined),
        },
      ],
    },
  })),
}))

describe('WalletConnectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when isOpen is true', () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    expect(wrapper.find('.glass-effect').exists()).toBe(true)
    expect(wrapper.text()).toContain('Connect Wallet')
  })

  it('should not render when isOpen is false', () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: false,
      },
    })

    expect(wrapper.find('.glass-effect').exists()).toBe(false)
  })

  it('should display available wallets', () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    expect(wrapper.text()).toContain('Pera Wallet')
    expect(wrapper.text()).toContain('Defly Wallet')
    expect(wrapper.text()).toContain('Kibisis')
  })

  it('should show network selector when showNetworkSelector is true', () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
        showNetworkSelector: true,
      },
      attachTo: document.body,
    })

    expect(wrapper.text()).toContain('Select Network')
    expect(wrapper.text()).toContain('VOI Mainnet')
    expect(wrapper.text()).toContain('Aramid Mainnet')
  })

  it('should hide network selector when showNetworkSelector is false', () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
        showNetworkSelector: false,
      },
      attachTo: document.body,
    })

    expect(wrapper.text()).not.toContain('Select Network')
  })

  it('should emit close event when close button is clicked', async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    const closeButton = wrapper.find('button[class*="pi-times"]').element.parentElement as HTMLElement
    await closeButton.click()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should emit close event when clicking outside modal', async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should display wallet descriptions', () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    expect(wrapper.text()).toContain('Mobile and web wallet')
    expect(wrapper.text()).toContain('Feature-rich wallet')
  })

  it('should display Terms of Service information', () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    expect(wrapper.text()).toContain('Terms of Service')
    expect(wrapper.text()).toContain('Privacy Policy')
  })

  it('should allow network selection', async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
        showNetworkSelector: true,
        defaultNetwork: 'voi-mainnet',
      },
      attachTo: document.body,
    })

    const aramidButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Aramid Mainnet')
    )

    expect(aramidButton).toBeDefined()
  })

  it('should display connecting state', async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    // Set connecting state
    await wrapper.vm.$nextTick()
    
    const walletButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Pera Wallet')
    )

    if (walletButton) {
      await walletButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Should show connecting message
      expect(wrapper.text()).toContain('Connecting to wallet')
    }
  })

  it('should display error message when connection fails', async () => {
    const errorMessage = 'User rejected connection'
    
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    // Simulate error by setting component data
    const component = wrapper.vm as any
    component.error = errorMessage

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Connection Failed')
    expect(wrapper.text()).toContain(errorMessage)
  })

  it('should disable wallet buttons while connecting', async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    const component = wrapper.vm as any
    component.isConnecting = true

    await wrapper.vm.$nextTick()

    const walletButtons = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Wallet')
    )

    walletButtons.forEach(button => {
      expect(button.attributes('disabled')).toBeDefined()
    })
  })
})
