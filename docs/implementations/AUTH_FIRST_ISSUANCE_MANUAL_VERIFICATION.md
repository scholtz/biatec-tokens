# Auth-First Issuance Workspace - Manual Verification Checklist

## Overview

This document provides step-by-step manual verification procedures for the auth-first issuance workspace and compliance UX determinism implementation.

**Purpose**: Validate that all user-facing flows work correctly and meet acceptance criteria through manual testing.

**Target Testers**: Product owners, QA engineers, non-technical stakeholders

**Estimated Time**: 30-45 minutes for complete checklist

## Prerequisites

- [ ] Development server running: `npm run dev`
- [ ] Browser: Chrome, Firefox, or Safari (latest version)
- [ ] Network: Internet connection (for external resources)
- [ ] Test Credentials: Use any email/password (e.g., `test@example.com` / `password123`)

## Test Environment Setup

### Start Development Server

```bash
cd /home/runner/work/biatec-tokens/biatec-tokens
npm install
npm run dev
```

Server should start at: `http://localhost:5173`

### Browser Setup

1. Open browser in **Incognito/Private mode** (ensures clean state)
2. Navigate to `http://localhost:5173`
3. Open DevTools (F12) → Console tab (monitor for errors)

## Verification Sections

### Section 1: Unauthenticated Home Page

**Objective**: Verify no wallet-era UI elements appear on home page

#### Test 1.1: Home Page Load

- [ ] Navigate to `http://localhost:5173`
- [ ] Page loads successfully (no errors in console)
- [ ] "Biatec Tokens" logo visible in top-left
- [ ] Navigation menu visible (Home, Features, Token Standards, etc.)

**Expected**: Page loads correctly

#### Test 1.2: Sign In Button Presence

- [ ] Look for button in top-right corner
- [ ] Button text says **"Sign In"** (not "Connect Wallet")
- [ ] Button has blue background
- [ ] Button shows login icon (arrow-right-on-rectangle)

**Expected**: "Sign In" button visible, NO "Connect Wallet" button

#### Test 1.3: No Wallet-Era Text

Search page for these terms (Ctrl+F):

- [ ] "Not connected" → **NOT FOUND**
- [ ] "Connect Wallet" → **NOT FOUND**
- [ ] "WalletConnect" → **NOT FOUND**
- [ ] "MetaMask" → **NOT FOUND**
- [ ] "Pera Wallet" → **NOT FOUND**
- [ ] "Defly" → **NOT FOUND**

**Expected**: ZERO wallet-related terms on home page

#### Test 1.4: Navigation Bar (Unauthenticated)

Check navigation items:

- [ ] "Home" link
- [ ] "Features" or similar links
- [ ] "Token Standards" link
- [ ] NO "My Tokens" link (requires auth)
- [ ] NO "Dashboard" link (requires auth)

**Expected**: Public routes only, no auth-required routes in navbar

---

### Section 2: Auth Redirect Flow (Protected Routes)

**Objective**: Verify unauthenticated users are redirected to login when accessing protected routes

#### Test 2.1: Guided Token Launch Redirect

1. [ ] Navigate directly to `http://localhost:5173/launch/guided`
2. [ ] Should redirect to `http://localhost:5173/?showAuth=true`
3. [ ] Auth modal appears with email/password fields
4. [ ] Modal title: "Sign In" or "Create Account"
5. [ ] Email input field visible
6. [ ] Password input field visible

**Expected**: Redirected to home with auth modal open

#### Test 2.2: Advanced Token Creator Redirect

1. [ ] Navigate directly to `http://localhost:5173/create`
2. [ ] Should redirect to `http://localhost:5173/?showAuth=true`
3. [ ] Auth modal appears

**Expected**: Redirected to home with auth modal open

#### Test 2.3: Compliance Dashboard Redirect

1. [ ] Navigate directly to `http://localhost:5173/compliance`
2. [ ] Should redirect to `http://localhost:5173/?showAuth=true`
3. [ ] Auth modal appears

**Expected**: Redirected to home with auth modal open

#### Test 2.4: Settings Page Redirect

1. [ ] Navigate directly to `http://localhost:5173/settings`
2. [ ] Should redirect to `http://localhost:5173/?showAuth=true`
3. [ ] Auth modal appears

**Expected**: Redirected to home with auth modal open

---

### Section 3: Email/Password Authentication

**Objective**: Verify email/password authentication works correctly (no wallet required)

#### Test 3.1: Sign Up Flow

1. [ ] Click "Sign In" button on home page
2. [ ] Auth modal opens
3. [ ] Look for "Create Account" or "Sign Up" tab/link
4. [ ] Click "Create Account"
5. [ ] Enter test email: `testuser@example.com`
6. [ ] Enter test password: `SecurePassword123!`
7. [ ] Click "Create Account" or "Sign Up" button
8. [ ] Account creation initiates (loading spinner)

**Expected**: Account created via ARC76 derivation (no wallet interaction)

#### Test 3.2: Sign In Flow

1. [ ] If already signed up, close modal and reopen
2. [ ] Click "Sign In" button
3. [ ] Enter email: `testuser@example.com`
4. [ ] Enter password: `SecurePassword123!`
5. [ ] Click "Sign In" button
6. [ ] Login initiates (loading spinner)
7. [ ] Modal closes on success
8. [ ] User menu appears in top-right (replaces "Sign In" button)

**Expected**: Login successful via email/password only

#### Test 3.3: User Menu After Login

After signing in:

- [ ] User menu visible in top-right
- [ ] User avatar/icon shows first letter of email
- [ ] Email address displayed: `testuser@example.com`
- [ ] Algorand address displayed (truncated): `ABC...XYZ` format
- [ ] NO wallet connector name displayed

**Expected**: User authenticated, email and address shown

#### Test 3.4: No Wallet Prompts

During entire auth flow:

- [ ] NO wallet extension popup
- [ ] NO "Connect to MetaMask" message
- [ ] NO "Choose Wallet Provider" dialog
- [ ] NO QR code for WalletConnect

**Expected**: ZERO wallet interaction required

---

### Section 4: Auth Redirect Return Flow

**Objective**: Verify users return to intended route after authentication

#### Test 4.1: Return to Guided Launch After Auth

1. [ ] Sign out (if signed in)
2. [ ] Navigate to `http://localhost:5173/launch/guided`
3. [ ] Redirected to `/?showAuth=true` (expected)
4. [ ] Sign in with email/password
5. [ ] **CHECK**: After login, redirected to `/launch/guided`
6. [ ] "Guided Token Launch" page loads
7. [ ] Step 1 (Organization Profile) visible

**Expected**: Redirected back to `/launch/guided` after login

#### Test 4.2: Return to Advanced Creator After Auth

1. [ ] Sign out
2. [ ] Navigate to `http://localhost:5173/create`
3. [ ] Redirected to `/?showAuth=true`
4. [ ] Sign in
5. [ ] **CHECK**: After login, redirected to `/create`
6. [ ] Advanced token creator loads

**Expected**: Redirected back to `/create` after login

#### Test 4.3: Return to Compliance After Auth

1. [ ] Sign out
2. [ ] Navigate to `http://localhost:5173/compliance`
3. [ ] Redirected to `/?showAuth=true`
4. [ ] Sign in
5. [ ] **CHECK**: After login, redirected to `/compliance`
6. [ ] Compliance dashboard loads

**Expected**: Redirected back to `/compliance` after login

---

### Section 5: State Persistence Across Refresh

**Objective**: Verify auth state persists through browser refresh

#### Test 5.1: Refresh on Guided Launch

1. [ ] Sign in
2. [ ] Navigate to `/launch/guided`
3. [ ] Page loads successfully
4. [ ] Press F5 (refresh browser)
5. [ ] **CHECK**: Page reloads WITHOUT redirecting to login
6. [ ] Still on `/launch/guided`
7. [ ] User menu still visible in top-right

**Expected**: Auth state persists, no re-authentication required

#### Test 5.2: Refresh on Compliance Dashboard

1. [ ] Navigate to `/compliance`
2. [ ] Press F5 (refresh)
3. [ ] **CHECK**: Page reloads WITHOUT redirecting to login
4. [ ] Still on `/compliance`
5. [ ] User still authenticated

**Expected**: Auth state persists across refresh

#### Test 5.3: localStorage Check

1. [ ] Open DevTools → Application tab → Local Storage
2. [ ] Look for key: `algorand_user`
3. [ ] **CHECK**: Value is JSON object with:
   - `address`: String (Algorand address)
   - `email`: String (user's email)
   - `isConnected`: Boolean (true)

**Expected**: Auth state stored in localStorage

---

### Section 6: Navigation Between Protected Routes

**Objective**: Verify auth state persists when navigating between routes

#### Test 6.1: Navigate from Guided Launch to Dashboard

1. [ ] Sign in
2. [ ] Start at `/launch/guided`
3. [ ] Click "Dashboard" link in navigation (or navigate to `/dashboard`)
4. [ ] **CHECK**: NO auth prompt
5. [ ] Dashboard loads immediately
6. [ ] User still authenticated (menu visible)

**Expected**: No re-authentication required

#### Test 6.2: Navigate from Dashboard to Settings

1. [ ] Start at `/dashboard`
2. [ ] Click user menu → "Settings"
3. [ ] **CHECK**: NO auth prompt
4. [ ] Settings page loads
5. [ ] User still authenticated

**Expected**: Smooth navigation, no auth interruption

#### Test 6.3: Navigate from Settings to Compliance

1. [ ] Start at `/settings`
2. [ ] Navigate to `/compliance`
3. [ ] **CHECK**: NO auth prompt
4. [ ] Compliance dashboard loads

**Expected**: Auth persists across all protected routes

---

### Section 7: Logout and State Clearing

**Objective**: Verify logout clears auth state correctly

#### Test 7.1: Logout Flow

1. [ ] Sign in
2. [ ] Click user menu (top-right)
3. [ ] Click "Sign Out" button
4. [ ] **CHECK**: Logged out successfully
5. [ ] Redirected to home page (`/`)
6. [ ] "Sign In" button reappears (replaces user menu)

**Expected**: Logout successful, state cleared

#### Test 7.2: localStorage Cleared

After logout:

1. [ ] Open DevTools → Application → Local Storage
2. [ ] **CHECK**: `algorand_user` key is REMOVED (or null)

**Expected**: Auth state cleared from localStorage

#### Test 7.3: Protected Route Access After Logout

1. [ ] After logging out, navigate to `/launch/guided`
2. [ ] **CHECK**: Redirected to `/?showAuth=true`
3. [ ] Auth modal appears (login required)

**Expected**: Cannot access protected routes after logout

---

### Section 8: Compliance UX Visibility

**Objective**: Verify compliance status is visible and actionable

#### Test 8.1: Compliance Dashboard Access

1. [ ] Sign in
2. [ ] Navigate to `/compliance`
3. [ ] Compliance Dashboard loads
4. [ ] **CHECK**: Compliance status visible
   - MICA compliance badges
   - Risk indicators
   - Attestation requirements

**Expected**: Compliance information displayed clearly

#### Test 8.2: Compliance Language Clarity

Review compliance messaging:

- [ ] Messages use **business language** (not crypto jargon)
- [ ] Examples:
  - ✅ "Utility tokens need compliance documentation"
  - ❌ NOT "ERC-20 requires Article 23 attestation"
- [ ] Risk levels: HIGH/MEDIUM/LOW (clear categories)
- [ ] Actionable warnings (what to do next)

**Expected**: Non-technical users can understand messages

#### Test 8.3: Compliance Gating (Deployment Blockers)

1. [ ] Navigate to guided token launch
2. [ ] Start creating a token (fill in organization profile)
3. [ ] Proceed to compliance step
4. [ ] **CHECK**: Required compliance items listed
5. [ ] **CHECK**: Deploy button DISABLED until requirements met
6. [ ] Warning message explains what's missing

**Expected**: Cannot deploy token without meeting compliance requirements

---

### Section 9: Form Validation and Error States

**Objective**: Verify validation failures preserve data and show clear guidance

#### Test 9.1: Email Validation

1. [ ] Click "Sign In" button
2. [ ] Enter invalid email: `notanemail`
3. [ ] Try to submit
4. [ ] **CHECK**: Validation error appears
5. [ ] Error message: "Please enter a valid email address"
6. [ ] Input field highlighted (red border)

**Expected**: Clear validation error, actionable message

#### Test 9.2: Password Validation

1. [ ] Enter valid email
2. [ ] Enter short password: `123`
3. [ ] Try to submit
4. [ ] **CHECK**: Validation error appears
5. [ ] Error message explains requirements (e.g., "Password must be at least 8 characters")

**Expected**: Password requirements clearly stated

#### Test 9.3: Form Data Preservation

1. [ ] Fill in organization profile form (step 1 of guided launch)
2. [ ] Enter organization name: "Test Company Inc."
3. [ ] Enter organization type: "Corporation"
4. [ ] Leave required field empty (e.g., industry)
5. [ ] Try to continue
6. [ ] **CHECK**: Validation error appears
7. [ ] **CHECK**: Entered data PRESERVED (name and type still filled)

**Expected**: Form data NOT lost on validation error

---

### Section 10: Mobile Responsiveness

**Objective**: Verify auth-first flows work on mobile devices

#### Test 10.1: Mobile Viewport Simulation

1. [ ] Open DevTools (F12)
2. [ ] Click device toolbar icon (or Ctrl+Shift+M)
3. [ ] Select device: "iPhone SE" (375x667)
4. [ ] **CHECK**: Page renders correctly
5. [ ] Hamburger menu visible (replaces desktop nav)
6. [ ] "Sign In" button visible and accessible

**Expected**: Responsive layout on mobile

#### Test 10.2: Mobile Auth Flow

1. [ ] On mobile viewport, click "Sign In"
2. [ ] Auth modal appears
3. [ ] Email/password fields usable on mobile
4. [ ] Touch keyboard opens for input
5. [ ] Submit button accessible
6. [ ] Sign in works correctly

**Expected**: Auth flow functional on mobile

#### Test 10.3: Mobile Navigation

1. [ ] Sign in on mobile viewport
2. [ ] Open hamburger menu
3. [ ] Protected routes accessible (Dashboard, Settings, etc.)
4. [ ] User menu accessible (shows email/address)

**Expected**: Full navigation available on mobile

---

### Section 11: Browser Compatibility

**Objective**: Verify auth-first flows work across browsers

#### Test 11.1: Chrome

- [ ] All Section 1-10 tests passing in Chrome

**Expected**: Full functionality in Chrome

#### Test 11.2: Firefox

- [ ] All Section 1-10 tests passing in Firefox

**Expected**: Full functionality in Firefox

#### Test 11.3: Safari (if available)

- [ ] All Section 1-10 tests passing in Safari

**Expected**: Full functionality in Safari

---

### Section 12: Error Recovery

**Objective**: Verify recoverable states for API errors

#### Test 12.1: Network Interruption Simulation

1. [ ] Sign in
2. [ ] Open DevTools → Network tab
3. [ ] Start guided token launch
4. [ ] In DevTools, set throttling to "Offline"
5. [ ] Try to submit organization profile form
6. [ ] **CHECK**: Error message appears
7. [ ] Message explains network issue
8. [ ] Form data preserved
9. [ ] Set throttling back to "No throttling"
10. [ ] Retry submission
11. [ ] **CHECK**: Submission succeeds

**Expected**: Graceful error handling, retry works

#### Test 12.2: Session Expiration Handling

1. [ ] Sign in
2. [ ] Open DevTools → Application → Local Storage
3. [ ] Delete `algorand_user` key (simulate session expiration)
4. [ ] Try to access `/compliance`
5. [ ] **CHECK**: Redirected to `/?showAuth=true`
6. [ ] Auth modal appears
7. [ ] Sign in again
8. [ ] **CHECK**: Redirected back to `/compliance`

**Expected**: Session expiration handled gracefully, redirect-return works

---

## Summary Checklist

### Critical Acceptance Criteria

- [ ] **AC #1**: Auth redirect-return flow works correctly
- [ ] **AC #2**: NO wallet-centric status in top navigation
- [ ] **AC #3**: NO wallet/network selector in auth-first flows
- [ ] **AC #4**: Issuance workspace deterministic across refresh
- [ ] **AC #5**: Compliance readiness visible before deploy
- [ ] **AC #6**: Validation failures actionable and preserve data
- [ ] **AC #7**: API errors show recoverable states
- [ ] **AC #8**: E2E tests cover auth flows (automated verification)
- [ ] **AC #9**: E2E tests stable in CI (automated verification)
- [ ] **AC #10**: Documentation updated (see validation summary)

### Overall Manual Verification

- [ ] All tests in Sections 1-12 completed
- [ ] Zero critical issues found
- [ ] Zero wallet-era UI elements observed
- [ ] Email/password authentication works flawlessly
- [ ] Auth state persistence verified
- [ ] Compliance UX clear and actionable

## Test Results Documentation

### Tester Information

- **Tester Name**: _____________________
- **Test Date**: _____________________
- **Browser(s) Used**: _____________________
- **Mobile Devices Tested**: _____________________

### Issues Found

If any issues found during manual verification, document here:

| Section | Test # | Issue Description | Severity | Status |
|---------|--------|-------------------|----------|--------|
| Example: 2.1 | Guided Launch Redirect | Modal doesn't open | HIGH | Fixed |
|         |        |                   |          |        |
|         |        |                   |          |        |

### Pass/Fail Summary

- **Total Tests Executed**: _____
- **Tests Passed**: _____
- **Tests Failed**: _____
- **Pass Rate**: _____%

### Sign-Off

**Manual Verification Status**: [ ] PASSED [ ] FAILED

**Tester Signature**: _____________________

**Date**: _____________________

**Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## Appendix: Quick Reference

### Key URLs

- Home: `http://localhost:5173/`
- Guided Launch: `http://localhost:5173/launch/guided`
- Advanced Creator: `http://localhost:5173/create`
- Compliance: `http://localhost:5173/compliance`
- Dashboard: `http://localhost:5173/dashboard`
- Settings: `http://localhost:5173/settings`

### Key localStorage Keys

- `algorand_user`: Auth state (email, address, isConnected)
- `redirect_after_auth`: Intended route after login

### Expected Behavior Summary

| Scenario | Expected Outcome |
|----------|------------------|
| Unauthenticated user → protected route | Redirect to `/?showAuth=true` |
| Sign in with email/password | Account derived via ARC76, no wallet |
| Refresh page while authenticated | Auth persists, no re-authentication |
| Navigate between protected routes | No auth interruption |
| Sign out | State cleared, redirect to home |
| Try protected route after logout | Redirect to `/?showAuth=true` |

### Contact

**Questions or Issues**: Contact product owner or engineering team

**Documentation**: See `docs/implementations/AUTH_FIRST_ISSUANCE_WORKSPACE_VALIDATION_SUMMARY.md`
