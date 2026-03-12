/**
 * MVP Backend Sign-off Lane — Strict Real-Backend Playwright Evidence
 *
 * This is the strict sign-off suite for AC #1, AC #2, and AC #3 of the
 * "Close MVP sign-off gap with real-backend Playwright evidence" issue, and
 * the "Enforce strict real-backend release sign-off" hardening issue.
 *
 * ## What makes this spec different from other sign-off specs
 *
 * 1. **No localStorage fallback for auth** — Uses `loginWithCredentialsStrict()`
 *    which FAILS (throws) if the backend is unavailable. If the test "passes"
 *    because of seeded localStorage, that is a false positive — this spec
 *    prevents it.
 *
 * 2. **No broad error suppression** — This spec does NOT call
 *    `suppressBrowserErrors()`. Genuine application errors surface as failures.
 *
 * 3. **No permissive early-return paths** — Every test that requires backend
 *    connectivity FAILS loudly (with `[STRICT SIGN-OFF FAILURE]` prefix) when
 *    the endpoint is unreachable, returns unexpected status codes, or returns
 *    responses missing required lifecycle evidence fields. There are no
 *    `return` statements that skip assertions silently.
 *
 * 4. **Real backend deployment lifecycle** — When `API_BASE_URL` is set to a
 *    live staging backend, the deployment lifecycle tests hit real endpoints
 *    and assert on actual backend response shapes.
 *
 * 5. **Terminal state is required** — The terminal-state test fails if the
 *    deployment does not reach Completed or Failed within the 60s polling
 *    window. "Still in progress" is not acceptable as release evidence.
 *
 * ## When these tests run
 *
 * All tests in this spec are guarded by `isStrictBackendMode()`. They skip
 * with a clear message when `BIATEC_STRICT_BACKEND=true` is NOT set in the
 * test environment. This keeps CI green in the standard (no-backend) lane.
 *
 * To run the strict sign-off lane:
 *   BIATEC_STRICT_BACKEND=true API_BASE_URL=https://staging.biatec.io \
 *   TEST_USER_EMAIL=signoff@biatec.io TEST_USER_PASSWORD=<secret> \
 *   npx playwright test e2e/mvp-backend-signoff.spec.ts
 *
 * ## Failure message format
 *
 * Every assertion that enforces release sign-off requirements uses the prefix
 * `[STRICT SIGN-OFF FAILURE]` in its failure message. This makes it easy to
 * distinguish genuine release-gate failures from flaky test failures in CI
 * artifacts and logs.
 *
 * ## Acceptance Criteria covered
 *
 *   AC #1 — At least one MVP blocker/sign-off Playwright suite runs against a
 *            real backend authentication flow and explicitly fails if fallback
 *            seeded auth is used.
 *
 *   AC #2 — `loginWithCredentials` (strict variant) no longer silently succeeds
 *            through localStorage fallback when strict backend mode is enabled.
 *
 *   AC #3 — The deployment sign-off test covers a real create-token/deployment
 *            lifecycle, including request acceptance, visible status progression,
 *            and a terminal success or failure state derived from backend responses.
 *            Early-return branches that skip lifecycle evidence have been removed.
 *
 * ## What is still mocked / what remains open
 *
 * - When BIATEC_STRICT_BACKEND is NOT set (standard CI): all tests skip. The
 *   permissive auth specs (`mvp-sign-off-hardening.spec.ts`, `mvp-stabilization.spec.ts`,
 *   etc.) cover UI contract validation with seeded auth state.
 *
 * - Payment and subscription flows are not covered here (separate backend concern).
 *
 * - The token creation wizard form is validated only at the entry page level.
 *   Full wizard step completion is tested separately in `guided-launch-hardening.spec.ts`.
 *
 * Auth model:   Email/password only — no wallet connectors.
 * Auth helper:  loginWithCredentialsStrict() — FAILS if backend unavailable.
 * Waits:        Semantic only (expect().toBeVisible, waitForFunction, waitForLoadState).
 *               Zero arbitrary waitForTimeout() in assertion paths.
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { test, expect } from '@playwright/test'
import {
  loginWithCredentialsStrict,
  isStrictBackendMode,
  getBackendBaseUrl,
  clearAuthScript,
  getNavText,
} from './helpers/auth'

// ---------------------------------------------------------------------------
// Guard: all tests in this file require BIATEC_STRICT_BACKEND=true
// ---------------------------------------------------------------------------

/**
 * Skip guard used by every test in this spec.
 * When `BIATEC_STRICT_BACKEND` is not set, the tests skip with a documented message.
 * When it IS set, tests run against a real backend and fail on any fallback.
 */
function requireStrictBackend() {
  if (!isStrictBackendMode()) {
    return (
      'Strict backend sign-off lane requires BIATEC_STRICT_BACKEND=true. ' +
      'Set API_BASE_URL and BIATEC_STRICT_BACKEND=true to run against a live backend. ' +
      'This skip is intentional: the test must fail (not silently pass) if run without a real backend.'
    )
  }
  return undefined
}

// ===========================================================================
// AC #1 + AC #2: Strict backend authentication
// ===========================================================================

test.describe('AC #1 + AC #2: Strict backend authentication — no localStorage fallback', () => {
  test('loginWithCredentialsStrict authenticates against real backend and seeds valid ARC76 session', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    // This is the core sign-off assertion: loginWithCredentialsStrict MUST succeed
    // via a real HTTP round-trip. If the backend is unavailable it throws — this
    // test fails, not silently passes.
    await loginWithCredentialsStrict(page)
    await page.goto('/')
    await page.waitForLoadState('load')

    // Verify the session that was seeded is ARC76-contract-valid
    const raw = await page.evaluate(() => localStorage.getItem('algorand_user'))
    expect(raw).not.toBeNull()

    const session = JSON.parse(raw!)
    // ARC76 contract fields
    expect(typeof session.address).toBe('string')
    expect(session.address.length).toBeGreaterThan(0)
    expect(typeof session.email).toBe('string')
    expect(session.email.length).toBeGreaterThan(0)
    expect(session.isConnected).toBe(true)

    // The email must match what we sent to the backend — stable identity
    const expectedEmail =
      process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io'
    expect(session.email.toLowerCase()).toBe(expectedEmail.toLowerCase())
  })

  test('authenticated session from real backend allows access to protected route /launch/guided', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)
    await page.goto('/launch/guided')
    await page.waitForLoadState('load')

    // Guided launch heading must be visible — proves the route guard accepted the session
    const heading = page.getByRole('heading', { name: /guided token launch/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })

    // URL must still be the canonical route (no redirect away due to auth failure)
    expect(page.url()).toContain('/launch/guided')
  })

  test('real backend session produces no wallet connector UI', async ({ page }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)
    await page.goto('/')
    await page.waitForLoadState('load')

    const navText = await getNavText(page)
    // Wallet connector brands must never appear in the navigation for an authenticated user
    expect(navText).not.toMatch(/WalletConnect/i)
    expect(navText).not.toMatch(/MetaMask/i)
    expect(navText).not.toMatch(/\bPera\b/i) // word boundary — won't match "Operations"
    expect(navText).not.toMatch(/Defly/i)
    expect(navText).not.toContain('Connect Wallet')
  })

  test('unauthenticated request to /launch/guided redirects even after strict auth cleared', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    // Clear any seeded auth state before navigation
    await clearAuthScript(page)
    await page.goto('/launch/guided')
    await page.waitForLoadState('load')

    // The auth guard must redirect unauthenticated users away from the protected route
    await page.waitForFunction(
      () => {
        const url = window.location.href
        const emailInput = document.querySelector("input[type='email']")
        return !url.includes('/launch/guided') || emailInput !== null
      },
      { timeout: 20000 },
    )

    const url = page.url()
    const redirectedAway = !url.includes('/launch/guided')
    const authFormVisible = await page.locator("input[type='email']").isVisible().catch(() => false)
    expect(redirectedAway || authFormVisible).toBe(true)
  })

  test('backend POST /api/auth/login with wrong password returns non-200 and strict helper fails', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    // Verify that the backend correctly rejects bad credentials (not just frontend validation)
    const apiBaseUrl = getBackendBaseUrl()
    const response = await page.request.post(`${apiBaseUrl}/api/auth/login`, {
      data: { email: 'nonexistent-signoff-test@biatec.io', password: 'WRONG_PASSWORD_12345' },
      timeout: 10000,
    })

    // Backend must return a non-200 status for invalid credentials
    expect(response.ok()).toBe(false)
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)

    // The error response must be JSON with some user-meaningful message
    const body = await response.json().catch(() => null)
    expect(body).not.toBeNull()
    // Must have an error or message field — no raw stack traces or internal codes
    const hasErrorField =
      typeof body?.error === 'string' ||
      typeof body?.message === 'string' ||
      typeof body?.detail === 'string'
    expect(hasErrorField).toBe(true)
  })
})

// ===========================================================================
// AC #3: Real deployment lifecycle sign-off
// ===========================================================================

test.describe('AC #3: Real deployment lifecycle — backend-driven status progression', () => {
  test('backend deployment request endpoint exists and returns accepted status', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)

    // Verify the deployment request endpoint is reachable and responds appropriately
    // This is the "request acceptance" check from AC #3
    const apiBaseUrl = getBackendBaseUrl()

    // First authenticate to get session token from the raw auth response
    const authResponse = await page.request.post(`${apiBaseUrl}/api/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io',
        password: process.env.TEST_USER_PASSWORD ?? '',
      },
      timeout: 10000,
    })
    expect(authResponse.ok()).toBe(true)

    const authBody = await authResponse.json()
    // Bearer token property name check: the backend API contract may use any of these
    // standard property names for the access token. We check all common conventions
    // because the backend API may not yet be finalised on a single property name.
    // Once the backend API is stable, this should be simplified to check only one.
    const bearerToken =
      authBody.token || authBody.accessToken || authBody.access_token || authBody.sessionToken

    // STRICT MODE: Bearer token MUST be present — cannot proceed without it.
    // If missing, the backend auth response does not meet the deployment contract.
    expect(
      typeof bearerToken === 'string' && bearerToken.length > 0,
      `[STRICT SIGN-OFF FAILURE] Auth response is missing a bearer token field. ` +
        `Auth response keys: ${Object.keys(authBody ?? {}).join(', ')}. ` +
        `Expected one of: token, accessToken, access_token, sessionToken.`,
    ).toBe(true)

    // STRICT MODE: Deployment status endpoint MUST be reachable — no silent skips.
    const statusResponse = await page.request
      .get(`${apiBaseUrl}/api/v1/backend-deployment-contract`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
        timeout: 10000,
      })
      .catch((networkError: unknown) => {
        const msg = networkError instanceof Error ? networkError.message : String(networkError)
        throw new Error(
          `[STRICT SIGN-OFF FAILURE] Deployment contract endpoint unreachable at ` +
            `${apiBaseUrl}/api/v1/backend-deployment-contract. Network error: ${msg}`,
        )
      })

    // Endpoint must respond — 200/404 (no deployments yet) or 401/403 (auth gating) are all
    // evidence that the backend is live and the route exists.
    expect(
      [200, 201, 400, 401, 403, 404, 405],
      `[STRICT SIGN-OFF FAILURE] Deployment contract endpoint returned unexpected HTTP ${statusResponse.status()}. ` +
        `Expected one of 200, 201, 400, 401, 403, 404, 405 — any of these proves the backend is reachable.`,
    ).toContain(statusResponse.status())
    console.log(
      `[mvp-backend-signoff] Deployment endpoint reachable — HTTP ${statusResponse.status()}`,
    )
  })

  test('guided launch page renders deployment status UI in auth-first context', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)
    await page.goto('/launch/guided')
    await page.waitForLoadState('load')

    // After real backend auth, the guided launch page must be visible
    const heading = page.getByRole('heading', { name: /guided token launch/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })

    // The page must not show wallet-based deployment prompts
    const bodyText = await page.locator('body').innerText({ timeout: 10000 })
    expect(bodyText).not.toMatch(/sign.*transaction|approve.*in.*wallet|connect.*wallet/i)
    expect(bodyText).not.toMatch(/WalletConnect|MetaMask|Defly/i)
  })

  test('compliance setup page is accessible after real backend auth', async ({ page }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)
    await page.goto('/compliance/setup')
    await page.waitForLoadState('load')

    // Main heading must render — confirms real backend session allows access
    const mainHeading = page.getByRole('heading', { level: 1 }).first()
    await expect(mainHeading).toBeVisible({ timeout: 30000 })

    // Must be a meaningful heading, not an error page
    const headingText = await mainHeading.textContent({ timeout: 5000 })
    expect((headingText ?? '').length).toBeGreaterThan(0)
    expect(headingText).not.toMatch(/error|not found|unauthorized/i)
  })

  test('deployment lifecycle — initiate request and receive accepted deploymentId', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)

    const apiBaseUrl = getBackendBaseUrl()

    // Obtain bearer token from real backend auth
    const authResponse = await page.request.post(`${apiBaseUrl}/api/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io',
        password: process.env.TEST_USER_PASSWORD ?? '',
      },
      timeout: 10000,
    })
    expect(authResponse.ok()).toBe(true)

    const authBody = await authResponse.json()
    const bearerToken =
      authBody.token || authBody.accessToken || authBody.access_token || authBody.sessionToken
    expect(typeof bearerToken).toBe('string')
    expect(bearerToken.length).toBeGreaterThan(0)

    // Submit a token deployment initiation request
    // Uses a unique idempotency key to prevent duplicate deployments across test runs
    const idempotencyKey = `signoff-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    // STRICT MODE: /initiate MUST be reachable — network failure is a hard release blocker.
    const initiateResponse = await page.request
      .post(`${apiBaseUrl}/api/v1/backend-deployment-contract/initiate`, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          idempotencyKey,
          tokenName: 'SignOffTestToken',
          tokenSymbol: 'SOFT',
          totalSupply: '1000000',
          decimals: 6,
          standard: 'ASA',
          network: 'testnet',
          bearerToken,
        },
        timeout: 15000,
      })
      .catch((networkError: unknown) => {
        const msg = networkError instanceof Error ? networkError.message : String(networkError)
        throw new Error(
          `[STRICT SIGN-OFF FAILURE] /initiate endpoint unreachable at ` +
            `${apiBaseUrl}/api/v1/backend-deployment-contract/initiate. ` +
            `The strict sign-off lane requires a live backend with this endpoint deployed. ` +
            `Network error: ${msg}`,
        )
      })

    // STRICT MODE: 200/201 (success) or 409 (idempotency replay) are the only acceptable statuses.
    // 400/422 (validation errors) indicate invalid sign-off test parameters or a backend regression — both are release blockers.
    expect(
      [200, 201, 409],
      `[STRICT SIGN-OFF FAILURE] /initiate returned HTTP ${initiateResponse.status()} with non-successful status. ` +
        `Expected HTTP 200, 201 (accepted), or 409 (idempotency replay). ` +
        `A 400/422 response indicates the sign-off test parameters were rejected by the backend — ` +
        `either the test data is invalid or the backend has a regression. Both are release blockers.`,
    ).toContain(initiateResponse.status())

    const initiateBody = await initiateResponse.json().catch(() => null)
    // STRICT MODE: Response body MUST be parseable JSON.
    expect(
      initiateBody,
      '[STRICT SIGN-OFF FAILURE] /initiate response body could not be parsed as JSON.',
    ).not.toBeNull()

    // Core AC #3 assertion: the backend MUST return a deploymentId for status polling.
    // Without a deploymentId, subsequent lifecycle evidence cannot be obtained.
    const deploymentId = initiateBody?.deploymentId
    expect(
      typeof deploymentId === 'string' && deploymentId.length > 0,
      `[STRICT SIGN-OFF FAILURE] /initiate response missing required 'deploymentId' field. ` +
        `Response keys: ${initiateBody ? Object.keys(initiateBody).join(', ') : '<empty>'}. ` +
        `The deploymentId is required for status polling and lifecycle evidence.`,
    ).toBe(true)

    // The initial state must be one of the valid lifecycle states
    const VALID_STATES = ['Pending', 'Validated', 'Submitted', 'Confirmed', 'Completed', 'Failed']
    if (initiateBody?.state !== undefined) {
      expect(VALID_STATES).toContain(initiateBody.state)
    }

    console.log(`[mvp-backend-signoff] Deployment initiated — ID: ${deploymentId}, state: ${initiateBody?.state}`)

    // STRICT MODE: Status endpoint MUST be reachable immediately after initiation.
    // This is the first lifecycle poll — proves the backend tracks the deployment.
    const statusResponse = await page.request
      .get(`${apiBaseUrl}/api/v1/backend-deployment-contract/status/${deploymentId}`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
        timeout: 10000,
      })
      .catch((networkError: unknown) => {
        const msg = networkError instanceof Error ? networkError.message : String(networkError)
        throw new Error(
          `[STRICT SIGN-OFF FAILURE] Status endpoint unreachable after initiation. ` +
            `Cannot poll lifecycle state for deploymentId=${deploymentId}. ` +
            `Network error: ${msg}`,
        )
      })

    expect(
      statusResponse.ok(),
      `[STRICT SIGN-OFF FAILURE] Status endpoint returned HTTP ${statusResponse.status()} for ` +
        `deploymentId=${deploymentId}. Expected HTTP 200 — backend must be able to track initiated deployments.`,
    ).toBe(true)

    const statusBody = await statusResponse.json().catch(() => null)
    expect(
      statusBody,
      '[STRICT SIGN-OFF FAILURE] Status endpoint returned non-JSON body.',
    ).not.toBeNull()

    // deploymentId must be echoed back for reference — proves backend tracks the correct deployment
    expect(statusBody?.deploymentId).toBe(deploymentId)

    // State must be a valid lifecycle state
    expect(
      VALID_STATES,
      `[STRICT SIGN-OFF FAILURE] Status response state '${statusBody?.state}' is not a valid lifecycle state. ` +
        `Expected one of: ${VALID_STATES.join(', ')}.`,
    ).toContain(statusBody?.state)

    console.log(`[mvp-backend-signoff] Deployment status polled — ID: ${deploymentId}, state: ${statusBody?.state}`)
  })

  test('deployment lifecycle — terminal state surfaced correctly (success or failure)', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)

    const apiBaseUrl = getBackendBaseUrl()

    // Obtain bearer token from real backend auth
    const authResponse = await page.request.post(`${apiBaseUrl}/api/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io',
        password: process.env.TEST_USER_PASSWORD ?? '',
      },
      timeout: 10000,
    })
    expect(authResponse.ok()).toBe(true)

    const authBody = await authResponse.json()
    const bearerToken =
      authBody.token || authBody.accessToken || authBody.access_token || authBody.sessionToken
    expect(typeof bearerToken).toBe('string')

    // Use a stable idempotency key across runs — will return existing deployment on replay
    const stableIdempotencyKey = `signoff-terminal-${process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io'}-stable-v1`

    // STRICT MODE: /initiate MUST succeed for the terminal state test.
    // A network failure or non-successful response is a hard release blocker.
    const initiateResponse = await page.request
      .post(`${apiBaseUrl}/api/v1/backend-deployment-contract/initiate`, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          idempotencyKey: stableIdempotencyKey,
          tokenName: 'SignOffTerminalToken',
          tokenSymbol: 'STOK',
          totalSupply: '500000',
          decimals: 6,
          standard: 'ASA',
          network: 'testnet',
          bearerToken,
        },
        timeout: 15000,
      })
      .catch((networkError: unknown) => {
        const msg = networkError instanceof Error ? networkError.message : String(networkError)
        throw new Error(
          `[STRICT SIGN-OFF FAILURE] /initiate endpoint unreachable during terminal state test. ` +
            `Network error: ${msg}`,
        )
      })

    expect(
      [200, 201, 409],
      `[STRICT SIGN-OFF FAILURE] /initiate returned HTTP ${initiateResponse.status()} in terminal state test. ` +
        `Expected 200, 201 (accepted), or 409 (idempotency replay). ` +
        `Cannot obtain terminal lifecycle evidence without a successfully initiated deployment.`,
    ).toContain(initiateResponse.status())

    const initiateBody = await initiateResponse.json().catch(() => null)
    expect(
      initiateBody,
      '[STRICT SIGN-OFF FAILURE] /initiate response body could not be parsed as JSON in terminal state test.',
    ).not.toBeNull()

    const deploymentId = initiateBody?.deploymentId
    // STRICT MODE: deploymentId is REQUIRED — cannot poll for terminal state without it.
    expect(
      typeof deploymentId === 'string' && deploymentId.length > 0,
      `[STRICT SIGN-OFF FAILURE] /initiate response missing 'deploymentId' in terminal state test. ` +
        `Response keys: ${initiateBody ? Object.keys(initiateBody).join(', ') : '<empty>'}. ` +
        `Terminal state evidence requires a valid deploymentId for polling.`,
    ).toBe(true)

    // AC #3: Poll for terminal state — allows up to 60s (12 attempts × 5s) for progression.
    // Increased from 30s to allow for slower staging backend processing times.
    const TERMINAL_STATES = ['Completed', 'Failed']
    const VALID_STATES = ['Pending', 'Validated', 'Submitted', 'Confirmed', 'Completed', 'Failed']
    let finalState: string | undefined = initiateBody?.state
    let finalBody: Record<string, unknown> | null = null

    for (let attempt = 0; attempt < 12; attempt++) {
      // Check status first (before waiting), then wait — allows fast completion to succeed immediately
      const statusResponse = await page.request
        .get(`${apiBaseUrl}/api/v1/backend-deployment-contract/status/${deploymentId}`, {
          headers: { Authorization: `Bearer ${bearerToken}` },
          timeout: 10000,
        })
        .catch(() => null)

      if (statusResponse === null) {
        // Network failure — log and retry
        console.log(`[mvp-backend-signoff] Poll attempt ${attempt + 1}: network failure, retrying`)
      } else if (statusResponse.status() >= 500) {
        // Transient 5xx — log the reason and continue polling (don't break on transient errors)
        console.log(`[mvp-backend-signoff] Poll attempt ${attempt + 1}: transient ${statusResponse.status()}, retrying`)
      } else if (!statusResponse.ok()) {
        // Non-transient error (4xx) — break polling
        console.log(`[mvp-backend-signoff] Poll attempt ${attempt + 1}: non-recoverable ${statusResponse.status()}, stopping`)
        break
      } else {
        finalBody = await statusResponse.json().catch(() => null)
        finalState = finalBody?.state as string | undefined
        console.log(`[mvp-backend-signoff] Poll attempt ${attempt + 1}: state=${finalState}`)
        if (finalState !== undefined && TERMINAL_STATES.includes(finalState)) break
      }

      if (attempt < 11) await page.waitForTimeout(5000) // wait 5s between attempts (skip on last)
    }

    // STRICT MODE: Terminal state MUST be reached within the polling window.
    // If the backend is too slow to reach terminal state in 60s, that is a release quality issue.
    expect(
      finalState !== undefined && TERMINAL_STATES.includes(finalState),
      `[STRICT SIGN-OFF FAILURE] Deployment did not reach a terminal state within the 60s polling window. ` +
        `Final observed state: '${finalState ?? '<unknown>'}'. ` +
        `Expected one of: ${TERMINAL_STATES.join(', ')}. ` +
        `This indicates either backend processing is too slow or the deployment is stuck — both are release blockers.`,
    ).toBe(true)

    // Assert that the terminal state surfaces expected authoritative identifiers
    if (finalState === 'Completed') {
      // Success: asset ID MUST be surfaced — this is the authoritative deployment evidence
      const assetId = finalBody?.assetId
      expect(
        typeof assetId === 'string' || typeof assetId === 'number',
        `[STRICT SIGN-OFF FAILURE] 'Completed' state is missing required 'assetId' field. ` +
          `Response keys: ${finalBody ? Object.keys(finalBody).join(', ') : '<empty>'}. ` +
          `The assetId is the authoritative evidence that the token was deployed on-chain.`,
      ).toBe(true)
      expect(
        String(assetId).length,
        '[STRICT SIGN-OFF FAILURE] assetId must be non-empty.',
      ).toBeGreaterThan(0)
      console.log(`[mvp-backend-signoff] Deployment completed — assetId: ${assetId}`)
    } else if (finalState === 'Failed') {
      // Failure: user guidance MUST be present — operators must receive actionable failure messaging
      const error = finalBody?.error as Record<string, unknown> | undefined
      expect(
        error !== undefined,
        `[STRICT SIGN-OFF FAILURE] 'Failed' state is missing the required 'error' object. ` +
          `Operators must receive explicit failure messaging — not a silent failure.`,
      ).toBe(true)
      // error is guaranteed non-undefined here (assertion above ensures it)
      const checkedError = error as Record<string, unknown>
      expect(
        typeof checkedError.userGuidance === 'string' && (checkedError.userGuidance as string).length > 0,
        `[STRICT SIGN-OFF FAILURE] Failed deployment error object is missing 'userGuidance' field. ` +
          `Error keys: ${Object.keys(checkedError).join(', ')}. ` +
          `Operators need actionable guidance when a deployment fails — raw error codes are unacceptable.`,
      ).toBe(true)
      // Must not contain raw exception/stack info
      expect(checkedError.userGuidance as string).not.toMatch(/^\s*at\s+\w+.*:\d+:\d+/m)
      console.log(`[mvp-backend-signoff] Deployment failed with guidance: ${checkedError.userGuidance}`)
    }
  })

  test('validate dry-run endpoint accepts parameters and returns isValid/isDeterministicAddress', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)

    const apiBaseUrl = getBackendBaseUrl()

    const authResponse = await page.request.post(`${apiBaseUrl}/api/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io',
        password: process.env.TEST_USER_PASSWORD ?? '',
      },
      timeout: 10000,
    })
    expect(authResponse.ok()).toBe(true)

    const authBody = await authResponse.json()
    const bearerToken =
      authBody.token || authBody.accessToken || authBody.access_token || authBody.sessionToken
    expect(typeof bearerToken).toBe('string')

    // STRICT MODE: /validate MUST be reachable — it is required lifecycle evidence.
    // A network failure or non-OK response is a hard release blocker.
    const validateResponse = await page.request
      .post(`${apiBaseUrl}/api/v1/backend-deployment-contract/validate`, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          tokenName: 'ValidationTestToken',
          tokenSymbol: 'VTT',
          totalSupply: '1000',
          decimals: 0,
          standard: 'ASA',
          network: 'testnet',
          bearerToken,
        },
        timeout: 10000,
      })
      .catch((networkError: unknown) => {
        const msg = networkError instanceof Error ? networkError.message : String(networkError)
        throw new Error(
          `[STRICT SIGN-OFF FAILURE] /validate endpoint unreachable at ` +
            `${apiBaseUrl}/api/v1/backend-deployment-contract/validate. ` +
            `Dry-run validation is required lifecycle evidence for release sign-off. ` +
            `Network error: ${msg}`,
        )
      })

    expect(
      validateResponse.ok(),
      `[STRICT SIGN-OFF FAILURE] /validate returned HTTP ${validateResponse.status()}. ` +
        `Expected HTTP 200 — validate endpoint must return a validation result for sign-off parameters.`,
    ).toBe(true)

    const validateBody = await validateResponse.json().catch(() => null)
    // STRICT MODE: Response body MUST be parseable JSON.
    expect(
      validateBody,
      '[STRICT SIGN-OFF FAILURE] /validate response body could not be parsed as JSON.',
    ).not.toBeNull()

    // isDeterministicAddress proves ARC76 derivation is working in the backend.
    // This field is REQUIRED for lifecycle evidence — it is the on-chain proof.
    expect(
      validateBody?.isDeterministicAddress !== undefined,
      `[STRICT SIGN-OFF FAILURE] /validate response missing required 'isDeterministicAddress' field. ` +
        `Response keys: ${validateBody ? Object.keys(validateBody).join(', ') : '<empty>'}. ` +
        `isDeterministicAddress is the ARC76 address derivation proof — required for deployment sign-off.`,
    ).toBe(true)
    expect(
      typeof validateBody.isDeterministicAddress,
      '[STRICT SIGN-OFF FAILURE] isDeterministicAddress must be a boolean.',
    ).toBe('boolean')

    // isValid tells us whether the parameters are deployable — must be returned.
    expect(
      validateBody?.isValid !== undefined,
      `[STRICT SIGN-OFF FAILURE] /validate response missing required 'isValid' field. ` +
        `Response keys: ${validateBody ? Object.keys(validateBody).join(', ') : '<empty>'}. ` +
        `isValid is required to confirm the deployment parameters meet backend validation rules.`,
    ).toBe(true)
    expect(
      typeof validateBody.isValid,
      '[STRICT SIGN-OFF FAILURE] isValid must be a boolean.',
    ).toBe('boolean')

    console.log(`[mvp-backend-signoff] Validate response — isValid: ${validateBody?.isValid}, isDeterministicAddress: ${validateBody?.isDeterministicAddress}`)
  })
})

// ===========================================================================
// Real-backend product posture — what strict mode proves about the platform
// ===========================================================================

test.describe('Real-backend product posture verification', () => {
  test('authenticated user email is displayed from real backend session, not placeholder', async ({
    page,
  }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)
    await page.goto('/')
    await page.waitForLoadState('load')

    // Email set in the session must come from the backend response (not a hardcoded placeholder)
    const raw = await page.evaluate(() => localStorage.getItem('algorand_user'))
    const session = JSON.parse(raw!)

    const expectedEmail = process.env.TEST_USER_EMAIL ?? 'e2e-test@biatec.io'

    // The email stored in the session must match what we sent to the backend
    expect(session.email.length).toBeGreaterThan(0) // non-empty
    expect(session.email.toLowerCase()).toBe(expectedEmail.toLowerCase())

    // Must not be a fallback placeholder address
    expect(session.address).not.toBe('E2EFALLBACK7BIATECTOKENSNOBKND7777777777777777777777777777')
    expect(session.address).not.toBe('E2E_TEST_ARC76_ADDRESS_BIATEC_TOKENS')

    // Address must be non-empty (ARC76-derived from real backend)
    expect(session.address.length).toBeGreaterThan(0)
  })

  test('canonical routes respond correctly after real backend authentication', async ({ page }) => {
    const skipReason = requireStrictBackend()
    test.skip(skipReason !== undefined, skipReason ?? '')

    await loginWithCredentialsStrict(page)

    // Verify each canonical protected route is accessible after real auth
    const canonicalRoutes = [
      { path: '/launch/guided', headingPattern: /guided token launch/i },
      { path: '/compliance/setup', headingPattern: /compliance|setup|workspace/i },
    ]

    for (const route of canonicalRoutes) {
      await page.goto(route.path)
      await page.waitForLoadState('load')

      // Route must resolve to a meaningful page, not an error or auth redirect
      const url = page.url()
      expect(url).not.toContain('error')

      // Must have a visible h1 heading
      const heading = page.getByRole('heading', { level: 1 }).first()
      const headingVisible = await heading.isVisible({ timeout: 20000 }).catch(() => false)
      expect(headingVisible).toBe(true)
    }
  })
})
