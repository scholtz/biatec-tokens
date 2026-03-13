/**
 * Playwright Global Setup
 *
 * Pre-warms the Vite dev server before any tests run.
 *
 * Root cause of cold-start CI failures (section 7h, copilot-instructions.md):
 * The router (src/router/index.ts) uses STATIC imports for 30+ view components.
 * First page load in CI causes Vite to compile the entire ~2.5MB bundle from
 * scratch — this takes 60-120s in CI, exceeding any reasonable per-test timeout.
 * Tests that happen to be first in a worker queue fail on attempt 0 and pass on
 * attempt 1 (warm Vite), causing FullResult.status = 'failed' and exit code 1.
 *
 * Fix: navigate to the key routes once in globalSetup BEFORE any tests start.
 * This forces Vite to compile all modules so every subsequent test page load
 * resolves in 2-5s (cached compilation).
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(_config: FullConfig) {
  const BASE_URL = 'http://localhost:5173'

  // Warmup address meets ARC76 ≥58-char requirement (not validated here but
  // consistent with other test fixtures in the codebase).
  const WARMUP_AUTH = JSON.stringify({
    address: 'GLOBALSETUPWARMUP7BIATECTOKENSNOBKND7777777777777777777777',
    email: 'warmup-setup@biatec.io',
    isConnected: true,
  })

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    console.log('[globalSetup] Pre-warming Vite dev server (eliminates cold-start CI failures)...')

    // Seed localStorage so auth-guarded routes render their full component tree
    // (instead of an immediate redirect that skips Vue hydration compilation).
    await page.addInitScript((auth: string) => {
      localStorage.setItem('algorand_user', auth)
    }, WARMUP_AUTH)

    // Visit home — triggers compilation of main.ts and all eager-loaded modules.
    // CRITICAL: Use 'load' NOT 'networkidle' — Vite HMR SSE keeps a persistent
    // Server-Sent Events connection open, preventing networkidle from completing.
    // networkidle requires 500ms of zero network activity; SSE ensures this never
    // happens. Using 'networkidle' here means the warmup ALWAYS hangs until the
    // 120s timeout fires, the error is caught silently, and Vite is never warmed.
    await page.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 120000 })
    console.log('[globalSetup] Home page compiled.')

    // Visit guided launch — compiles GuidedTokenLaunch.vue and its deep import tree.
    await page.goto(`${BASE_URL}/launch/guided`, { waitUntil: 'load', timeout: 120000 })
    console.log('[globalSetup] /launch/guided compiled.')

    // Visit guided launch workspace — compiles GuidedLaunchWorkspace.vue.
    await page.goto(`${BASE_URL}/launch/workspace`, { waitUntil: 'load', timeout: 120000 })
    console.log('[globalSetup] /launch/workspace compiled.')

    // Visit compliance setup — compiles ComplianceSetupWorkspace.vue subtree.
    await page.goto(`${BASE_URL}/compliance/setup`, { waitUntil: 'load', timeout: 120000 })
    console.log('[globalSetup] /compliance/setup compiled.')

    // Visit compliance launch console — compiles ComplianceLaunchConsole.vue.
    await page.goto(`${BASE_URL}/compliance/launch`, { waitUntil: 'load', timeout: 120000 })
    console.log('[globalSetup] /compliance/launch compiled.')

    // Visit whitelist policy dashboard — compiles WhitelistPolicyDashboard.vue and
    // all 4 sub-components (PolicySummaryPanel, EligibilityInspector, PolicyEditPanel,
    // PolicyAuditCard). Without this warmup, the first test that hits /compliance/policy
    // triggers a cold Vite compilation of the entire component subtree, causing the
    // 12-second "wait for edit button" window to expire before the mock fetch completes.
    await page.goto(`${BASE_URL}/compliance/policy`, { waitUntil: 'load', timeout: 120000 })
    console.log('[globalSetup] /compliance/policy compiled.')

    // Visit team workspace — compiles TeamWorkspaceView.vue and approval workflow components.
    await page.goto(`${BASE_URL}/team/workspace`, { waitUntil: 'load', timeout: 120000 })
    console.log('[globalSetup] /team/workspace compiled.')

    console.log('[globalSetup] Vite dev server fully warmed up. All module compilations cached.')
  } catch (err) {
    // Non-fatal: log and continue. Per-test timeouts (test.setTimeout) act as
    // a belt-and-suspenders fallback if the warmup is incomplete.
    console.warn(`[globalSetup] Warmup encountered issue (non-fatal): ${err}`)
  } finally {
    await browser.close()
  }

  console.log('Global Playwright setup completed')
}

export default globalSetup
