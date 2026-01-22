# Wallet Integration Guide

## Overview

The Biatec Tokens platform provides comprehensive wallet integration for VOI and Aramid networks using the `@txnlab/use-wallet-vue` library. This guide covers how to use and extend the wallet integration features.

## Quick Start

### Using the Wallet Manager

The `useWalletManager` composable is the primary interface for wallet operations:

```typescript
import { useWalletManager } from '@/composables/useWalletManager'

// In your component
const {
  isConnected,
  activeAddress,
  formattedAddress,
  currentNetwork,
  networkInfo,
  connect,
  disconnect,
  switchNetwork,
} = useWalletManager()
```

### Connecting a Wallet

Use the `WalletConnectModal` component for a user-friendly wallet selection experience:

```vue
<template>
  <button @click="showWalletModal = true">Connect Wallet</button>
  
  <WalletConnectModal
    :is-open="showWalletModal"
    @close="showWalletModal = false"
    @connected="handleConnected"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WalletConnectModal from '@/components/WalletConnectModal.vue'

const showWalletModal = ref(false)

const handleConnected = ({ address, walletId, network }) => {
  console.log('Wallet connected:', { address, walletId, network })
  showWalletModal.value = false
}
</script>
```

## Network Management

### Supported Networks

Three networks are configured by default:

1. **VOI Mainnet**
   - ID: `voi-mainnet`
   - algod: `https://mainnet-api.voi.nodely.dev`
   - Production network for VOI blockchain

2. **Aramid Mainnet**
   - ID: `aramidmain`
   - algod: `https://algod.aramidmain.a-wallet.net`
   - Production network for Aramid blockchain

3. **Dockernet**
   - ID: `dockernet`
   - algod: `http://localhost:4001`
   - Local development network

### Network Switcher Component

Add the `NetworkSwitcher` component to allow users to switch between networks:

```vue
<template>
  <NetworkSwitcher />
</template>

<script setup lang="ts">
import NetworkSwitcher from '@/components/NetworkSwitcher.vue'
</script>
```

### Programmatic Network Switching

```typescript
import { useWalletManager } from '@/composables/useWalletManager'

const { switchNetwork } = useWalletManager()

// Switch to Aramid mainnet
await switchNetwork('aramidmain')
```

**Important**: Switching networks will disconnect the current wallet and require reconnection.

## Wallet State Management

### Connection State

The wallet manager provides reactive state:

```typescript
const {
  walletState,      // Complete wallet state object
  isConnected,      // Boolean - is wallet connected?
  activeAddress,    // String | null - connected wallet address
  activeWallet,     // String | null - wallet provider ID
  accounts,         // Array - all connected accounts
  formattedAddress, // String | null - shortened address display
} = useWalletManager()
```

### Persistent Connections

The wallet manager automatically:
- Saves connection state to `localStorage`
- Attempts to reconnect on page reload
- Restores the selected network
- Syncs with the auth store

Connection data persisted:
- `wallet_connected`: Boolean flag
- `active_wallet_id`: Last used wallet provider
- `selected_network`: Current network ID

## Supported Wallets

The platform integrates with multiple wallet providers:

| Wallet | ID | Description |
|--------|-----|-------------|
| Pera Wallet | `pera` | Mobile and web wallet |
| Defly Wallet | `defly` | Feature-rich wallet |
| Exodus | `exodus` | Multi-chain wallet |
| Biatec Wallet | `biatec` | Enterprise wallet solution |
| Kibisis | `kibisis` | Browser extension |
| Lute Wallet | `lute` | Lightweight wallet |

### Configuring Wallets

Wallets are configured in `src/main.ts`:

```typescript
app.use(WalletManagerPlugin, {
  wallets: [
    {
      id: WalletId.BIATEC,
      options: { projectId: 'your-project-id' },
    },
    WalletId.PERA,
    WalletId.DEFLY,
    // ... other wallets
  ],
  networks: networks,
  defaultNetwork: NetworkId.TESTNET,
})
```

## Error Handling

### Connection Errors

```typescript
const { connect } = useWalletManager()

try {
  await connect('pera')
} catch (error) {
  if (error.message.includes('User rejected')) {
    // Handle user rejection
  } else if (error.message.includes('not found')) {
    // Handle wallet not found
  } else {
    // Handle other errors
  }
}
```

### Network Switch Errors

```typescript
const { switchNetwork } = useWalletManager()

try {
  await switchNetwork('voi-mainnet')
} catch (error) {
  console.error('Network switch failed:', error)
  // Network will remain unchanged
}
```

## Integration with Auth Store

The wallet manager automatically syncs with the auth store:

```typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// When wallet connects, auth store is updated:
// authStore.user.address = activeAddress
// authStore.isConnected = true

// When wallet disconnects:
// authStore.signOut() is called
```

## Advanced Usage

### Custom Wallet Event Handlers

Access the underlying wallet manager for advanced operations:

```typescript
const { walletManager } = useWalletManager()

// Access wallet-specific methods
const activeWallet = walletManager.activeWallet.value
if (activeWallet) {
  // Use wallet-specific features
  await activeWallet.signTransactions(transactions)
}
```

### Account Management

Switch between multiple connected accounts:

```typescript
const { accounts, setActiveAccount } = useWalletManager()

// List all accounts
console.log(accounts.value)

// Switch to a different account
setActiveAccount('ANOTHER_ADDRESS...')
```

## UI Components

### WalletConnectModal Props

```typescript
interface Props {
  isOpen: boolean                    // Show/hide modal
  showNetworkSelector?: boolean      // Show network selection (default: true)
  defaultNetwork?: NetworkId         // Default selected network
}
```

### WalletConnectModal Events

```typescript
// Connection successful
@connected="({ address, walletId, network }) => {}"

// Modal closed
@close="() => {}"

// Connection error
@error="(errorMessage: string) => {}"
```

### NetworkSwitcher

The NetworkSwitcher is a standalone component with no props. It manages its own state and interacts directly with the wallet manager.

## Testing

### Mocking the Wallet Manager

```typescript
import { vi } from 'vitest'

vi.mock('@/composables/useWalletManager', () => ({
  useWalletManager: vi.fn(() => ({
    isConnected: ref(false),
    activeAddress: ref(null),
    connect: vi.fn(),
    disconnect: vi.fn(),
    // ... other mocked methods
  }))
}))
```

### Testing Wallet Connections

```typescript
import { mount } from '@vue/test-utils'
import WalletConnectModal from '@/components/WalletConnectModal.vue'

it('should emit connected event when wallet connects', async () => {
  const wrapper = mount(WalletConnectModal, {
    props: { isOpen: true }
  })
  
  // Simulate wallet connection
  await wrapper.vm.handleConnect('pera')
  
  expect(wrapper.emitted('connected')).toBeTruthy()
})
```

## Security Considerations

1. **No Private Key Storage**: The wallet manager never stores private keys. All signing operations are handled by the wallet providers.

2. **Connection Metadata Only**: Only connection metadata (wallet ID, network) is persisted to localStorage.

3. **User Confirmation**: Network switches and disconnections require explicit user action.

4. **Trusted Libraries**: Uses official `@txnlab/use-wallet-vue` library and wallet-specific SDKs.

## Troubleshooting

### Wallet Not Connecting

1. Check that the wallet extension/app is installed
2. Verify the network is supported by the wallet
3. Check browser console for detailed error messages
4. Try disconnecting and reconnecting

### Network Switch Fails

1. Ensure the wallet is disconnected before switching
2. Verify network configuration in `src/main.ts`
3. Check network endpoints are accessible

### Reconnection Issues

1. Clear localStorage and try connecting fresh
2. Check that wallet extension is still authorized
3. Verify network configuration hasn't changed

## Adding a New Network

To add support for a new network:

1. Update the `NETWORKS` constant in `src/composables/useWalletManager.ts`:

```typescript
export const NETWORKS: Record<NetworkId, NetworkInfo> = {
  // ... existing networks
  'new-network': {
    id: 'new-network',
    name: 'new-network',
    displayName: 'New Network',
    algodUrl: 'https://algod.new-network.com',
    genesisId: 'newnetwork-v1.0',
    isTestnet: false,
  },
}
```

2. Update the network configuration in `src/main.ts`:

```typescript
const networks = new NetworkConfigBuilder()
  // ... existing networks
  .addNetwork("new-network", {
    algod: {
      token: "",
      baseServer: "https://algod.new-network.com",
      port: "",
    },
    isTestnet: false,
    genesisHash: "...",
    genesisId: "newnetwork-v1.0",
    caipChainId: "algorand:...",
  })
  .build()
```

## Best Practices

1. **Always check `isConnected`** before performing wallet operations
2. **Handle connection errors gracefully** with user-friendly messages
3. **Persist minimal data** to localStorage (only connection metadata)
4. **Test on multiple wallets** to ensure compatibility
5. **Provide clear feedback** during connection and network switches
6. **Use the WalletConnectModal** for consistent UX across the app
7. **Respect user privacy** - never log or store private information

## Related Files

- `/src/composables/useWalletManager.ts` - Core wallet management logic
- `/src/components/WalletConnectModal.vue` - Wallet selection UI
- `/src/components/NetworkSwitcher.vue` - Network management UI
- `/src/stores/auth.ts` - Authentication state management
- `/src/main.ts` - Wallet plugin configuration

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review test files for usage examples
- Consult `@txnlab/use-wallet-vue` documentation
- Open an issue on GitHub
