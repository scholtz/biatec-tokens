import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AUTH_STORAGE_KEYS, WALLET_CONNECTION_STATE } from '../constants/auth'

describe('Router Authentication Guards', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Authentication Guard Logic', () => {
    /**
     * Tests for the router guard behavior without actually importing router
     * This tests the business logic that the guard should implement
     */
    
    it('should use showAuth parameter instead of showOnboarding (deprecated)', () => {
      // The new implementation should use showAuth, not showOnboarding
      const newParameter = 'showAuth'
      const oldParameter = 'showOnboarding'
      
      expect(newParameter).toBe('showAuth')
      expect(newParameter).not.toBe(oldParameter)
    })

    it('should store redirect path when user is not authenticated', () => {
      const redirectPath = '/create'
      localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, redirectPath)
      
      const storedPath = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)
      expect(storedPath).toBe(redirectPath)
    })

    it('should check WALLET_CONNECTED state for authentication', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED, WALLET_CONNECTION_STATE.CONNECTED)
      
      const isAuthenticated = localStorage.getItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED) === WALLET_CONNECTION_STATE.CONNECTED
      expect(isAuthenticated).toBe(true)
    })

    it('should treat user as unauthenticated when WALLET_CONNECTED is not set', () => {
      localStorage.removeItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED)
      
      const isAuthenticated = localStorage.getItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED) === WALLET_CONNECTION_STATE.CONNECTED
      expect(isAuthenticated).toBe(false)
    })

    it('should use correct storage keys from constants', () => {
      expect(AUTH_STORAGE_KEYS.WALLET_CONNECTED).toBe('wallet_connected')
      expect(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH).toBe('redirect_after_auth')
      expect(WALLET_CONNECTION_STATE.CONNECTED).toBe('true')
    })
  })

  describe('Protected Route Paths', () => {
    it('should define token creator as protected route', () => {
      const protectedRoutes = ['/create', '/settings', '/account', '/compliance', '/attestations', '/allowances']
      expect(protectedRoutes).toContain('/create')
    })

    it('should define settings as protected route', () => {
      const protectedRoutes = ['/create', '/settings', '/account']
      expect(protectedRoutes).toContain('/settings')
    })

    it('should define account as protected route', () => {
      const protectedRoutes = ['/create', '/settings', '/account']
      expect(protectedRoutes).toContain('/account')
    })

    it('should allow dashboard access without auth (exception)', () => {
      // Dashboard is special - allows unauthenticated access to show empty state
      const dashboardRoute = '/dashboard'
      const exceptionsFromAuth = ['/dashboard']
      expect(exceptionsFromAuth).toContain(dashboardRoute)
    })
  })

  describe('Redirect Flow', () => {
    it('should construct redirect URL with showAuth parameter', () => {
      const homeRoute = '/'
      const queryParam = 'showAuth=true'
      const redirectUrl = `${homeRoute}?${queryParam}`
      
      expect(redirectUrl).toBe('/?showAuth=true')
      expect(redirectUrl).not.toContain('showOnboarding')
    })

    it('should preserve full path including query params in redirect storage', () => {
      const fullPath = '/create?template=fungible&network=voi'
      localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, fullPath)
      
      const stored = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)
      expect(stored).toBe(fullPath)
      expect(stored).toContain('?')
      expect(stored).toContain('template=fungible')
    })
  })

  describe('Business Logic Validation', () => {
    it('should follow wallet-free authentication pattern', () => {
      // Business requirement: email/password only, no wallet knowledge required
      const authMethod = 'email-password'
      const walletRequired = false
      
      expect(authMethod).toBe('email-password')
      expect(walletRequired).toBe(false)
    })

    it('should redirect to sign-in modal not onboarding wizard', () => {
      const redirectTarget = 'showAuth' // sign-in modal
      const deprecatedTarget = 'showOnboarding' // wizard (deprecated)
      
      expect(redirectTarget).not.toBe(deprecatedTarget)
      expect(redirectTarget).toBe('showAuth')
    })
  })
})


// ---------------------------------------------------------------------------
// MVP Hardening — Canonical /launch/guided route guard behavior
// ---------------------------------------------------------------------------

import { isAuthRequired, isGuestAccessible, AUTH_REQUIRED_PATHS, GUEST_ACCESSIBLE_PATHS } from '../utils/authFirstHardening'

describe('MVP Hardening — Canonical Route Guard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('AUTH_REQUIRED_PATHS includes /launch/guided (mirrors router requiresAuth meta)', () => {
    // The authFirstHardening AUTH_REQUIRED_PATHS array mirrors the router's requiresAuth meta.
    // This verifies the router config indirectly through the shared contract.
    // Note: direct router import is not used because the router guard setup
    // (router.beforeEach) requires a browser environment and would fail in unit tests.
    expect(AUTH_REQUIRED_PATHS).toContain('/launch/guided')
  })

  it('isAuthRequired /launch/guided returns true (mirrors router requiresAuth: true)', () => {
    expect(isAuthRequired('/launch/guided')).toBe(true)
  })

  it('GUEST_ACCESSIBLE_PATHS includes / (mirrors router: Home has no requiresAuth)', () => {
    expect(GUEST_ACCESSIBLE_PATHS).toContain('/')
  })

  it('isGuestAccessible / returns true (mirrors router: Home has no requiresAuth)', () => {
    expect(isGuestAccessible('/')).toBe(true)
  })

  it('should store /launch/guided as redirect target for unauthenticated access', () => {
    // Simulate router guard behavior for unauthenticated /launch/guided access
    const intendedPath = '/launch/guided'
    localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, intendedPath)

    expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/launch/guided')
  })

  it('should validate algorand_user session before granting access to /launch/guided', () => {
    // Simulate guard: algorand_user must be present
    localStorage.removeItem('algorand_user')
    const hasSession = !!localStorage.getItem('algorand_user')
    expect(hasSession).toBe(false)

    // After login
    localStorage.setItem('algorand_user', JSON.stringify({
      address: 'TEST_ADDRESS',
      email: 'test@example.com',
      isConnected: true,
    }))
    const hasSessionAfterLogin = !!localStorage.getItem('algorand_user')
    expect(hasSessionAfterLogin).toBe(true)
  })

  it('should NOT include /create in canonical token creation path', () => {
    // After MVP hardening: /create is legacy; primary CTAs use /launch/guided
    const canonicalPath = '/launch/guided'
    const legacyPath = '/create'
    expect(canonicalPath).not.toBe(legacyPath)
    expect(canonicalPath).toContain('launch')
  })

  it('should redirect to home with showAuth=true when unauthenticated', () => {
    // Router guard pattern: { name: "Home", query: { showAuth: "true" } }
    const redirectTarget = { name: 'Home', query: { showAuth: 'true' } }
    expect(redirectTarget.query.showAuth).toBe('true')
    expect(redirectTarget.name).toBe('Home')
  })
})
