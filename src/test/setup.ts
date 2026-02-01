import { beforeEach, vi } from "vitest";

// Mock wallet-related composables globally
vi.mock("../src/composables/useWalletManager", () => ({
  useWalletManager: vi.fn(() => ({
    walletManager: {
      isConnected: false,
      address: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    },
    algodClient: {
      getTransactionParams: vi.fn().mockResolvedValue({}),
    },
  })),
}));

// Mock toast composable
vi.mock("../src/composables/useToast", () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

// Reset mocks before each test
beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear();
});
