# Developer Guide: Adding New Token Standards

**Last Updated:** February 14, 2026  
**Audience:** Frontend developers adding support for new token standards  
**Prerequisites:** Understanding of TypeScript, Vue 3, and blockchain token standards

---

## Overview

This guide provides step-by-step instructions for adding support for a new token standard to the Biatec Tokens platform. The platform is designed to be extensible, with clear patterns for adding new standards while maintaining code quality and user experience.

**Important:** This platform uses email/password authentication with backend-managed deployments. You are NOT adding wallet connector integration. See [WALLET_FREE_ARCHITECTURE.md](/docs/WALLET_FREE_ARCHITECTURE.md) for details.

## Architecture Context

### Backend-First Approach

Token deployment is handled entirely by the backend:
1. Frontend collects token parameters from user
2. Frontend sends request to backend API
3. Backend derives ARC76 account from user credentials
4. Backend signs and submits transactions
5. Frontend displays deployment status

### Multi-Chain Support

The platform supports two blockchain families:
- **AVM Chains**: Algorand Mainnet, Algorand Testnet, VOI, Aramid
- **EVM Chains**: Ethereum, Arbitrum, Base, Sepolia

Each standard must be categorized as AVM or EVM.

## Step-by-Step Guide

### Step 1: Define TypeScript Types

**File:** `src/types/api.ts`

Add the new standard to the `TokenStandard` enum:

```typescript
export enum TokenStandard {
  // Existing standards
  ERC20 = 'ERC20',
  ARC3 = 'ARC3',
  ARC200 = 'ARC200',
  
  // NEW: Add your standard here
  ERC1155 = 'ERC1155',
}
```

Create a deployment request interface:

```typescript
/**
 * ERC1155 token deployment request (Multi-token standard)
 * Supports both fungible and non-fungible tokens in a single contract
 */
export interface ERC1155DeploymentRequest extends BaseDeploymentRequest {
  standard: TokenStandard.ERC1155;
  
  // Standard fields
  name: string;
  symbol: string;
  walletAddress: string; // ARC76-derived address
  
  // ERC1155-specific fields
  uri: string; // Base URI for token metadata
  initialTokens?: Array<{
    tokenId: string;
    amount: number;
    metadata?: TokenMetadata;
  }>;
  
  // Optional fields
  description?: string;
  icon?: string;
}
```

Update the `DeploymentRequest` union type:

```typescript
export type DeploymentRequest =
  | ERC20DeploymentRequest
  | ARC3DeploymentRequest
  | ARC200DeploymentRequest
  | ERC1155DeploymentRequest; // Add your new type
```

### Step 2: Update Token Wizard

**File:** `src/components/wizard/steps/TokenDetailsStep.vue`

Add the new standard to the `tokenStandards` array:

```typescript
const tokenStandards = [
  // Existing standards...
  
  // NEW: ERC1155 standard
  {
    value: 'ERC1155',
    label: 'ERC1155',
    description: 'Multi-token standard supporting both fungible and non-fungible tokens',
    badges: ['EVM', 'Multi-Token', 'NFT', 'Advanced'],
    chainType: 'EVM',
    features: [
      'Batch transfers',
      'Reduced gas costs',
      'Mixed token types',
      'Flexible metadata',
    ],
    useCases: [
      'Gaming items',
      'Collectible sets',
      'Mixed asset portfolios',
      'DeFi protocols',
    ],
    technicalDetails: {
      deploymentCost: 'High (complex contract)',
      transactionSpeed: 'Variable (depends on network)',
      scalability: 'Excellent (batch operations)',
      marketSupport: 'Growing (OpenSea, Rarible)',
    },
  },
]
```

**Key Fields:**
- `value`: Must match enum value from `TokenStandard`
- `label`: Display name shown to users
- `description`: Brief explanation (1-2 sentences)
- `badges`: Visual tags (recommended: type, features)
- `chainType`: Either 'AVM' or 'EVM'
- `features`: Key capabilities (3-5 items)
- `useCases`: Real-world applications (3-5 items)
- `technicalDetails`: Cost, speed, scalability, support

### Step 3: Update Standards Comparison Table

**File:** `src/components/TokenStandardsComparison.vue`

Add a new row to the standards comparison table:

```typescript
const standardsData = [
  // Existing standards...
  
  {
    name: 'ERC1155',
    fullName: 'ERC1155 Multi-Token Standard',
    chain: 'EVM',
    chainBadge: { text: 'EVM', class: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
    type: 'Multi-Token',
    fungible: '✓',
    nft: '✓',
    fractional: '✓',
    programmatic: '✓',
    metadataSupport: '✓ (URI pattern)',
    compliance: 'Custom',
    deploymentCost: 'High',
    transactionCost: 'Low (batch)',
    scalability: 'Excellent',
    marketSupport: 'Growing',
    useCases: 'Gaming, collectibles, DeFi',
    docsLink: 'https://eips.ethereum.org/EIPS/eip-1155',
  },
]
```

**Feature Matrix Columns:**
- `fungible`: Does it support fungible tokens? (✓ or —)
- `nft`: Does it support NFTs? (✓ or —)
- `fractional`: Fractional ownership? (✓ or —)
- `programmatic`: Smart contract logic? (✓ or —)
- `metadataSupport`: Metadata capabilities (✓, ✓ (Limited), —)
- `compliance`: Compliance features (✓, Custom, —)

### Step 4: Add Network-Specific Guidance

**File:** `src/stores/tokens.ts`

Update the `networkGuidance` with any network-specific considerations:

```typescript
const networkGuidance = [
  // For EVM networks
  {
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    standards: ['ERC20', 'ERC721', 'ERC1155'], // Add your standard
    // ...
  },
]
```

### Step 5: Create Validation Rules

**File:** `src/utils/tokenValidation.ts` (create if doesn't exist)

Add validation logic for your standard:

```typescript
export function validateERC1155Request(
  request: ERC1155DeploymentRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!request.name || request.name.length < 1) {
    errors.push('Token name is required')
  }
  
  if (!request.symbol || request.symbol.length < 1) {
    errors.push('Token symbol is required')
  }
  
  if (!request.uri || !isValidURI(request.uri)) {
    errors.push('Valid metadata URI is required')
  }
  
  if (!request.walletAddress || !isValidAddress(request.walletAddress)) {
    errors.push('Valid wallet address is required')
  }
  
  // Optional initial tokens validation
  if (request.initialTokens) {
    request.initialTokens.forEach((token, index) => {
      if (!token.tokenId) {
        errors.push(`Token ID required for token at index ${index}`)
      }
      if (token.amount <= 0) {
        errors.push(`Token amount must be positive for token ${token.tokenId}`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
```

### Step 6: Update Deployment Service

**File:** `src/services/TokenDeploymentService.ts` (or similar)

Add deployment logic for your standard:

```typescript
async deployToken(request: DeploymentRequest): Promise<DeploymentResponse> {
  // Validate request
  if (request.standard === TokenStandard.ERC1155) {
    const validation = validateERC1155Request(request as ERC1155DeploymentRequest)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
  }
  
  // Send to backend API
  const response = await apiClient.post('/api/tokens/deploy', request)
  
  // Track analytics
  telemetryService.trackTokenCreationAttempt({
    tokenStandard: request.standard,
    network: getCurrentNetwork(),
    tokenType: request.standard === TokenStandard.ERC1155 ? 'multi-token' : 'fungible',
  })
  
  return response.data
}
```

### Step 7: Add Token Detail Rendering

**File:** `src/views/TokenDetail.vue`

Add display logic for your standard's unique fields:

```vue
<template>
  <!-- Existing token details -->
  
  <!-- ERC1155-specific fields -->
  <div v-if="token.standard === 'ERC1155'" class="glass-effect rounded-xl p-6">
    <h3 class="text-xl font-semibold text-white mb-4">Multi-Token Details</h3>
    <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <dt class="text-sm text-gray-400">Base URI</dt>
        <dd class="text-white font-medium font-mono break-all">{{ token.uri }}</dd>
      </div>
      <div v-if="token.tokenTypes">
        <dt class="text-sm text-gray-400">Token Types</dt>
        <dd class="text-white font-medium">{{ token.tokenTypes.length }} types</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
// Add interface for ERC1155 token
interface ERC1155Token extends BaseToken {
  standard: 'ERC1155';
  uri: string;
  tokenTypes?: Array<{
    tokenId: string;
    amount: number;
    metadata?: TokenMetadata;
  }>;
}
</script>
```

### Step 8: Add Analytics Tracking

Use existing telemetry methods to track user interactions:

```typescript
import { telemetryService } from '@/services/TelemetryService'

// Track when user selects the standard
telemetryService.track('token_standard_selected', {
  standard: 'ERC1155',
  source: 'wizard',
})

// Track when deployment succeeds
telemetryService.trackTokenCreationSuccess({
  tokenId: response.tokenId,
  tokenStandard: 'ERC1155',
  network: currentNetwork,
  durationMs: deploymentDuration,
})

// Track when user views standards comparison
telemetryService.trackTokenStandardsComparisonViewed({
  source: 'navbar',
})
```

### Step 9: Write Tests

#### Unit Tests

**File:** `src/components/wizard/steps/__tests__/TokenDetailsStep.test.ts`

```typescript
describe('TokenDetailsStep - ERC1155 Support', () => {
  it('should display ERC1155 in standard options', async () => {
    const wrapper = mount(TokenDetailsStep, {
      global: {
        plugins: [createTestingPinia()],
      },
    })

    const standards = wrapper.findAll('[data-testid="token-standard"]')
    const standardNames = standards.map(s => s.text())
    
    expect(standardNames).toContain('ERC1155')
  })

  it('should show ERC1155 features when selected', async () => {
    const wrapper = mount(TokenDetailsStep)
    const vm = wrapper.vm as any
    
    await vm.selectStandard('ERC1155')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Multi-token')
    expect(wrapper.text()).toContain('Batch transfers')
  })
})
```

#### E2E Tests

**File:** `e2e/token-wizard-erc1155.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Token Wizard - ERC1155 Flow', () => {
  test('should create ERC1155 token successfully', async ({ page }) => {
    // Setup auth
    await page.addInitScript(() => {
      const mockUser = { address: 'TEST_ADDRESS', email: 'test@example.com' }
      localStorage.setItem('algorand_user', JSON.stringify(mockUser))
    })

    await page.goto('/create/wizard')
    await page.waitForLoadState('networkidle')

    // Select ERC1155 standard
    await page.getByText('ERC1155').click()
    await page.getByRole('button', { name: /Next|Continue/i }).click()

    // Fill in token details
    await page.getByLabel(/Token Name/i).fill('My Multi-Token')
    await page.getByLabel(/Symbol/i).fill('MMT')
    await page.getByLabel(/Base URI/i).fill('ipfs://QmExampleHash/')

    // Complete wizard
    await page.getByRole('button', { name: /Deploy/i }).click()
    
    // Verify success
    await expect(page.getByText(/Success|Deployed/i)).toBeVisible({ timeout: 30000 })
  })
})
```

### Step 10: Update Documentation

#### Update README

**File:** `README.md`

```markdown
### Supported Token Standards

- **AVM Chains**: ASA, ARC3, ARC19, ARC69, ARC200, ARC72
- **EVM Chains**: ERC20, ERC721, **ERC1155** ← Add this
```

#### Update Architecture Doc

**File:** `docs/WALLET_FREE_ARCHITECTURE.md`

```markdown
### Supported Standards (9 Total) ← Update count

#### EVM Chain Standards
- **ERC20** - Fungible tokens
- **ERC721** - Non-fungible tokens (NFTs)
- **ERC1155** - Multi-token standard (NEW) ← Add description
```

### Step 11: Coordinate with Backend

**Important:** Frontend changes are only half the work!

1. **Create Backend Ticket:**
   ```
   Title: Add ERC1155 Token Deployment Support
   
   Description:
   - Add /api/tokens/deploy endpoint support for ERC1155
   - Implement ERC1155 contract deployment logic
   - Add ERC1155 metadata storage
   - Update transaction monitoring for ERC1155
   
   API Contract Example:
   POST /api/tokens/deploy
   {
     "standard": "ERC1155",
     "name": "My Multi-Token",
     "symbol": "MMT",
     "uri": "ipfs://QmExampleHash/{id}.json",
     "walletAddress": "0x...",
     "initialTokens": [...]
   }
   
   Response:
   {
     "transactionId": "txn_...",
     "tokenId": "token_...",
     "contractAddress": "0x...",
     "status": "pending"
   }
   ```

2. **Test with Backend:**
   - Use mock data in frontend first
   - Test with backend staging environment
   - Verify transaction flow end-to-end
   - Check error handling

### Step 12: Deploy and Monitor

1. **Deployment Checklist:**
   - [ ] All unit tests pass
   - [ ] E2E tests pass
   - [ ] Code reviewed by team
   - [ ] Backend API is deployed and tested
   - [ ] Documentation updated
   - [ ] Analytics tracking verified

2. **Post-Deployment Monitoring:**
   - Monitor telemetry for standard selection rate
   - Track deployment success/failure rates
   - Monitor user feedback and support tickets
   - Check for console errors in production

## Common Patterns and Best Practices

### Naming Conventions

- **Enum Values**: Use UPPERCASE (e.g., `ERC1155`)
- **Interface Names**: Use PascalCase with suffix (e.g., `ERC1155DeploymentRequest`)
- **Component Props**: Use camelCase (e.g., `tokenStandard`)
- **Display Labels**: Use human-readable format (e.g., "ERC1155 Multi-Token Standard")

### Validation Best Practices

```typescript
// ✅ GOOD: Comprehensive validation with clear messages
if (!request.uri || !isValidURI(request.uri)) {
  errors.push('Valid metadata URI is required. Must be a valid URL or IPFS hash.')
}

// ❌ BAD: Generic error message
if (!request.uri) {
  errors.push('Invalid URI')
}
```

### Error Handling

```typescript
// ✅ GOOD: Specific error handling with user guidance
try {
  const response = await deployToken(request)
  telemetryService.trackTokenCreationSuccess({ ... })
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    showError('Insufficient funds. Please upgrade your subscription plan.')
  } else if (error.code === 'NETWORK_ERROR') {
    showError('Network error. Please check your connection and try again.')
  } else {
    showError('Deployment failed. Please contact support.')
  }
  telemetryService.trackTokenCreationFailure({
    tokenStandard: request.standard,
    network: currentNetwork,
    errorType: error.code,
    errorMessage: error.message,
  })
}

// ❌ BAD: Generic catch-all
try {
  await deployToken(request)
} catch (error) {
  console.error(error) // Not user-facing!
}
```

### Accessibility

```vue
<!-- ✅ GOOD: Proper labels and ARIA attributes -->
<label for="token-uri" class="block text-sm font-medium">
  Base URI
  <span class="text-red-500">*</span>
</label>
<input
  id="token-uri"
  v-model="uri"
  type="text"
  aria-required="true"
  aria-describedby="uri-help"
  placeholder="ipfs://..."
/>
<p id="uri-help" class="text-xs text-gray-500">
  The base URI for token metadata. Use IPFS or HTTPS.
</p>

<!-- ❌ BAD: No labels or accessibility -->
<input v-model="uri" placeholder="URI" />
```

## Troubleshooting

### Issue: Standard not appearing in wizard

**Solution:** Check these files:
1. `src/types/api.ts` - Enum defined?
2. `src/components/wizard/steps/TokenDetailsStep.vue` - Added to array?
3. Browser cache - Hard refresh (Ctrl+Shift+R)

### Issue: TypeScript errors

**Solution:**
```bash
# Rebuild TypeScript
npm run build

# Check for errors
npm run check-typescript-errors-tsc
npm run check-typescript-errors-vue
```

### Issue: Tests failing

**Solution:**
```bash
# Run unit tests
npm test

# Run specific test file
npm test -- TokenDetailsStep.test.ts

# Run E2E tests
npm run test:e2e -- token-wizard-erc1155.spec.ts
```

### Issue: Backend API errors

**Solution:**
1. Check backend logs
2. Verify API contract matches frontend
3. Test with curl/Postman:
   ```bash
   curl -X POST https://api.tokens.biatec.io/api/tokens/deploy \
     -H "Content-Type: application/json" \
     -d '{"standard": "ERC1155", ...}'
   ```

## Checklist for Adding a New Standard

Use this checklist to ensure you've covered all steps:

- [ ] **Step 1:** Added enum to `TokenStandard` in `src/types/api.ts`
- [ ] **Step 2:** Created `<Standard>DeploymentRequest` interface
- [ ] **Step 3:** Updated `DeploymentRequest` union type
- [ ] **Step 4:** Added standard to wizard (`TokenDetailsStep.vue`)
- [ ] **Step 5:** Updated standards comparison table
- [ ] **Step 6:** Added network guidance (if needed)
- [ ] **Step 7:** Created validation rules
- [ ] **Step 8:** Updated deployment service
- [ ] **Step 9:** Added token detail rendering
- [ ] **Step 10:** Added analytics tracking
- [ ] **Step 11:** Wrote unit tests (min 5 tests)
- [ ] **Step 12:** Wrote E2E tests (min 3 scenarios)
- [ ] **Step 13:** Updated README.md
- [ ] **Step 14:** Updated WALLET_FREE_ARCHITECTURE.md
- [ ] **Step 15:** Coordinated with backend team
- [ ] **Step 16:** Tested with backend staging
- [ ] **Step 17:** Code reviewed and approved
- [ ] **Step 18:** Deployed to production
- [ ] **Step 19:** Monitored telemetry post-launch

## Resources

- **Architecture:** [WALLET_FREE_ARCHITECTURE.md](/docs/WALLET_FREE_ARCHITECTURE.md)
- **Business Roadmap:** [business-owner-roadmap.md](/business-owner-roadmap.md)
- **Contributing:** [CONTRIBUTING.md](/docs/general/CONTRIBUTING.md)
- **Testing Guide:** [Test documentation](/docs/testing/)

## Getting Help

- **Questions:** Ask in team chat or create GitHub discussion
- **Bugs:** Create GitHub issue with [Standard Support] tag
- **Backend:** Coordinate via backend team's issue tracker
- **Design:** Consult design system documentation

---

**Last Updated:** February 14, 2026  
**Maintainer:** Platform Team  
**Questions?** See [WALLET_FREE_ARCHITECTURE.md](/docs/WALLET_FREE_ARCHITECTURE.md)
