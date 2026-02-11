import { beforeEach, vi } from "vitest";

// Mock wallet-related composables globally
vi.mock("../src/composables/useWalletManager", () => ({
  useWalletManager: vi.fn(() => ({
    walletState: {
      isConnected: false,
      activeAddress: null,
      activeWallet: null,
      accounts: [],
      isConnecting: false,
      error: null,
      connectionState: "disconnected",
      lastError: null,
      balanceLastUpdated: null,
    },
    isConnected: false,
    activeAddress: null,
    activeWallet: null,
    accounts: [],
    formattedAddress: "",
    isReconnecting: false,
    currentNetwork: "voi-mainnet",
    networkInfo: {
      id: "voi-mainnet",
      name: "voi-mainnet",
      displayName: "VOI Mainnet",
      isTestnet: false,
      chainType: "AVM",
      algodUrl: "https://mainnet-api.voi.network",
      genesisId: "voi-mainnet-v1.0",
    },
    availableNetworks: [],
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchNetwork: vi.fn(),
    setActiveAccount: vi.fn(),
    updateWalletState: vi.fn(),
    attemptReconnect: vi.fn(),
    retryConnection: vi.fn(),
    walletManager: {
      isConnected: false,
      address: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    },
    getTroubleshootingSteps: vi.fn(),
  })),
}));

// Mock toast composable
vi.mock("../src/composables/useToast", () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

// Stub router-link component
vi.mock("vue-router", () => {
  const currentRoute = { value: { params: {}, query: {}, path: "/", name: "home" } };

  const createRouterMock = () => ({
    push: vi.fn((pathOrObject: string | { path?: string; query?: Record<string, any> }) => {
      let routePath = "/";
      let query: Record<string, string> = {};

      if (typeof pathOrObject === "string") {
        // Parse string path like '/compliance/token123?network=VOI'
        const [pathPart, queryString] = pathOrObject.split("?");
        routePath = pathPart;

        if (queryString) {
          queryString.split("&").forEach((pair) => {
            const [key, value] = pair.split("=");
            if (key && value) {
              query[key] = decodeURIComponent(value);
            }
          });
        }
      } else if (typeof pathOrObject === "object") {
        // Handle route object like { path: '/compliance/token123', query: { network: 'VOI' } }
        routePath = pathOrObject.path || "/";
        query = pathOrObject.query || {};
      }

      // Parse route params from path
      const params: Record<string, string> = {};
      const pathParts = routePath.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        if (pathParts[0] === "compliance" || pathParts[0] === "token" || pathParts[0] === "tokens") {
          params.id = pathParts[1];
        }
      }

      // Update currentRoute
      currentRoute.value = {
        params,
        query,
        path: routePath,
        name: pathParts[0] || "home",
      };

      return Promise.resolve();
    }),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    isReady: vi.fn().mockResolvedValue(true),
    currentRoute,
  });

  return {
    RouterLink: {
      name: "RouterLink",
      props: ["to"],
      template: '<a :href="to"><slot /></a>',
    },
    createRouter: vi.fn(createRouterMock),
    createWebHistory: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    })),
    createMemoryHistory: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    })),
    useRouter: vi.fn(createRouterMock),
    useRoute: vi.fn(() => currentRoute.value),
  };
});

// Reset mocks before each test
beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear();
});
