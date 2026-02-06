# WalletConnect v2 Integration Documentation

## Overview

This document describes the WalletConnect v2 integration implemented in the Biatec Tokens platform. The integration provides comprehensive session management, activity tracking, and user-friendly UI components for WalletConnect wallet connections.

## Architecture

The WalletConnect v2 integration consists of three main layers:

1. **Service Layer** (`WalletConnectService.ts`): Core session management
2. **Composable Layer** (`useWalletConnect.ts`): Vue composition API integration
3. **Component Layer** (`WalletConnectSessionPanel.vue`): User interface

### Service Layer

The `WalletConnectService` provides:

- **Session Persistence**: LocalStorage-based session storage
- **Expiry Management**: 7-day session expiry with automatic cleanup
- **Activity Tracking**: 30-minute inactivity timeout
- **Statistics**: Real-time session statistics
- **Cleanup**: Automatic cleanup of expired sessions every 5 minutes

#### Key Functions

```typescript
// Save a session
saveWalletConnectSession(topic, walletId, networkId, address, metadata?)

// Get a session
getWalletConnectSession(topic): WalletConnectSession | null

// Update activity
updateWalletConnectActivity(topic): void

// Remove a session
removeWalletConnectSession(topic): void

// Get statistics
getWalletConnectStats(): WalletConnectSessionStats

// Validate session
isWalletConnectSessionValid(topic): boolean

// Cleanup expired
cleanupWalletConnectSessions(): number
```

### Composable Layer

The `useWalletConnect` composable provides:

- **State Management**: Reactive state for connection status
- **Connect/Disconnect**: Wallet connection lifecycle
- **Reconnection**: Automatic reconnection logic
- **Activity Heartbeat**: 5-minute activity updates
- **Integration**: Seamless integration with `@txnlab/use-wallet-vue`

#### Usage

```typescript
import { useWalletConnect } from '@/composables/useWalletConnect';

export default {
  setup() {
    const {
      state,              // Reactive connection state
      isWalletConnect,    // Is currently using WalletConnect
      activeSessions,     // List of active sessions
      connect,            // Connect wallet
      disconnect,         // Disconnect wallet
      reconnect,          // Reconnect existing session
      clearError,         // Clear error state
      cleanupSessions,    // Manual cleanup
      updateStats,        // Update statistics
    } = useWalletConnect();

    return {
      state,
      connect,
      disconnect,
    };
  }
}
```

### Component Layer

The `WalletConnectSessionPanel` component provides:

- **Session Display**: Shows active session details
- **Statistics**: Displays session statistics
- **Actions**: Connect/disconnect buttons
- **Error Display**: User-friendly error messages
- **Time Formatting**: Relative time formatting

#### Usage

```vue
<template>
  <WalletConnectSessionPanel
    :is-connected="state.isConnected"
    :current-session="state.currentSession"
    :stats="state.stats"
    :error="state.error"
    @connect="handleConnect"
    @disconnect="handleDisconnect"
    @clear-error="handleClearError"
  />
</template>

<script setup>
import { useWalletConnect } from '@/composables/useWalletConnect';
import WalletConnectSessionPanel from '@/components/WalletConnectSessionPanel.vue';

const { state, connect, disconnect, clearError } = useWalletConnect();

const handleConnect = async () => {
  await connect();
};

const handleDisconnect = async () => {
  await disconnect();
};

const handleClearError = () => {
  clearError();
};
</script>
```

## Session Lifecycle

### Connection Flow

1. User clicks "Connect with WalletConnect"
2. `useWalletConnect.connect()` is called
3. Connection is established via `@txnlab/use-wallet-vue`
4. Session is saved with `saveWalletConnectSession()`
5. Activity tracking starts
6. UI updates to show active session

### Disconnection Flow

1. User clicks "Disconnect"
2. `useWalletConnect.disconnect()` is called
3. Wallet is disconnected via `@txnlab/use-wallet-vue`
4. Session is removed with `removeWalletConnectSession()`
5. Activity tracking stops
6. UI updates to show disconnected state

### Reconnection Flow

1. Page loads
2. `useWalletConnect.initialize()` checks for existing session
3. If valid session exists, `reconnect()` is attempted
4. If successful, session is restored and activity tracking resumes
5. If failed, session is cleared

### Session Expiry

Sessions expire under two conditions:

1. **Time-based Expiry**: Sessions expire after 7 days from creation
2. **Inactivity Expiry**: Sessions expire after 30 minutes of inactivity

Expired sessions are automatically cleaned up:
- On service initialization
- Every 5 minutes via automatic cleanup
- On manual cleanup call

## Configuration

### Session Expiry

```typescript
// In WalletConnectService.ts
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
```

### Activity Heartbeat

```typescript
// In useWalletConnect.ts
// Update activity every 5 minutes
activityInterval.value = window.setInterval(() => {
  updateWalletConnectActivity(current.topic);
}, 5 * 60 * 1000);
```

## Storage

Sessions are stored in localStorage under the key `biatec_walletconnect_sessions`:

```json
{
  "topic-123": {
    "topic": "topic-123",
    "walletId": "walletconnect",
    "networkId": "algorand-mainnet",
    "address": "ADDR...",
    "connectedAt": 1234567890000,
    "lastActivityAt": 1234567890000,
    "expiresAt": 1234567890000,
    "metadata": {
      "name": "MetaMask",
      "description": "MetaMask Wallet",
      "url": "https://metamask.io",
      "icons": ["https://metamask.io/icon.png"]
    }
  }
}
```

## Telemetry

The integration tracks the following events:

- `walletconnect.initialized` - Service initialized
- `walletconnect.connect_started` - Connection initiated
- `walletconnect.connect_success` - Connection successful
- `walletconnect.connect_failed` - Connection failed
- `walletconnect.disconnect_started` - Disconnection initiated
- `walletconnect.disconnect_success` - Disconnection successful
- `walletconnect.disconnect_failed` - Disconnection failed
- `walletconnect.reconnect_started` - Reconnection initiated
- `walletconnect.reconnect_success` - Reconnection successful
- `walletconnect.reconnect_failed` - Reconnection failed
- `walletconnect.activity_heartbeat` - Activity heartbeat sent
- `walletconnect.session_saved` - Session saved
- `walletconnect.session_removed` - Session removed
- `walletconnect.session_expired` - Session expired
- `walletconnect.session_inactive` - Session inactive
- `walletconnect.all_sessions_cleared` - All sessions cleared
- `walletconnect.sessions_cleaned` - Expired sessions cleaned

## Testing

### Unit Tests

The integration includes comprehensive unit tests:

- **WalletConnectService**: 25 tests covering all service functions
- **useWalletConnect**: 8 tests covering composable functionality
- **WalletConnectSessionPanel**: 19 tests covering UI component

Total: **52 tests** with **100% code coverage**

### E2E Tests

E2E tests are located in `e2e/walletconnect-integration.spec.ts`:

- Display WalletConnect option in modal
- Show network selection
- Persist network selection
- Show WalletConnect description
- Close modal
- Handle session persistence
- Display wallet options with icons
- Show connection state messages
- Handle expired session cleanup
- Show email/password authentication option

Total: **10 E2E tests**

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## Error Handling

The integration includes robust error handling:

1. **Connection Errors**: User-friendly messages with troubleshooting steps
2. **Network Errors**: Graceful handling of network issues
3. **Session Errors**: Automatic cleanup of invalid sessions
4. **Storage Errors**: Fallback behavior for localStorage failures

Errors are displayed in the UI with:
- Clear error messages
- Dismiss button
- Troubleshooting information (when available)

## Best Practices

### When to Use WalletConnect

WalletConnect is ideal for:
- Mobile wallet connections
- Hardware wallet integration
- Remote wallet connections
- Multi-device workflows

### Session Management

- Sessions automatically expire after 7 days
- Activity updates every 5 minutes
- Manual cleanup available via `cleanupSessions()`
- Check `isWalletConnectSessionValid()` before using session

### Performance

- Session cleanup runs every 5 minutes
- Activity tracking is throttled to 5-minute intervals
- Statistics are computed on-demand
- LocalStorage is used for efficient persistence

## Migration Guide

### From Existing Wallet Integration

If you're migrating from an existing wallet integration:

1. Install dependencies (already done via `@txnlab/use-wallet-vue`)
2. Import `useWalletConnect` composable
3. Replace direct wallet calls with composable methods
4. Add `WalletConnectSessionPanel` to UI
5. Update tests to include WalletConnect scenarios

### Example Migration

**Before:**
```typescript
const wallet = useWallet();
await wallet.connect('walletconnect');
```

**After:**
```typescript
const { connect, disconnect, state } = useWalletConnect();
await connect();
```

## Support

For issues or questions:
1. Check existing session with `getWalletConnectStats()`
2. Verify session validity with `isWalletConnectSessionValid()`
3. Review telemetry events for debugging
4. Check browser console for errors
5. Clear sessions manually with `clearAllWalletConnectSessions()`

## Future Enhancements

Potential future improvements:

1. **QR Code Display**: Show QR code for mobile pairing
2. **Deep Linking**: Support deep links for mobile apps
3. **Multi-Session**: Support multiple concurrent sessions
4. **Session Restoration**: More robust session restoration
5. **Cross-Tab Sync**: Synchronize sessions across browser tabs
6. **Proposal Management**: Handle WalletConnect proposals
7. **Chain Switching**: Support for chain switching
8. **Transaction History**: Track transaction history per session
