# Manual Wallet Regression Testing Checklist

## Purpose

This checklist ensures wallet connectivity features work correctly across all supported wallets and browsers after code changes. Execute this checklist before each major release.

## Test Environment Setup

### Browsers
- [ ] Chrome (latest stable)
- [ ] Brave (latest stable)
- [ ] Firefox (latest stable)
- [ ] Edge (latest stable - optional)

### Wallets - AVM Chain
- [ ] Pera Wallet (browser extension)
- [ ] Defly Wallet (browser extension)
- [ ] Exodus Wallet (browser extension)
- [ ] Kibisis (browser extension)
- [ ] Lute Connect (browser extension)

### Wallets - EVM Chain
- [ ] MetaMask (browser extension)
- [ ] WalletConnect (mobile QR scan)

### Networks
- [ ] Algorand Mainnet
- [ ] Algorand Testnet
- [ ] VOI Mainnet
- [ ] Aramid Mainnet
- [ ] Ethereum Mainnet
- [ ] Base Mainnet
- [ ] Arbitrum Mainnet
- [ ] Sepolia Testnet (EVM)

## Test Scenarios

### 1. Initial Connection Flow

#### 1.1 Fresh Browser Session
- [ ] Open application in incognito/private window
- [ ] Verify "Sign In" button is visible
- [ ] Click "Sign In" button
- [ ] Verify wallet selection modal appears
- [ ] Verify all 5 AVM wallets are listed
- [ ] Verify wallet availability indicators are correct
- [ ] Select a wallet (e.g., Pera)
- [ ] Approve connection in wallet
- [ ] Verify connection success within 3 seconds
- [ ] Verify wallet address displayed in UI
- [ ] Verify network badge shows correct network

**Expected Result**: Smooth connection without errors or delays

#### 1.2 Connection with Locked Wallet
- [ ] Lock your wallet (e.g., logout)
- [ ] Click "Sign In" button
- [ ] Select wallet
- [ ] Verify error message: "Wallet Locked"
- [ ] Verify troubleshooting steps displayed
- [ ] Verify retry button available
- [ ] Unlock wallet
- [ ] Click retry button
- [ ] Verify successful connection

**Expected Result**: Clear error message with actionable guidance

#### 1.3 Connection Rejection
- [ ] Click "Sign In" button
- [ ] Select wallet
- [ ] Reject connection in wallet
- [ ] Verify error message: "Connection Declined"
- [ ] Verify alternative wallet suggestions shown
- [ ] Verify retry button available

**Expected Result**: User-friendly error with clear next steps

### 2. Network Switching

#### 2.1 AVM Network Switching (VOI ↔ Aramid)
- [ ] Connect wallet to VOI Mainnet
- [ ] Verify network badge shows "VOI"
- [ ] Open network selector
- [ ] Select "Aramid Mainnet"
- [ ] Verify confirmation dialog appears
- [ ] Review warnings (if any)
- [ ] Confirm network switch
- [ ] Verify network badge updates to "Aramid"
- [ ] Verify balance updates (if different)
- [ ] Wait 30 seconds
- [ ] Verify connection remains stable

**Expected Result**: Smooth network switch with UI updates

#### 2.2 Cross-Chain Switching (AVM → EVM)
- [ ] Connect wallet to VOI Mainnet (AVM)
- [ ] Open network selector
- [ ] Select "Ethereum Mainnet" (EVM)
- [ ] Verify warning about disconnection
- [ ] Confirm switch
- [ ] Verify wallet disconnects
- [ ] Verify option to connect EVM wallet appears
- [ ] Connect MetaMask
- [ ] Verify successful connection to Ethereum

**Expected Result**: Clear warning and smooth transition

#### 2.3 Testnet ↔ Mainnet Switching
- [ ] Connect to Algorand Testnet
- [ ] Switch to Algorand Mainnet
- [ ] Verify warning about real assets
- [ ] Confirm switch
- [ ] Verify mainnet badge visible
- [ ] Switch back to testnet
- [ ] Verify warning about test assets
- [ ] Confirm switch
- [ ] Verify testnet badge visible

**Expected Result**: Clear warnings about asset value

### 3. Balance Display

#### 3.1 Initial Balance Fetch
- [ ] Connect wallet with known balance
- [ ] Verify balance displays within 5 seconds
- [ ] Verify balance is accurate
- [ ] Verify asset list displays (if multiple assets)
- [ ] Verify "Last updated" timestamp shown

**Expected Result**: Accurate balance with timestamp

#### 3.2 Balance Caching
- [ ] Note current balance
- [ ] Navigate to another page
- [ ] Return to balance view
- [ ] Verify balance loads instantly (<1 second)
- [ ] Verify "Last updated" timestamp unchanged
- [ ] Wait 35 seconds
- [ ] Navigate away and back
- [ ] Verify balance refreshes (new timestamp)

**Expected Result**: Fast cached loads, automatic refresh after 30s

#### 3.3 Balance Refresh
- [ ] View current balance
- [ ] Send transaction from wallet (outside app)
- [ ] Click refresh button in app
- [ ] Verify balance updates immediately
- [ ] Verify new "Last updated" timestamp
- [ ] Verify cache invalidated

**Expected Result**: Manual refresh bypasses cache

#### 3.4 Balance Error Handling
- [ ] Disconnect internet
- [ ] Try to fetch balance
- [ ] Verify error message displayed
- [ ] Verify retry button available
- [ ] Reconnect internet
- [ ] Click retry
- [ ] Verify balance fetches successfully

**Expected Result**: Clear error with retry option

### 4. Connection Persistence

#### 4.1 Page Reload
- [ ] Connect wallet
- [ ] Note current network and address
- [ ] Reload page (F5)
- [ ] Verify connection restored automatically
- [ ] Verify same network selected
- [ ] Verify same address displayed
- [ ] Verify balance loads correctly

**Expected Result**: Session persists across reload

#### 4.2 Network Selection Persistence
- [ ] Select VOI Mainnet
- [ ] Reload page
- [ ] Verify VOI Mainnet still selected
- [ ] Change to Aramid Mainnet
- [ ] Reload page
- [ ] Verify Aramid Mainnet still selected

**Expected Result**: Network preference persists

#### 4.3 Multi-Tab Behavior
- [ ] Connect wallet in Tab 1
- [ ] Open Tab 2 (same app)
- [ ] Verify connection state in Tab 2
- [ ] Switch network in Tab 1
- [ ] Switch to Tab 2
- [ ] Reload Tab 2
- [ ] Verify network updated

**Expected Result**: Reasonable multi-tab behavior

### 5. Auto-Reconnection

#### 5.1 Temporary Network Disruption
- [ ] Connect wallet
- [ ] Wait for health check interval (30s)
- [ ] Briefly disconnect internet (5-10 seconds)
- [ ] Reconnect internet
- [ ] Wait 30 seconds
- [ ] Verify automatic reconnection attempt
- [ ] Verify connection restored without manual action

**Expected Result**: Automatic recovery after brief disruption

#### 5.2 Extended Network Disruption
- [ ] Connect wallet
- [ ] Disconnect internet for 2 minutes
- [ ] Verify connection lost detected
- [ ] Reconnect internet
- [ ] Verify automatic reconnection attempts (3 retries)
- [ ] If fails, verify error message with manual reconnect option

**Expected Result**: Multiple retry attempts, fallback to manual

#### 5.3 Wallet Lock During Session
- [ ] Connect wallet
- [ ] Lock wallet (logout in extension)
- [ ] Wait 30 seconds for health check
- [ ] Verify connection lost detection
- [ ] Verify error message about locked wallet
- [ ] Unlock wallet
- [ ] Verify automatic reconnection attempt

**Expected Result**: Detects lock, prompts user

### 6. Disconnect Flow

#### 6.1 Clean Disconnect
- [ ] Connect wallet
- [ ] Click disconnect button
- [ ] Verify disconnection within 1 second
- [ ] Verify wallet address removed from UI
- [ ] Verify "Sign In" button appears
- [ ] Verify balance data cleared
- [ ] Verify network selection persisted

**Expected Result**: Clean state reset

### 7. Token Creation Integration

#### 7.1 Token Creation with Wallet
- [ ] Connect wallet
- [ ] Navigate to token creation
- [ ] Verify wallet address shown in creation form
- [ ] Verify network shown in creation form
- [ ] Select token standard (e.g., ASA)
- [ ] Fill form
- [ ] Initiate deployment
- [ ] Approve transaction in wallet
- [ ] Verify transaction submits successfully

**Expected Result**: Smooth token creation flow

#### 7.2 Network Mismatch Warning
- [ ] Connect to VOI Mainnet
- [ ] Navigate to token creation
- [ ] Select ERC-20 token (Ethereum standard)
- [ ] Verify network mismatch warning
- [ ] Verify suggestion to switch network
- [ ] Follow suggestion
- [ ] Verify network switches correctly

**Expected Result**: Clear mismatch detection and guidance

### 8. Transaction History

#### 8.1 Transaction History Display
- [ ] Connect wallet with transaction history
- [ ] Open transaction history panel
- [ ] Verify recent transactions listed
- [ ] Verify transaction details shown (type, status, timestamp)
- [ ] Verify explorer links present
- [ ] Click explorer link
- [ ] Verify opens correct blockchain explorer

**Expected Result**: Accurate transaction history

#### 8.2 Transaction Filtering
- [ ] Open transaction history
- [ ] Filter by "Pending" status
- [ ] Verify only pending transactions shown
- [ ] Filter by "Token Creation" type
- [ ] Verify only token creation transactions shown
- [ ] Reset filters
- [ ] Verify all transactions shown

**Expected Result**: Filters work correctly

### 9. Error Scenarios

#### 9.1 Wallet Extension Not Installed
- [ ] Remove/disable wallet extension
- [ ] Click "Sign In"
- [ ] Select wallet
- [ ] Verify error: "Wallet Not Detected"
- [ ] Verify install link provided
- [ ] Click install link
- [ ] Verify navigates to wallet website

**Expected Result**: Clear error with install guidance

#### 9.2 Unsupported Network
- [ ] Connect wallet
- [ ] Manually switch wallet to unsupported network (e.g., custom RPC)
- [ ] Verify network mismatch detected
- [ ] Verify warning message displayed
- [ ] Verify suggestion to switch to supported network

**Expected Result**: Unsupported network detected

### 10. Console and Telemetry

#### 10.1 No Console Errors
- [ ] Open browser console (F12)
- [ ] Execute all test scenarios above
- [ ] Verify no uncaught errors or promise rejections
- [ ] Verify Vue warnings are minimal/expected

**Expected Result**: Clean console output

#### 10.2 Telemetry Events
- [ ] Check telemetry service for events
- [ ] Verify events logged for:
  - Connection attempts
  - Network switches
  - Balance fetches
  - Cache hits/misses
  - Recovery attempts
- [ ] Verify no sensitive data in telemetry

**Expected Result**: Comprehensive telemetry without sensitive data

## Sign-Off

### Test Execution

- **Tester Name**: _______________________
- **Date**: _______________________
- **Environment**: _______________________
- **Git Commit**: _______________________

### Results Summary

- **Total Tests Executed**: _______
- **Tests Passed**: _______
- **Tests Failed**: _______
- **Critical Issues Found**: _______

### Critical Issues

List any critical issues that must be resolved before release:

1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Approval

- [ ] All critical tests passed
- [ ] No critical issues remaining
- [ ] Ready for release

**Approved By**: _______________________  
**Date**: _______________________

---

**Notes**: 
- Not all scenarios need to be tested in every browser
- Focus critical scenarios on Chrome/Brave
- Test edge cases in Firefox
- Document any browser-specific issues found
