import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useEVMWallet } from "../useEVMWallet";

// Mock window.ethereum
const mockEthereum = {
  isMetaMask: true,
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

describe("useEVMWallet", () => {
  beforeEach(() => {
    // Setup mock ethereum provider
    (global as any).window = {
      ethereum: mockEthereum,
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    delete (global as any).window;
  });

  describe("Ethereum Provider Detection", () => {
    it("should detect when ethereum provider is available", () => {
      const { isEthereumAvailable } = useEVMWallet();
      expect(isEthereumAvailable.value).toBe(true);
    });

    it("should detect when ethereum provider is not available", () => {
      delete (global as any).window.ethereum;
      const { isEthereumAvailable } = useEVMWallet();
      expect(isEthereumAvailable.value).toBe(false);
    });
  });

  describe("Wallet Connection", () => {
    it("should connect to MetaMask successfully", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockChainId = "0x1"; // Ethereum mainnet

      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve(mockChainId);
        }
        return Promise.resolve(null);
      });

      const { connect, isConnected, activeAddress, chainId } = useEVMWallet();

      await connect();

      expect(isConnected.value).toBe(true);
      expect(activeAddress.value).toBe(mockAddress);
      expect(chainId.value).toBe(1);
    });

    it("should format address correctly", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockChainId = "0x1";

      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve(mockChainId);
        }
        return Promise.resolve(null);
      });

      const { connect, formattedAddress } = useEVMWallet();

      await connect();

      expect(formattedAddress.value).toBe("0x1234...7890");
    });

    it("should handle connection error when no provider", async () => {
      delete (global as any).window.ethereum;

      const { connect } = useEVMWallet();

      await expect(connect()).rejects.toThrow("No Ethereum wallet detected");
    });

    it("should handle user rejection", async () => {
      mockEthereum.request.mockRejectedValue(new Error("User rejected the request"));

      const { connect } = useEVMWallet();

      await expect(connect()).rejects.toThrow("User rejected the request");
    });
  });

  describe("Network Switching", () => {
    beforeEach(async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockChainId = "0x1";

      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve(mockChainId);
        }
        return Promise.resolve(null);
      });
    });

    it("should switch to existing network", async () => {
      const { connect, switchNetwork, chainId } = useEVMWallet();

      await connect();

      mockEthereum.request.mockImplementation(({ method, params }) => {
        if (method === "wallet_switchEthereumChain") {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await switchNetwork("arbitrum");

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xa4b1" }], // 42161 in hex
      });
    });

    it("should add network if not exists (error 4902)", async () => {
      const { connect, switchNetwork } = useEVMWallet();

      await connect();

      // First call fails with 4902, second call succeeds
      let callCount = 0;
      mockEthereum.request.mockImplementation(({ method }) => {
        callCount++;
        if (method === "wallet_switchEthereumChain" && callCount === 1) {
          const error: any = new Error("Network not found");
          error.code = 4902;
          return Promise.reject(error);
        }
        if (method === "wallet_addEthereumChain") {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await switchNetwork("base");

      expect(mockEthereum.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "wallet_addEthereumChain",
        })
      );
    });

    it("should throw error if network not found", async () => {
      const { connect, switchNetwork } = useEVMWallet();

      await connect();

      await expect(switchNetwork("unknown-network" as any)).rejects.toThrow();
    });

    it("should throw error if wallet not connected", async () => {
      const { switchNetwork } = useEVMWallet();

      await expect(switchNetwork("ethereum")).rejects.toThrow("Wallet not connected");
    });
  });

  describe("Wallet Disconnection", () => {
    it("should disconnect wallet", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockChainId = "0x1";

      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve(mockChainId);
        }
        return Promise.resolve(null);
      });

      const { connect, disconnect, isConnected } = useEVMWallet();

      await connect();
      expect(isConnected.value).toBe(true);

      await disconnect();
      expect(isConnected.value).toBe(false);
    });
  });

  describe("Auto Reconnect", () => {
    it("should reconnect if already connected", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockChainId = "0x1";

      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_accounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve(mockChainId);
        }
        return Promise.resolve(null);
      });

      const { attemptReconnect, isConnected } = useEVMWallet();

      await attemptReconnect();

      expect(isConnected.value).toBe(true);
    });

    it("should not reconnect if not previously connected", async () => {
      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_accounts") {
          return Promise.resolve([]);
        }
        return Promise.resolve(null);
      });

      const { attemptReconnect, isConnected } = useEVMWallet();

      await attemptReconnect();

      expect(isConnected.value).toBe(false);
    });
  });

  describe("Current Network Detection", () => {
    it("should detect Ethereum mainnet", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockChainId = "0x1";

      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve(mockChainId);
        }
        return Promise.resolve(null);
      });

      const { connect, currentNetwork } = useEVMWallet();

      await connect();

      expect(currentNetwork.value?.id).toBe("ethereum");
      expect(currentNetwork.value?.displayName).toBe("Ethereum Mainnet");
    });

    it("should detect Arbitrum", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockChainId = "0xa4b1"; // 42161 in hex

      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve(mockChainId);
        }
        return Promise.resolve(null);
      });

      const { connect, currentNetwork } = useEVMWallet();

      await connect();

      expect(currentNetwork.value?.id).toBe("arbitrum");
      expect(currentNetwork.value?.displayName).toBe("Arbitrum One");
    });

    it("should return null for unknown network", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockChainId = "0x539"; // Unknown chain

      mockEthereum.request.mockImplementation(({ method }) => {
        if (method === "eth_requestAccounts") {
          return Promise.resolve([mockAddress]);
        }
        if (method === "eth_chainId") {
          return Promise.resolve(mockChainId);
        }
        return Promise.resolve(null);
      });

      const { connect, currentNetwork } = useEVMWallet();

      await connect();

      expect(currentNetwork.value).toBeNull();
    });
  });
});
