/**
 * Centralized UI copy for authentication and account-related features
 * This provides SaaS-style language that is more approachable for non-crypto users
 */

export const AUTH_UI_COPY = {
  // Authentication button labels
  SIGN_IN: 'Sign In',
  SIGNING_IN: 'Signing in...',
  SIGN_OUT: 'Sign Out',
  AUTHENTICATE: 'Authenticate',
  
  // Modal headers
  SIGN_IN_HEADER: 'Sign In to Your Account',
  AUTHENTICATION_HEADER: 'Account Authentication',
  
  // Authentication methods
  EMAIL_PASSWORD_PRIMARY: 'Sign in with Email & Password',
  EMAIL_PASSWORD_DESCRIPTION: 'Use email and password to create a self-custody account',
  WALLET_PROVIDERS_ADVANCED: 'Advanced: Connect with Wallet Provider',
  WALLET_PROVIDERS_DESCRIPTION: 'Connect using a blockchain wallet application',
  
  // Status messages
  SIGNED_IN: 'Signed in',
  NOT_SIGNED_IN: 'Not signed in',
  PENDING_AUTH: 'Authentication pending',
  AUTH_FAILED: 'Authentication failed',
  
  // Account menu
  ACCOUNT: 'Account',
  ACCOUNT_STATUS: 'Account Status',
  CONNECTED_ADDRESS: 'Connected Address',
  SECURITY_CENTER: 'Security Center',
  
  // Guidance messages
  NEW_USER_GUIDANCE: 'New to self-custody authentication?',
  NEW_USER_INFO: 'Download a wallet app to get started with secure, self-custody authentication:',
  RECOMMENDED: 'Recommended',
  
  // Network labels
  MAINNET_LABEL: 'Mainnet',
  TESTNET_LABEL: 'Testnet',
  TESTNET_WARNING: 'Testnet Notice',
  TESTNET_WARNING_TEXT: 'This network is for testing only. Assets have no real-world value. For production use, please select a mainnet network.',
  
  // Terms and security
  TERMS_AGREEMENT: 'By signing in, you agree to our Terms of Service and acknowledge that you\'ve read our Privacy Policy.',
  SECURITY_NOTE: 'We never store your private keys. All transactions require your explicit approval.',
} as const

export const NETWORK_UI_COPY = {
  SELECT_NETWORK: 'Select Network',
  CHOOSE_DEPLOYMENT: 'Choose your deployment target',
  MAINNET_PRIORITY: 'Production Ready',
  TESTNET_SECONDARY: 'Testing Only',
} as const

export const WIZARD_UI_COPY = {
  CREATE_TOKEN: 'Create New Token',
  CREATE_TOKEN_SUBTITLE: 'Choose a template or token standard and deploy in seconds',
  COMPLIANCE_CHECKLIST: 'Compliance Checklist',
  NETWORK_SELECTION: 'Select Network',
} as const
