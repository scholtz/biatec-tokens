/**
 * Wallet Session Management Service
 * Handles persistent session storage with expiry and secure recovery
 */

import type { NetworkId } from "../composables/useWalletManager";

export interface WalletSession {
  walletId: string;
  networkId: NetworkId;
  address: string;
  connectedAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

export interface DiagnosticData {
  timestamp: number;
  walletState: string;
  network: NetworkId;
  address: string | null;
  walletId: string | null;
  lastError: {
    type: string;
    message: string;
    diagnosticCode?: string;
    timestamp: string;
  } | null;
  browserInfo: {
    userAgent: string;
    language: string;
    online: boolean;
  };
  connectionHistory: {
    timestamp: number;
    event: string;
    details?: string;
  }[];
}

const SESSION_KEY = "biatec_wallet_session";
const HISTORY_KEY = "biatec_connection_history";
const MAX_HISTORY_ITEMS = 20;
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Save wallet session with expiry
 */
export function saveWalletSession(
  walletId: string,
  networkId: NetworkId,
  address: string,
  durationMs: number = DEFAULT_SESSION_DURATION_MS
): void {
  const now = Date.now();
  const session: WalletSession = {
    walletId,
    networkId,
    address,
    connectedAt: now,
    lastActivityAt: now,
    expiresAt: now + durationMs,
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    logConnectionEvent("session_saved", `Wallet: ${walletId}, Network: ${networkId}`);
  } catch (error) {
    console.error("Failed to save wallet session:", error);
  }
}

/**
 * Load wallet session if valid
 */
export function loadWalletSession(): WalletSession | null {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr) as WalletSession;
    const now = Date.now();

    // Check if session expired
    if (session.expiresAt < now) {
      clearWalletSession();
      logConnectionEvent("session_expired", `Expired at ${new Date(session.expiresAt).toISOString()}`);
      return null;
    }

    // Update last activity
    session.lastActivityAt = now;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session;
  } catch (error) {
    console.error("Failed to load wallet session:", error);
    return null;
  }
}

/**
 * Clear wallet session
 */
export function clearWalletSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    logConnectionEvent("session_cleared", "Session removed from storage");
  } catch (error) {
    console.error("Failed to clear wallet session:", error);
  }
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  const session = loadWalletSession();
  return session !== null;
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(): void {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr) as WalletSession;
    session.lastActivityAt = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to update session activity:", error);
  }
}

/**
 * Log connection event to history
 */
export function logConnectionEvent(event: string, details?: string): void {
  try {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    const history: { timestamp: number; event: string; details?: string }[] = historyStr ? JSON.parse(historyStr) : [];

    history.unshift({
      timestamp: Date.now(),
      event,
      details,
    });

    // Keep only recent history
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Failed to log connection event:", error);
  }
}

/**
 * Get connection history
 */
export function getConnectionHistory(): { timestamp: number; event: string; details?: string }[] {
  try {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
  } catch (error) {
    console.error("Failed to get connection history:", error);
    return [];
  }
}

/**
 * Collect diagnostic data for support
 */
export function collectDiagnosticData(walletState: any): DiagnosticData {
  return {
    timestamp: Date.now(),
    walletState: walletState.connectionState,
    network: walletState.currentNetwork || "unknown",
    address: walletState.activeAddress,
    walletId: walletState.activeWallet,
    lastError: walletState.lastError
      ? {
          type: walletState.lastError.type,
          message: walletState.lastError.message,
          diagnosticCode: walletState.lastError.diagnosticCode,
          timestamp: walletState.lastError.timestamp.toISOString(),
        }
      : null,
    browserInfo: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
    },
    connectionHistory: getConnectionHistory(),
  };
}

/**
 * Format diagnostic data for copying
 */
export function formatDiagnosticData(data: DiagnosticData): string {
  const lines = [
    "=== Wallet Diagnostic Report ===",
    `Timestamp: ${new Date(data.timestamp).toISOString()}`,
    `State: ${data.walletState}`,
    `Network: ${data.network}`,
    `Address: ${data.address || "N/A"}`,
    `Wallet: ${data.walletId || "N/A"}`,
    "",
    "Last Error:",
    data.lastError ? `  Type: ${data.lastError.type}` : "  None",
    data.lastError ? `  Message: ${data.lastError.message}` : "",
    data.lastError ? `  Code: ${data.lastError.diagnosticCode}` : "",
    data.lastError ? `  Time: ${data.lastError.timestamp}` : "",
    "",
    "Browser:",
    `  User Agent: ${data.browserInfo.userAgent}`,
    `  Language: ${data.browserInfo.language}`,
    `  Online: ${data.browserInfo.online}`,
    "",
    "Recent Connection History:",
    ...data.connectionHistory.slice(0, 10).map((item) => `  ${new Date(item.timestamp).toISOString()} - ${item.event}${item.details ? `: ${item.details}` : ""}`),
  ];

  return lines.join("\n");
}

/**
 * Copy diagnostic data to clipboard
 */
export async function copyDiagnosticData(data: DiagnosticData): Promise<boolean> {
  try {
    const formattedData = formatDiagnosticData(data);
    await navigator.clipboard.writeText(formattedData);
    return true;
  } catch (error) {
    console.error("Failed to copy diagnostic data:", error);
    return false;
  }
}
