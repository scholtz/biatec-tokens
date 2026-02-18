# Auth-First Behavior Contract

## Overview

This document defines the behavior contract for the auth-first authentication and token creation flow in Biatec Tokens platform. This contract ensures that the platform maintains its core product principle: **email/password authentication only, with no wallet connectors**.

## Target Audience

**Non-crypto-native enterprise users** - Traditional businesses and professionals who need regulated token issuance without requiring blockchain or wallet knowledge.

## Core Principles

### 1. Email/Password Authentication Only

**Principle**: The platform MUST use email and password authentication exclusively. Wallet connectors (WalletConnect, MetaMask, Pera, Defly, etc.) MUST NOT be presented to users in any authentication or token creation flow.

**Implementation**:
- Authentication handled via ARC76 account derivation from email/password
- Backend provisions accounts automatically
- No wallet connection UI elements in navigation, modals, or forms
- No "Connect Wallet" buttons anywhere on the platform

**Test Coverage**:
- `e2e/auth-first-token-creation.spec.ts` - Lines 115-148: Validates no wallet/network UI elements
- `e2e/auth-first-token-creation.spec.ts` - Lines 150-175: Validates email/password auth elements

**Regression Safeguards**:
- E2E tests explicitly check page content does NOT contain wallet-related strings
- Tests verify "Sign In" button exists, not "Connect Wallet"

### 2. Backend-Driven Token Deployment

**Principle**: All token creation and deployment operations MUST be handled by backend services. Users NEVER sign transactions in their browser or approve operations in a wallet.

**Implementation**:
- Frontend sends deployment requests to backend API
- Backend handles all blockchain interactions
- Users see deployment status updates, not transaction signing prompts
- ARC14 session tokens authorize backend operations

**Test Coverage**:
- `src/services/__tests__/TokenDeploymentService.test.ts` - Backend deployment request/response contracts
- `src/services/__tests__/AccountProvisioningService.test.ts` - Account provisioning and entitlements

**Regression Safeguards**:
- No transaction signing UI components in codebase
- API client enforces backend-only deployment pattern

### 3. Auth-First Routing

**Principle**: Protected routes (token creation, deployment, compliance) MUST enforce authentication BEFORE access. Unauthenticated users are redirected to login with clear messaging.

**Implementation**:
- Router guard checks `requiresAuth: true` metadata on routes
- Unauthenticated users redirected to `/?showAuth=true`
- Redirect target preserved in `AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH`
- Auth state persists across page reloads via localStorage

**Protected Routes**:
- `/create` - Advanced token creator
- `/launch/guided` - Guided token launch wizard
- `/compliance/*` - Compliance dashboard and workflows
- `/settings` - User settings
- `/cockpit` - Lifecycle cockpit
- `/dashboard` - Token dashboard

**Test Coverage**:
- `src/router/auth-guard.test.ts` - 17 tests covering auth guard logic
- `e2e/auth-first-token-creation.spec.ts` - Lines 30-69: Unauthenticated redirect validation
- `e2e/auth-first-token-creation.spec.ts` - Lines 71-113: Authenticated access validation

**Regression Safeguards**:
- Integration tests ensure all protected routes enforce auth
- E2E tests verify redirect behavior for unauthenticated users

### 4. ARC76 Deterministic Account Derivation

**Principle**: User accounts MUST be derived deterministically from email and password using ARC76 standard. The same email/password combination ALWAYS produces the same Algorand address.

**Implementation**:
- `generateAlgorandAccount(password, email, 1)` from arc76 library
- Derivation index defaulted to 1 for consistency
- Address stored in auth store after successful derivation
- Backend provisions account automatically after derivation

**Test Coverage**:
- `src/stores/auth.test.ts` - Lines 288-336: ARC76 deterministic behavior
- `e2e/arc76-validation.spec.ts` - 5 tests validating ARC76 account derivation

**Regression Safeguards**:
- Unit tests verify deterministic address generation
- Integration tests ensure same email/password produces same address across sessions

### 5. Compliance-First Token Creation

**Principle**: Token creation workflows MUST surface compliance requirements (MICA, KYC, jurisdiction restrictions) at appropriate stages. Compliance validation happens BEFORE deployment.

**Implementation**:
- Guided launch wizard includes compliance setup step
- MICA classification required for all tokens
- Whitelist management integrated with token creation
- Compliance dashboard tracks regulatory status

**Test Coverage**:
- `e2e/compliance-auth-first.spec.ts` - 7 tests for auth-first compliance flows
- `src/services/__tests__/ComplianceService.test.ts` - 1014 lines of compliance service tests
- `src/utils/mica-compliance.ts` - MICA classification and validation logic

**Regression Safeguards**:
- E2E tests verify compliance gating in token creation flow
- Unit tests ensure MICA classification validation

## API Contracts

### Account Provisioning API

**Endpoint**: `POST /api/v1/accounts/provision`

**Request**:
```typescript
interface AccountProvisioningRequest {
  email: string;
  derivedAddress: string;
  derivationIndex?: number;
}
```

**Response**:
```typescript
interface AccountProvisioningResponse {
  status: 'active' | 'pending' | 'failed';
  account: {
    address: string;
    email: string;
    entitlements: string[]; // Must include 'token_deployment'
  };
  metadata: {
    derivedAddress: string;
    derivationIndex: number;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Validation**: 
- Email must be valid format
- Derived address must be valid Algorand address
- Derivation index defaults to 1

**Test Coverage**: `src/services/__tests__/AccountProvisioningService.test.ts`

### Token Deployment API

**Endpoint**: `POST /api/v1/tokens/deploy`

**Request** (varies by standard):
```typescript
// ERC20 Example
interface ERC20DeploymentRequest {
  standard: 'ERC20';
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  walletAddress: string; // Backend-managed wallet
}

// ARC3 Example
interface ARC3DeploymentRequest {
  standard: 'ARC3';
  name: string;
  unitName: string;
  total: number;
  metadataUrl?: string;
  walletAddress: string;
}
```

**Response**:
```typescript
interface TokenDeploymentResponse {
  success: boolean;
  transactionId?: string;
  tokenId?: string;
  contractAddress?: string;
  error?: string;
  errorCode?: string;
  timestamp: string;
}
```

**Test Coverage**: `src/services/__tests__/TokenDeploymentService.test.ts`

## State Management

### Auth Store State

**File**: `src/stores/auth.ts`

**State Properties**:
- `user: AlgorandUser | null` - Current authenticated user
- `isConnected: boolean` - Connection status
- `arc76email: string | null` - Email used for ARC76 derivation
- `provisioningStatus: AccountProvisioningStatus` - Account provisioning state
- `loading: boolean` - Loading state for async operations

**Computed Properties**:
- `isAuthenticated` - Returns `true` when `user` exists AND `isConnected` is true
- `isAccountReady` - Returns `true` when authenticated, provisioned, and `canDeploy` is true

**Persistence**: All state persists to localStorage for session continuity

**Test Coverage**: `src/stores/auth.test.ts` - 24 tests

## Deployment Flow

### End-to-End Token Creation Flow

1. **User Authentication**
   - User enters email/password on home page
   - Frontend derives Algorand address using ARC76
   - Frontend provisions account on backend
   - Auth store updated with user data and provisioning status

2. **Navigate to Token Creation**
   - User clicks "Create Token" or "Guided Launch"
   - Router guard checks authentication
   - If authenticated, user accesses token creation UI
   - If not authenticated, redirected to `/?showAuth=true`

3. **Token Configuration**
   - User selects token standard (ERC20, ARC3, etc.)
   - User fills in token metadata
   - User configures compliance settings (MICA classification, jurisdiction restrictions)
   - User selects whitelist (if required)

4. **Backend Deployment**
   - Frontend sends deployment request to backend API
   - Backend validates request using session token (ARC14)
   - Backend deploys token to blockchain
   - Backend returns deployment status and transaction ID

5. **Status Monitoring**
   - Frontend polls deployment status
   - User sees real-time deployment progress
   - Upon completion, user sees success confirmation
   - Token appears in dashboard

**Test Coverage**: `e2e/auth-first-token-creation.spec.ts` - Complete auth-first journey

## Error Handling

### Authentication Errors

**Scenarios**:
- Invalid email/password combination
- Account provisioning failure
- Backend API unavailable

**Handling**:
- Clear error messages displayed to user
- Errors logged to audit trail service
- User remains on authentication screen with retry option

### Deployment Errors

**Scenarios**:
- Insufficient backend wallet balance
- Invalid token configuration
- Network congestion
- Contract deployment failure

**Handling**:
- Error response includes `error` and `errorCode` fields
- Frontend displays user-friendly error message
- Deployment status updated to "failed"
- User can retry deployment with corrected configuration

## Quality Requirements

### Unit Test Coverage

**Minimum Coverage Thresholds**:
- Statements: ≥78%
- Branches: ≥68.5%
- Functions: ≥68.5%
- Lines: ≥79%

**Critical Components**:
- Auth store: 24+ tests
- Router guard: 17+ tests
- Account provisioning service: 20+ tests
- Token deployment service: 30+ tests
- Compliance service: 50+ tests

### E2E Test Coverage

**Critical Flows**:
- Auth-first token creation journey (8 tests)
- ARC76 validation (5 tests)
- Compliance auth-first flows (7 tests)
- Lifecycle cockpit (11 tests)
- Whitelist management (14 tests)

**CI Requirements**:
- All critical E2E tests must run in CI
- No skipped tests for MVP-critical scenarios
- Tests must use deterministic waits, not arbitrary timeouts
- Fail-fast behavior when auth/deployment/compliance regressions appear

### PR Quality Requirements

**Every PR Must Include**:
1. **Issue Linkage**: Reference to GitHub issue number
2. **Business Value Statement**: Explanation of how changes support product roadmap
3. **Risk Assessment**: Technical and business risks identified
4. **Test Matrix**: Breakdown of unit/integration/E2E tests covering changes
5. **Acceptance Criteria Mapping**: Each AC mapped to implementation and tests
6. **Before/After Evidence**: Screenshots or log snippets for UX changes

## Regression Safeguards

### Automated Checks

**E2E Tests**:
- `e2e/auth-first-token-creation.spec.ts::should not display wallet/network UI elements`
  - Checks page content does NOT contain: WalletConnect, MetaMask, Pera Wallet, Defly
  - Checks page content does NOT contain: "Not connected", "Connect Wallet"
  
- `e2e/auth-first-token-creation.spec.ts::should show email/password authentication elements`
  - Checks page contains "Sign In" button
  - Checks page does NOT contain wallet-related buttons

**Unit Tests**:
- Router guard tests ensure all protected routes require authentication
- Auth store tests ensure deterministic ARC76 derivation

### Manual Review Checklist

**Before Merging Code**:
- [ ] No wallet connector UI components added to codebase
- [ ] No transaction signing prompts in frontend
- [ ] All protected routes enforce `requiresAuth: true`
- [ ] Email/password authentication remains primary method
- [ ] Backend handles all token deployment operations
- [ ] E2E tests for auth-first flow still passing

## Business Roadmap Alignment

**Product Vision**: Biatec Tokens is positioned as a regulated tokenization SaaS platform for traditional businesses that need compliant token issuance without wallet complexity.

**Target Customer**: Non-crypto-native enterprise users who evaluate platforms based on:
- Ease of onboarding (email/password, not wallet setup)
- Regulatory compliance (MICA readiness)
- Operational simplicity (backend-driven deployment)
- Trust and transparency (audit trails, compliance dashboards)

**Revenue Impact**: 
- Auth-first flow reduces onboarding friction → higher conversion rate
- No wallet requirement expands addressable market to non-crypto users
- Compliance-first approach enables enterprise sales → $2.5M ARR target

**Competitive Advantage**:
- Most competitors require wallet setup → high friction for traditional businesses
- Biatec Tokens eliminates crypto complexity → faster time-to-value
- Robust compliance tooling → enterprise-grade trust

## Compliance & Audit Trail

### Audit Logging

**Events Logged**:
- User authentication (email login)
- Account provisioning
- Token deployment requests
- Token deployment completions
- Compliance validation results
- Whitelist modifications

**Audit Trail Service**: `src/services/AuditTrailService.ts`

**Storage**: All audit events persisted to backend for compliance reporting

### MICA Compliance

**Required Fields**:
- Issuer legal name
- Issuer jurisdiction
- MICA token classification (utility, e-money, asset-referenced, other)
- KYC requirements
- Restricted jurisdictions
- Compliance contact email
- Whitepaper URL

**Validation**: `src/utils/mica-compliance.ts`

**Test Coverage**: E2E tests validate MICA compliance forms in token creation wizard

## Monitoring & Observability

### Telemetry Events

**Auth Events**:
- `auth.email_login_initiated`
- `auth.arc76_derivation_complete`
- `auth.account_provisioned`
- `auth.session_restored`
- `auth.logout`

**Deployment Events**:
- `deployment.token_creation_started`
- `deployment.validation_failed`
- `deployment.backend_request_sent`
- `deployment.deployment_complete`
- `deployment.deployment_failed`

**Compliance Events**:
- `compliance.mica_classification_set`
- `compliance.whitelist_assigned`
- `compliance.jurisdiction_restriction_added`

**Service**: `src/services/TelemetryService.ts`

## Future Enhancements

### Phase 2 (Q2 2025)
- Enhanced MICA compliance dashboards
- Advanced whitelist management
- KYC/AML provider integrations

### Phase 3 (Q3-Q4 2025)
- Multi-user enterprise accounts
- Role-based access control
- Advanced audit reporting

**Constraint**: All future enhancements MUST maintain auth-first principle. No wallet connectors.

## References

- **Product Roadmap**: `/business-owner-roadmap.md`
- **Copilot Instructions**: `/.github/copilot-instructions.md`
- **Auth Store Implementation**: `/src/stores/auth.ts`
- **Router Guard Implementation**: `/src/router/index.ts`
- **E2E Test Suite**: `/e2e/auth-first-token-creation.spec.ts`

## Changelog

- **2026-02-18**: Initial behavior contract created
- Document defines auth-first principles, API contracts, test coverage, and regression safeguards
- Establishes quality requirements for PRs and CI
