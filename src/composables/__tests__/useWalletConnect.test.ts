import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useWalletConnect } from '../useWalletConnect';
import { ref } from 'vue';

// Mock modules
vi.mock('./useWalletManager', () => ({
  useWalletManager: () => ({
    activeWallet: ref(null),
    activeAddress: ref(null),
    currentNetwork: ref(null),
    walletManager: {
      wallets: ref([]),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock('../services/WalletConnectService', () => ({
  saveWalletConnectSession: vi.fn(),
  getWalletConnectSession: vi.fn(),
  removeWalletConnectSession: vi.fn(),
  updateWalletConnectActivity: vi.fn(),
  isWalletConnectSessionValid: vi.fn(() => true),
  getCurrentWalletConnectSession: vi.fn(() => null),
  setCurrentWalletConnectSession: vi.fn(),
  getAllActiveSessions: vi.fn(() => []),
  cleanupWalletConnectSessions: vi.fn(() => 0),
  getWalletConnectStats: vi.fn(() => ({
    activeSessions: 0,
    expiredSessions: 0,
    totalSessions: 0,
  })),
}));

vi.mock('../services/TelemetryService', () => ({
  telemetryService: {
    track: vi.fn(),
  },
}));

describe('useWalletConnect', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { state } = useWalletConnect();

      expect(state.value.isConnected).toBe(false);
      expect(state.value.isPairing).toBe(false);
      expect(state.value.isSessionActive).toBe(false);
      expect(state.value.currentSession).toBeNull();
      expect(state.value.qrCodeUri).toBeNull();
      expect(state.value.error).toBeNull();
    });

    it('should initialize stats', () => {
      const { state } = useWalletConnect();

      expect(state.value.stats).toBeDefined();
      expect(state.value.stats.activeSessions).toBe(0);
      expect(state.value.stats.expiredSessions).toBe(0);
      expect(state.value.stats.totalSessions).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should provide reactive state', () => {
      const { state } = useWalletConnect();

      expect(state.value).toBeDefined();
      expect(typeof state.value).toBe('object');
    });

    it('should compute isWalletConnect correctly', () => {
      const { isWalletConnect } = useWalletConnect();

      expect(isWalletConnect.value).toBe(false);
    });

    it('should provide active sessions', () => {
      const { activeSessions } = useWalletConnect();

      expect(Array.isArray(activeSessions.value)).toBe(true);
      expect(activeSessions.value).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should clear error state', () => {
      const { state, clearError } = useWalletConnect();

      // Set an error
      state.value.error = 'Test error';

      clearError();

      expect(state.value.error).toBeNull();
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up sessions', () => {
      const { cleanupSessions } = useWalletConnect();

      const removed = cleanupSessions();

      expect(typeof removed).toBe('number');
    });
  });

  describe('Stats Update', () => {
    it('should update stats manually', () => {
      const { updateStats, state } = useWalletConnect();

      updateStats();

      expect(state.value.stats).toBeDefined();
    });
  });
});
