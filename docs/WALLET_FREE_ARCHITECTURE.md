# Wallet-Free Architecture: Token Standards Without Wallet Connectors

**Last Updated:** February 14, 2026  
**Status:** Architecture Documentation

## Executive Summary

Biatec Tokens Platform implements a **wallet-free architecture** where users authenticate via email/password and all blockchain operations are handled by backend services. This document explains why wallet connectors are **intentionally excluded** and how token standards are supported without requiring users to manage wallets.

## Core Architectural Principle

> **"Email and password authentication only - no wallet connectors anywhere on the web"**  
> — Business Owner Roadmap, Line 9

### Why No Wallet Connectors?

**Target Audience:** Non-crypto native persons
- Traditional businesses and enterprises
- Users who don't need blockchain or wallet knowledge
- Regulated token issuers who need enterprise-grade security

**Key Benefits:**
1. **Lower Barrier to Entry**: No need to download wallet apps or manage private keys
2. **Enterprise Security**: Backend-managed key derivation via ARC76 standard
3. **Compliance Focus**: Centralized audit trails and regulatory reporting
4. **Cost Predictability**: Gas fees included in subscription (no surprise costs)
5. **Simplified UX**: Email/password like any SaaS application

## Token Standards Support

### Supported Standards (8 Total)

The platform supports multiple token standards across both AVM and EVM chains:

#### AVM Chain Standards (Algorand, VOI, Aramid)
- **ASA** (Algorand Standard Asset) - Basic fungible/non-fungible tokens
- **ARC3** - NFTs and fractional NFTs with metadata
- **ARC19** - Mutable NFTs with URL-based metadata
- **ARC69** - NFTs with flexible metadata
- **ARC200** - Smart contract tokens (ERC20-compatible, MICA compliant)
- **ARC72** - Advanced NFT standard with royalties

#### EVM Chain Standards (Ethereum, Arbitrum, Base)
- **ERC20** - Fungible tokens
- **ERC721** - Non-fungible tokens (NFTs)

### How Token Operations Work Without Wallets

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                         │
│                                                              │
│  1. User logs in with email/password                        │
│  2. User configures token (name, symbol, supply, etc.)     │
│  3. User clicks "Deploy Token"                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Processing                          │
│                                                              │
│  1. Derive ARC76 account from user credentials              │
│  2. Generate and sign transaction                           │
│  3. Submit to blockchain network                            │
│  4. Monitor transaction status                              │
│  5. Return deployment confirmation                          │
└─────────────────────────────────────────────────────────────┘
```

**Key Point:** The frontend NEVER handles private keys, signing, or direct blockchain interaction.

## ARC76 Account Derivation

### What is ARC76?

ARC76 is a standard for deriving deterministic Algorand accounts from email/password credentials:

```typescript
// Pseudo-code example (actual implementation in backend)
const account = generateAlgorandAccount(
  password: string,
  email: string,
  derivationIndex: number
)
// Returns: Algorand account with predictable address
```

### Security Model

1. **Password Never Stored**: Only used for account derivation
2. **Deterministic**: Same email/password always derives same account
3. **No Private Key Export**: Keys managed entirely by backend
4. **Audit Trail**: All operations logged for compliance

## Token Metadata Display

### Viewing Tokens Without Wallet Connection

Users can view token details through the platform's UI:

- **Token Dashboard** (`/dashboard`) - List of created tokens
- **Token Detail View** (`/tokens/:id`) - Full metadata display
- **Discovery Dashboard** (`/discovery`) - Browse public tokens
- **Marketplace** (`/marketplace`) - Token trading interface

### Metadata Rendering

The platform renders metadata for:
- **Fungible Tokens**: Name, symbol, decimals, total supply
- **NFTs**: Media (images, video), properties/traits, descriptions
- **Compliance Data**: Issuer information, jurisdiction, KYC requirements

**Data Sources:**
- On-chain metadata (IPFS URLs, metadata hash)
- Off-chain metadata (backend-indexed data)
- User-provided metadata (during token creation)

## Token Operations Available

### Creation Operations
- ✅ Create tokens (all 8 standards)
- ✅ Configure metadata
- ✅ Set compliance parameters
- ✅ Batch token creation

### Management Operations
- ✅ View token details
- ✅ Monitor deployment status
- ✅ Track transaction history
- ✅ Generate compliance reports
- ✅ Manage whitelists (for ARC200)

### Operations NOT Available (By Design)
- ❌ Connect external wallet
- ❌ Sign transactions in browser
- ❌ Export private keys
- ❌ Manual gas fee payment
- ❌ Direct blockchain RPC calls

## Frontend Components Architecture

### Token Views (5 Views)
```
src/views/
├── TokenCreator.vue          # Token creation interface
├── TokenCreationWizard.vue   # Multi-step wizard (9 steps)
├── TokenDashboard.vue        # Token portfolio view
├── TokenDetail.vue           # Individual token details
└── TokenStandardsView.vue    # Standards comparison
```

### Token Components (10+ Components)
```
src/components/
├── TokenCard.vue                    # Token display card
├── TokenDetailDrawer.vue            # Expandable detail view
├── TokenUtilityCard.vue             # Utility information
├── TokenComplianceChecklist.vue     # Compliance verification
├── TokenStandardsComparison.vue     # Standards table
├── MarketplaceTokenCard.vue         # Marketplace listing
├── DiscoveryTokenCard.vue           # Discovery interface
├── BatchTokenEntryForm.vue          # Batch creation
└── wizard/steps/
    ├── TokenDetailsStep.vue         # Standard selection
    ├── ComplianceReviewStep.vue     # Compliance check
    ├── MetadataStep.vue             # Metadata config
    └── DeploymentReviewStep.vue     # Final review
```

### Authentication Flow
```
src/stores/auth.ts
├── authenticateWithARC76()    # Email/password login
├── connectWallet()            # Legacy name (actually email login)
└── signOut()                  # Logout

Key State:
- user: AlgorandUser (derived address, email, name)
- isAuthenticated: boolean
- provisioningStatus: AccountProvisioningStatus
```

## Analytics & Instrumentation

### Tracking Events

The platform tracks token operations for analytics:

**TelemetryService** (`src/services/TelemetryService.ts`):
```typescript
- trackTokenWizardStarted()
- trackTokenWizardCompleted()
- trackTokenWizardAbandoned()
- trackBalanceFetch()
- trackTransactionSuccess()
- trackTransactionFailure()
```

**AnalyticsService** (`src/services/analytics.ts`):
```typescript
- trackWizardStepCompleted(step, data)
- trackTokenCreationAttempt(standard, network)
- trackTokenCreationSuccess(tokenId)
- trackTokenCreationFailure(error)
- trackComplianceChecklistUpdate(itemId, completed)
```

### Event Properties Collected

For privacy and compliance, we track:
- Token standard selected
- Network selected
- Completion time
- Error messages (sanitized)
- Step progression

We **DO NOT** track:
- Email addresses
- Account addresses
- Token names/symbols
- User personal data

## API Integration

### Backend Endpoints

Token operations are handled by backend API:

```
POST /api/tokens/deploy
POST /api/tokens/batch
GET  /api/tokens/status/:id
GET  /api/tokens/list
GET  /api/tokens/:id
POST /api/tokens/:id/metadata
GET  /api/compliance/check
```

### Type Safety

TypeScript types defined in `src/types/api.ts`:
```typescript
export enum TokenStandard {
  ERC20 = 'ERC20',
  ARC3 = 'ARC3',
  ARC200 = 'ARC200',
  ARC1400 = 'ARC1400',
}

export interface ERC20DeploymentRequest {
  standard: TokenStandard.ERC20;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  walletAddress: string; // ARC76-derived address
}
```

## Compliance Integration

### MICA Compliance

ARC200 tokens include MICA compliance metadata:
```typescript
export interface MicaComplianceMetadata {
  issuerLegalName: string;
  issuerRegistrationNumber: string;
  issuerJurisdiction: string;
  micaTokenClassification: 'utility' | 'e-money' | 'asset-referenced' | 'other';
  tokenPurpose: string;
  kycRequired: boolean;
  restrictedJurisdictions?: string[];
  complianceContactEmail: string;
}
```

### Whitelist Management

For regulated tokens (ARC200), address whitelists can be managed:
- Backend-managed whitelist storage
- Frontend UI for adding/removing addresses
- Compliance dashboard shows whitelist status

## Testing

### E2E Tests

Token flows are tested with Playwright:

```
e2e/
├── token-utility-recommendations.spec.ts  # Utility recommendations
├── token-wizard-whitelist.spec.ts         # Whitelist integration
└── [additional token tests to be added]
```

### Unit Tests

Component and store tests with Vitest:
```
src/stores/tokens.test.ts
src/stores/tokenCompliance.test.ts
src/components/wizard/steps/__tests__/TokenDetailsStep.test.ts
```

## Common Misconceptions

### ❌ "This platform needs MetaMask integration"
**Reality:** Platform intentionally excludes wallet connectors. Backend handles all blockchain operations.

### ❌ "Users need to sign transactions"
**Reality:** Backend signs transactions using ARC76-derived accounts. Users only need email/password.

### ❌ "We should add WalletConnect support"
**Reality:** This would violate the core architecture and target audience (non-crypto native users).

### ❌ "Token holders need wallets"
**Reality:** Token **creators** don't need wallets. Token **holders** (external users) use their own wallets to receive/hold tokens, but that's outside this platform's scope.

## Adding New Token Standards

### Developer Guide

To add support for a new token standard (e.g., ARC1400, ERC1155):

1. **Update TypeScript Types** (`src/types/api.ts`):
   ```typescript
   export enum TokenStandard {
     // ... existing standards
     ERC1155 = 'ERC1155',
   }
   
   export interface ERC1155DeploymentRequest {
     standard: TokenStandard.ERC1155;
     // ... specific fields
   }
   ```

2. **Add Standard to Wizard** (`src/components/wizard/steps/TokenDetailsStep.vue`):
   ```typescript
   const tokenStandards = [
     // ... existing standards
     {
       value: 'ERC1155',
       label: 'ERC1155',
       description: 'Multi-token standard for fungible and non-fungible tokens',
       badges: ['EVM', 'Multi-Token'],
       chainType: 'EVM',
     },
   ]
   ```

3. **Update Standards Comparison** (`src/components/TokenStandardsComparison.vue`):
   - Add new row to standards table
   - Include feature matrix columns
   - Add use case examples

4. **Add Backend Integration**:
   - Update API endpoint to handle new standard
   - Add deployment logic in backend service
   - Test with backend team

5. **Add Tests**:
   - E2E test for standard selection
   - E2E test for deployment flow
   - Unit tests for validation logic

6. **Update Documentation**:
   - Add standard to this document
   - Update README.md
   - Create migration guide if applicable

## Frequently Asked Questions

### Q: Can users transfer tokens to other addresses?
**A:** Yes, through the backend API. Frontend provides UI for transfers, backend signs and submits transactions.

### Q: How do users receive tokens?
**A:** Tokens are sent to their ARC76-derived address. They can view balances in the dashboard.

### Q: Can users export their private keys?
**A:** No, by design. This is an enterprise platform, not a self-custody wallet.

### Q: What if a user forgets their password?
**A:** Password reset flow exists, but since accounts are deterministically derived, a new password creates a new account. Account recovery requires backend support.

### Q: Are tokens compatible with external wallets?
**A:** Yes! Tokens are standard blockchain assets. External users can hold/trade them in their wallets. The platform just handles **creation**, not holding.

### Q: How do we handle gas fees?
**A:** Gas fees are included in subscription pricing. Backend pays fees and bills aggregate to customers.

### Q: Can enterprise clients deploy to their own infrastructure?
**A:** Yes, enterprise plans include self-hosted deployment options. API keys allow programmatic token creation.

## Related Documentation

- [Business Owner Roadmap](/business-owner-roadmap.md)
- [ARC76 Implementation Summary](/ARC76_IMPLEMENTATION_SUMMARY.md)
- [Non-Wallet Token Creation](/docs/implementations/NON_WALLET_TOKEN_CREATION_FINALIZATION.md)
- [Compliance Dashboard](/COMPLIANCE_DASHBOARD_IMPLEMENTATION.md)
- [Token Standards Guide](/src/components/TokenStandardsComparison.vue)

## Support & Questions

For questions about architecture decisions or implementation guidance:
- Review this document first
- Check business-owner-roadmap.md for strategic context
- Consult with backend team for API changes
- Review existing implementations for patterns

**Remember:** Wallet connectors are **intentionally excluded** from this platform's architecture. Do not add them.
