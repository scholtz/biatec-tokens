/**
 * Authentication and wallet-related constants
 * 
 * Note: Despite the naming, WALLET_CONNECTED and ACTIVE_WALLET_ID are used for
 * email/password authentication in the MVP wallet-free flow. These keys represent
 * the authentication state regardless of whether a wallet is involved.
 * 
 * - WALLET_CONNECTED: Indicates user is authenticated (via email/password ARC76)
 * - ACTIVE_WALLET_ID: Legacy field, not actively used in MVP wallet-free auth
 */

// LocalStorage keys
export const AUTH_STORAGE_KEYS = {
  WALLET_CONNECTED: 'wallet_connected', // Used for email/password auth state
  ACTIVE_WALLET_ID: 'active_wallet_id', // Legacy - not used in MVP
  SELECTED_NETWORK: 'selected_network',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  REDIRECT_AFTER_AUTH: 'redirect_after_auth',
} as const

// Wallet connection states
export const WALLET_CONNECTION_STATE = {
  CONNECTED: 'true',
  DISCONNECTED: 'false',
} as const
