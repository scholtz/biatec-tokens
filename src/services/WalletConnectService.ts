/**
 * WalletConnect v2 Enhanced Service
 * Provides WalletConnect-specific session management and utilities
 * Works alongside @txnlab/use-wallet-vue for comprehensive WalletConnect support
 */

import { ref } from 'vue';
import { telemetryService } from './TelemetryService';

export interface WalletConnectSession {
  topic: string;
  pairingTopic?: string;
  walletId: string;
  networkId: string;
  address: string;
  connectedAt: number;
  lastActivityAt: number;
  expiresAt: number;
  metadata?: {
    name?: string;
    description?: string;
    url?: string;
    icons?: string[];
  };
}

export interface WalletConnectSessionStats {
  activeSessions: number;
  expiredSessions: number;
  totalSessions: number;
  oldestSession?: Date;
  newestSession?: Date;
}

const WALLETCONNECT_STORAGE_KEY = 'biatec_walletconnect_sessions';
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Session state
 */
const sessions = ref<Map<string, WalletConnectSession>>(new Map());
const currentSession = ref<WalletConnectSession | null>(null);

/**
 * Load sessions from localStorage
 */
export function loadWalletConnectSessions(): void {
  try {
    const stored = localStorage.getItem(WALLETCONNECT_STORAGE_KEY);
    if (!stored) {
      sessions.value = new Map();
      return;
    }

    const parsed = JSON.parse(stored);
    const now = Date.now();
    const validSessions = new Map<string, WalletConnectSession>();

    // Filter out expired sessions
    for (const [topic, session] of Object.entries(parsed)) {
      const wcSession = session as WalletConnectSession;
      if (wcSession.expiresAt > now) {
        validSessions.set(topic, wcSession);
      } else {
        telemetryService.track('walletconnect_session_expired', {
          walletId: wcSession.walletId,
          duration: now - wcSession.connectedAt,
        });
      }
    }

    sessions.value = validSessions;
    
    // Save cleaned sessions back
    if (validSessions.size !== Object.keys(parsed).length) {
      saveWalletConnectSessions();
    }
  } catch (error) {
    console.error('Failed to load WalletConnect sessions:', error);
    sessions.value = new Map();
  }
}

/**
 * Save sessions to localStorage
 */
export function saveWalletConnectSessions(): void {
  try {
    const sessionObj = Object.fromEntries(sessions.value);
    localStorage.setItem(WALLETCONNECT_STORAGE_KEY, JSON.stringify(sessionObj));
  } catch (error) {
    console.error('Failed to save WalletConnect sessions:', error);
  }
}

/**
 * Create or update a WalletConnect session
 */
export function saveWalletConnectSession(
  topic: string,
  walletId: string,
  networkId: string,
  address: string,
  metadata?: WalletConnectSession['metadata']
): void {
  const now = Date.now();
  const session: WalletConnectSession = {
    topic,
    walletId,
    networkId,
    address,
    connectedAt: sessions.value.get(topic)?.connectedAt || now,
    lastActivityAt: now,
    expiresAt: now + SESSION_EXPIRY_MS,
    metadata,
  };

  sessions.value.set(topic, session);
  currentSession.value = session;
  saveWalletConnectSessions();

  telemetryService.track('walletconnect_session_saved', {
    walletId,
  });
}

/**
 * Get a WalletConnect session by topic
 */
export function getWalletConnectSession(topic: string): WalletConnectSession | null {
  const session = sessions.value.get(topic);
  if (!session) return null;

  // Check if expired
  if (session.expiresAt < Date.now()) {
    removeWalletConnectSession(topic);
    return null;
  }

  // Check if inactive
  if (Date.now() - session.lastActivityAt > ACTIVITY_TIMEOUT_MS) {
    telemetryService.track('walletconnect_session_inactive', {
      walletId: session.walletId,
      inactiveTime: Date.now() - session.lastActivityAt,
    });
  }

  return session;
}

/**
 * Update session activity timestamp
 */
export function updateWalletConnectActivity(topic: string): void {
  const session = sessions.value.get(topic);
  if (!session) return;

  session.lastActivityAt = Date.now();
  sessions.value.set(topic, session);
  saveWalletConnectSessions();
}

/**
 * Remove a WalletConnect session
 */
export function removeWalletConnectSession(topic: string): void {
  const session = sessions.value.get(topic);
  if (session) {
    telemetryService.track('walletconnect_session_removed', {
      walletId: session.walletId,
      duration: Date.now() - session.connectedAt,
    });
  }

  sessions.value.delete(topic);
  if (currentSession.value?.topic === topic) {
    currentSession.value = null;
  }
  saveWalletConnectSessions();
}

/**
 * Clear all WalletConnect sessions
 */
export function clearAllWalletConnectSessions(): void {
  const count = sessions.value.size;
  sessions.value.clear();
  currentSession.value = null;
  localStorage.removeItem(WALLETCONNECT_STORAGE_KEY);

  telemetryService.track('walletconnect_all_sessions_cleared', {
    count,
  });
}

/**
 * Get session statistics
 */
export function getWalletConnectStats(): WalletConnectSessionStats {
  const now = Date.now();
  const allSessions = Array.from(sessions.value.values());
  const active = allSessions.filter(s => s.expiresAt > now && Date.now() - s.lastActivityAt < ACTIVITY_TIMEOUT_MS);
  const expired = allSessions.filter(s => s.expiresAt <= now);
  
  const timestamps = allSessions.map(s => s.connectedAt);
  const oldest = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined;
  const newest = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;

  return {
    activeSessions: active.length,
    expiredSessions: expired.length,
    totalSessions: allSessions.length,
    oldestSession: oldest,
    newestSession: newest,
  };
}

/**
 * Check if a session is valid and active
 */
export function isWalletConnectSessionValid(topic: string): boolean {
  const session = sessions.value.get(topic);
  if (!session) return false;

  const now = Date.now();
  return session.expiresAt > now && now - session.lastActivityAt < ACTIVITY_TIMEOUT_MS;
}

/**
 * Get the current active session
 */
export function getCurrentWalletConnectSession(): WalletConnectSession | null {
  return currentSession.value;
}

/**
 * Set the current active session
 */
export function setCurrentWalletConnectSession(topic: string | null): void {
  if (!topic) {
    currentSession.value = null;
    return;
  }

  const session = getWalletConnectSession(topic);
  if (session) {
    currentSession.value = session;
    updateWalletConnectActivity(topic);
  }
}

/**
 * Get all active sessions
 */
export function getAllActiveSessions(): WalletConnectSession[] {
  const now = Date.now();
  return Array.from(sessions.value.values()).filter(
    s => s.expiresAt > now && now - s.lastActivityAt < ACTIVITY_TIMEOUT_MS
  );
}

/**
 * Clean up expired and inactive sessions
 */
export function cleanupWalletConnectSessions(): number {
  const now = Date.now();
  const toRemove: string[] = [];

  for (const [topic, session] of sessions.value.entries()) {
    if (session.expiresAt <= now || now - session.lastActivityAt > SESSION_EXPIRY_MS) {
      toRemove.push(topic);
    }
  }

  toRemove.forEach(topic => removeWalletConnectSession(topic));
  
  if (toRemove.length > 0) {
    telemetryService.track('walletconnect_sessions_cleaned', {
      count: toRemove.length,
    });
  }

  return toRemove.length;
}

// Initialize on module load
loadWalletConnectSessions();

// Cleanup expired sessions periodically
if (typeof window !== 'undefined') {
  setInterval(cleanupWalletConnectSessions, 5 * 60 * 1000); // Every 5 minutes
}
