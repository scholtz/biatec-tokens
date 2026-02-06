/**
 * WalletConnect Enhanced Composable
 * Provides enhanced WalletConnect v2 integration and UX
 * Works with @txnlab/use-wallet-vue and WalletConnectService
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useWalletManager } from './useWalletManager';
import {
  saveWalletConnectSession,
  getWalletConnectSession,
  removeWalletConnectSession,
  updateWalletConnectActivity,
  isWalletConnectSessionValid,
  getCurrentWalletConnectSession,
  setCurrentWalletConnectSession,
  getAllActiveSessions,
  cleanupWalletConnectSessions,
  getWalletConnectStats,
  type WalletConnectSession,
  type WalletConnectSessionStats,
} from '../services/WalletConnectService';
import { telemetryService } from '../services/TelemetryService';

export interface WalletConnectState {
  isConnected: boolean;
  isPairing: boolean;
  isSessionActive: boolean;
  currentSession: WalletConnectSession | null;
  stats: WalletConnectSessionStats;
  qrCodeUri: string | null;
  error: string | null;
}

/**
 * Enhanced WalletConnect composable
 */
export function useWalletConnect() {
  const walletManager = useWalletManager();

  // State
  const state = ref<WalletConnectState>({
    isConnected: false,
    isPairing: false,
    isSessionActive: false,
    currentSession: null,
    stats: {
      activeSessions: 0,
      expiredSessions: 0,
      totalSessions: 0,
    },
    qrCodeUri: null,
    error: null,
  });

  const activityInterval = ref<number | null>(null);

  /**
   * Check if current wallet is WalletConnect
   */
  const isWalletConnect = computed(() => {
    return walletManager.activeWallet?.value === 'walletconnect';
  });

  /**
   * Get active WalletConnect sessions
   */
  const activeSessions = computed(() => {
    return getAllActiveSessions();
  });

  /**
   * Initialize WalletConnect state
   */
  function initialize(): void {
    // Load current session if exists
    const current = getCurrentWalletConnectSession();
    if (current) {
      state.value.currentSession = current;
      state.value.isSessionActive = isWalletConnectSessionValid(current.topic);
      state.value.isConnected = state.value.isSessionActive;
    }

    // Update stats
    updateStats();

    // Clean up expired sessions on init
    cleanupWalletConnectSessions();

    telemetryService.track('walletconnect_initialized', {
      hasSession: current ? true : false,
    });
  }

  /**
   * Update session statistics
   */
  function updateStats(): void {
    state.value.stats = getWalletConnectStats();
  }

  /**
   * Connect with WalletConnect
   */
  async function connect(): Promise<void> {
    try {
      state.value.isPairing = true;
      state.value.error = null;

      telemetryService.track('walletconnect_connect_started');

      // Connect via useWalletManager
      await walletManager.connect('walletconnect');

      // After successful connection, save session
      const activeAddress = walletManager.activeAddress?.value;
      const activeNetwork = walletManager.currentNetwork?.value;

      if (activeAddress && activeNetwork && walletManager.activeWallet?.value) {
        const topic = `wc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        saveWalletConnectSession(
          topic,
          'walletconnect',
          activeNetwork,
          activeAddress
        );

        setCurrentWalletConnectSession(topic);
        state.value.currentSession = getWalletConnectSession(topic);
        state.value.isConnected = true;
        state.value.isSessionActive = true;

        // Start activity tracking
        startActivityTracking();

        updateStats();

        telemetryService.track('walletconnect_connect_success', {
          network: activeNetwork,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      state.value.error = errorMessage;

      telemetryService.track('walletconnect_connect_failed', {
        error: errorMessage,
      });

      throw error;
    } finally {
      state.value.isPairing = false;
    }
  }

  /**
   * Disconnect WalletConnect session
   */
  async function disconnect(): Promise<void> {
    try {
      telemetryService.track('walletconnect_disconnect_started');

      // Disconnect via useWalletManager
      if (walletManager.activeWallet?.value) {
        await walletManager.disconnect();
      }

      // Remove session
      if (state.value.currentSession) {
        removeWalletConnectSession(state.value.currentSession.topic);
      }

      // Clear state
      state.value.currentSession = null;
      state.value.isConnected = false;
      state.value.isSessionActive = false;
      state.value.qrCodeUri = null;
      setCurrentWalletConnectSession(null);

      // Stop activity tracking
      stopActivityTracking();

      updateStats();

      telemetryService.track('walletconnect_disconnect_success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnection failed';
      state.value.error = errorMessage;

      telemetryService.track('walletconnect_disconnect_failed', {
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Attempt to reconnect existing session
   */
  async function reconnect(): Promise<boolean> {
    try {
      const current = getCurrentWalletConnectSession();
      if (!current || !isWalletConnectSessionValid(current.topic)) {
        return false;
      }

      telemetryService.track('walletconnect_reconnect_started');

      // Attempt reconnection via useWalletManager
      await walletManager.connect('walletconnect');
        // Update session activity
        updateWalletConnectActivity(current.topic);
        state.value.currentSession = getWalletConnectSession(current.topic);
        state.value.isConnected = true;
        state.value.isSessionActive = true;

        // Start activity tracking
        startActivityTracking();

        telemetryService.track('walletconnect_reconnect_success');

        return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reconnection failed';
      state.value.error = errorMessage;

      telemetryService.track('walletconnect_reconnect_failed', {
        error: errorMessage,
      });

      return false;
    }
  }

  /**
   * Start tracking session activity
   */
  function startActivityTracking(): void {
    if (activityInterval.value) return;

    // Update activity every 5 minutes
    activityInterval.value = window.setInterval(() => {
      const current = getCurrentWalletConnectSession();
      if (current && isWalletConnectSessionValid(current.topic)) {
        updateWalletConnectActivity(current.topic);
        
        telemetryService.track('walletconnect_activity_heartbeat');
      } else {
        // Session expired, clean up
        stopActivityTracking();
        state.value.isSessionActive = false;
        state.value.isConnected = false;
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop tracking session activity
   */
  function stopActivityTracking(): void {
    if (activityInterval.value) {
      clearInterval(activityInterval.value);
      activityInterval.value = null;
    }
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    state.value.error = null;
  }

  /**
   * Manually trigger session cleanup
   */
  function cleanupSessions(): number {
    const removed = cleanupWalletConnectSessions();
    updateStats();
    return removed;
  }

  // Watch for wallet connection changes
  watch(
    () => walletManager.activeWallet?.value,
    (newWallet, oldWallet) => {
      if (newWallet === 'walletconnect' && oldWallet !== 'walletconnect') {
        // Switched to WalletConnect
        const activeAddress = walletManager.activeAddress?.value;
        const activeNetwork = walletManager.currentNetwork?.value;

        if (activeAddress && activeNetwork) {
          const topic = `wc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          saveWalletConnectSession(
            topic,
            'walletconnect',
            activeNetwork,
            activeAddress
          );

          setCurrentWalletConnectSession(topic);
          state.value.currentSession = getWalletConnectSession(topic);
          state.value.isConnected = true;
          state.value.isSessionActive = true;

          startActivityTracking();
          updateStats();
        }
      } else if (oldWallet === 'walletconnect' && newWallet !== 'walletconnect') {
        // Switched away from WalletConnect
        stopActivityTracking();
      }
    }
  );

  // Initialize on mount
  onMounted(() => {
    initialize();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    stopActivityTracking();
  });

  return {
    state: computed(() => state.value),
    isWalletConnect,
    activeSessions,
    connect,
    disconnect,
    reconnect,
    clearError,
    cleanupSessions,
    updateStats,
  };
}
