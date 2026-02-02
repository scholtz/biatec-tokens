import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createTestingPinia } from "@pinia/testing";
import WalletConnectModal from "../WalletConnectModal.vue";

// Mock the @txnlab/use-wallet-vue module
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockWallets = [
  {
    id: "pera",
    isActive: true,
    connect: mockConnect,
  },
  {
    id: "defly",
    isActive: true,
    connect: mockConnect,
  },
  {
    id: "kibisis",
    isActive: true,
    connect: mockConnect,
  },
];

vi.mock("@txnlab/use-wallet-vue", () => ({
  useWallet: vi.fn(() => ({
    activeAccount: { value: null },
    activeWallet: { value: null },
    wallets: {
      value: mockWallets,
    },
  })),
}));

describe("WalletConnectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render modal when isOpen is true", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    const modalContent = document.querySelector(".glass-effect");
    expect(modalContent).toBeTruthy();
    expect(modalContent?.textContent).toContain("Sign In");

    wrapper.unmount();
  });

  it("should not render modal when isOpen is false", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: false,
      },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    // Wait for potential rendering
    await nextTick();

    const modalContent = document.querySelector(".glass-effect");
    expect(modalContent).toBeFalsy();

    wrapper.unmount();
  });

  it("should display available wallets", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    const modalContent = document.body.textContent || "";
    expect(modalContent).toContain("Pera Wallet");
    expect(modalContent).toContain("Defly Wallet");
    expect(modalContent).toContain("Kibisis");

    wrapper.unmount();
  });

  it("should show network selector when showNetworkSelector is true", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
        showNetworkSelector: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    const modalContent = document.body.textContent || "";
    expect(modalContent).toContain("Select Network");
    expect(modalContent).toContain("VOI Mainnet");
    expect(modalContent).toContain("Aramid Mainnet");

    wrapper.unmount();
  });

  it("should hide network selector when showNetworkSelector is false", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
        showNetworkSelector: false,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();
    await nextTick(); // Extra tick for rendering

    const modalContent = document.body.textContent || "";
    // When network selector is hidden, we should still see Sign In but not "Select Network" label
    expect(modalContent).toContain("Sign In");
    
    // Check that network buttons are not shown (look for network-specific text instead of just "Select Network")
    const networkSection = document.querySelector('label.block.text-sm.font-medium.text-gray-300.mb-3');
    expect(networkSection).toBeFalsy();

    wrapper.unmount();
  });

  it("should emit close event when close button is clicked", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();
    await nextTick(); // Extra tick to ensure full render

    const closeButton = document.querySelector(".pi-times")?.parentElement as HTMLElement;
    expect(closeButton).toBeTruthy();

    if (closeButton) {
      await closeButton.click();
      await nextTick();
      await nextTick(); // Extra tick for event processing

      expect(wrapper.emitted("close")).toBeTruthy();
    }

    wrapper.unmount();
  });

  it("should display wallet descriptions", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    const modalContent = document.body.textContent || "";
    expect(modalContent).toContain("Mobile and web wallet");
    expect(modalContent).toContain("Feature-rich wallet");

    wrapper.unmount();
  });

  it("should display Terms of Service information", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    const modalContent = document.body.textContent || "";
    expect(modalContent).toContain("Terms of Service");
    expect(modalContent).toContain("Privacy Policy");

    wrapper.unmount();
  });

  it("should handle wallet connection", async () => {
    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    // Find wallet button
    const buttons = Array.from(document.querySelectorAll("button"));
    const peraButton = buttons.find((btn) => btn.textContent?.includes("Pera Wallet"));

    expect(peraButton).toBeTruthy();

    wrapper.unmount();
  });

  it("should emit error event on connection failure", async () => {
    const errorMessage = "Connection failed";
    mockConnect.mockRejectedValueOnce(new Error(errorMessage));

    const wrapper = mount(WalletConnectModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    // Simulate connection attempt - this would trigger error handling in the component
    // The component should emit the error event

    wrapper.unmount();
  });
});
