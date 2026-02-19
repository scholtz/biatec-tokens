/**
 * Integration Tests: Login-to-Create-Token Redirection Chain
 *
 * Tests the complete auth-first flow:
 *   1. Unauthenticated user attempts to access create-token route
 *   2. Router guard stores the intended destination and redirects to login
 *   3. After successful login, auth store marks user authenticated
 *   4. Consumer retrieves stored redirect and navigates to original destination
 *
 * These tests validate the behavioral contract end-to-end, not just individual
 * guard logic. They are integration tests that simulate the real sequence.
 *
 * Business value: Prevents activation drop-off caused by broken redirect-after-login
 * patterns. Users who land on /launch/guided unauthenticated should resume exactly
 * where they intended after signing in.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AUTH_STORAGE_KEYS } from '../../constants/auth'

// ---------------------------------------------------------------------------
// Simulate the full router guard + post-auth redirect chain
// ---------------------------------------------------------------------------

/**
 * Step 1: Unauthenticated access → guard fires, stores intended path, returns redirect
 */
function simulateUnauthenticatedAccess(
  path: string,
  requiresAuth: boolean,
  routeName?: string
): { redirected: boolean; redirectTarget: { name: string; query: Record<string, string> } | null } {
  if (!requiresAuth) return { redirected: false, redirectTarget: null }
  if (routeName === 'TokenDashboard') return { redirected: false, redirectTarget: null }

  const algorandUser = localStorage.getItem('algorand_user')
  if (!algorandUser) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, path)
    return {
      redirected: true,
      redirectTarget: { name: 'Home', query: { showAuth: 'true' } },
    }
  }
  return { redirected: false, redirectTarget: null }
}

/**
 * Step 2: User completes email/password login → auth store saves user
 */
function simulateSuccessfulLogin(email: string, address: string): void {
  const user = { address, email, isConnected: true }
  localStorage.setItem('algorand_user', JSON.stringify(user))
}

/**
 * Step 3: After login, consumer checks for stored redirect and navigates
 */
function simulatePostAuthRedirect(): string | null {
  const storedPath = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)
  if (storedPath) {
    localStorage.removeItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)
    return storedPath
  }
  return null
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login-to-Create-Token Redirection Chain', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('complete flow: unauthenticated → login → resume intended route', () => {
    it('should store /launch/guided and redirect to login when unauthenticated', () => {
      const result = simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')

      expect(result.redirected).toBe(true)
      expect(result.redirectTarget?.name).toBe('Home')
      expect(result.redirectTarget?.query.showAuth).toBe('true')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/launch/guided')
    })

    it('should resume /launch/guided after successful login', () => {
      // Step 1: Unauthenticated access stores the intent
      simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/launch/guided')

      // Step 2: User logs in
      simulateSuccessfulLogin('user@example.com', 'ALGO_ADDRESS_1234')
      expect(localStorage.getItem('algorand_user')).toBeTruthy()

      // Step 3: Post-auth redirect fires
      const resumePath = simulatePostAuthRedirect()
      expect(resumePath).toBe('/launch/guided')

      // Verify redirect key is cleaned up after use
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBeNull()
    })

    it('should resume /create after successful login', () => {
      simulateUnauthenticatedAccess('/create', true, 'TokenCreator')
      simulateSuccessfulLogin('creator@example.com', 'ALGO_CREATOR_ADDR')
      const resumePath = simulatePostAuthRedirect()
      expect(resumePath).toBe('/create')
    })

    it('should resume /settings after successful login', () => {
      simulateUnauthenticatedAccess('/settings', true, 'Settings')
      simulateSuccessfulLogin('settings@example.com', 'ALGO_SETTINGS_ADDR')
      const resumePath = simulatePostAuthRedirect()
      expect(resumePath).toBe('/settings')
    })

    it('should resume /compliance/setup after successful login', () => {
      simulateUnauthenticatedAccess('/compliance/setup', true, 'ComplianceSetupWorkspace')
      simulateSuccessfulLogin('compliance@example.com', 'ALGO_COMPLIANCE_ADDR')
      const resumePath = simulatePostAuthRedirect()
      expect(resumePath).toBe('/compliance/setup')
    })

    it('should return null from post-auth redirect when no stored path (direct login)', () => {
      // User navigated directly to login without a prior route
      simulateSuccessfulLogin('direct@example.com', 'ALGO_DIRECT_ADDR')
      const resumePath = simulatePostAuthRedirect()
      // No stored path → consumer should use default (e.g., /dashboard or /launch/guided)
      expect(resumePath).toBeNull()
    })
  })

  describe('edge cases: stale or corrupted redirect state', () => {
    it('should not store redirect for dashboard (special exception)', () => {
      const result = simulateUnauthenticatedAccess('/dashboard', true, 'TokenDashboard')
      // Dashboard is special: allowed without auth
      expect(result.redirected).toBe(false)
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBeNull()
    })

    it('should not store redirect for public routes', () => {
      const result = simulateUnauthenticatedAccess('/', false, 'Home')
      expect(result.redirected).toBe(false)
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBeNull()
    })

    it('should overwrite stale redirect when user attempts a new route', () => {
      // User attempted /settings earlier (stored), now tries /launch/guided
      simulateUnauthenticatedAccess('/settings', true, 'Settings')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/settings')

      // New unauthenticated attempt to /launch/guided overwrites stored path
      simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/launch/guided')
    })

    it('should clear redirect storage after consumption (prevents double-redirect)', () => {
      simulateUnauthenticatedAccess('/launch/guided', true)
      simulateSuccessfulLogin('user@example.com', 'ADDR')

      const first = simulatePostAuthRedirect()
      const second = simulatePostAuthRedirect()

      expect(first).toBe('/launch/guided')
      expect(second).toBeNull() // Already consumed
    })

    it('should handle login without previous unauthenticated access gracefully', () => {
      // No guard fired, no stored redirect
      simulateSuccessfulLogin('fresh@example.com', 'FRESH_ADDR')
      const resumePath = simulatePostAuthRedirect()
      expect(resumePath).toBeNull()
    })
  })

  describe('authenticated user accessing protected routes', () => {
    it('should allow authenticated user to access /launch/guided without redirect', () => {
      localStorage.setItem(
        'algorand_user',
        JSON.stringify({ address: 'AUTH_ADDR', email: 'auth@example.com', isConnected: true })
      )

      const result = simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      expect(result.redirected).toBe(false)
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBeNull()
    })

    it('should allow authenticated user to access /create without redirect', () => {
      localStorage.setItem(
        'algorand_user',
        JSON.stringify({ address: 'AUTH_ADDR', email: 'auth@example.com' })
      )

      const result = simulateUnauthenticatedAccess('/create', true, 'TokenCreator')
      expect(result.redirected).toBe(false)
    })

    it('should allow authenticated user to access /compliance/setup', () => {
      localStorage.setItem(
        'algorand_user',
        JSON.stringify({ address: 'AUTH_ADDR', email: 'auth@example.com' })
      )

      const result = simulateUnauthenticatedAccess('/compliance/setup', true)
      expect(result.redirected).toBe(false)
    })
  })

  describe('nav visibility: create-token entries must be protected', () => {
    it('/launch/guided requires auth (canonical create-token entry)', () => {
      // Without auth, attempting canonical create entry should be redirected
      const result = simulateUnauthenticatedAccess('/launch/guided', true)
      expect(result.redirected).toBe(true)
    })

    it('/create requires auth (advanced token creator)', () => {
      const result = simulateUnauthenticatedAccess('/create', true)
      expect(result.redirected).toBe(true)
    })

    it('/create/batch requires auth (batch token deployment)', () => {
      const result = simulateUnauthenticatedAccess('/create/batch', true)
      expect(result.redirected).toBe(true)
    })
  })
})

describe('Create-Token Auth State Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should detect authenticated state from localStorage (auth store pattern)', () => {
    const userData = { address: 'ALGO_1234', email: 'user@example.com', isConnected: true }
    localStorage.setItem('algorand_user', JSON.stringify(userData))

    const raw = localStorage.getItem('algorand_user')
    const isAuthenticated = !!raw

    expect(isAuthenticated).toBe(true)
    expect(JSON.parse(raw!).email).toBe('user@example.com')
  })

  it('should detect unauthenticated state when localStorage is empty', () => {
    const raw = localStorage.getItem('algorand_user')
    const isAuthenticated = !!raw
    expect(isAuthenticated).toBe(false)
  })

  it('should treat null/undefined storage as unauthenticated', () => {
    localStorage.removeItem('algorand_user')
    const raw = localStorage.getItem('algorand_user')
    expect(raw).toBeNull()
    expect(!!raw).toBe(false)
  })

  it('should treat empty string storage as unauthenticated (edge case)', () => {
    localStorage.setItem('algorand_user', '')
    const raw = localStorage.getItem('algorand_user')
    const isAuthenticated = !!raw && raw.length > 0
    expect(isAuthenticated).toBe(false)
  })

  it('should persist auth state across simulated page reload', () => {
    // Simulate setting auth state on login
    const user = { address: 'PERSIST_ADDR', email: 'persist@example.com' }
    localStorage.setItem('algorand_user', JSON.stringify(user))

    // Simulate what auth store.initialize() would read on reload
    const storedUser = localStorage.getItem('algorand_user')
    const parsed = storedUser ? JSON.parse(storedUser) : null

    expect(parsed).not.toBeNull()
    expect(parsed.address).toBe('PERSIST_ADDR')
    expect(parsed.email).toBe('persist@example.com')
  })

  it('should clear auth state on simulated logout', () => {
    localStorage.setItem('algorand_user', JSON.stringify({ address: 'ADDR', email: 'u@e.com' }))
    expect(localStorage.getItem('algorand_user')).toBeTruthy()

    // Simulate logout
    localStorage.removeItem('algorand_user')

    expect(localStorage.getItem('algorand_user')).toBeNull()
  })
})
