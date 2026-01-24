# MICA Wallet Integration Checklist & Acceptance Criteria

## Executive Summary

This document provides a comprehensive, vision-aligned checklist for integrating key wallet providers (Pera, Defly, Biatec, and others) into the MICA-compliant dashboard on Biatec Tokens platform. It covers UX flows for whitelisting and token issuance, along with performance and security considerations specific to Algorand-based networks (VOI, Aramid).

**Target Audience:** Development team, Product Owners, Compliance Officers  
**Scope:** Wallet integration for MICA-compliant token management  
**Networks:** VOI Mainnet, Aramid Mainnet, Dockernet (development)

---

## Table of Contents

1. [Current Implementation Status](#current-implementation-status)
2. [Wallet Integration Checklist](#wallet-integration-checklist)
3. [UX Flow: Whitelisting](#ux-flow-whitelisting)
4. [UX Flow: Token Issuance](#ux-flow-token-issuance)
5. [Performance Considerations](#performance-considerations)
6. [Security Considerations](#security-considerations)
7. [Acceptance Criteria](#acceptance-criteria)
8. [Testing Requirements](#testing-requirements)
9. [Compliance Verification](#compliance-verification)

---

## Current Implementation Status

### ✅ Completed Features

**Wallet Integration Foundation:**
- [x] Multi-wallet support via `@txnlab/use-wallet-vue`
- [x] Wallet providers: Biatec, Pera, Defly, Exodus, Kibisis, Lute
- [x] WalletConnect integration with projectId configuration
- [x] Persistent wallet connections (localStorage)
- [x] Automatic reconnection on page reload
- [x] Network-aware wallet management

**Network Support:**
- [x] VOI Mainnet configuration (mainnet-api.voi.nodely.dev)
- [x] Aramid Mainnet configuration (algod.aramidmain.a-wallet.net)
- [x] Dockernet for local development
- [x] Network switching with wallet disconnection
- [x] Network-specific genesis ID and CAIP chain ID

**MICA Compliance Features:**
- [x] MICA whitelist management dashboard
- [x] Whitelist CRUD operations with audit trail
- [x] KYC verification tracking
- [x] Compliance score calculation
- [x] CSV bulk import/export for whitelist addresses
- [x] Audit trail with reason, requester, timestamp
- [x] Compliance report generation (JSON/CSV)

**UI Components:**
- [x] `WalletConnectModal.vue` - Modal for wallet selection
- [x] `NetworkSwitcher.vue` - Network selection component
- [x] `MicaDashboardSummary.vue` - MICA compliance metrics
- [x] `MicaWhitelistManagement.vue` - Whitelist administration

**State Management:**
- [x] `useWalletManager` composable for wallet operations
- [x] Auth store integration for wallet state
- [x] Reactive wallet state management
- [x] Error handling and retry logic

### 🔄 In Progress / Gaps Identified

**MICA-Specific Wallet Integration:**
- [ ] Wallet-based whitelist address validation
- [ ] Wallet address verification against whitelist before token operations
- [ ] Real-time whitelist status display in wallet UI
- [ ] Wallet-initiated whitelist application workflow
- [ ] Multi-signature wallet support for enterprise whitelisting

**Enhanced UX Flows:**
- [ ] Streamlined wallet connection → whitelist verification → token operation flow
- [ ] Progressive disclosure for MICA compliance requirements
- [ ] User education tooltips for MICA terminology
- [ ] Wallet-specific feature detection and messaging

**Performance Optimizations:**
- [ ] Lazy loading of wallet provider libraries
- [ ] Connection state caching and optimization
- [ ] Batch transaction support for whitelist operations

**Security Enhancements:**
- [ ] Hardware wallet support (Ledger via Pera/Defly)
- [ ] Multi-factor authentication for sensitive operations
- [ ] Rate limiting for wallet connection attempts
- [ ] Suspicious activity detection and alerting

---

## Wallet Integration Checklist

### Phase 1: Core Wallet Integration (COMPLETED ✅)

#### 1.1 Wallet Provider Setup
- [x] **Biatec Wallet** - Enterprise wallet with WalletConnect
  - [x] Configure WalletConnect projectId
  - [x] Test connection on VOI Mainnet
  - [x] Test connection on Aramid Mainnet
  - [x] Verify transaction signing
  
- [x] **Pera Wallet** - Popular mobile/web wallet
  - [x] Add Pera SDK integration
  - [x] Test QR code connection flow
  - [x] Test deep link connection (mobile)
  - [x] Verify transaction signing
  
- [x] **Defly Wallet** - Feature-rich Algorand wallet
  - [x] Add Defly SDK integration
  - [x] Test connection flow
  - [x] Verify transaction signing
  - [x] Test multi-account support

- [x] **Additional Wallets**
  - [x] Exodus - Multi-chain wallet
  - [x] Kibisis - Browser extension
  - [x] Lute - Lightweight wallet

#### 1.2 Network Configuration
- [x] VOI Mainnet endpoint configuration
- [x] Aramid Mainnet endpoint configuration
- [x] Dockernet (local development) configuration
- [x] Genesis ID verification for each network
- [x] CAIP chain ID configuration for WalletConnect

#### 1.3 Connection Management
- [x] WalletConnectModal component implementation
- [x] Wallet selection UI with icons and descriptions
- [x] Network selection during connection
- [x] Connection state persistence
- [x] Automatic reconnection logic
- [x] Graceful disconnection handling
- [x] Error handling for failed connections

#### 1.4 State Management
- [x] useWalletManager composable implementation
- [x] Reactive wallet state (isConnected, activeAddress, etc.)
- [x] Auth store integration
- [x] Multi-account support
- [x] Account switching functionality

### Phase 2: MICA Compliance Integration (IN PROGRESS 🔄)

#### 2.1 Whitelist Integration with Wallet
- [ ] **Address Validation on Connection**
  - [ ] Check if connected wallet address is whitelisted
  - [ ] Display whitelist status in wallet UI
  - [ ] Show compliance score for connected address
  - [ ] Provide whitelist application link if not whitelisted

- [ ] **Wallet-Initiated Whitelist Application**
  - [ ] "Apply for Whitelist" button in wallet modal
  - [ ] Pre-fill application form with connected address
  - [ ] Guide user through KYC/AML verification process
  - [ ] Show application status tracking

- [ ] **Whitelist Status Indicators**
  - [ ] Badge/icon showing whitelist status in header
  - [ ] Real-time status updates
  - [ ] Tooltip explaining whitelist requirements
  - [ ] Link to MICA compliance documentation

#### 2.2 Token Operations with Wallet
- [ ] **Pre-Transaction Validation**
  - [ ] Verify sender address is whitelisted (if required)
  - [ ] Verify recipient address is whitelisted (if required)
  - [ ] Display compliance warnings before transaction
  - [ ] Block non-compliant transactions with clear messaging

- [ ] **Token Issuance Flow**
  - [ ] Connect wallet
  - [ ] Verify issuer is whitelisted (for RWA tokens)
  - [ ] Select token standard (with MICA compliance indicators)
  - [ ] Configure token parameters
  - [ ] Review compliance implications
  - [ ] Sign and submit transaction
  - [ ] Track transaction status
  - [ ] Confirm successful issuance

- [ ] **Token Transfer Flow**
  - [ ] Connect wallet
  - [ ] Select token to transfer
  - [ ] Validate sender whitelist status
  - [ ] Enter recipient address
  - [ ] Validate recipient whitelist status
  - [ ] Show compliance status for transfer
  - [ ] Confirm transaction details
  - [ ] Sign and submit transaction
  - [ ] Track transaction status

#### 2.3 Compliance Dashboard Integration
- [ ] **Wallet-Specific Dashboard**
  - [ ] Show tokens owned by connected wallet
  - [ ] Display whitelist status prominently
  - [ ] Show compliance score for wallet
  - [ ] List recent transactions with compliance status
  - [ ] Show pending whitelist applications

- [ ] **MICA Summary Widget**
  - [ ] Total whitelisted addresses
  - [ ] Whitelist status for connected wallet
  - [ ] Recent whitelist approvals/rejections
  - [ ] Compliance score trend
  - [ ] Link to full whitelist management

### Phase 3: Enhanced User Experience (PLANNED 📋)

#### 3.1 Progressive Disclosure
- [ ] **First-Time User Flow**
  - [ ] Welcome screen explaining MICA requirements
  - [ ] Interactive tutorial for wallet connection
  - [ ] Guided walkthrough of whitelist process
  - [ ] Contextual help for token operations

- [ ] **Contextual Guidance**
  - [ ] Tooltips for MICA terminology
  - [ ] Inline help for compliance requirements
  - [ ] Links to regulatory documentation
  - [ ] Video tutorials for complex operations

#### 3.2 Error Handling & Recovery
- [ ] **Graceful Error Messages**
  - [ ] User-friendly error descriptions
  - [ ] Actionable recovery steps
  - [ ] Support contact information
  - [ ] Error logging for debugging

- [ ] **Connection Issues**
  - [ ] Automatic retry with exponential backoff
  - [ ] Clear messaging for network problems
  - [ ] Fallback options (e.g., manual address entry)
  - [ ] Network status indicator

#### 3.3 Accessibility
- [ ] **WCAG 2.1 AA Compliance**
  - [ ] Keyboard navigation for all wallet operations
  - [ ] Screen reader support with ARIA labels
  - [ ] High contrast mode support
  - [ ] Focus indicators for interactive elements

- [ ] **Internationalization**
  - [ ] English language support (primary)
  - [ ] Multi-language readiness (i18n infrastructure)
  - [ ] Date/time formatting per locale
  - [ ] Number formatting per locale

### Phase 4: Performance & Optimization (PLANNED 📋)

#### 4.1 Loading Performance
- [ ] **Lazy Loading**
  - [ ] Lazy load wallet provider SDKs
  - [ ] Code splitting for wallet components
  - [ ] Defer non-critical wallet features
  - [ ] Progressive image loading for wallet logos

- [ ] **Caching Strategy**
  - [ ] Cache wallet connection state
  - [ ] Cache whitelist status (with TTL)
  - [ ] Cache network configuration
  - [ ] Service worker for offline support

#### 4.2 Network Performance
- [ ] **Request Optimization**
  - [ ] Batch whitelist status checks
  - [ ] Debounce address validation requests
  - [ ] Use HTTP/2 multiplexing
  - [ ] Implement request prioritization

- [ ] **VOI/Aramid Specific Optimizations**
  - [ ] Optimize for VOI's fast block times (~1s)
  - [ ] Optimize for Aramid's architecture
  - [ ] Network-specific transaction batching
  - [ ] Algod API rate limit handling

### Phase 5: Security & Compliance (ONGOING 🔒)

#### 5.1 Security Best Practices
- [x] **No Private Key Storage**
  - [x] All signing via wallet providers
  - [x] No private keys in localStorage
  - [x] No private keys in state management
  - [x] Clear security warnings in UI

- [ ] **Hardware Wallet Support**
  - [ ] Ledger support via Pera Wallet
  - [ ] Ledger support via Defly Wallet
  - [ ] Hardware wallet detection and messaging
  - [ ] Enhanced security indicators for hardware wallets

- [ ] **Transaction Security**
  - [ ] Transaction preview before signing
  - [ ] Clear display of transaction details
  - [ ] Warning for unusual transactions
  - [ ] Transaction amount confirmation
  - [ ] Transaction fee estimation and warnings

#### 5.2 MICA Compliance Features
- [ ] **Audit Trail**
  - [x] Log all wallet connections (timestamp, wallet ID)
  - [x] Log all whitelist operations (add/remove, reason, requester)
  - [ ] Log all token issuance operations
  - [ ] Log all token transfers
  - [ ] Export audit logs for regulatory reporting

- [ ] **Data Protection (GDPR)**
  - [x] Minimal data collection (only necessary fields)
  - [ ] User consent for data processing
  - [ ] Data deletion capabilities ("right to be forgotten")
  - [ ] Privacy policy compliance
  - [ ] Data export capabilities

- [ ] **AML/KYC Integration**
  - [x] KYC verification status tracking
  - [x] Sanctions screening flag
  - [ ] Integration with KYC provider API
  - [ ] Automated compliance checks
  - [ ] Regulatory reporting exports

---

## UX Flow: Whitelisting

### Flow 1: New User Whitelist Application

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHITELIST APPLICATION FLOW                    │
└─────────────────────────────────────────────────────────────────┘

1. USER LANDS ON PLATFORM
   ├─> Sees MICA compliance badge
   ├─> Prompted to "Connect Wallet" to proceed
   └─> Educational tooltip: "MICA requires identity verification"

2. CONNECT WALLET
   ├─> Click "Connect Wallet" button
   ├─> WalletConnectModal opens
   ├─> Select Network (VOI/Aramid)
   ├─> Choose Wallet Provider (Pera/Defly/Biatec)
   ├─> Approve connection in wallet app
   └─> Connection confirmed with address display

3. WHITELIST CHECK
   ├─> System automatically checks if address is whitelisted
   ├─> Display results:
   │   ├─> ✅ "Whitelisted" → Proceed to dashboard
   │   ├─> ⏳ "Pending" → Show application status
   │   └─> ❌ "Not Whitelisted" → Prompt to apply
   └─> Show compliance score if whitelisted

4. WHITELIST APPLICATION (If not whitelisted)
   ├─> Banner: "⚠️ Whitelist required for token operations"
   ├─> Click "Apply for Whitelist" button
   ├─> Redirect to Whitelist Application Form
   │   ├─> Pre-filled with wallet address
   │   ├─> Request: Full Name
   │   ├─> Request: Email
   │   ├─> Request: Jurisdiction (Country)
   │   ├─> Request: KYC Document Upload
   │   ├─> Request: Reason for Access
   │   └─> Request: Requester Name/Organization
   ├─> Review terms and conditions
   ├─> Submit application
   └─> Confirmation: "Application submitted. Expected review time: 2-5 business days"

5. PENDING STATE
   ├─> Dashboard shows "⏳ Whitelist Pending" badge
   ├─> Limited functionality (view-only mode)
   ├─> Email notification sent when status changes
   └─> Can track application status in dashboard

6. APPROVAL
   ├─> Email notification: "Whitelist Approved"
   ├─> Dashboard updates: "✅ Whitelisted" badge
   ├─> Full platform access granted
   └─> Can now perform token operations

7. REJECTION (If applicable)
   ├─> Email notification: "Whitelist Denied - [Reason]"
   ├─> Dashboard shows rejection reason
   ├─> Option to re-apply or appeal
   └─> Support contact information provided
```

### Flow 2: Whitelisted User Token Operation

```
┌─────────────────────────────────────────────────────────────────┐
│              WHITELISTED USER TOKEN OPERATION FLOW               │
└─────────────────────────────────────────────────────────────────┘

1. CONNECT WALLET
   ├─> Click "Connect Wallet"
   ├─> Select Network & Wallet
   ├─> Approve connection
   └─> ✅ Whitelist status verified automatically

2. DASHBOARD VIEW
   ├─> Header shows: "✅ Whitelisted" badge
   ├─> Compliance score displayed (e.g., "92/100")
   ├─> Recent activity log
   └─> Available actions enabled

3. TOKEN OPERATION (e.g., Transfer)
   ├─> Click "Transfer Tokens"
   ├─> Select token to transfer
   ├─> Enter recipient address
   ├─> System validates recipient address
   │   ├─> ✅ Whitelisted → Proceed
   │   └─> ❌ Not Whitelisted → Show warning
   │       └─> Option: "Send Whitelist Invite to Recipient"
   ├─> Enter amount
   ├─> Review transaction details
   │   ├─> Sender: [Your Address] ✅
   │   ├─> Recipient: [Address] [Status]
   │   ├─> Amount: [Value]
   │   ├─> Network: VOI/Aramid
   │   ├─> Estimated Fee: [Network fee]
   │   └─> Compliance Status: [OK/Warning]
   ├─> Click "Confirm Transfer"
   ├─> Wallet prompts for transaction signature
   ├─> Sign transaction in wallet
   ├─> Transaction submitted to network
   ├─> Track transaction status
   │   ├─> ⏳ Pending
   │   ├─> ⏳ Confirming (VOI: ~1-2 seconds, Aramid: ~3-5 seconds)
   │   └─> ✅ Confirmed
   └─> Success notification with transaction ID

4. AUDIT TRAIL
   ├─> Transaction logged in compliance dashboard
   ├─> Audit record includes:
   │   ├─> Timestamp
   │   ├─> Transaction ID
   │   ├─> Sender address
   │   ├─> Recipient address
   │   ├─> Amount
   │   ├─> Network
   │   └─> Compliance status
   └─> Exportable for regulatory reporting
```

### Flow 3: Enterprise Bulk Whitelisting

```
┌─────────────────────────────────────────────────────────────────┐
│                 ENTERPRISE BULK WHITELIST FLOW                   │
└─────────────────────────────────────────────────────────────────┘

1. ENTERPRISE ADMIN CONNECTS
   ├─> Connect wallet with admin privileges
   ├─> Navigate to "MICA Whitelist Management"
   └─> Verify enterprise subscription active

2. BULK IMPORT
   ├─> Click "Import CSV" button
   ├─> Download CSV template
   │   ├─> Columns: Address, Name, Email, Jurisdiction, KYC_Status, Reason
   │   └─> Example rows provided
   ├─> Fill CSV with addresses to whitelist
   ├─> Upload CSV file
   ├─> System validates CSV
   │   ├─> Check address format (Algorand: 58-char base32; Ethereum: 0x + 40 hex)
   │   ├─> Check required fields
   │   └─> Check for duplicates
   ├─> Show preview of addresses to be added
   ├─> Confirm bulk import
   └─> System processes addresses (background job)

3. PROCESSING
   ├─> Progress indicator shows processing status
   ├─> Addresses added one by one
   ├─> Each address gets audit trail entry
   └─> Errors logged for manual review

4. COMPLETION
   ├─> Summary report:
   │   ├─> Total addresses processed: [N]
   │   ├─> Successfully added: [M]
   │   ├─> Errors: [P]
   │   └─> Duplicates skipped: [Q]
   ├─> Export error log if errors occurred
   └─> Notification sent to admin

5. AUDIT & EXPORT
   ├─> View updated whitelist dashboard
   ├─> Export compliance report (JSON/CSV)
   ├─> Review audit trail
   └─> Generate regulatory report
```

---

## UX Flow: Token Issuance

### Flow 1: RWA Token Issuance (MICA-Compliant)

```
┌─────────────────────────────────────────────────────────────────┐
│                    RWA TOKEN ISSUANCE FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. PREREQUISITE: WHITELISTED ISSUER
   ├─> Connect wallet
   ├─> Verify issuer address is whitelisted
   └─> If not whitelisted: Block with "Apply for Whitelist" prompt

2. START TOKEN CREATION
   ├─> Navigate to "Create Token"
   ├─> Presented with token standard options
   │   ├─> ASA (Basic)
   │   ├─> ARC3 Fungible (Recommended for RWA)
   │   ├─> ARC3 NFT
   │   ├─> ARC200
   │   └─> ERC20 (Ethereum-compatible)
   ├─> Each option shows MICA compliance badge (✅/⚠️)
   └─> Select "ARC3 Fungible" for RWA token

3. SELECT RWA PRESET (Optional)
   ├─> Show available RWA compliance presets:
   │   ├─> "Real Estate Token" (Whitelist enabled, jurisdiction restrictions)
   │   ├─> "Security Token" (Partition support, transfer restrictions)
   │   ├─> "E-Money Token" (MICA e-money requirements)
   │   └─> "Custom" (Manual configuration)
   ├─> Select preset or start from scratch
   └─> Preset auto-configures compliance features

4. CONFIGURE TOKEN PARAMETERS
   ├─> Basic Information:
   │   ├─> Token Name (e.g., "Real Estate Investment Token")
   │   ├─> Symbol (e.g., "REIT")
   │   ├─> Decimals (e.g., 6)
   │   └─> Total Supply (e.g., 1,000,000)
   ├─> MICA Compliance Settings:
   │   ├─> Enable Whitelist: ✅ Yes / ❌ No
   │   ├─> Transfer Restrictions: None / Whitelist Only / Accredited Only
   │   ├─> Jurisdiction: [Select Country/Region]
   │   ├─> KYC Required: ✅ Yes / ❌ No
   │   └─> Issuer Controls: Freeze / Clawback / Pause
   ├─> Metadata (ARC3):
   │   ├─> Description
   │   ├─> Image URL (IPFS)
   │   ├─> External URL
   │   └─> Additional Properties (JSON)
   └─> Review compliance implications:
       └─> "⚠️ This token requires holders to be whitelisted"

5. NETWORK SELECTION
   ├─> Choose deployment network:
   │   ├─> VOI Mainnet (Recommended for production)
   │   ├─> Aramid Mainnet (Alternative)
   │   └─> Dockernet (Testing only)
   ├─> Show network-specific considerations:
   │   ├─> VOI: Fast confirmation (~1s), lower fees
   │   └─> Aramid: Enterprise features, compliance tools
   └─> Confirm network selection

6. REVIEW & CONFIRM
   ├─> Summary page showing:
   │   ├─> Token details
   │   ├─> Compliance settings
   │   ├─> Network selection
   │   ├─> Estimated gas fees
   │   └─> Deployment cost breakdown
   ├─> Compliance checklist:
   │   ├─> ✅ Issuer is whitelisted
   │   ├─> ✅ MICA compliance settings configured
   │   ├─> ✅ Audit trail will be generated
   │   └─> ✅ Regulatory reporting enabled
   ├─> Terms and conditions checkbox
   └─> Click "Deploy Token"

7. WALLET SIGNATURE
   ├─> Wallet prompts for transaction signature
   ├─> Display transaction details:
   │   ├─> Transaction type: "Asset Creation"
   │   ├─> Network: [Selected Network]
   │   ├─> Fee: [Amount]
   │   └─> Issuer: [Your Address]
   ├─> User reviews and approves in wallet
   └─> Transaction signed

8. DEPLOYMENT
   ├─> Transaction submitted to network
   ├─> Progress indicator:
   │   ├─> ⏳ Submitting transaction...
   │   ├─> ⏳ Waiting for confirmation...
   │   └─> ✅ Transaction confirmed
   ├─> Token ID generated
   └─> Deployment details displayed

9. POST-DEPLOYMENT
   ├─> Success screen:
   │   ├─> Token ID: [Asset ID]
   │   ├─> Transaction ID: [Txn Hash]
   │   ├─> Network: [VOI/Aramid]
   │   └─> "View Token Details" button
   ├─> Token added to dashboard
   ├─> Audit trail entry created
   ├─> Notification sent (if enabled)
   └─> Options:
       ├─> "Manage Whitelist" (if whitelist enabled)
       ├─> "View Compliance Report"
       ├─> "Share Token Information"
       └─> "Create Another Token"

10. COMPLIANCE DASHBOARD UPDATE
    ├─> Token appears in "My Tokens" list
    ├─> Compliance metrics updated
    ├─> Whitelist management available (if enabled)
    └─> Audit trail accessible
```

### Flow 2: Standard Token Issuance (Non-MICA)

```
┌─────────────────────────────────────────────────────────────────┐
│               STANDARD TOKEN ISSUANCE FLOW (Basic)               │
└─────────────────────────────────────────────────────────────────┘

1. CONNECT WALLET
   ├─> Connect wallet (no whitelist required)
   └─> Proceed to token creation

2. SELECT TOKEN STANDARD
   ├─> Choose: ASA, ARC3, ARC200, ERC20, etc.
   ├─> No MICA preset selection
   └─> Standard configuration only

3. CONFIGURE TOKEN
   ├─> Basic parameters (name, symbol, decimals, supply)
   ├─> No MICA compliance settings
   └─> Standard metadata (optional)

4. REVIEW & DEPLOY
   ├─> Review token details
   ├─> Approve transaction in wallet
   ├─> Submit to network
   └─> Receive token ID

5. COMPLETION
   ├─> Token created successfully
   ├─> View in dashboard
   └─> No compliance requirements
```

---

## Performance Considerations

### VOI Network-Specific Optimizations

**Network Characteristics:**
- **Block Time:** ~1 second (ultra-fast finality)
- **TPS:** High throughput
- **Fee Structure:** Low transaction fees
- **Consensus:** Pure Proof-of-Stake

**Optimizations:**
1. **Fast Confirmation Handling**
   - Implement optimistic UI updates
   - Show pending state for 1-2 seconds max
   - Use VOI's fast finality for UX advantage
   - Reduce polling intervals (1-2s instead of 5-10s)

2. **Transaction Batching**
   - Batch multiple whitelist additions in single transaction
   - Group token operations where possible
   - Reduce overall transaction costs

3. **Caching Strategy**
   - Cache whitelist status with 30-second TTL
   - Cache token metadata with longer TTL (5 minutes)
   - Invalidate cache on user-initiated changes
   - Use service worker for offline data access

4. **API Request Optimization**
   - Use VOI's Algod API efficiently
   - Implement request deduplication
   - Batch status checks for multiple addresses
   - Use indexer for historical data queries

### Aramid Network-Specific Optimizations

**Network Characteristics:**
- **Block Time:** ~3-5 seconds
- **Architecture:** Enterprise-focused features
- **Compliance:** Built-in compliance tools
- **Throughput:** Optimized for enterprise workloads

**Optimizations:**
1. **Confirmation Handling**
   - Set expectations for 3-5 second confirmations
   - Show clear progress indicators
   - Use Aramid-specific status endpoints
   - Implement retry logic for failed requests

2. **Enterprise Features**
   - Leverage Aramid's native compliance APIs
   - Use built-in KYC/AML integrations
   - Optimize for bulk operations
   - Utilize enterprise-specific endpoints

3. **Network Selection Intelligence**
   - Recommend VOI for speed-critical operations
   - Recommend Aramid for compliance-heavy workflows
   - Allow users to choose based on requirements
   - Provide network comparison guide

### General Performance Best Practices

1. **Lazy Loading**
   - Lazy load wallet provider libraries
   - Code split wallet-specific components
   - Load whitelist data on-demand
   - Defer non-critical features

2. **Bundle Optimization**
   - Tree-shake unused wallet providers
   - Minimize JavaScript bundle size
   - Use dynamic imports for large libraries
   - Optimize images and assets

3. **State Management**
   - Minimize reactive state overhead
   - Use computed properties effectively
   - Debounce user inputs (address validation)
   - Throttle API requests

4. **Monitoring**
   - Track wallet connection success rates
   - Monitor transaction confirmation times
   - Measure API response times
   - Alert on performance degradation

### Performance Metrics & Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Wallet Connection Time | < 2 seconds | > 5 seconds |
| Whitelist Status Check | < 500ms | > 2 seconds |
| Token Deployment Time (VOI) | < 5 seconds | > 15 seconds |
| Token Deployment Time (Aramid) | < 10 seconds | > 30 seconds |
| Dashboard Load Time | < 1.5 seconds | > 3 seconds |
| Transaction Confirmation (VOI) | 1-2 seconds | > 10 seconds |
| Transaction Confirmation (Aramid) | 3-5 seconds | > 15 seconds |
| Bundle Size (Initial Load) | < 500 KB | > 1 MB |
| Time to Interactive | < 3 seconds | > 5 seconds |

---

## Security Considerations

### Wallet Security

1. **Private Key Management**
   - ✅ Never store private keys (handled by wallets)
   - ✅ Never request private keys from users
   - ✅ All signing operations via wallet providers
   - ✅ Clear security messaging in UI

2. **Connection Security**
   - Use WalletConnect v2 for enhanced security
   - Implement connection expiration (auto-disconnect after inactivity)
   - Verify wallet signatures on all operations
   - Use nonce-based transaction validation

3. **Hardware Wallet Support**
   - Support Ledger via Pera Wallet integration
   - Support Ledger via Defly Wallet integration
   - Display enhanced security indicators for hardware wallets
   - Provide setup guides for hardware wallet users

4. **Session Management**
   - Implement secure session timeout (30 minutes)
   - Clear sensitive data on disconnect
   - Use secure localStorage (encrypted if possible)
   - Implement CSRF protection

### Transaction Security

1. **Transaction Validation**
   - Validate all transaction parameters client-side
   - Display transaction details clearly before signing
   - Warn on unusual transactions (large amounts, unknown recipients)
   - Implement transaction amount limits for safety

2. **Address Validation**
   - Validate Algorand address format (58 chars, base32)
   - Verify checksum for address validity
   - Check address against whitelist before operations
   - Warn on sending to non-whitelisted addresses

3. **Fee Protection (Transaction/Network Fees, "Gas" on EVM)**
   - Display estimated transaction/network fees clearly (gas on EVM)
   - Warn on unusually high fees
   - Implement maximum fee limits for transactions
   - Show fee comparison across supported networks

4. **Phishing Protection**
   - Display connected address prominently
   - Warn on network switches
   - Verify contract addresses before interactions
   - Implement domain verification for WalletConnect

### MICA Compliance Security

1. **Data Protection (GDPR)**
   - Encrypt sensitive data at rest
   - Use HTTPS/TLS for all communications
   - Implement data minimization (collect only necessary data)
   - Provide data export and deletion capabilities
   - Log data access for audit purposes

2. **Audit Trail Security**
   - Use append-only audit log
   - Timestamp all operations (NTP synchronized)
   - Include requester identification
   - Digitally sign audit records
   - Store audit logs in tamper-proof storage

3. **Access Control**
   - Implement role-based access control (RBAC)
   - Separate admin and user roles
   - Require additional authentication for sensitive operations
   - Log all access attempts (successful and failed)

4. **Whitelist Management Security**
   - Multi-factor authentication for whitelist modifications
   - Approval workflow for bulk whitelist changes
   - Rate limiting on whitelist API endpoints
   - Suspicious activity detection and alerting

### Network-Specific Security

1. **VOI Network**
   - Verify genesis ID on connection
   - Use official VOI Algod endpoints (mainnet-api.voi.nodely.dev)
   - Implement failover to backup nodes
   - Monitor for network forks or chain reorganizations

2. **Aramid Network**
   - Verify genesis ID on connection
   - Use official Aramid endpoints (algod.aramidmain.a-wallet.net)
   - Leverage Aramid's compliance features
   - Monitor for network-specific vulnerabilities

3. **Cross-Network Security**
   - Prevent network confusion attacks
   - Display clear network indicators in UI
   - Require confirmation for network switches
   - Validate transaction for correct network

### Incident Response

1. **Detection**
   - Monitor for failed login attempts
   - Detect unusual transaction patterns
   - Alert on suspected phishing or social engineering
   - Track error rates and anomalies

2. **Response**
   - Incident response playbook
   - Automated alerting to security team
   - User notification for security events
   - Temporary account lockdown capabilities

3. **Recovery**
   - Secure backup and restore procedures
   - Communication plan for security incidents
   - Post-incident analysis and improvement
   - User support for compromised accounts

### Security Audit & Compliance

- [ ] Third-party security audit (planned)
- [ ] Penetration testing (planned)
- [ ] Bug bounty program (planned)
- [ ] Regular security updates
- [ ] Dependency vulnerability scanning
- [ ] MICA compliance audit
- [ ] GDPR compliance verification
- [ ] SOC 2 Type II certification (enterprise goal)

---

## Acceptance Criteria

### AC1: Wallet Connection
**Given** a user visits the MICA dashboard  
**When** they click "Connect Wallet"  
**Then** 
- WalletConnectModal opens
- Available wallets are displayed (Pera, Defly, Biatec, Exodus, Kibisis, Lute)
- User can select network (VOI, Aramid, Dockernet)
- User can select wallet provider
- Connection is established within 2 seconds
- Connected address is displayed in header
- Connection persists across page reloads

### AC2: Whitelist Status Check
**Given** a user connects their wallet  
**When** the connection is established  
**Then**
- System automatically checks if address is whitelisted
- Whitelist status is displayed (✅ Whitelisted / ⏳ Pending / ❌ Not Whitelisted)
- Compliance score is shown for whitelisted addresses
- "Apply for Whitelist" button is shown for non-whitelisted addresses
- Status check completes within 500ms

### AC3: Whitelist Application
**Given** a non-whitelisted user is connected  
**When** they click "Apply for Whitelist"  
**Then**
- Application form opens
- Form is pre-filled with connected address
- Required fields: Name, Email, Jurisdiction, Reason
- Optional: KYC document upload
- Form validates all inputs
- Submission creates audit trail entry
- User receives confirmation message
- Email notification is sent

### AC4: Token Issuance (Whitelisted User)
**Given** a whitelisted user wants to create an RWA token  
**When** they navigate to "Create Token"  
**Then**
- Token standard options are displayed with MICA badges
- RWA compliance presets are available
- User can configure token parameters
- MICA compliance settings are configurable
- System validates all inputs
- User can review transaction details
- Wallet prompts for signature
- Token is deployed to selected network
- Token ID is returned within 5-10 seconds
- Audit trail entry is created
- Token appears in dashboard

### AC5: Token Transfer (Compliance Check)
**Given** a whitelisted user wants to transfer tokens  
**When** they enter a recipient address  
**Then**
- System validates recipient whitelist status
- Warning is shown if recipient is not whitelisted
- User can proceed or cancel
- Transaction details are displayed clearly
- Wallet prompts for signature
- Transaction is submitted to network
- Confirmation is received within network-specific time
- Audit trail entry is created

### AC6: Network Switching
**Given** a user is connected to VOI Mainnet  
**When** they switch to Aramid Mainnet  
**Then**
- Confirmation prompt is shown
- Current wallet is disconnected
- Network is switched
- User must reconnect wallet on new network
- Whitelist status is re-checked on new network
- Dashboard updates to show new network

### AC7: Bulk Whitelist Import (Enterprise)
**Given** an enterprise admin is connected  
**When** they upload a CSV with 100 addresses  
**Then**
- CSV is validated (format, required fields)
- Preview is shown before import
- Import proceeds in background
- Progress is displayed
- Completion summary shows: total, success, errors
- Each address gets audit trail entry
- Dashboard updates with new addresses
- Compliance report can be exported

### AC8: Compliance Dashboard
**Given** a whitelisted user is connected  
**When** they view the MICA Compliance Dashboard  
**Then**
- Token supply metrics are displayed
- Holder distribution is shown
- Whitelist status widget is visible
- Transfer activity is listed
- Recent transfers are shown (last 5)
- All metrics update on refresh
- Metrics load within 1 second

### AC9: Error Handling
**Given** a user attempts an operation that fails  
**When** an error occurs  
**Then**
- Clear, user-friendly error message is displayed
- Error includes actionable recovery steps
- Technical details are logged (not shown to user)
- Support contact information is provided
- User can retry the operation

### AC10: Audit Trail
**Given** any MICA-related operation occurs  
**When** the operation completes  
**Then**
- Audit trail entry is created
- Entry includes: timestamp, operation, address, reason, requester
- Entry is immutable (append-only)
- Audit trail is exportable (JSON/CSV)
- Export includes all required fields for regulatory reporting

---

## Testing Requirements

### Unit Tests

**Wallet Manager Composable (`useWalletManager.ts`)**
- [x] Wallet connection and disconnection
- [x] Network switching
- [x] State management and updates
- [x] Error handling
- [x] Persistent connection restoration

**Wallet Components**
- [x] WalletConnectModal rendering
- [x] Wallet selection
- [x] Network selection
- [ ] Whitelist status display
- [ ] Error message display

**MICA Compliance Components**
- [x] MicaDashboardSummary rendering and data display
- [x] MicaWhitelistManagement CRUD operations
- [x] CSV import/export functionality
- [x] Compliance score calculation
- [ ] Wallet address validation against whitelist

### Integration Tests

**Wallet + Whitelist Integration**
- [ ] Connect wallet → Check whitelist status
- [ ] Non-whitelisted user → Apply for whitelist
- [ ] Whitelisted user → Create token
- [ ] Transfer validation with whitelist check
- [ ] Bulk whitelist import with wallet connection

**Network Switching Integration**
- [x] Switch network → Disconnect wallet
- [x] Reconnect on new network
- [ ] Whitelist status persists across networks
- [ ] Token operations on different networks

**Token Operations Integration**
- [ ] Whitelisted user → Deploy RWA token
- [ ] Transfer token with whitelist validation
- [ ] Block transfer to non-whitelisted address
- [ ] Audit trail creation on all operations

### End-to-End Tests

**Complete User Flows**
- [ ] New user → Connect wallet → Apply for whitelist → Get approved → Create token
- [ ] Whitelisted user → Connect wallet → Transfer tokens → Complete successfully
- [ ] Enterprise admin → Bulk import whitelist → Review audit trail → Export report
- [ ] User → Switch networks → Reconnect wallet → Resume operations

### Performance Tests

**Load Testing**
- [ ] 100 concurrent wallet connections
- [ ] 1000 whitelist status checks per minute
- [ ] Bulk import of 10,000 addresses
- [ ] Dashboard rendering with 1000+ tokens

**Stress Testing**
- [ ] Network disconnection and reconnection
- [ ] Rapid network switching
- [ ] Wallet disconnection during transaction
- [ ] API unavailability scenarios

### Security Tests

**Penetration Testing**
- [ ] SQL injection attempts
- [ ] XSS attack vectors
- [ ] CSRF attack simulation
- [ ] Session hijacking attempts
- [ ] Phishing simulation

**Compliance Testing**
- [ ] GDPR compliance verification
- [ ] Audit trail immutability
- [ ] Data encryption verification
- [ ] Access control enforcement

---

## Compliance Verification

### MICA Regulatory Requirements

#### Article 17: Token Holder Identification
- [x] Whitelist management system
- [x] Address tracking
- [x] KYC verification status
- [x] Jurisdiction identification
- [ ] Integration with certified KYC provider

#### Article 18: AML/KYC Compliance
- [x] Sanctions screening flag
- [x] AML verification flag
- [x] Customer due diligence tracking
- [ ] Automated sanctions list checking
- [ ] Enhanced due diligence for high-risk jurisdictions

#### Article 19: Record Keeping
- [x] Audit trail with timestamps
- [x] Requester identification
- [x] Reason documentation
- [x] 7-year retention capability
- [x] Immutable audit log

#### Article 35: Reporting Requirements
- [x] Compliance report generation
- [x] JSON structured data export
- [x] CSV tabular export
- [x] Jurisdiction breakdown
- [ ] Automated regulatory reporting (scheduled)

### GDPR Compliance

- [x] Data minimization (only necessary fields)
- [x] Purpose limitation (explicit MICA compliance)
- [ ] User consent management
- [ ] Data deletion capabilities ("right to be forgotten")
- [x] Storage limitation (configurable retention)
- [x] Integrity and confidentiality (encryption)
- [x] Accountability (audit logging)
- [ ] Data portability (export in machine-readable format)

### Security Standards

- [ ] **ISO 27001** - Information security management (planned)
- [ ] **SOC 2 Type II** - Service organization controls (planned)
- [ ] **OWASP Top 10** - Web application security (in progress)
- [x] **HTTPS/TLS** - Encrypted communications
- [x] **No private key storage** - Wallet-based signing only

### Audit Readiness

**Documentation**
- [x] Wallet integration documentation
- [x] MICA compliance feature documentation
- [x] Security best practices documented
- [ ] Privacy policy (legal review pending)
- [ ] Terms of service (legal review pending)

**Operational Readiness**
- [x] Audit trail system operational
- [x] Compliance reports exportable
- [x] Whitelist management functional
- [ ] 24/7 monitoring and alerting
- [ ] Incident response playbook

**Compliance Certification**
- [ ] Third-party audit completed
- [ ] MICA compliance certification (pending)
- [ ] GDPR compliance verified (pending)
- [ ] Annual compliance review scheduled

---

## Next Steps & Roadmap

### Immediate Priorities (Sprint 1-2)

1. **Complete Wallet-Whitelist Integration**
   - Implement wallet address validation against whitelist
   - Add real-time whitelist status in wallet UI
   - Create "Apply for Whitelist" flow from wallet modal

2. **Enhance Token Operation Flows**
   - Add pre-transaction whitelist checks
   - Implement blocking for non-compliant transfers
   - Create clear compliance warnings

3. **Performance Optimization**
   - Implement lazy loading for wallet libraries
   - Add caching for whitelist status checks
   - Optimize dashboard loading performance

### Short-Term Goals (Sprint 3-6)

4. **Hardware Wallet Support**
   - Test and document Ledger integration via Pera
   - Test and document Ledger integration via Defly
   - Add hardware wallet indicators in UI

5. **Enhanced UX**
   - Create first-time user tutorial
   - Add contextual help and tooltips
   - Implement progressive disclosure

6. **Security Enhancements**
   - Implement multi-factor authentication
   - Add rate limiting
   - Set up suspicious activity monitoring

### Medium-Term Goals (Q2-Q3)

7. **Enterprise Features**
   - Multi-signature wallet support
   - Advanced role-based access control
   - Automated compliance reporting

8. **KYC/AML Integration**
   - Integrate with certified KYC provider
   - Automated sanctions screening
   - Enhanced due diligence workflows

9. **Monitoring & Analytics**
   - Real-time compliance dashboard
   - Performance monitoring
   - Security event tracking

### Long-Term Vision (Q4+)

10. **Regulatory Certification**
    - Complete MICA compliance audit
    - Obtain GDPR certification
    - Achieve SOC 2 Type II certification

11. **Advanced Features**
    - AI-powered compliance risk scoring
    - Predictive analytics for regulatory changes
    - Multi-jurisdiction support with automatic configuration

12. **Ecosystem Expansion**
    - Support for additional Algorand networks
    - Cross-chain bridge integrations
    - DeFi protocol integrations

---

## Success Metrics

### User Experience Metrics
- **Wallet Connection Success Rate**: > 95%
- **Average Connection Time**: < 2 seconds
- **Whitelist Application Completion Rate**: > 80%
- **User Satisfaction (NPS)**: > 50

### Performance Metrics
- **Dashboard Load Time**: < 1.5 seconds
- **Whitelist Status Check**: < 500ms
- **Token Deployment Time (VOI)**: < 5 seconds
- **Transaction Confirmation (VOI)**: 1-2 seconds

### Compliance Metrics
- **Audit Trail Completeness**: 100%
- **Compliance Report Generation Time**: < 2 seconds
- **Whitelist Coverage**: > 90% of active users
- **Regulatory Violations**: 0

### Business Metrics
- **Enterprise Customer Adoption**: 50 customers in Year 1
- **Whitelist Applications**: 1000+ in Year 1
- **Token Deployments**: 500+ MICA-compliant tokens in Year 1
- **Revenue from Compliance Features**: $250K-$750K in Year 1

---

## Appendix

### A. Supported Wallets

| Wallet | ID | Mobile | Web | Hardware | WalletConnect |
|--------|-----|--------|-----|----------|---------------|
| Biatec Wallet | `biatec` | ✅ | ✅ | ❌ | ✅ |
| Pera Wallet | `pera` | ✅ | ✅ | ✅ (Ledger) | ✅ |
| Defly Wallet | `defly` | ✅ | ✅ | ✅ (Ledger) | ✅ |
| Exodus | `exodus` | ✅ | ✅ | ❌ | ✅ |
| Kibisis | `kibisis` | ❌ | ✅ (Extension) | ❌ | ❌ |
| Lute | `lute` | ✅ | ✅ | ❌ | ✅ |

### B. Network Configuration

**VOI Mainnet**
```typescript
{
  id: 'voi-mainnet',
  name: 'voi-mainnet',
  displayName: 'VOI Mainnet',
  algodUrl: 'https://mainnet-api.voi.nodely.dev',
  genesisId: 'voimain-v1.0',
  genesisHash: 'r20fSQI8gWe/kFZziNonSPCXLwcQmH/nxROvnnueWOk=',
  caipChainId: 'algorand:r20fSQI8gWe_kFZziNonSPCXLwcQmH_n',
  isTestnet: false,
}
```

**Aramid Mainnet**
```typescript
{
  id: 'aramidmain',
  name: 'aramidmain',
  displayName: 'Aramid Mainnet',
  algodUrl: 'https://algod.aramidmain.a-wallet.net',
  genesisId: 'aramidmain-v1.0',
  genesisHash: 'PgeQVJJgx/LYKJfIEz7dbfNPuXmDyJ+O7FwQ4XL9tE8=',
  caipChainId: 'algorand:PgeQVJJgx_LYKJfIEz7dbfNPuXmDyJ-O',
  isTestnet: false,
}
```

### C. Glossary

**MICA** - Markets in Crypto-Assets Regulation (EU)  
**RWA** - Real World Assets  
**KYC** - Know Your Customer  
**AML** - Anti-Money Laundering  
**GDPR** - General Data Protection Regulation (EU)  
**ASA** - Algorand Standard Asset  
**ARC** - Algorand Request for Comment (token standard)  
**CAIP** - Chain Agnostic Improvement Proposal  
**Whitelist** - List of approved addresses for MICA-compliant operations  
**Audit Trail** - Immutable record of all compliance-related operations

### D. Related Documents

- [Wallet Integration Guide](./WALLET_INTEGRATION.md) - Technical implementation details
- [MICA Whitelist Business Value](./MICA_WHITELIST_BUSINESS_VALUE.md) - Business case and ROI
- [RWA Compliance Presets](./RWA_COMPLIANCE_PRESETS_BUSINESS_VALUE.md) - Token preset features
- [Network Switching Guide](./NETWORK_SWITCHING_BUSINESS_VALUE.md) - Multi-network support

### E. Contact & Support

**Development Team:**
- Technical Lead: scholtz (GitHub handle)
- Product Owner: copilot (GitHub handle)
- Security Team: security@biatec.io

**Regulatory Compliance:**
- Compliance Officer: compliance@biatec.io
- Legal Team: legal@biatec.io

**Support:**
- GitHub Issues: https://github.com/scholtz/biatec-tokens/issues
- Email: support@biatec.io

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Status:** Active  
**Review Date:** April 24, 2026

**Approval:**
- [ ] Development Team Lead
- [ ] Product Owner
- [ ] Compliance Officer
- [ ] Security Team Lead

---

*This document is a living document and should be updated as the implementation progresses and regulatory requirements evolve.*
