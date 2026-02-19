# Auth-First Issuance Determinism - Manual Verification Checklist

## Purpose
This checklist provides step-by-step instructions for product owner to manually verify that the frontend meets all requirements for auth-first issuance determinism and compliance UX hardening.

## Prerequisites
- Access to the application at the deployment URL or local dev server
- Modern browser (Chrome, Firefox, or Safari)
- Mobile device or browser responsive mode for mobile testing
- (Optional) Screen reader for accessibility testing

## Verification Steps

### 1. Auth-First Routing Verification ✅

**Test 1.1: Unauthenticated Redirect**
- [ ] Open application in private/incognito window
- [ ] Navigate directly to: `https://yourdomain.com/launch/guided`
- **Expected Result**: 
  - Redirected to home page (`/?showAuth=true`)
  - Email authentication modal opens automatically
  - URL shows query parameter: `?showAuth=true`

**Test 1.2: Return Path Preservation**
- [ ] (Continue from Test 1.1) Sign in with valid email/password
- **Expected Result**:
  - Email modal closes
  - Redirected back to `/launch/guided` automatically
  - No manual navigation required

**Test 1.3: Multi-Route Auth Protection**
- [ ] Sign out (user menu → Sign Out)
- [ ] Try accessing each protected route:
  - `/create` (Advanced token creation)
  - `/dashboard` (Token dashboard)
  - `/compliance/setup` (Compliance workspace)
  - `/cockpit` (Lifecycle cockpit)
  - `/settings` (Settings page)
- **Expected Result** for each route:
  - Redirected to `/?showAuth=true`
  - Email modal opens
  - After sign-in, redirected to attempted route

**Test 1.4: Authenticated Navigation**
- [ ] Sign in with email/password
- [ ] Navigate between routes without signing out:
  - Home → Guided Launch → Compliance → Create → Dashboard
- **Expected Result**:
  - All routes accessible
  - No re-authentication required
  - No wallet connection prompts

---

### 2. Navigation Parity Verification ✅

**Test 2.1: Desktop Navigation**
- [ ] Open application on desktop browser (>768px width)
- [ ] Locate horizontal navigation bar at top of page
- [ ] Verify presence of all navigation items:
  1. Home
  2. Cockpit
  3. Guided Launch
  4. Compliance
  5. Create
  6. Dashboard
  7. Insights
  8. Pricing
  9. Settings
- **Expected Result**: All 9 items visible inline with icons

**Test 2.2: Mobile Navigation**
- [ ] Resize browser to mobile width (<768px) OR use mobile device
- [ ] Verify horizontal navigation collapses to hamburger icon (☰)
- [ ] Click hamburger icon to open mobile menu
- [ ] Verify presence of same navigation items:
  1. Home
  2. Cockpit
  3. Guided Launch
  4. Compliance
  5. Create
  6. Dashboard
  7. Insights
  8. Pricing
  9. Settings
- **Expected Result**: Same 9 items in vertical layout

**Test 2.3: Navigation Functionality**
- [ ] **Desktop**: Click each navigation item
- [ ] **Mobile**: Open menu, click each navigation item, verify menu closes
- **Expected Result**:
  - Each item navigates to correct route
  - Mobile menu closes after selection
  - Issuance/compliance routes accessible on both platforms

---

### 3. Compliance Workspace Verification ✅

**Test 3.1: Step Sequence Display**
- [ ] Sign in and navigate to `/compliance/setup`
- [ ] Verify step indicators show in order:
  1. **Step 1**: Jurisdiction & Policy
  2. **Step 2**: Whitelist Eligibility
  3. **Step 3**: KYC/AML Readiness
  4. **Step 4**: Attestation & Evidence
  5. **Step 5**: Readiness Summary
- **Expected Result**: Steps always appear in this fixed order

**Test 3.2: Sequential Navigation Enforcement**
- [ ] On fresh compliance setup, try clicking Step 3 badge directly
- **Expected Result**:
  - Button is disabled (gray background)
  - Cursor shows "not-allowed" icon
  - Cannot skip ahead without completing previous steps

**Test 3.3: Step Completion Flow**
- [ ] Complete Step 1 (Jurisdiction & Policy):
  - Select a country
  - Select jurisdiction type
  - Select distribution scope
  - Click "Next" or "Continue"
- [ ] Verify Step 1 badge shows green checkmark
- [ ] Verify Step 2 badge becomes clickable (no longer gray)
- **Expected Result**:
  - Step 1 shows ✓ (green checkmark)
  - Step 2 becomes accessible
  - Progress bar updates to 20%

**Test 3.4: Progress Tracking**
- [ ] Complete each step sequentially (Steps 1-5)
- [ ] Verify progress bar updates:
  - After Step 1: 20%
  - After Step 2: 40%
  - After Step 3: 60%
  - After Step 4: 80%
  - After Step 5: 100%
- [ ] Verify "X of 5 Steps Complete" counter updates
- **Expected Result**: Progress indicators update correctly

**Test 3.5: Readiness Score Display**
- [ ] After completing Step 1, verify readiness score appears
- [ ] Verify score is color-coded:
  - 0-30%: Red
  - 31-60%: Yellow
  - 61-100%: Green
- **Expected Result**: Readiness score visible and color-coded

---

### 4. No Wallet UI Verification ✅

**Test 4.1: Navigation Bar Audit**
- [ ] Sign in and check top navigation bar
- [ ] Verify presence of:
  - User email address (truncated or full)
  - ARC76 address (truncated, e.g., "ABCD...XYZ")
  - Subscription status badge (if applicable)
  - Theme toggle (sun/moon icon)
- [ ] Verify ABSENCE of:
  - "Connect Wallet" button
  - "Not connected" status text
  - "Disconnected" indicator
  - Wallet provider names (WalletConnect, Pera, Defly, MetaMask)
  - Network connection status (e.g., "Connected to Algorand Mainnet")
- **Expected Result**: Only email/ARC76 info visible, no wallet UI

**Test 4.2: Issuance Flow Audit**
- [ ] Navigate to `/launch/guided` (Guided Token Launch)
- [ ] Check page header and body for wallet-related text
- [ ] Navigate to `/create` (Advanced Token Creation)
- [ ] Check page for wallet connection prompts
- **Expected Result**: No wallet connection UI on any issuance page

**Test 4.3: Compliance Flow Audit**
- [ ] Navigate to `/compliance/setup`
- [ ] Complete Steps 1-5, checking each step for wallet references
- **Expected Result**: No wallet UI in compliance workspace

**Test 4.4: Modal Dialogs Audit**
- [ ] Sign out, trigger sign-in modal
- [ ] Verify modal title says "Sign in with Email & Password" or similar
- [ ] Verify modal shows email/password input fields only
- [ ] Verify NO wallet provider buttons (Pera, Defly, MetaMask, etc.)
- **Expected Result**: Email/password authentication only

---

### 5. Error Message Verification ✅

**Test 5.1: Field Validation Errors**
- [ ] Navigate to `/compliance/setup`
- [ ] On Step 1, leave country field empty
- [ ] Click "Next" or "Continue"
- **Expected Result**:
  - Inline error message: "Country is required" (or similar)
  - Error message is user-friendly (not technical jargon)
  - Error appears near the field (not just console)

**Test 5.2: Email Validation Errors**
- [ ] Sign out, open sign-in modal
- [ ] Enter invalid email (e.g., "notanemail")
- [ ] Click "Sign In"
- **Expected Result**:
  - Error message: "Please enter a valid email address"
  - Message is user-friendly and actionable

**Test 5.3: Network Error Handling**
- [ ] (Optional) Open browser DevTools → Network tab
- [ ] (Optional) Set throttling to "Offline"
- [ ] Try to navigate or submit a form
- **Expected Result**:
  - Error message appears (may be generic for now)
  - Error does NOT show raw stack traces
  - Error does NOT show "undefined" or "[object Object]"

**Note**: Some error states may show TODO for error toasts. This is documented as a minor gap and acceptable for this validation.

---

### 6. Accessibility Verification ✅

**Test 6.1: Keyboard Navigation**
- [ ] Use **Tab key** to navigate through all interactive elements:
  - Navigation links
  - Buttons
  - Form inputs
  - Step indicators in compliance workspace
- [ ] Verify focus indicator is visible on each element
- **Expected Result**:
  - Focus ring visible (blue outline or similar)
  - Can reach all interactive elements with Tab
  - Tab order follows visual layout (left-to-right, top-to-bottom)

**Test 6.2: Contrast Ratios**
- [ ] Check text readability in dark mode (default)
- [ ] Verify primary text (white) is clearly readable on dark background
- [ ] Verify secondary text (light gray) is readable
- [ ] Verify accent text (blue) is readable
- **Expected Result**:
  - All text meets minimum contrast ratio (4.5:1 for normal text)
  - No low-contrast text that's hard to read

**Test 6.3: Focus Visibility**
- [ ] Click on a button (e.g., "Sign In")
- [ ] Verify button shows active/pressed state
- [ ] Tab to next button, verify focus ring appears
- **Expected Result**:
  - Active states visible (button darkens or changes color)
  - Focus states visible (outline or ring appears)

**Test 6.4: Screen Reader (Optional)**
- [ ] Enable screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Navigate through page with screen reader
- [ ] Verify headings are announced correctly (h1, h2, h3)
- [ ] Verify form labels are announced
- [ ] Verify button purposes are clear
- **Expected Result**: Page structure announced logically

---

### 7. Mobile Responsiveness Verification ✅

**Test 7.1: Layout Adaptation**
- [ ] Resize browser to mobile width (375px - iPhone SE)
- [ ] Verify navigation collapses to hamburger menu
- [ ] Verify step indicators in compliance workspace stack vertically
- [ ] Verify all text is readable (no horizontal scrolling)
- **Expected Result**: Layout adapts gracefully to mobile

**Test 7.2: Touch Targets**
- [ ] Use mobile device or touch simulator
- [ ] Tap buttons, links, form inputs
- [ ] Verify all touch targets are large enough (minimum 44x44px)
- **Expected Result**: All buttons/links easy to tap

**Test 7.3: Mobile Workflow**
- [ ] Sign in on mobile device
- [ ] Navigate through guided launch or compliance setup
- [ ] Complete at least one full workflow on mobile
- **Expected Result**: All functionality works on mobile

---

## Additional Verification (Optional)

### Browser Compatibility
- [ ] Test on Chrome/Edge (Chromium)
- [ ] Test on Firefox
- [ ] Test on Safari (if Mac available)
- **Expected Result**: Consistent behavior across browsers

### Performance
- [ ] Open browser DevTools → Lighthouse
- [ ] Run Lighthouse audit on home page
- [ ] Verify scores:
  - Performance: >80
  - Accessibility: >90
  - Best Practices: >80
- **Expected Result**: Acceptable Lighthouse scores

---

## Verification Summary

After completing all tests, fill out this summary:

**Auth-First Routing**: ✅ / ⚠️ / ❌  
**Navigation Parity**: ✅ / ⚠️ / ❌  
**Compliance Determinism**: ✅ / ⚠️ / ❌  
**No Wallet UI**: ✅ / ⚠️ / ❌  
**Error Messages**: ✅ / ⚠️ / ❌  
**Accessibility**: ✅ / ⚠️ / ❌  
**Mobile Responsiveness**: ✅ / ⚠️ / ❌  

**Overall Verdict**: APPROVED / NEEDS FIXES / BLOCKED

**Issues Found** (if any):
1. 
2. 
3. 

**Sign-off**:
- Reviewer Name: _______________
- Date: _______________
- Signature: _______________

---

## Quick Reference

**Test URLs**:
- Home: `/`
- Guided Launch: `/launch/guided`
- Advanced Creation: `/create`
- Compliance Setup: `/compliance/setup`
- Dashboard: `/dashboard`
- Lifecycle Cockpit: `/cockpit`

**Expected Behaviors**:
- Unauthenticated → Redirect to `/?showAuth=true`
- Authenticated → Access granted to all protected routes
- No wallet UI anywhere in auth/navigation/issuance flows
- Compliance steps: Always 1→2→3→4→5 order
- Desktop/mobile: Same navigation items

**Contact for Issues**:
- If tests fail unexpectedly, contact development team with:
  - Browser version
  - Steps to reproduce
  - Screenshot of issue
  - Console errors (if any)
