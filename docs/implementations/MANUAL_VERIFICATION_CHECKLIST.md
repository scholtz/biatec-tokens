# Manual Verification Checklist - Deterministic Auth-First Issuance Journey

## Overview

This checklist provides step-by-step manual testing scenarios for product owner validation of the deterministic auth-first issuance journey. Each scenario covers happy path, invalid input, interrupted flow, and recovery scenarios as required by the issue.

## Prerequisites

- [ ] Application running locally: `npm run dev`
- [ ] Browser: Chrome/Chromium (primary), Firefox/Safari (secondary)
- [ ] Network: Development environment with backend API access
- [ ] Clean state: Clear browser localStorage before each major scenario

## Scenario 1: Happy Path - Complete Auth-First Token Creation Journey

### Step 1: Initial State (Unauthenticated)
- [ ] Navigate to `http://localhost:5173`
- [ ] **Verify**: Homepage loads successfully
- [ ] **Verify**: No wallet connector buttons visible (WalletConnect, MetaMask, Pera, Defly)
- [ ] **Verify**: "Sign In" or similar email/password auth button visible

### Step 2: Attempt Protected Route Access
- [ ] Directly navigate to `http://localhost:5173/launch/guided`
- [ ] **Verify**: Redirected to homepage
- [ ] **Verify**: URL contains `?showAuth=true` query parameter
- [ ] **Verify**: Email/password authentication modal/form appears
- [ ] **Verify**: No wallet connection prompts

### Step 3: Email/Password Authentication
- [ ] Enter email: `test@example.com`
- [ ] Enter password: `TestPassword123!`
- [ ] Click "Sign In" or "Authenticate"
- [ ] **Verify**: No errors displayed
- [ ] **Verify**: User authenticated (check for user indicator in navbar)
- [ ] **Verify**: Redirected to originally requested route (`/launch/guided`)
- [ ] **Verify**: No wallet connection required

### Step 4: Guided Launch Wizard - Organization Profile
- [ ] **Verify**: Guided Launch page loads with correct title
- [ ] **Verify**: Step 1 "Organization Profile" is active
- [ ] **Verify**: Progress tracker shows "1 of 6 steps" (or similar)
- [ ] Fill organization name: `Test Company Inc`
- [ ] Select organization type: `Corporation`
- [ ] Fill website: `https://testcompany.com`
- [ ] **Verify**: "Continue" button becomes enabled
- [ ] Click "Continue"
- [ ] **Verify**: Navigation to Step 2 "Token Intent"

### Step 5: Token Intent
- [ ] Select token purpose: `Utility Token`
- [ ] Fill token description: `Test token for manual verification`
- [ ] **Verify**: Validation messages appear for required fields if left empty
- [ ] **Verify**: "Continue" button enabled when all required fields filled
- [ ] Click "Continue"
- [ ] **Verify**: Navigation to Step 3 "Compliance Readiness"

### Step 6: Compliance Readiness
- [ ] **Verify**: Compliance checklist items displayed
- [ ] **Verify**: Risk acknowledgment or compliance selection options available
- [ ] Complete required compliance selections
- [ ] **Verify**: "Continue" button enabled
- [ ] Click "Continue"
- [ ] **Verify**: Navigation to Step 4 "Template Selection"

### Step 7: Template Selection
- [ ] **Verify**: Token template options displayed (ARC3, ARC19, ARC200, etc.)
- [ ] Select a template: `ARC19 (Fractional NFT)`
- [ ] **Verify**: Template details/description shown
- [ ] Click "Continue"
- [ ] **Verify**: Navigation to Step 5 "Economics"

### Step 8: Economics
- [ ] Fill total supply: `1000000`
- [ ] Fill decimals: `6`
- [ ] Fill token symbol: `TEST`
- [ ] **Verify**: Validation warnings if values are unusual
- [ ] Click "Continue"
- [ ] **Verify**: Navigation to Step 6 "Review & Submit"

### Step 9: Review & Submit
- [ ] **Verify**: All entered data displayed in review summary
- [ ] **Verify**: Readiness score displayed (if applicable)
- [ ] **Verify**: Blockers/warnings/recommendations shown
- [ ] **Verify**: No "Sign transaction in wallet" prompts (backend deployment)
- [ ] Click "Submit" or "Create Token"
- [ ] **Verify**: Submission in progress indicator
- [ ] **Verify**: Success message or redirect to token dashboard

### Step 10: Post-Creation
- [ ] **Verify**: Created token appears in token list/dashboard
- [ ] **Verify**: Token details match entered data
- [ ] **Verify**: Deployment status visible (pending/active)

**Expected Duration**: 5-10 minutes
**Pass Criteria**: All verifications successful, no wallet UI, smooth flow

---

## Scenario 2: Invalid Input Handling

### Step 1: Email Validation
- [ ] Navigate to sign-in page
- [ ] Enter invalid email: `notanemail`
- [ ] **Verify**: Email validation error displayed
- [ ] **Verify**: Cannot proceed with invalid email

### Step 2: Password Validation
- [ ] Enter valid email: `test@example.com`
- [ ] Enter weak password: `123`
- [ ] **Verify**: Password strength indicator shows weak
- [ ] **Verify**: Error message for insufficient password

### Step 3: Organization Profile Validation
- [ ] Authenticate successfully
- [ ] Navigate to `/launch/guided`
- [ ] Leave organization name empty
- [ ] **Verify**: "Continue" button disabled or validation error shown
- [ ] Enter special characters: `<script>alert('xss')</script>`
- [ ] **Verify**: Input sanitized or validation error shown
- [ ] **Verify**: No XSS vulnerability

### Step 4: Token Economics Validation
- [ ] Navigate to Economics step
- [ ] Enter negative supply: `-1000`
- [ ] **Verify**: Validation error displayed
- [ ] Enter non-numeric value: `abc`
- [ ] **Verify**: Input rejected or validation error shown
- [ ] Enter extremely large supply: `999999999999999999999`
- [ ] **Verify**: Warning or validation for unrealistic value

### Step 5: Compliance Validation
- [ ] Navigate to Compliance Readiness step
- [ ] Attempt to continue without completing required items
- [ ] **Verify**: "Continue" button disabled or validation error shown
- [ ] **Verify**: Clear messaging about what's required

**Expected Duration**: 5-7 minutes
**Pass Criteria**: All invalid inputs rejected gracefully with clear error messages

---

## Scenario 3: Interrupted Flow & Draft Persistence

### Step 1: Start Wizard
- [ ] Authenticate and navigate to `/launch/guided`
- [ ] Fill Organization Profile step completely
- [ ] Click "Continue" to Token Intent step
- [ ] Fill token description: `This is a test draft`
- [ ] **Do NOT click Continue**

### Step 2: Interrupt Flow (Close Browser)
- [ ] Close browser tab/window entirely
- [ ] **Verify**: Draft auto-saved to localStorage (check dev tools if needed)

### Step 3: Restore Draft
- [ ] Open new browser tab
- [ ] Navigate to `http://localhost:5173/launch/guided`
- [ ] **Verify**: User still authenticated (or re-authenticate)
- [ ] **Verify**: Wizard restores to Token Intent step
- [ ] **Verify**: Previously entered data restored (organization name, token description)
- [ ] **Verify**: Progress indicator shows correct step

### Step 4: Clear Draft
- [ ] Click "Clear Draft" or "Start Over" button (if available)
- [ ] **Verify**: Confirmation dialog appears
- [ ] Confirm clear action
- [ ] **Verify**: All form fields reset to empty
- [ ] **Verify**: Wizard returns to Step 1

### Step 5: Page Reload Mid-Wizard
- [ ] Fill Organization Profile again
- [ ] Navigate to Token Intent step
- [ ] Fill some fields
- [ ] Press F5 (page reload)
- [ ] **Verify**: Data persists after reload
- [ ] **Verify**: User stays authenticated
- [ ] **Verify**: Wizard state preserved

**Expected Duration**: 5-7 minutes
**Pass Criteria**: Draft persistence works across interruptions, clear draft resets state

---

## Scenario 4: Session Recovery & Persistence

### Step 1: Initial Authentication
- [ ] Clear all browser data (localStorage, cookies)
- [ ] Navigate to homepage
- [ ] Authenticate with email/password
- [ ] **Verify**: User authenticated successfully

### Step 2: Page Reload (Same Session)
- [ ] Press F5 to reload page
- [ ] **Verify**: User remains authenticated
- [ ] **Verify**: No re-authentication required
- [ ] **Verify**: User data persists (email, address visible)

### Step 3: New Tab (Same Browser)
- [ ] Open new tab in same browser
- [ ] Navigate to `http://localhost:5173/launch/guided`
- [ ] **Verify**: User authenticated in new tab
- [ ] **Verify**: Session shared across tabs

### Step 4: Browser Restart (If Session Persists)
- [ ] Close all browser windows
- [ ] Reopen browser
- [ ] Navigate to `http://localhost:5173`
- [ ] **Verify**: User may or may not be authenticated (depends on implementation)
- [ ] **If authenticated**: Verify user data correct
- [ ] **If not authenticated**: Verify can re-authenticate with same credentials

### Step 5: Logout
- [ ] Click "Sign Out" or "Logout" button
- [ ] **Verify**: User signed out successfully
- [ ] **Verify**: Redirected to homepage or login page
- [ ] **Verify**: localStorage cleared (check dev tools)
- [ ] Attempt to navigate to `/launch/guided`
- [ ] **Verify**: Redirected to authentication

**Expected Duration**: 5-7 minutes
**Pass Criteria**: Session persists correctly, logout clears state completely

---

## Scenario 5: Error States & Recovery

### Step 1: Backend Provisioning Failure (Simulated)
- [ ] **Note**: May require backend simulation or network throttling
- [ ] Authenticate with email/password
- [ ] **If provisioning fails**:
  - [ ] **Verify**: Error message displayed clearly
  - [ ] **Verify**: User can continue but sees "canDeploy: false" indicator
  - [ ] **Verify**: Guided launch wizard accessible but submission may be blocked
  - [ ] **Verify**: Option to retry provisioning or contact support

### Step 2: Network Error During Wizard
- [ ] Open browser dev tools
- [ ] Enable "Offline" mode in Network tab
- [ ] Fill wizard step and click "Continue"
- [ ] **Verify**: Error message displayed for network failure
- [ ] **Verify**: Data not lost (still in form fields)
- [ ] Disable offline mode
- [ ] Retry "Continue"
- [ ] **Verify**: Navigation succeeds after network restored

### Step 3: Invalid Session Token
- [ ] Authenticate successfully
- [ ] Open dev tools → Application → Local Storage
- [ ] Corrupt `arc76_session` value (change a few characters)
- [ ] Navigate to `/launch/guided` or refresh page
- [ ] **Verify**: Graceful handling (re-authentication prompt or error message)
- [ ] **Verify**: No app crash or infinite loop

### Step 4: Submission Error
- [ ] Complete entire wizard
- [ ] Click "Submit"
- [ ] **If backend returns error**:
  - [ ] **Verify**: Error message displayed clearly
  - [ ] **Verify**: User can retry submission
  - [ ] **Verify**: Form data preserved (not lost)
  - [ ] **Verify**: No duplicate token creation

**Expected Duration**: 7-10 minutes (may require backend cooperation)
**Pass Criteria**: All errors handled gracefully with clear user guidance

---

## Scenario 6: Business Roadmap Alignment Verification

### Step 1: No Wallet Connectors
- [ ] Navigate through entire application:
  - [ ] Homepage
  - [ ] Sign-in page
  - [ ] Guided launch wizard (all steps)
  - [ ] Token dashboard
  - [ ] Compliance pages
  - [ ] Settings pages
- [ ] **Verify**: No "Connect Wallet" buttons anywhere
- [ ] **Verify**: No WalletConnect, MetaMask, Pera Wallet, Defly, or similar UI
- [ ] **Verify**: Only email/password authentication visible

### Step 2: Backend-Driven Deployment
- [ ] Complete wizard and submit token
- [ ] **Verify**: No "Sign transaction in wallet" prompts
- [ ] **Verify**: No "Approve in wallet" messages
- [ ] **Verify**: Submission happens directly (backend handles blockchain)
- [ ] **Verify**: User sees deployment status (pending → active)

### Step 3: Email/Password Only
- [ ] Sign out
- [ ] **Verify**: Only email/password sign-in option available
- [ ] **Verify**: No wallet-based authentication option
- [ ] Authenticate again
- [ ] **Verify**: Same account accessible with email/password

### Step 4: Compliance-First Architecture
- [ ] Navigate to compliance dashboard
- [ ] **Verify**: Compliance checks visible and functional
- [ ] **Verify**: No blockchain-specific complexity exposed to user
- [ ] **Verify**: Clear, business-friendly language (not crypto jargon)

**Expected Duration**: 10-15 minutes
**Pass Criteria**: Zero wallet UI, backend-driven deployment, email/password auth only

---

## Scenario 7: Accessibility & Responsiveness

### Step 1: Keyboard Navigation
- [ ] Navigate to sign-in page
- [ ] Use Tab key to navigate between form fields
- [ ] **Verify**: Focus indicators visible
- [ ] **Verify**: Logical tab order (email → password → submit)
- [ ] Use Enter key to submit form
- [ ] **Verify**: Form submits via Enter key

### Step 2: Mobile Viewport
- [ ] Open browser dev tools
- [ ] Enable device emulation (iPhone 12 or similar)
- [ ] Navigate through wizard
- [ ] **Verify**: Responsive layout (no horizontal scroll)
- [ ] **Verify**: Buttons/inputs properly sized for touch
- [ ] **Verify**: Navigation functional on mobile

### Step 3: Screen Reader (Optional)
- [ ] Enable screen reader (VoiceOver, NVDA, JAWS)
- [ ] Navigate through sign-in form
- [ ] **Verify**: Form labels read correctly
- [ ] **Verify**: Error messages announced
- [ ] **Verify**: Buttons have descriptive labels

**Expected Duration**: 5-7 minutes
**Pass Criteria**: Keyboard accessible, mobile responsive, screen reader friendly

---

## Final Verification Checklist

### Automated Tests
- [ ] Unit tests passing: `npm test` (expect 3124+ passing)
- [ ] Build succeeds: `npm run build` (0 errors)
- [ ] E2E tests (critical): Auth-first flows passing (15/15 expected)

### Documentation
- [ ] Implementation summary reviewed
- [ ] Testing matrix reviewed
- [ ] Acceptance criteria mapped to tests

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors in browser (except suppressed)
- [ ] No XSS vulnerabilities
- [ ] No hardcoded credentials

### Business Requirements
- [ ] Email/password authentication only ✅
- [ ] No wallet connectors anywhere ✅
- [ ] Backend-driven token deployment ✅
- [ ] Compliance-first architecture ✅
- [ ] Deterministic behavior (repeatable) ✅

---

## Sign-Off

**Manual Testing Completed By**: ___________________________

**Date**: ___________________________

**Issues Found**: 
- [ ] None (ready for production)
- [ ] Minor issues (document below, not blocking)
- [ ] Major issues (blocking, requires fixes)

**Issue Details** (if any):
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Recommendation**:
- [ ] Approve for merge
- [ ] Request changes
- [ ] Requires further testing

**Product Owner Signature**: ___________________________
