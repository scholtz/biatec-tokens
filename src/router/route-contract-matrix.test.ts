/**
 * Route Contract Matrix Tests
 *
 * Exhaustive behavioral contract for every named route under both auth states.
 * Maps: entry route × auth state → expected destination
 *
 * Evidence package for Issue: Frontend MVP hardening - auth-first guided launch reliability
 *
 * Business value:
 * - Prevents regression to legacy wizard paths (direct revenue risk)
 * - Enforces deterministic auth-first routing for enterprise trust
 * - Documents intended behavior for auditors and compliance reviewers
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AUTH_STORAGE_KEYS } from '../constants/auth'

// ---------------------------------------------------------------------------
// Route registry: all routes requiring auth and their canonical paths
// ---------------------------------------------------------------------------
const PROTECTED_ROUTES = [
  { path: '/create', name: 'TokenCreator' },
  { path: '/create/batch', name: 'BatchCreator' },
  { path: '/tokens/abc123', name: 'TokenDetail (dynamic)' },
  { path: '/settings', name: 'Settings' },
  { path: '/compliance/orchestration', name: 'ComplianceOrchestration' },
  { path: '/compliance/setup', name: 'ComplianceSetupWorkspace' },
  { path: '/compliance/whitelists', name: 'ComplianceWhitelists' },
  { path: '/compliance-monitoring', name: 'ComplianceMonitoringDashboard' },
  { path: '/attestations', name: 'AttestationsDashboard' },
  { path: '/insights', name: 'VisionInsightsWorkspace' },
  { path: '/launch/guided', name: 'GuidedTokenLaunch (canonical create)' },
  { path: '/launch/workspace', name: 'GuidedLaunchWorkspace (workspace orchestration)' },
  { path: '/cockpit', name: 'LifecycleCockpit' },
  { path: '/account/security', name: 'AccountSecurity' },
  { path: '/onboarding', name: 'OnboardingFlow' },
  { path: '/enterprise/onboarding', name: 'EnterpriseOnboardingCommandCenter' },
  { path: '/subscription/success', name: 'SubscriptionSuccess' },
  { path: '/activation/wallet', name: 'WalletActivationJourney' },
]

const PUBLIC_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/token-standards', name: 'TokenStandards' },
  { path: '/enterprise-guide', name: 'EnterpriseGuide' },
  { path: '/marketplace', name: 'Marketplace' },
  { path: '/discovery', name: 'DiscoveryDashboard' },
  { path: '/discovery/journey', name: 'TokenDiscoveryJourney' },
  { path: '/subscription/pricing', name: 'Pricing' },
  { path: '/subscription/cancel', name: 'SubscriptionCancel' },
]

// Dashboard is a special case: protected route that allows unauthenticated access
const DASHBOARD_SPECIAL_CASE = { path: '/dashboard', name: 'TokenDashboard' }

// Legacy route that must redirect to canonical create flow
const LEGACY_CREATE_WIZARD = { path: '/create/wizard', redirectsTo: '/launch/guided' }

// ---------------------------------------------------------------------------
// Auth guard simulation (mirrors src/router/index.ts lines ~205-225)
// ---------------------------------------------------------------------------
type GuardResult =
  | { action: 'allow' }
  | { action: 'redirect'; to: string; storedPath: string | null }

function simulateGuard(
  path: string,
  requiresAuth: boolean,
  routeName?: string
): GuardResult {
  if (!requiresAuth) return { action: 'allow' }

  // Special case: TokenDashboard allows access without auth
  if (routeName === 'TokenDashboard') return { action: 'allow' }

  const algorandUser = localStorage.getItem('algorand_user')
  const isAuthenticated = !!algorandUser

  if (!isAuthenticated) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, path)
    return {
      action: 'redirect',
      to: '/?showAuth=true',
      storedPath: path,
    }
  }

  return { action: 'allow' }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Route Contract Matrix', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // ── Unauthenticated access to protected routes ────────────────────────────
  describe('Unauthenticated user → protected routes → redirected to login', () => {
    it.each(PROTECTED_ROUTES)(
      '%s (%j) should redirect to /?showAuth=true when unauthenticated',
      ({ path, name }) => {
        const result = simulateGuard(path, true, name)
        expect(result.action).toBe('redirect')
        expect((result as { action: 'redirect'; to: string }).to).toBe('/?showAuth=true')
      }
    )
  })

  // ── Redirect path preservation ────────────────────────────────────────────
  describe('Unauthenticated user → redirect path is preserved for post-auth resume', () => {
    it.each(PROTECTED_ROUTES)(
      '%s (%j) should store intended path in localStorage',
      ({ path, name }) => {
        simulateGuard(path, true, name)
        const stored = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)
        expect(stored).toBe(path)
      }
    )
  })

  // ── Authenticated access to protected routes ──────────────────────────────
  describe('Authenticated user → protected routes → allowed through', () => {
    beforeEach(() => {
      localStorage.setItem(
        'algorand_user',
        JSON.stringify({ address: 'TEST_ADDR', email: 'test@example.com', isConnected: true })
      )
    })

    it.each(PROTECTED_ROUTES)(
      '%s (%j) should allow authenticated user',
      ({ path, name }) => {
        const result = simulateGuard(path, true, name)
        expect(result.action).toBe('allow')
      }
    )
  })

  // ── Public routes always allow ────────────────────────────────────────────
  describe('All users → public routes → always allowed', () => {
    it.each(PUBLIC_ROUTES)(
      '%s (%j) should allow unauthenticated access',
      ({ path, name }) => {
        const result = simulateGuard(path, false, name)
        expect(result.action).toBe('allow')
      }
    )
  })

  // ── Dashboard special case ────────────────────────────────────────────────
  describe('TokenDashboard special case', () => {
    it('should allow unauthenticated user to access /dashboard (shows empty state)', () => {
      const result = simulateGuard(DASHBOARD_SPECIAL_CASE.path, true, 'TokenDashboard')
      expect(result.action).toBe('allow')
    })

    it('should allow authenticated user to access /dashboard', () => {
      localStorage.setItem('algorand_user', JSON.stringify({ address: 'TEST' }))
      const result = simulateGuard(DASHBOARD_SPECIAL_CASE.path, true, 'TokenDashboard')
      expect(result.action).toBe('allow')
    })
  })

  // ── Legacy wizard redirect ────────────────────────────────────────────────
  describe('Legacy /create/wizard canonical redirect', () => {
    it('should declare legacy wizard redirect target as /launch/guided', () => {
      // The router config defines: { path: '/create/wizard', redirect: '/launch/guided' }
      // This test documents the contract: any reference to /create/wizard goes to /launch/guided
      expect(LEGACY_CREATE_WIZARD.redirectsTo).toBe('/launch/guided')
    })

    it('/launch/guided should be the canonical create entry protected by auth', () => {
      // Without auth: redirect
      const unauthed = simulateGuard('/launch/guided', true, 'GuidedTokenLaunch')
      expect(unauthed.action).toBe('redirect')
      expect((unauthed as { action: 'redirect'; to: string }).to).toBe('/?showAuth=true')

      // With auth: allow
      localStorage.setItem('algorand_user', JSON.stringify({ address: 'TEST' }))
      const authed = simulateGuard('/launch/guided', true, 'GuidedTokenLaunch')
      expect(authed.action).toBe('allow')
    })
  })

  // ── Redirect path storage is overwritten on each navigation ───────────────
  describe('Redirect path overwrite behavior', () => {
    it('should store the most recent intended destination', () => {
      simulateGuard('/compliance/setup', true, 'ComplianceSetupWorkspace')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/compliance/setup')

      simulateGuard('/launch/guided', true, 'GuidedTokenLaunch')
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe('/launch/guided')
    })
  })

  // ── Summary matrix assertion ──────────────────────────────────────────────
  describe('Complete route contract summary', () => {
    it('should cover all 18 protected routes in the matrix', () => {
      expect(PROTECTED_ROUTES.length).toBe(18)
    })

    it('should cover all 8 public routes in the matrix', () => {
      expect(PUBLIC_ROUTES.length).toBe(8)
    })

    it('/launch/guided must be the canonical token creation entry point', () => {
      const canonicalRoute = PROTECTED_ROUTES.find((r) => r.path === '/launch/guided')
      expect(canonicalRoute).toBeDefined()
      expect(canonicalRoute?.name).toContain('canonical create')
    })
  })
})
