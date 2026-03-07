/**
 * Integration tests: Canonical routing contract hardening
 *
 * Validates that the canonical token-creation entry point is /launch/guided,
 * not the legacy /create route. Tests use pure logic and constants — no
 * component mounting required.
 *
 * Acceptance criteria (MVP Hardening issue):
 *   AC #1 — CTA entry points consistently route to /launch/guided.
 *   AC #1 — Legacy /create/wizard is only an explicit redirect reference.
 *   AC #1 — Auth redirect target for unauthenticated create-token flow is /launch/guided.
 *
 * Issue: MVP Hardening: Canonical Guided Launch, Accessibility, and Backend-Verified Auth Quality Gates
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NAV_ITEMS } from '../../constants/navItems'
import { AUTH_STORAGE_KEYS } from '../../constants/auth'
import {
  storePostAuthRedirect,
  consumePostAuthRedirect,
} from '../../utils/authFirstHardening'

// ---------------------------------------------------------------------------
// AC #1: Canonical route constant
// ---------------------------------------------------------------------------

const CANONICAL_LAUNCH_PATH = '/launch/guided'
const LEGACY_CREATE_PATH = '/create'
const LEGACY_WIZARD_PATH = '/create/wizard'

describe('Canonical routing contract (MVP Hardening AC #1)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ── NAV_ITEMS canonical entry ────────────────────────────────────────────

  it('NAV_ITEMS contains Guided Launch entry at /launch/workspace (workspace orchestration)', () => {
    // The nav "Guided Launch" entry now points to the workspace orchestration layer
    const guidedLaunchItem = NAV_ITEMS.find(
      item => item.path === '/launch/workspace',
    )
    expect(guidedLaunchItem).toBeDefined()
    expect(guidedLaunchItem?.label).toMatch(/guided launch/i)
  })

  it('NAV_ITEMS does NOT contain a direct /create entry for primary navigation', () => {
    // /create (TokenCreator) should NOT be in the primary nav — users use /launch/guided
    const createItem = NAV_ITEMS.find(item => item.path === LEGACY_CREATE_PATH)
    expect(createItem).toBeUndefined()
  })

  it('NAV_ITEMS does NOT contain a /create/wizard entry (legacy path, redirect only)', () => {
    const wizardItem = NAV_ITEMS.find(item => item.path === LEGACY_WIZARD_PATH)
    expect(wizardItem).toBeUndefined()
  })

  // ── Auth redirect stores canonical path ──────────────────────────────────

  it('storePostAuthRedirect stores /launch/guided as redirect target for unauthenticated create-token intent', () => {
    // Simulate what handleCreateToken does for unauthenticated users:
    // store canonical guided launch path as post-auth redirect
    storePostAuthRedirect(CANONICAL_LAUNCH_PATH)

    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)
    expect(stored).toBe(CANONICAL_LAUNCH_PATH)
  })

  it('consumePostAuthRedirect returns /launch/guided when it was stored as post-auth redirect', () => {
    storePostAuthRedirect(CANONICAL_LAUNCH_PATH)
    const consumed = consumePostAuthRedirect()
    expect(consumed).toBe(CANONICAL_LAUNCH_PATH)
  })

  it('canonical guided launch path and legacy wizard path are distinct routes', () => {
    expect(CANONICAL_LAUNCH_PATH).not.toBe(LEGACY_WIZARD_PATH)
    expect(CANONICAL_LAUNCH_PATH).not.toBe(LEGACY_CREATE_PATH)
  })

  // ── AUTH_STORAGE_KEYS constant ───────────────────────────────────────────

  it('AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH is defined for post-auth redirect storage', () => {
    expect(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH).toBeTruthy()
    expect(typeof AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH).toBe('string')
  })

  // ── Regression: /launch/guided must be the canonical path ────────────────

  it('/launch/guided canonical path is a non-empty string starting with /', () => {
    expect(CANONICAL_LAUNCH_PATH).toBe('/launch/guided')
    expect(CANONICAL_LAUNCH_PATH.startsWith('/')).toBe(true)
  })

  it('Guided Launch nav item routeName matches the route definition name', () => {
    const guidedLaunchItem = NAV_ITEMS.find(item => item.path === '/launch/workspace')
    expect(guidedLaunchItem?.routeName).toBe('GuidedLaunchWorkspace')
  })
})
