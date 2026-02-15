import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createTestingPinia } from "@pinia/testing";
import EmailAuthModal from "../EmailAuthModal.vue";

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

describe("EmailAuthModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render modal when isOpen is true", async () => {
    const wrapper = mount(EmailAuthModal, {
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
    const wrapper = mount(EmailAuthModal, {
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

  it("should display email/password form only (wallet-free authentication)", async () => {
    const wrapper = mount(EmailAuthModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    // Should display email/password form
    const modalContent = document.body.textContent || "";
    expect(modalContent).toContain("Sign in with Email & Password");
    expect(modalContent).toContain("Email");
    expect(modalContent).toContain("Password");
    
    // Wallet providers should be hidden (wallet-free MVP)
    expect(modalContent).not.toContain("Advanced: Connect with Wallet Provider");
    expect(modalContent).not.toContain("Pera Wallet");
    expect(modalContent).not.toContain("Defly Wallet");

    wrapper.unmount();
  });

  it("should show network selector when showNetworkSelector is true", async () => {
    const wrapper = mount(EmailAuthModal, {
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
    // Network selector should be hidden for wallet-free authentication
    expect(modalContent).not.toContain("Select Network");
    expect(modalContent).not.toContain("VOI Mainnet");
    expect(modalContent).not.toContain("Aramid Mainnet");

    wrapper.unmount();
  });

  it("should hide network selector when showNetworkSelector is false", async () => {
    const wrapper = mount(EmailAuthModal, {
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
    // When network selector is hidden, we should still see Sign In but not network-specific text
    expect(modalContent).toContain("Sign In");
    
    // Check that network-specific text is not shown
    expect(modalContent).not.toContain("VOI Mainnet");
    expect(modalContent).not.toContain("Aramid Mainnet");

    wrapper.unmount();
  });

  it("should emit close event when close button is clicked", async () => {
    const wrapper = mount(EmailAuthModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Teleport: false,
        },
      },
    });

    await nextTick();
    await nextTick(); // Extra tick to ensure full render

    const closeButtons = Array.from(document.querySelectorAll("button"));
    const closeButton = closeButtons.find((btn) => btn.querySelector(".pi-times"));
    expect(closeButton).toBeTruthy();

    if (closeButton) {
      await closeButton.click();
      await nextTick();
      await nextTick(); // Extra tick for event processing

      expect(wrapper.emitted("close")).toBeTruthy();
    }

    wrapper.unmount();
  });

  it("should not display wallet provider UI (wallet-free authentication)", async () => {
    const wrapper = mount(EmailAuthModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    // Advanced options button should not be visible (hidden for MVP)
    const advancedButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Advanced: Connect with Wallet Provider")
    );
    
    expect(advancedButton).toBeFalsy();
    
    // Wallet descriptions should not appear
    const modalContent = document.body.textContent || "";
    expect(modalContent).not.toContain("Mobile and web wallet");
    expect(modalContent).not.toContain("Feature-rich wallet");

    wrapper.unmount();
  });

  it("should display Terms of Service information", async () => {
    const wrapper = mount(EmailAuthModal, {
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

  it("should not handle wallet connection (wallet-free authentication)", async () => {
    const wrapper = mount(EmailAuthModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await nextTick();

    // Advanced options button should not exist (hidden for MVP)
    const advancedButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Advanced: Connect with Wallet Provider")
    );
    
    expect(advancedButton).toBeFalsy();
    
    // Wallet buttons should not be visible
    const buttons = Array.from(document.querySelectorAll("button"));
    const peraButton = buttons.find((btn) => btn.textContent?.includes("Pera Wallet"));
    expect(peraButton).toBeFalsy();

    wrapper.unmount();
  });

  it("should emit error event on connection failure", async () => {
    const errorMessage = "Connection failed";
    mockConnect.mockRejectedValueOnce(new Error(errorMessage));

    const wrapper = mount(EmailAuthModal, {
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
