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
  SIGN_IN_HEADER: 'Sign In to Biatec Tokens',
  AUTHENTICATION_HEADER: 'Account Authentication',
  
  // Authentication methods
  EMAIL_PASSWORD_PRIMARY: 'Sign in with Email & Password',
  EMAIL_PASSWORD_DESCRIPTION: 'Your secure account with automatic blockchain identity',
  
  // Status messages
  SIGNED_IN: 'Authenticated',
  NOT_SIGNED_IN: 'Sign In',
  PENDING_AUTH: 'Authenticating',
  AUTH_FAILED: 'Authentication failed',
  
  // Account menu
  ACCOUNT: 'Account',
  ACCOUNT_STATUS: 'Account Status',
  CONNECTED_ADDRESS: 'ARC76 Account',
  SECURITY_CENTER: 'Security Center',
  
  // Guidance messages
  NEW_USER_GUIDANCE: 'New to tokenization?',
  NEW_USER_INFO: 'Sign up with email to get started with secure, compliant token creation:',
  RECOMMENDED: 'Recommended',
  
  // Network labels
  MAINNET_LABEL: 'Mainnet',
  TESTNET_LABEL: 'Testnet',
  TESTNET_WARNING: 'Testnet Notice',
  TESTNET_WARNING_TEXT: 'This network is for testing only. Assets have no real-world value. For production use, please select a mainnet network.',
  
  // Terms and security
  TERMS_AGREEMENT: 'By signing in, you agree to our Terms of Service and acknowledge that you\'ve read our Privacy Policy.',
  SECURITY_NOTE: 'Your password is never stored in plain text. Your ARC76 account is derived securely from your credentials using enterprise-grade encryption.',
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
