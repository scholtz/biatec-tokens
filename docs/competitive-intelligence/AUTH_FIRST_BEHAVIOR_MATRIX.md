# Auth-First UI Behavior Matrix

## Overview

This matrix defines the exact UI behavior, error messages, redirect logic, and component visibility for each authentication state in Biatec. All product decisions about auth-related UI must be consistent with this matrix.

**Core principle:** Authentication state is determined server-side (via the auth store). UI elements that require authentication are never rendered for unauthenticated users — not hidden, **not rendered**.

---

## State 1: Guest (Unauthenticated)

**Definition:** No user session exists. `localStorage` has no `algorand_user` key, or the auth store's `isAuthenticated` computed property returns `false`.

### UI Behavior

| Element | Behavior |
|---------|----------|
| Navigation bar | Shows: Logo, Sign In button, pricing/marketing links |
| Navigation bar | Hides: Dashboard links, token management, compliance menu |
| Main content area | Shows: Marketing content, value proposition, feature overview |
| Protected route (any `/tokens`, `/launch`, `/compliance` path) | Immediate redirect to home with auth prompt |
| Sign In button | Prominent, primary CTA in navbar and hero section |
| "Create Token" button | Not rendered (not hidden — entirely absent from DOM) |
| "My Tokens" link | Not rendered |
| Compliance dashboard | Not rendered |
| Account menu | Not rendered |
| Session indicator | Not rendered |

### Error Messages

| Scenario | User-Facing Message |
|----------|-------------------|
| Tries to access protected route | No error shown — redirected silently to sign-in prompt |
| Signs in with wrong password | "The email or password you entered doesn't match our records. Please try again." |
| Signs in with unregistered email | "We couldn't find an account with that email. Please check the address or create a new account." |
| Signs in too many times (rate limited) | "Too many sign-in attempts. Please wait 5 minutes before trying again." |
| Email verification required | "Please verify your email before signing in. Check your inbox for a verification link." |

### Redirect Logic

```
Guest user → /launch/guided
  ↓
Auth guard triggers
  ↓
Store returnPath = '/launch/guided' (persisted to sessionStorage)
  ↓
Redirect to /?showAuth=true
  ↓
User signs in
  ↓
Auth store initializes, isAuthenticated = true
  ↓
Redirect to returnPath (/launch/guided)
```

### Component Visibility

```
Navbar:
  ✅ <NavLogo />
  ✅ <SignInButton />
  ✅ <MarketingLinks />
  ❌ <UserAccountMenu /> (not rendered)
  ❌ <DashboardLinks /> (not rendered)
  ❌ <NotificationBell /> (not rendered)

Home page:
  ✅ <HeroSection />
  ✅ <FeatureOverview />
  ✅ <PricingSection />
  ❌ <TokenDashboardWidget /> (not rendered)
  ❌ <ComplianceStatusWidget /> (not rendered)
  ❌ <RecentActivityFeed /> (not rendered)
```

---

## State 2: Authenticated (Active Session)

**Definition:** User session is valid. `authStore.isAuthenticated === true`. `authStore.user` is populated with email and identifier. Session token is not expired.

### UI Behavior

| Element | Behavior |
|---------|----------|
| Navigation bar | Shows: All links (Dashboard, Tokens, Compliance, Launch) |
| Session indicator | Visible: User email or initials in account menu |
| Account menu | Shows: Profile, Settings, Subscription, Sign Out |
| Protected routes | Accessible without redirect |
| Token dashboard | Renders with user's actual token data |
| "Create Token" CTA | Visible and enabled |
| Compliance dashboard | Renders with user's actual compliance status |
| Sign In button | Not rendered |
| Marketing hero section | Replaced by authenticated dashboard |

### Error Messages

| Scenario | User-Facing Message |
|----------|-------------------|
| API call fails (network) | "We couldn't load your data. Please check your connection and try again." |
| API call fails (server error) | "Something went wrong on our end. Our team has been notified. Please try again in a moment." |
| Token action fails | Specific message per action (see launchErrorMessages.ts) |
| File upload fails | "Your file couldn't be uploaded. Please check the file format and size, then try again." |
| Session will expire soon (warning) | "Your session will expire in 5 minutes. Save your work to avoid losing any changes." |

### Redirect Logic

```
Authenticated user → / (home)
  ↓
Auth guard allows access
  ↓
Dashboard renders with user data

Authenticated user → /launch/guided
  ↓
Auth guard allows access
  ↓
Check for saved draft
  ↓
Resume from last step (if draft) OR start fresh
```

### Component Visibility

```
Navbar (authenticated):
  ✅ <NavLogo />
  ✅ <DashboardLinks />
  ✅ <UserAccountMenu /> (shows email/initials)
  ✅ <NotificationBell />
  ❌ <SignInButton /> (not rendered)
  ❌ <MarketingLinks /> (replaced by app links)

Dashboard:
  ✅ <TokenDashboardWidget />
  ✅ <ComplianceStatusWidget />
  ✅ <RecentActivityFeed />
  ✅ <LaunchReadinessPanel />
  ❌ <HeroSection /> (not rendered)
```

### Session Indicator Requirements

The session indicator must:
- Show user's email address truncated to first 20 characters if longer
- Show user's initials as avatar fallback
- NOT show wallet address or blockchain account address in any user-facing text
- Indicate subscription tier if relevant (e.g., "Pro Plan" badge)

---

## State 3: Expired Session

**Definition:** User had a valid session, but the session token has expired (typically after 24 hours of inactivity). `authStore.isAuthenticated` may temporarily return `true` from cached state, but API calls return `401 Unauthorized`.

### UI Behavior

| Element | Behavior |
|---------|----------|
| Page content | Renders briefly, then shows session-expired overlay |
| Forms in progress | Inputs disabled; overlay shown above form |
| Session expired overlay | Full-screen: "Your session has expired. Sign in again to continue." |
| Sign In button in overlay | Prominent; clicking opens sign-in modal |
| User's context | Preserved: form data saved to `sessionStorage` before overlay appears |
| After re-auth | User returned to same page, form data restored |

### Error Messages

| Scenario | User-Facing Message |
|----------|-------------------|
| Session expired, user on dashboard | "Your session has expired. Sign in again to continue where you left off." |
| Session expired during form fill | "Your session expired while you were working. Your progress has been saved — sign in to continue." |
| Session expired during file upload | "Your session expired and the upload was cancelled. Sign in and try uploading again." |
| Refresh token fails | "We couldn't refresh your session. Please sign in again." |

### Redirect Logic

```
User on /launch/guided, step 3
  ↓
API returns 401 (session expired)
  ↓
Auth store: set isAuthenticated = false
  ↓
Save current form state to sessionStorage: key = 'launch_guided_saved_context'
  ↓
Show session-expired overlay (not redirect — overlay preserves context)
  ↓
User clicks "Sign In Again"
  ↓
Open sign-in modal (not redirect to home)
  ↓
User signs in successfully
  ↓
Restore saved context from sessionStorage
  ↓
Close overlay, continue from saved state
```

### Context Preservation

The following must be preserved across session expiry:
- Current step in the guided launch wizard
- All form field values (serializable data only, not file objects)
- Scroll position within the current step
- Selected tab or accordion state

The following must NOT be preserved:
- Uploaded file objects (must be re-uploaded)
- Payment form data (security requirement)

---

## State 4: API Failure (Authentication System Error)

**Definition:** The authentication service itself is unavailable, or a critical API call fails during the auth flow. Distinct from expired session — here the system itself has an error.

### UI Behavior

| Element | Behavior |
|---------|----------|
| Sign-in modal | Shows error message with retry option |
| Loading states | Show skeleton UI (not blank) while auth initializes |
| Auth status banner | Optional: show at top of page if auth service is degraded |
| Retry action | Visible: "Try Again" button |
| Support link | Visible: "Contact Support" link if multiple retries fail |
| Protected routes | Block access with "Unable to verify your session" message |

### Error Messages

| Scenario | User-Facing Message |
|----------|-------------------|
| Sign-in API unavailable | "We're having trouble signing you in right now. This is a temporary issue — please try again in a moment." |
| Auth service timeout | "Sign-in is taking longer than expected. Please wait a moment and try again." |
| Network error during sign-in | "We couldn't reach our servers. Please check your internet connection and try again." |
| Unknown auth error | "Something went wrong during sign-in. If this continues, please contact support." |
| Auth succeeds but user data fails to load | "You're signed in, but we had trouble loading your account. Please refresh the page." |

### Redirect Logic

```
User attempts sign-in
  ↓
API call fails (network/server error)
  ↓
Show inline error in sign-in modal
  ↓
Show "Try Again" button (retry same action)
  ↓
If 3rd consecutive failure:
  Show "Contact Support" link
  Do NOT redirect (user stays on sign-in form)
```

### Retry Action

| Retry # | Action |
|---------|--------|
| 1st failure | Show error + "Try Again" button |
| 2nd failure | Show same error + "Try Again" |
| 3rd+ failure | Show "Try Again" + "Contact Support" |
| Retry succeeds | Clear error, continue normal flow |

---

## Implementation Reference

### Auth Store Properties Referenced

```typescript
// src/stores/auth.ts
authStore.isAuthenticated   // boolean — computed: user !== null && isConnected
authStore.user              // AlgorandUser | null
authStore.isConnected       // boolean — derived from session validity
authStore.initialize()      // async — must be called before app mount
```

### Router Guard Pattern

```typescript
// src/router/index.ts
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !authStore.isAuthenticated) {
    // Save returnPath before redirect
    sessionStorage.setItem('auth_return_path', to.fullPath)
    next({ path: '/', query: { showAuth: 'true' } })
    return
  }

  next()
})
```

### After Auth: Restore Return Path

```typescript
// After successful sign-in
const returnPath = sessionStorage.getItem('auth_return_path')
if (returnPath) {
  sessionStorage.removeItem('auth_return_path')
  router.push(returnPath)
} else {
  router.push('/') // or '/tokens' for dashboard
}
```

---

## Anti-Patterns (Never Do This)

| Anti-Pattern | Why It's Wrong |
|-------------|----------------|
| Show "Connect Wallet" button to guest users | This is an email/password-first product — no wallet UI |
| Show "Not connected" status in navbar | Implies wallet connection model; wrong for our product |
| Render protected components and hide with CSS | Leak protected data to DOM; fails security audit |
| Redirect to /login page | We use modal-based auth; redirect causes context loss |
| Clear form data on session expiry | Causes user frustration; context must be preserved |
| Show technical JWT error messages | Users don't understand token expiry; use plain language |

---

*Last updated: 2025 | Platform and Security*
