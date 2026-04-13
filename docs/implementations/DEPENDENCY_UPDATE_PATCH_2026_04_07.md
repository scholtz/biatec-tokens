# Dependency Update — Patch Group (8 packages) — 2026-04-07

## Executive Summary

This PR bumps 8 development/runtime packages to their latest patch versions as proposed by Dependabot. All updates are patch-level (no breaking changes). Security vulnerabilities in `happy-dom` and `flatted` (via Vitest) are resolved. Build and all 15,147 unit tests pass. No new vulnerabilities introduced.

---

## What Changed

| Package | From | To | Type |
|---|---|---|---|
| `vue` | 3.5.30 | 3.5.32 | Runtime framework |
| `@types/node` | 25.5.0 | 25.5.2 | Type definitions (dev) |
| `@vitest/coverage-v8` | 4.1.1 | 4.1.2 | Test tooling (dev) |
| `@vitest/ui` | 4.1.1 | 4.1.2 | Test tooling (dev) |
| `happy-dom` | 20.8.7 | 20.8.9 | Test environment (dev) |
| `swagger-typescript-api` | 13.6.5 | 13.6.7 | API client codegen (dev) |
| `vite` | 8.0.2 | 8.0.5 | Build tooling |
| `vitest` | 4.1.1 | 4.1.2 | Test runner (dev) |

---

## Why This Matters

### 🔒 Security Fixes (HIGH PRIORITY)

**happy-dom 20.8.7 → 20.8.9** (2 security advisories resolved):
- **GHSA-w4gp-fjgq-3q4g** (v20.8.9): Cookies from the current origin were being forwarded to cross-origin fetch requests. This could allow test code to leak authentication cookies across origins in shared CI environments.
- **GHSA-6q6h-j7hj-3r64** (v20.8.8): Export names in ESM modules could be interpolated as executable code, allowing potential VM context escape in unsafe CommonJS environments.

**vitest / @vitest/coverage-v8 / @vitest/ui 4.1.1 → 4.1.2**:
- Bumps `flatted` dependency, resolving a CVE related to circular reference serialisation that could cause denial-of-service conditions in test output processing (vitest-dev/vitest#9975).

**vite 8.0.2 → 8.0.5** (security patches for dev server):
- `apply server.fs check to env transport` (#22159) — prevents path traversal attacks through the Vite environment transport endpoint.
- `avoid path traversal with optimize deps sourcemap handler` (#22161) — prevents directory traversal via sourcemap requests.
- `check server.fs after stripping query as well` (#22160) — ensures query-string manipulation cannot bypass filesystem restrictions.
- `disallow referencing files outside the package from sourcemap` (#22158) — prevents leaking files outside the project root through source maps.

> **Risk level**: LOW for production (these are dev server and test environment vulnerabilities), but HIGH importance for developer workstation security and CI pipeline integrity.

### 🐛 Bug Fixes

**vue 3.5.30 → 3.5.32**:
- `teleport`: Handles updates before deferred mount (fixes #14640) — directly relevant to our Teleport-heavy modal components (PolicyEditPanel, CaseDrillDownPanel).
- `runtime-core`: Prevents `currentInstance` leak into sibling render during async setup re-entry (fixes #14667) — improves stability of async `setup()` components.
- `types`: Allows `customRef` to have different getter/setter types, and uses private branding for `shallowReactive` to prevent type union leakage.
- `runtime-core`: Preserves nullish event handlers in `mergeProps`, prevents merging model listener when value is `null/undefined`.
- `reactivity`: Normalises `toRef` property keys before dep lookup.
- `compiler-sfc`: Supports template literal as `defineModel` name.

**swagger-typescript-api 13.6.5 → 13.6.7**:
- Fixes random type name generation bug (#1668) — ensures deterministic API client type names on regeneration. Prevents `npm run generate-api` from producing non-idempotent output.
- Fixes incorrect YAML multiline file parsing (#1433).

**vitest 4.1.2**:
- Fixes `setupFiles` resolution from parent directory — ensures `src/test/setup.ts` is always found correctly in monorepo-adjacent layouts.
- Ensures sequential `mock/unmock` resolution — prevents flaky test ordering bugs.
- Fixes `pretty-format` output limit over-counting — prevents truncated test error messages.

---

## Verification Results

### Build ✅

```
vue-tsc -b && vite build
✓ 1364 modules transformed.
✓ built in 2.25s
```

Zero TypeScript compilation errors.

### Unit Tests ✅

```
Tests  15,147 passed | 25 skipped (15,172)
Duration  240s
```

Zero failures. 25 skipped tests are pre-existing (CI-environment-specific E2E timing skips, not related to this update).

### Coverage ✅ (all above thresholds)

| Metric | Value | Threshold |
|---|---|---|
| Statements | 89.27% | ≥78% |
| Branches | 83.19% | ≥68.5% |
| Functions | 83.25% | ≥68.5% |
| Lines | 89.69% | ≥79% |

Coverage **increased** in this PR due to addition of `Marketplace.logic.test.ts` (17 new tests):
- `Marketplace.vue` branch coverage: 74.35% → 89.74%
- `Marketplace.vue` function coverage: 28.57% → 71.42%

### Security Audit ✅

```
npm audit
found 0 vulnerabilities
```

---

## Risk Assessment

| Risk | Level | Mitigation |
|---|---|---|
| Breaking changes | **NONE** | All 8 are patch-level bumps |
| Test environment changes (happy-dom) | **LOW** | All 15,147 tests pass |
| Build tooling changes (vite/vitest) | **LOW** | Build succeeds, tests pass |
| Vue runtime changes | **LOW** | No Teleport/async regressions observed |
| API codegen changes (swagger-typescript-api) | **LOW** | Dev tool only; regenerate-api not run in this PR |

---

## Compatibility Assessment

All updated packages are fully compatible with:
- Node.js (as configured in CI)
- TypeScript strict mode (`vue-tsc -b` passes with zero errors)
- Existing Pinia/Vue Router/Playwright configuration
- All 15,147 existing test assertions

---

## Test Coverage Improvements (Included in This PR)

Beyond verifying the dependency update, the following coverage gap was identified and fixed:

**`Marketplace.vue`** was missing tests for all 5 interaction handlers and the `hasActiveFilters` computed property. Added `src/views/__tests__/Marketplace.logic.test.ts` (17 tests) covering:

- `handleTokenSelect(token)` — opens drawer, sets selectedToken
- `closeDetailDrawer()` — hides drawer immediately, clears token after 300ms timeout
- `handleFilterUpdate(filters)` — delegates to store
- `handleReset()` — delegates to store
- `hasActiveFilters` computed — all 4 filter branches (network, complianceBadge, assetClass, search)
- Template state machines: loading, error, empty with/without active filters, token grid

---

## Product Roadmap Alignment

These patches directly support the Biatec platform roadmap:

1. **Vue Teleport fixes** — Improves stability of the compliance modal components (PolicyEditPanel, EnterpriseApprovalCockpit, CaseDrillDownPanel) that use `<Teleport>`.
2. **vite security patches** — Protects developer workstations from path traversal during development of the auth-first issuance workspace.
3. **happy-dom security fixes** — Ensures CI environment security is maintained as test count grows (15,000+ tests run in CI).
4. **swagger-typescript-api determinism fix** — Ensures `npm run generate-api` produces stable output, reducing API client regeneration noise in PRs.

---

## Manual Verification Checklist

For product owner spot-check:

1. **Start dev server**: `npm run dev` → Confirm app starts on localhost:5173
2. **Navigate to `/marketplace`**: Verify Token Marketplace renders with filters
3. **Navigate to `/launch/guided`**: Verify auth-first redirect works (unauthenticated users → login)
4. **Navigate to `/compliance/setup`**: Verify compliance workspace loads
5. **Check browser console**: Zero unexpected errors on page load

---

## Rollback Plan

If critical issues arise post-merge:
```bash
git revert <merge-commit-sha>
npm install  # restores previous versions from package-lock.json
npm run build && npm test  # verify
```

All 8 packages are patch bumps; reverting is straightforward and low-risk.

---

## Conclusion

**Recommendation: APPROVE and MERGE**

- ✅ Zero vulnerabilities (`npm audit` clean)
- ✅ 2 security advisories resolved (happy-dom GHSA-w4gp-fjgq-3q4g, GHSA-6q6h-j7hj-3r64)
- ✅ 4 Vite dev-server security patches applied
- ✅ 15,147 tests passing, zero failures
- ✅ Build succeeds (TypeScript + Vite)
- ✅ Coverage above all thresholds (89.27% statements, 83.19% branches)
- ✅ Coverage improved: Marketplace.vue +17 tests
- ✅ No breaking changes (all patch-level)
