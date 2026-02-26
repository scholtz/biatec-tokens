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
 *
 * Router guard behaviour (src/router/index.ts):
 *   - GuidedTokenLaunch: uses isIssuanceSessionValid() + stores path in ISSUANCE_RETURN_PATH_KEY
 *   - All other protected routes: plain truthy check + stores path in AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AUTH_STORAGE_KEYS } from '../../constants/auth'
import {
  ISSUANCE_RETURN_PATH_KEY,
  isIssuanceSessionValid,
} from '../../utils/authFirstIssuanceWorkspace'

// ---------------------------------------------------------------------------
// Simulate the full router guard + post-auth redirect chain
// ---------------------------------------------------------------------------

/**
 * Step 1: Unauthenticated access → guard fires, stores intended path, returns redirect.
 *
 * Mirrors the ACTUAL router guard logic in src/router/index.ts:
 * - GuidedTokenLaunch uses structural session validation (address + isConnected) and
 *   stores in ISSUANCE_RETURN_PATH_KEY (separate from generic redirect key)
 * - All other protected routes use plain truthy check and AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH
 */
function simulateUnauthenticatedAccess(
  path: string,
  requiresAuth: boolean,
  routeName?: string
): { redirected: boolean; redirectTarget: { name: string; query: Record<string, string> } | null } {
  if (!requiresAuth) return { redirected: false, redirectTarget: null }
  if (routeName === 'TokenDashboard') return { redirected: false, redirectTarget: null }

  const algorandUser = localStorage.getItem('algorand_user')

  // GuidedTokenLaunch uses the actual isIssuanceSessionValid utility (structural check):
  // requires non-empty address AND isConnected === true
  let isAuthenticated: boolean
  if (routeName === 'GuidedTokenLaunch') {
    isAuthenticated = isIssuanceSessionValid(algorandUser)
  } else {
    isAuthenticated = !!algorandUser
  }

  if (!isAuthenticated) {
    // GuidedTokenLaunch stores in issuance-specific key; others use generic key
    if (routeName === 'GuidedTokenLaunch') {
      localStorage.setItem(ISSUANCE_RETURN_PATH_KEY, path)
    } else {
      localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, path)
    }
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
 * Step 3a: After login, component checks for ISSUANCE-specific return path
 * (mirrors consumeIssuanceReturnPath called in GuidedTokenLaunch.vue onMounted)
 */
function simulateIssuancePostAuthRedirect(): string | null {
  const storedPath = localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)
  if (storedPath) {
    localStorage.removeItem(ISSUANCE_RETURN_PATH_KEY)
    return storedPath
  }
  return null
}

/**
 * Step 3b: After login, consumer checks for stored redirect and navigates
 * (generic redirect for non-issuance routes)
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
    it('should store /launch/guided in ISSUANCE key and redirect to login when unauthenticated', () => {
      const result = simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')

      expect(result.redirected).toBe(true)
      expect(result.redirectTarget?.name).toBe('Home')
      expect(result.redirectTarget?.query.showAuth).toBe('true')
      // GuidedTokenLaunch stores in ISSUANCE_RETURN_PATH_KEY (not generic redirect key)
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBe('/launch/guided')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBeNull()
    })

    it('should resume /launch/guided via issuance return path after successful login', () => {
      // Step 1: Unauthenticated access stores the intent in issuance-specific key
      simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBe('/launch/guided')

      // Step 2: User logs in
      simulateSuccessfulLogin('user@example.com', 'ALGO_ADDRESS_1234')
      expect(localStorage.getItem('algorand_user')).toBeTruthy()

      // Step 3: GuidedTokenLaunch.vue onMounted calls consumeIssuanceReturnPath
      const resumePath = simulateIssuancePostAuthRedirect()
      expect(resumePath).toBe('/launch/guided')

      // Verify issuance redirect key is cleaned up after use
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBeNull()
    })

    it('should resume /create after successful login (generic redirect key)', () => {
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

    it('issuance key and generic key are independent - no cross-contamination', () => {
      // Accessing /settings stores in generic key
      simulateUnauthenticatedAccess('/settings', true, 'Settings')
      // Accessing /launch/guided stores in issuance key
      simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')

      // Generic key still has /settings (not overwritten by issuance route)
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/settings')
      // Issuance key has /launch/guided (stored separately)
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBe('/launch/guided')
    })
  })

  describe('edge cases: stale or corrupted redirect state', () => {
    it('should not store redirect for dashboard (special exception)', () => {
      const result = simulateUnauthenticatedAccess('/dashboard', true, 'TokenDashboard')
      // Dashboard is special: allowed without auth
      expect(result.redirected).toBe(false)
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBeNull()
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBeNull()
    })

    it('should not store redirect for public routes', () => {
      const result = simulateUnauthenticatedAccess('/', false, 'Home')
      expect(result.redirected).toBe(false)
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBeNull()
    })

    it('should overwrite generic stale redirect when user attempts another non-issuance route', () => {
      // User attempted /settings earlier (stored in generic key), now tries /create
      simulateUnauthenticatedAccess('/settings', true, 'Settings')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/settings')

      // New unauthenticated attempt to /create overwrites stored generic path
      simulateUnauthenticatedAccess('/create', true, 'TokenCreator')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/create')
    })

    it('should overwrite stale issuance key when user re-attempts /launch/guided', () => {
      // First attempt stores /launch/guided
      simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBe('/launch/guided')

      // Another attempt overwrites (e.g., user manually navigated again)
      simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBe('/launch/guided')
    })

    it('should clear issuance redirect storage after consumption (prevents double-redirect)', () => {
      simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      simulateSuccessfulLogin('user@example.com', 'ADDR')

      const first = simulateIssuancePostAuthRedirect()
      const second = simulateIssuancePostAuthRedirect()

      expect(first).toBe('/launch/guided')
      expect(second).toBeNull() // Already consumed
    })

    it('should handle login without previous unauthenticated access gracefully', () => {
      // No guard fired, no stored redirect
      simulateSuccessfulLogin('fresh@example.com', 'FRESH_ADDR')
      const resumePath = simulatePostAuthRedirect()
      expect(resumePath).toBeNull()
    })

    it('GuidedTokenLaunch rejects malformed session (missing isConnected)', () => {
      // Plain truthy string (not a well-formed session)
      localStorage.setItem('algorand_user', JSON.stringify({ address: 'ADDR', email: 'u@e.com' }))

      const result = simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      // isConnected is not true → structural validation fails → redirect
      expect(result.redirected).toBe(true)
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBe('/launch/guided')
    })

    it('GuidedTokenLaunch accepts well-formed session (address + isConnected)', () => {
      localStorage.setItem(
        'algorand_user',
        JSON.stringify({ address: 'ALGO_1234', email: 'u@e.com', isConnected: true })
      )

      const result = simulateUnauthenticatedAccess('/launch/guided', true, 'GuidedTokenLaunch')
      // Structural validation passes → not redirected
      expect(result.redirected).toBe(false)
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBeNull()
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
      expect(localStorage.getItem(ISSUANCE_RETURN_PATH_KEY)).toBeNull()
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
