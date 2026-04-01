# Dependency Update: axios 1.13.6 → 1.14.0

**Date:** April 1, 2026  
**PR:** dependabot/npm_and_yarn/axios-1.14.0  
**Type:** Minor version upgrade (semver-minor, no breaking changes)  
**Priority:** MEDIUM — stability and type-safety improvements

---

## Executive Summary

Axios was bumped from 1.13.6 to 1.14.0 by Dependabot. This is a minor version release with no breaking changes. The upgrade improves interceptor error handling, TypeScript type accuracy, Bun runtime compatibility, and HTTP/2 port resolution — all of which benefit the Biatec Tokens backend API client and price-oracle integration. Build succeeds, all 15,127 unit tests pass, and test coverage remains above all configured thresholds.

---

## What Changed (1.13.6 → 1.14.0)

### New Features
- **`undefined` support in `AxiosRequestConfig`** — safer optional field handling; reduces need for explicit `null` guards in request payloads.
- **Intellisense for string literals in widened unions** — improved IDE experience for `responseType`, `method`, and similar fields.
- **Bun runtime exports condition** — the correct Node.js build is now loaded in Bun environments; no impact for our Vite/browser targets but improves cross-environment safety.
- **Frozen-prototype compatibility** — axios now works correctly when the prototype chain is frozen; prevents potential errors in strict security contexts.
- **`pipeFileToResponse` enhanced error handling** — better server-side streaming reliability (Node.js SSR use-cases only).

### Bug Fixes
- **`http2`: use port 443 for HTTPS by default** — fixes incorrect port resolution when no explicit port is given for HTTPS connections.
- **Interceptor error handling** — errors are now handled within the same interceptor they arise in, preventing incorrect re-throw behaviour.
- **`AxiosError.cause` type** — restored as `Error` (was incorrectly widened to `unknown`), giving type-safe error chaining in `catch` handlers.
- **`AxiosInterceptorManager` interface** — `handlers` property is now correctly typed; previously missing from the public interface.
- **`package.json` `main` field** — CJS build artifacts are now correctly referenced, preventing bundler resolution errors in non-ESM contexts.

### Reverts (included in 1.13.x, now stabilised in 1.14.0)
- Silent JSON parsing behaviour reverted to match original specification — `silentJSONParsing=false` no longer throws on invalid JSON by default, restoring backwards compatibility.

---

## Why This Matters for Biatec Tokens

### Revenue Impact: MEDIUM

| Concern | Impact |
|---|---|
| Backend API client reliability | The interceptor error-handling fix (same-interceptor error routing) prevents silent failures in `BiatecTokensApiClient.ts` when backend returns error responses. Our response-error interceptor now correctly chains errors. |
| Price oracle data freshness | `PriceOracleService.ts` uses axios for CoinGecko/Chainlink calls. The HTTP/2 port fix ensures HTTPS connections default to port 443 without explicit configuration. |
| TypeScript safety | `AxiosError.cause` being `Error` (not `unknown`) means our `catch` blocks can safely access `error.cause.message` without unsafe casts. |
| Developer productivity | Improved Intellisense on `AxiosRequestConfig` fields reduces typo-driven bugs in request configuration. |

### Risk Reduction: LOW

- Minor version bump — semver guarantees no breaking changes.
- No changes to public API surface used by our codebase.
- All existing tests pass without modification.
- The `AxiosError.cause` type fix brings the library in line with what TypeScript already infers; our code already handled this correctly.

### Security Impact: NONE

No CVEs addressed in this release. `npm audit` shows pre-existing moderate/high vulnerabilities in **dev-only** dependencies (`brace-expansion`, `flatted`, `happy-dom`, `minimatch`, `picomatch`, `yaml`) — none of these are production runtime dependencies and none are introduced or worsened by this axios update.

---

## Verification Results

### Build
```
✓ vue-tsc -b  (0 TypeScript errors)
✓ vite build  (1364 modules transformed, no errors)
```

### Unit Tests
```
Test Files  479 passed (479)
     Tests  15,127 passed | 25 skipped (15,152)
  Duration  201s
```

### Test Coverage (all thresholds met)
| Metric | Result | Threshold |
|---|---|---|
| Statements | 89.24% | ≥78% ✅ |
| Branches | 83.15% | ≥68.5% ✅ |
| Functions | 83.16% | ≥68.5% ✅ |
| Lines | 89.65% | ≥79% ✅ |

### BiatecTokensApiClient coverage improvement
The `getApiClient()` singleton cache branch and the `error.response` false branch in the response error interceptor were not covered. Three new tests were added:
- `getApiClient singleton cache` — verifies the cached instance is returned on the second call (line 143 false-branch)
- `getApiClient instanceof` — verifies the returned instance is a `BiatecTokensApiClient`
- `error interceptor without response in DEV mode` — verifies the `if (error.response)` false branch (no crash when error has no `response`)

`BiatecTokensApiClient.test.ts`: 28 tests → 31 tests.

---

## Risk Assessment

| Risk | Level | Mitigation |
|---|---|---|
| Breaking changes | **NONE** | Minor version per semver spec; all tests pass |
| Regression in API calls | **LOW** | 31 unit tests for `BiatecTokensApiClient` + 25 for `PriceOracleService` |
| TypeScript compilation errors | **NONE** | vue-tsc reports 0 errors |
| Runtime errors in production | **LOW** | Interceptor changes are additive / correctness fixes |

---

## Manual Verification Checklist

| Step | Action | Expected |
|---|---|---|
| 1 | `npm install` | Installs axios 1.14.0, no peer dependency conflicts |
| 2 | `npm run build` | Build succeeds, no TypeScript errors |
| 3 | `npm test` | All 15,127 tests pass |
| 4 | `npm run dev` — navigate to app | App loads, no console errors from axios |
| 5 | Network tab in DevTools | API requests to `VITE_API_BASE_URL` succeed with correct headers |
| 6 | Subscription/pricing page | Stripe integration (uses axios internally via SDK) works |
| 7 | Compliance dashboard | Backend compliance APIs respond correctly |

---

## Product Roadmap Alignment

This update supports the Biatec Tokens roadmap in the following ways:

- **Backend Token Deployment (68% complete)** — reliable API client error handling is a prerequisite for the backend deployment lifecycle UI (initiate → poll → terminal state). The interceptor fix prevents silent failures.
- **KYC / AML Integration (50–56% complete)** — the price oracle and backend API client are used in compliance evidence gathering. Improved HTTP/2 port handling benefits future cloud-native backend deployments.
- **Email/Password Authentication only** — this update does not introduce or alter any wallet connector. Axios is used exclusively for backend REST calls and price feeds, aligned with the roadmap's no-wallet-connector mandate.

---

## Rollback Plan

If any issue arises post-merge:
1. Revert `package.json` axios version to `"^1.13.6"`
2. Run `npm install` to restore `node_modules`
3. Run `npm test` to confirm no test regressions
4. Push the reverted `package.json` + `package-lock.json`

The revert is low-risk: axios 1.13.6 is functionally equivalent for all code paths we exercise.

---

## Recommendation: ✅ APPROVE

- Build passes, zero TypeScript errors
- All 15,127 unit tests pass
- Coverage above all thresholds  
- No breaking changes (minor semver bump)
- Bug fixes in interceptor error handling and TypeScript types are net positives
- Fully aligned with product definition (no wallet connectors, email/password only)
