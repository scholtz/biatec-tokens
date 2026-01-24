/**
 * Authentication and wallet-related constants
 */

// LocalStorage keys
export const AUTH_STORAGE_KEYS = {
  WALLET_CONNECTED: 'wallet_connected',
  ACTIVE_WALLET_ID: 'active_wallet_id',
  SELECTED_NETWORK: 'selected_network',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  REDIRECT_AFTER_AUTH: 'redirect_after_auth',
} as const

// Wallet connection states
export const WALLET_CONNECTION_STATE = {
  CONNECTED: 'true',
  DISCONNECTED: 'false',
} as const
