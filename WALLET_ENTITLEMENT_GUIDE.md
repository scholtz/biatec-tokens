# Wallet Connection & Entitlement System

This document describes the wallet connection reliability improvements and entitlement gating system implemented for the Biatec Tokens frontend.

## Overview

The system provides:
- **Unified Signing Interface**: Standardized signing across AVM (Algorand, VOI, Aramid) and EVM (Ethereum, Arbitrum, Base) chains
- **Deterministic Error Handling**: User-friendly error messages with troubleshooting steps
- **Entitlement Service**: Subscription-based feature gating with usage tracking
- **UI Components**: Ready-to-use components for feature gates and usage indicators
- **Comprehensive Telemetry**: Event tracking for analytics and debugging

## Architecture

### Signing System

#### Types (`types/signing.ts`)
- `SigningResult<T>`: Standardized result type for all signing operations
- `SigningStatus`: Enum of possible signing outcomes
- `SigningError`: Detailed error information with user-friendly messages
- `Signer`: Interface for wallet signing implementations

#### Composables
- `useAVMSigning()`: Algorand-compatible chain signing
- `useEVMSigning()`: Ethereum-compatible chain signing
- Both support batch operations and optional confirmation waiting

#### Utilities (`utils/signing.ts`)
- `parseSigningError()`: Convert errors to user-friendly format
- `createSuccessResult()`, `createErrorResult()`: Result builders
- `waitForConfirmation()`: Transaction confirmation polling
- `isRetryableError()`: Determine if error is transient

### Entitlement System

#### Types (`types/entitlement.ts`)
- `SubscriptionTier`: FREE, BASIC, PRO, ENTERPRISE
- `FeatureFlag`: 26 feature flags for granular access control
- `UsageLimits`: Usage constraints per tier
- `Entitlement`: Complete entitlement state

#### Service (`services/EntitlementService.ts`)
Singleton service providing:
- `initialize(subscriptionData)`: Set up from subscription info
- `checkFeatureAccess(feature)`: Check if feature is accessible
- `checkUsageLimit(limitKey, increment)`: Verify usage within limits
- `incrementUsage(limitKey, amount)`: Track usage
- `getUpgradePrompt(feature)`: Get upgrade information
- `resetUsage()`: Reset periodic counters

#### Composable (`composables/useEntitlement.ts`)
Vue composable for easy component integration:
```typescript
const { hasFeature, canUse, trackUsage, entitlement } = useEntitlement();

// Check feature access
if (hasFeature(FeatureFlag.TOKEN_CREATION_ARC200)) {
  // Feature is available
}

// Check usage limit
if (canUse('tokensPerMonth', 1)) {
  // Create token
  trackUsage('tokensPerMonth', 1);
}
```

### UI Components

#### FeatureGate (`components/entitlement/FeatureGate.vue`)
Conditionally renders content based on feature access:
```vue
<FeatureGate :feature="FeatureFlag.TOKEN_CREATION_ARC200">
  <CreateTokenForm />
</FeatureGate>
```

Props:
- `feature`: Feature flag to check
- `showUpgradePrompt`: Show upgrade modal (default: true)
- `fallbackMessage`: Custom blocked message

#### UsageIndicator (`components/entitlement/UsageIndicator.vue`)
Shows usage progress with visual indicators:
```vue
<UsageIndicator
  limitKey="tokensPerMonth"
  label="Tokens Created This Month"
  @upgrade="handleUpgrade"
/>
```

Props:
- `limitKey`: Which usage limit to display
- `label`: Display label
- `showPercentage`: Show percentage badge (default: true)
- `showUpgradePrompt`: Show upgrade prompts (default: true)

## Subscription Tiers

### Free Tier
**Features:**
- ASA token creation
- VOI network
- Testnet access

**Limits:**
- 3 tokens/month
- 5 deployments/day
- 100 whitelist addresses
- 10 attestations/month
- 100 API calls/day

### Basic Tier
**Features:**
- All Free features
- ARC3, ARC19, ARC69 tokens
- Compliance whitelist
- Aramid network

**Limits:**
- 10 tokens/month
- 20 deployments/day
- 1,000 whitelist addresses
- 50 attestations/month
- 500 API calls/day

### Pro Tier
**Features:**
- All Basic features
- ARC200, ARC72 tokens
- ERC20, ERC721 tokens
- All compliance features
- Batch deployment
- API access
- Advanced analytics
- All networks (Ethereum, Arbitrum, Base)

**Limits:**
- 100 tokens/month
- 100 deployments/day
- 10,000 whitelist addresses
- 500 attestations/month
- 5,000 API calls/day

### Enterprise Tier
**Features:**
- All features
- Custom branding
- Priority support

**Limits:**
- Unlimited

## Usage Examples

### Basic Signing Flow

```typescript
import { useAVMSigning } from '@/composables/useAVMSigning';
import { SigningStatus } from '@/types/signing';

const avmSigner = useAVMSigning();

async function signTransaction(txn: Transaction) {
  const transaction: AVMTransaction = {
    type: 'avm',
    network: 'voi-mainnet',
    from: avmSigner.getAddress()!,
    data: { txn },
  };

  const result = await avmSigner.sign(transaction, {
    timeout: 60000,
    requireConfirmation: true,
  });

  if (result.status === SigningStatus.SUCCESS) {
    console.log('Transaction ID:', result.txId);
    return result.data;
  } else if (result.status === SigningStatus.USER_CANCELLED) {
    console.log('User cancelled signing');
  } else {
    console.error('Signing failed:', result.error?.userMessage);
    console.log('Troubleshooting:', result.error?.troubleshootingSteps);
  }
}
```

### Feature Gating in Components

```vue
<script setup lang="ts">
import { FeatureFlag } from '@/types/entitlement';
import FeatureGate from '@/components/entitlement/FeatureGate.vue';
import { useEntitlement } from '@/composables/useEntitlement';

const { hasFeature, canUse, trackUsage } = useEntitlement();

async function createToken() {
  // Check if we can create a token
  if (!canUse('tokensPerMonth', 1)) {
    showError('You have reached your monthly token limit');
    return;
  }

  // Create token...
  
  // Track usage
  trackUsage('tokensPerMonth', 1);
}
</script>

<template>
  <div>
    <!-- Gate entire feature -->
    <FeatureGate :feature="FeatureFlag.TOKEN_CREATION_ARC200">
      <button @click="createToken">Create ARC200 Token</button>
    </FeatureGate>

    <!-- Show usage indicator -->
    <UsageIndicator
      limitKey="tokensPerMonth"
      label="Tokens Created This Month"
    />
  </div>
</template>
```

### Usage Monitoring

```typescript
import { useEntitlement } from '@/composables/useEntitlement';

const { getUsagePercentage, isNearLimit, entitlement } = useEntitlement();

// Check usage percentage
const tokensUsed = getUsagePercentage('tokensPerMonth');
console.log(`Tokens used: ${tokensUsed}%`);

// Check if approaching limit
if (isNearLimit('tokensPerMonth')) {
  showWarning('You are approaching your monthly token limit');
}

// Access full entitlement info
console.log('Current tier:', entitlement.value?.tier);
console.log('Available features:', entitlement.value?.features);
```

## Error Handling

The signing system provides detailed error information:

```typescript
const result = await signer.sign(transaction);

if (result.status !== SigningStatus.SUCCESS) {
  // User-friendly message
  console.log(result.error?.userMessage);
  
  // Technical details
  console.log(result.error?.message);
  
  // Troubleshooting steps
  result.error?.troubleshootingSteps?.forEach(step => {
    console.log('- ' + step);
  });
  
  // Check if retryable
  if (isRetryableError(result.status)) {
    // Offer retry option
  }
}
```

## Telemetry

All operations emit telemetry events:

**Wallet Events:**
- `wallet_connected`: Successful wallet connection
- `wallet_state_transition`: State changes
- `wallet_detection`: Provider detection attempts
- `wallet_connection_failure`: Connection errors
- `network_switched`: Network changes
- `network_switch_failure`: Network switch errors

**Signing Events:**
- `avm_signing_success` / `evm_signing_success`
- `avm_signing_failure` / `evm_signing_failure`
- `avm_batch_signing_success` / `evm_batch_signing_success`
- `avm_transaction_confirmed` / `evm_transaction_confirmed`

**Entitlement Events:**
- `entitlement_initialized`: Entitlement setup
- `feature_access_check`: Feature access attempts
- `usage_incremented`: Usage tracking
- `usage_reset`: Usage counter reset

## Testing

The system includes comprehensive test coverage:

- **Unit Tests**: 60 tests for signing and entitlement logic
- **Integration Tests**: 24 tests for wallet+entitlement flows
- **Total**: 1579 tests passing

Run tests:
```bash
npm test                    # All tests
npm test -- signing         # Signing tests only
npm test -- entitlement     # Entitlement tests only
npm run test:coverage       # With coverage report
```

## Migration Guide

### Existing Code

If you have existing wallet signing code:

1. **Replace direct wallet calls** with composables:
   ```typescript
   // Old
   const signedTxn = await wallet.signTransaction(txn);
   
   // New
   const signer = useAVMSigning();
   const result = await signer.sign({ type: 'avm', ... });
   ```

2. **Add error handling** with standardized messages:
   ```typescript
   if (result.status !== SigningStatus.SUCCESS) {
     showError(result.error?.userMessage);
   }
   ```

3. **Add entitlement checks** before operations:
   ```typescript
   const { hasFeature, canUse } = useEntitlement();
   
   if (!hasFeature(FeatureFlag.TOKEN_CREATION_ARC200)) {
     showUpgradePrompt();
     return;
   }
   ```

## Best Practices

1. **Always check entitlements** before operations
2. **Track usage** after successful operations
3. **Handle all signing statuses** (not just success/failure)
4. **Show user-friendly messages** from SigningError
5. **Use FeatureGate** for entire features
6. **Use UsageIndicator** to show limits proactively
7. **Emit telemetry** for custom operations
8. **Test with different tiers** during development

## Troubleshooting

### Signing Failures

1. Check error type: `result.status`
2. Show user message: `result.error?.userMessage`
3. Provide troubleshooting: `result.error?.troubleshootingSteps`
4. Allow retry if `isRetryableError(result.status)`

### Entitlement Issues

1. Verify subscription is active: `entitlement.value?.isActive`
2. Check feature access: `checkFeatureAccess(feature)`
3. Review usage limits: `entitlement.value?.limits`
4. Monitor usage: `getUsagePercentage(limitKey)`

### Integration Issues

1. Initialize entitlement service early (e.g., in App.vue)
2. Ensure subscription data is loaded before checking entitlements
3. Use `refreshEntitlement()` after subscription changes
4. Check telemetry events for debugging

## Contributing

When adding new features:

1. Add feature flag to `FeatureFlag` enum
2. Add to appropriate tier in `TIER_CONFIGS`
3. Use `FeatureGate` in UI
4. Add tests for feature access
5. Document in this README
