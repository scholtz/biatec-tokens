# Business Owner Roadmap: Biatec Tokens Platform

## Executive Summary

**Business Vision:** Biatec Tokens is a comprehensive tokenization platform specializing in regulated Real-World Asset (RWA) tokens in multichain environment. Our mission is to democratize compliant token issuance while ensuring enterprise-grade security and regulatory compliance.

**Target Audience:** Non-crypto native persons - traditional businesses and enterprises who need regulated token issuance without requiring blockchain or wallet knowledge.

**Authentication Approach:** Email and password authentication only - no wallet connectors anywhere on the web. Token creation and deployment handled entirely by backend services.

**Revenue Model:** Subscription-based SaaS with tiered pricing ($29/month basic, $99/month professional, $299/month enterprise). Target: 1,000 paying customers in Year 1, generating $2.5M ARR.

**Market Opportunity:** $50B+ RWA tokenization market by 2025, with MICA regulation creating demand for compliant platforms. Current competitors lack comprehensive compliance tooling.

**Current Status:** April 7, 2026 reality check: at review time `main` points to commit `35b6f80b5d7130ac01cce2218ebefd49eb4f7a10` (`docs: update business roadmap - April 2026 reality check`). `Run Tests` is green on that exact head (**24076141196**, `success`), while `Playwright Tests` on the same commit (**24076141206**, `failure`) is now the authoritative current-head browser evidence: the lane finishes with **1891 passed, 5 failed, 23 skipped**. The failures span **three active blocker classes**: three retries of the same time-sensitive assertion, `filters events by freshness`, in `e2e/compliance-notification-center.spec.ts` still report `Expected: 1` / `Received: 7`; `e2e/procurement-accessibility-evidence.spec.ts` again fails the unauthenticated home-page WCAG 2.1 AA axe scan with one blocking violation; and `e2e/release-evidence-center.spec.ts` again fails `next actions or no-blockers section is rendered (AC #4)` with `Expected: true` / `Received: false`. The current-head browser story therefore regressed rather than narrowed, so the standard browser lane is still red and cannot be cited as trustworthy MVP proof. The latest `Build and Deploy FE` success is still **23844787131** on prior product-bearing head `d70a0aba851b925620af7e6b5ee37b9bd6671a30` because `build-fe.yml` only triggers for `src/**`, `docker/**`, `k8s/**`, `public/**`, `package-lock.json`, or the workflow file itself, so the docs-only roadmap commit did not retrigger it. The latest `Strict Backend Sign-off Gate` success likewise remains **23844787156** on `d70a0ab`; the workflow still emits `Generate not-configured status artifact`, and `signoff-status.json` still records `status:not_configured` / `is_release_evidence:false` because `SIGNOFF_API_BASE_URL` and `SIGNOFF_TEST_PASSWORD` remain unset. Recently shipped business-facing progress on `main` still includes the release-evidence command center plus the enterprise notification, remediation, and white-label work (issues **#753**, **#751**, **#749**, and **#747** are closed; PR **#754** is merged), while open PR **#755** now carries the procurement-accessibility / theme-init hardening and open PR **#759** carries the relative-timestamp notification-center fix alongside dependency updates; neither is merged on the evaluated head, open issue **#758** remains open, and the release-evidence-center regression still lacks a merged remediation. The remaining business-owner MVP blockers are protected-environment provisioning, current-head browser credibility, notification-center freshness drift, procurement accessibility, release-evidence next-actions rendering, residual blocker-suite rigor, fresh strict-run provenance on the evaluated head, local Playwright reproducibility, and stale stakeholder-facing Playwright documentation.

---

## Phase 1: MVP Foundation (Q1 2025) - 80% Complete 🟡

### Core Token Creation & Deployment - 70% Complete 🟡

- **Multi-Token Standard Support** (85%): ASA, ARC3, ARC200, ERC20, ERC721 - Support implemented but integration issues persist
- **Backend Token Creation Service** (60%): All token creation and deployment handled by backend - release-truthfulness UX is merged on `main`, the strict sign-off lane now emits auditable artifacts, and standard deployment verification was green before the March 25 TypeScript 6 regression; live protected release evidence still depends on sign-off environment provisioning
- **Multi-Network Deployment** (45%): Algorand Mainnet, Ethereum mainnet (Ethereum, Base, Arbitrum), VOI Testnet, Aramid Testnet - Main chains supported, test networks functional
- **Smart Contract Templates** (75%): 15+ pre-built templates with validation - Templates exist and functional
- **Real-time Deployment Status** (70%): Deployment lifecycle UI now pairs with current-head truthfulness, provenance, and next-action guidance in release-critical views, but protected real-backend evidence is still environment-blocked
- **Batch Deployment** (30%): Multiple tokens in single transaction, basic implementation exists

### Backend Token Creation & Authentication - 72% Complete 🟡

- **Email/Password Authentication** (87%): Secure user authentication without wallet requirements - unit/integration CI is green on current `main`, strict workflow plumbing is healthy, and fail-closed auth proof exists, but the standard Playwright lane is currently red on current `main` for notification-center freshness drift, a renewed procurement accessibility axe failure, and a release-evidence next-actions rendering regression; protected real-backend credentials still need provisioning for final business-owner proof
- **Backend Token Deployment** (68%): All token creation handled server-side - canonical strict Playwright coverage and current-head workflow artifacts exist, but current-head browser evidence is now weakened by three active failure classes (notification-center freshness, procurement accessibility, and release-evidence next-actions rendering), while the newest strict artifact is still `not_configured`, not final release evidence
- **ARC76 Account Management** (72%): Automatic account derivation from user credentials - deterministic contract behavior is well covered in code, tests, and auth helpers, but live protected evidence remains incomplete
- **Transaction Processing** (66%): Backend handles all blockchain interactions - frontend orchestration and evidence messaging on `main` improved materially, but protected end-to-end deployment proof remains the gating evidence
- **Security & Compliance** (76%): Enterprise-grade security for token operations - fail-closed sign-off posture, evidence truthfulness, and deployment workflow health improved materially, but release governance still awaits one `is_release_evidence:true` artifact

### Basic Compliance Features - 76% Complete 🟡

- **MICA Readiness Check** (88%): Article 17-35 compliance validation - validation implemented and functional, with stronger operator-facing evidence on `main`
- **Basic Attestation System** (65%): Digital signatures for compliance - Partial implementation, needs completion
- **Compliance Badges** (95%): Visual compliance indicators - UI components exist and remain backed by automated accessibility coverage and screen-reader review artifacts, but the current-head browser lane again reproduces a procurement-facing axe violation on the unauthenticated home page, so accessibility is back to active blocker status until a fully green current-head run restores confidence
- **Audit Trail Logging** (78%): Basic transaction logging - logging implemented and functional, with evidence-pack workflows improving operator trust

---

## Phase 2: Enterprise Compliance (Q2 2025) - 76% Complete 🟡

### Advanced MICA Compliance - 75% Complete 🟡

- **Whitelist Management** (80%): Guided-launch whitelist authoring, policy dashboard review, and standalone compliance setup workspace proof now exist, but backend-backed enforcement evidence still needs release-grade cross-environment validation
- **Jurisdiction Tracking** (62%): Jurisdiction-aware policy modeling, contradiction detection, and operator review UX are implemented in the frontend, with deeper workspace proof now in CI and stronger reporting surfaces on `main`
- **KYC Integration** (56%): The frontend now has a dedicated investor-onboarding workspace plus a role-aware operations cockpit for staged KYC review, queue health, blocker surfacing, SLA-aware handoffs, and approval language for operators, and PR **#735** adds **58** integration tests plus **30** Playwright assertions proving provider-backed lifecycle mapping, fail-closed posture, cross-surface operator navigation, and wallet-free copy against the already wired enterprise surfaces; deployed-provider evidence and release-grade protected sign-off proof are still missing
- **AML Screening** (50%): The onboarding workflow and operations cockpit now surface AML / risk-review stages, aged items, remediation guidance, and degraded-state posture in the frontend, backend `master` includes provider-backed case lifecycle support alongside sanctions / AML orchestration from PR **#610**, and PR **#735** now proves blocked AML states and degraded evidence handling in automated tests; there is still no end-to-end protected evidence showing those checks in the real release sign-off flow
- **Compliance Reporting** (90%): Reporting, saved audience templates, scheduled delivery, approval history, export readiness, regulator-ready audit export packages, release evidence surfaces, and command-center lifecycle states are now merged on `main` via PR **#737**, and backend reporting / audit-export APIs are merged via **scholtz/BiatecTokensApi#614**; the remaining gap is not feature shipment but protected-environment sign-off evidence and customer-facing operational proof

### Enterprise Dashboard - 90% Complete 🟡

- **Compliance Monitoring** (95%): Compliance policy dashboards, evidence views, remediation workflows, approval/readiness panels, reporting workspaces, the investor-onboarding queue, release evidence center, the role-aware operations cockpit, and the newly shipped notification-center / remediation surfaces now provide a credible operator-facing governance surface with persona-based queue lenses, clearer next-action handoffs, evidence-linked case drill-down, approval-history context, and guided escalation workflows; live operational data integration and protected release evidence still need work.
- **Risk Assessment** (74%): Policy health summaries, contradiction warnings, onboarding blockers, queue-health signals, remediation rollups, sign-off-readiness posture, risk-report builders, cockpit aging/SLA signals, evidence status groupings, case timelines, and clearer escalation guidance improve operator risk awareness, and the shipped notification-center / remediation work makes those signals more actionable; scoring, live backend sourcing, and protected release evidence remain partial.
- **Audit Export** (88%): JSON / text export readiness, approval history, audience-scoped evidence reporting, regulator-ready audit export packaging, and the dedicated release evidence center are now visible product strengths, and backend PR **scholtz/BiatecTokensApi#614** has landed the API backbone; regulator-ready export trust now depends mainly on current strict execution evidence and real operator adoption
- **Multi-User Access** (80%): Team workspace, reviewer queues, staged approval UX, onboarding queue assignment/priority signals, role-aware workflow handoffs, persona-aware queue views, case drill-down ownership context, guided escalation paths, and backend approval-workflow APIs on `master` materially improve enterprise collaboration, but roles/permissions and deployed-system parity remain immature
- **Custom Reporting** (78%): Reporting workspaces, saved audience templates, scheduled delivery, approval history, audit export packaging, command-center lifecycle states, and the risk-report builder now move this from exploratory to commercially meaningful; remaining work is mostly configurability, downstream adoption, and release-grade evidence

### Regulatory Integration - 30% Complete 🔴

- **EU MICA Full Compliance** (26%): Compliance signals, reporting command-center surfaces, release-evidence workflows, and operations-cockpit routing are improving, but full regulator-grade operational validation is still incomplete
- **FATF Guidelines** (18%): AML/sanctions orchestration now exists in backend `master`, but deployed-system proof and downstream case-management workflows are still missing
- **SEC Integration** (5%): US securities compliance, not started - Not started
- **Regulatory API** (34%): API surface and compliance evidence services have advanced materially with merged audit-export / reporting endpoints in backend PR **#614**, and the release evidence center makes that work more usable to operators, but business-owner proof still depends on live-environment validation
- **Compliance Webhooks** (42%): Regulatory / compliance webhook work merged in backend `master`, and the frontend now has clearer workflow handoff surfaces for it, but it is not yet part of a business-owner-verified deployed workflow

---

## Phase 3: Advanced Features (Q3-Q4 2025) - 10% Complete 🔴

### DeFi Integration - 5% Complete 🔴

- **DEX Integration** (5%): Decentralized exchange connectivity, not started
- **Liquidity Pools** (0%): Automated market making, not started
- **Yield Farming** (0%): Staking and rewards, not started
- **Cross-Chain Bridges** (10%): Multi-chain token transfers, basic - Basic framework exists
- **Flash Loans** (0%): Instant liquidity protocols, not started

### Advanced Token Features - 15% Complete 🔴

- **Dynamic NFTs** (10%): Evolving token metadata, basic - Basic support exists
- **Soulbound Tokens** (20%): Non-transferable assets, partial - Partial implementation
- **Token Gating** (25%): Access control mechanisms, basic - Basic functionality
- **Royalty Management** (5%): Automated creator fees, not started
- **Token Burning** (30%): Supply reduction mechanisms, partial - Basic burning exists

### Analytics & Intelligence - 10% Complete 🔴

- **Portfolio Analytics** (15%): Performance tracking, basic - Basic tracking exists
- **Market Intelligence** (5%): Price and volume data, not started
- **Risk Analytics** (10%): Portfolio risk assessment, basic - Basic framework
- **Compliance Analytics** (20%): Regulatory reporting, partial - Basic reporting
- **Predictive Modeling** (0%): Market trend analysis, not started

---

## Phase 4: Scale & Monetization (Q1-Q2 2026) - 5% Complete 🔴

### Enterprise Features - 10% Complete 🔴

- **White-label Solution** (35%): Branding workspace and enterprise portal customization UX are now shipped on `main`, but tenant domain configuration, backend parity, and customer rollout tooling remain incomplete
- **API Access** (10%): Full platform API, basic - Basic API exists
- **Custom Integrations** (0%): Client-specific features, not started
- **Priority Support** (15%): 24/7 enterprise support, basic - Basic support exists
- **SLA Guarantees** (5%): Service level agreements, not started

### Marketplace Features - 0% Complete 🔴

- **Token Marketplace** (5%): Buy/sell regulated tokens, not started - Basic UI exists
- **Liquidity Provision** (0%): Market making services, not started
- **Token Discovery** (10%): Search and filter tools, basic - Basic search exists
- **Price Oracles** (0%): Real-time pricing data, not started
- **Trading Interfaces** (0%): Professional trading UI, not started

### Global Expansion - 0% Complete 🔴

- **Multi-Language Support** (0%): Localization, not started
- **Regional Compliance** (0%): Country-specific regulations, not started
- **Local Payment Methods** (0%): Regional payment processing, not started
- **Partner Ecosystems** (0%): Local integrator networks, not started
- **Regulatory Partnerships** (0%): Government collaborations, not started

---

## Phase 5: Innovation & Leadership (2026+) - 0% Complete 🔴

### AI-Powered Features - 0% Complete 🔴

- **Smart Contract Generation** (0%): AI-assisted contract creation, not started
- **Risk Prediction** (0%): ML-based compliance risk assessment, not started
- **Automated Compliance** (0%): AI-driven regulatory adherence, not started
- **Market Analysis** (0%): AI-powered investment insights, not started
- **Chat Support** (0%): AI customer service, not started

### Next-Generation Blockchain - 0% Complete 🔴

- **Layer 2 Solutions** (0%): Scalability improvements, not started
- **Privacy Features** (0%): Zero-knowledge proofs, not started
- **Interoperability** (5%): Cross-chain communication, basic - Basic framework
- **Quantum Resistance** (0%): Future-proof cryptography, not started
- **Carbon Neutral** (0%): Sustainable blockchain operations, not started

---

## MVP Blockers Reality Check (April 7, 2026 - observed `main` head `35b6f80`)

### Evidence Reviewed

- At review time `main` head was commit `35b6f80b5d7130ac01cce2218ebefd49eb4f7a10` (`docs: update business roadmap - April 2026 reality check`), which again refreshed roadmap evidence without changing shipped product behavior.
- Latest `Run Tests` on `main` is green on that exact head (run **24076141196**, `success`).
- Latest `Playwright Tests` on `main` completed on that same head as run **24076141206** (`failure`). The current-head browser evidence is now direct rather than inferred: the run finished with **1891 passed, 5 failed, 23 skipped**. The failure mix covers **three active blocker classes**: three retries of `e2e/compliance-notification-center.spec.ts`'s `filters events by freshness` assertion still report `Expected: 1` / `Received: 7`; `e2e/procurement-accessibility-evidence.spec.ts` again fails `home page passes axe WCAG 2.1 AA scan (unauthenticated)` with one blocking violation; and `e2e/release-evidence-center.spec.ts` again fails `next actions or no-blockers section is rendered (AC #4)` with `Expected: true` / `Received: false`. The standard browser lane is therefore still red on current head and still cannot be treated as trustworthy sign-off evidence.
- Latest `Build and Deploy FE` success on `main` is still run **23844787131** on prior head `d70a0aba851b925620af7e6b5ee37b9bd6671a30` (`success`) because `build-fe.yml` is path-scoped to product-bearing paths (`src/**`, `docker/**`, `k8s/**`, `public/**`, `package-lock.json`, and the workflow file), so docs-only roadmap updates do not retrigger it.
- Latest `Strict Backend Sign-off Gate` has **not** rerun on `35b6f80`; the newest strict workflow success is still run **23844787156** on older head `d70a0aba851b925620af7e6b5ee37b9bd6671a30`, and the workflow definition still generates a `not_configured` artifact with `is_release_evidence:false` when protected-environment secrets are absent. That run should still be treated as infrastructure-only evidence, not release proof.
- Recently closed roadmap work still includes the release-evidence command center (**#753 / PR #754**), enterprise notification center (**#751**), white-label branding workspace (**#749**), and operator-safe remediation guidance (**#747**). These improve operator-facing value and demo strength, but they do not close the protected sign-off or current-head Playwright credibility gaps. Open PR **#755** now carries the procurement-accessibility / theme-init hardening, while open PR **#759** now carries the relative-timestamp notification-center fix alongside dependency updates; neither is on `main`, open issue **#758** remains open, and the release-evidence-center current-head failure still lacks a merged remediation.
- Static review of the current Playwright corpus still shows strong blocker-facing coverage (`e2e/kyc-aml-operator-journey.spec.ts`, `e2e/compliance-reporting-workspace.spec.ts`, `e2e/release-evidence-center.spec.ts`, `e2e/wizard-redirect-compat.spec.ts`), and PR **#744** still matters because it moved `e2e/mvp-signoff-readiness.spec.ts` from seeded `withAuth()` flows to `loginWithCredentials()`. The route model still needs to be described more honestly in stakeholder docs: source-of-truth navigation points to `/launch/workspace`, while `/launch/guided` is the in-workspace wizard destination.
- The blocker-suite posture is still softer than the docs claim: `e2e/mvp-backend-signoff.spec.ts` still documents "Zero arbitrary waitForTimeout()" while containing a real `await page.waitForTimeout(5000)` poll and **13** guarded `test.skip()` calls, `e2e/backend-deployment-contract.spec.ts` strict polling still uses `waitForTimeout`, and `e2e/mvp-stabilization.spec.ts` still mixes **8** runtime `withAuth()` calls with only **3** runtime `loginWithCredentials()` calls, so the helper discipline remains materially uneven.
- Stakeholder-facing Playwright documents trail reality again: `docs/testing/PLAYWRIGHT_STATUS.md`, `docs/implementations/MVP_SIGNOFF_READINESS_BLOCKER_MAPPING.md`, and parts of `e2e/README.md` still describe older run IDs, undercount current skip / wait debt, overstate auth-helper convergence, and still describe `/launch/guided` as the sole canonical entry even though current code and blocker suites treat `/launch/workspace` as the canonical nav/workspace entry and `/launch/guided` as the downstream wizard destination. The README also still implies the strict lane simply skips at prerequisites even though the workflow produces a successful-but-not-configured artifact instead.
- Local verification in this review confirms targeted Playwright execution outside GitHub Actions is still not dependable enough to replace Actions as the browser-level source of truth; prior local runs in this environment still hit Vite's `EMFILE: too many open files` watcher failure before the browser journey begins. Local Playwright reproducibility therefore remains an operational gap.

### Blocker Validation Status

- 🟡 **Backend-confirmed strict-release blocker remains open:** there is still no backend-confirmed release proof for business-owner sign-off, and the newest strict artifact still says `not_configured` / `is_release_evidence:false`.
- 🔴 **Current-head standard-browser confidence is open:** `Run Tests` is green on `35b6f80`, but `Playwright Tests` failed on that same head across three blocker classes: notification-center freshness drift, procurement accessibility, and release-evidence next-actions rendering.
- 🔴 **Standard Playwright lane is not currently compliant with MVP blocker expectations:** the permissive lane is supposed to provide trustworthy current-head browser confidence, but it currently fails before the business can cite it as evidence, and the active failure mix is broader again rather than narrower.
- 🔴 **Procurement accessibility is an active current-head blocker again:** the latest current-head browser evidence reproduces the unauthenticated home-page axe failure, so procurement-facing accessibility should not be treated as recovered.
- ✅ **Enterprise onboarding realism blocker is materially improved:** PR **#735** still closes the frontend side of provider-backed KYC/AML lifecycle evidence, and backend PR **#610** keeps the corresponding API milestone closed.
- ✅ **Reporting / audit-export milestone is now shipped code:** frontend PR **#737** and backend PR **#614** are both merged, so this capability has moved from roadmap promise to delivered implementation.
- 🟡 **Blocker-suite helper discipline is only partially compliant:** PR **#744** closed the `mvp-signoff-readiness.spec.ts` gap, but `mvp-stabilization.spec.ts` still mixes seeded auth with backend-attempted auth, so some blocker-facing paths remain softer than the stated `loginWithCredentials()` standard.
- 🟡 **Semantic-waits-only standard is not fully met:** both `mvp-backend-signoff.spec.ts` and the strict lane inside `backend-deployment-contract.spec.ts` still use fixed polling sleeps instead of a semantic retry helper.
- 🟡 **Current-head strict freshness is open:** the protected strict lane did not rerun on `35b6f80`, so the newest strict provenance still points to `d70a0ab` and remains non-credible release evidence.
- ✅ **Notification-center / remediation / branding UX is shipped:** those late-March workstreams have landed on `main`, so they strengthen enterprise-operational credibility; they still do not replace protected sign-off evidence or fix current-head Playwright drift by themselves.
- 🟡 **Stakeholder-document freshness is open:** the roadmap is being refreshed now, but `PLAYWRIGHT_STATUS.md`, the blocker-mapping doc, and parts of `e2e/README.md` are still stale or overstated relative to the current suite posture, current run IDs, current metric counts, and the `/launch/workspace` -> `/launch/guided` route contract.
- ✅ **Legacy `/create/wizard` blocker remains contained on `main`:** direct `goto('/create/wizard')` usage is still isolated to `e2e/wizard-redirect-compat.spec.ts`.
- 🔴 **Release-evidence workspace regression is an active current-head blocker again:** the latest current-head Playwright run reintroduces the `e2e/release-evidence-center.spec.ts` AC #4 next-actions / no-blockers failure, so that business-proof surface cannot be treated as recovered.

### Playwright Compliance vs MVP Blockers

**Status:** 🔴 **Not currently compliant for business-owner MVP blocker closure on the evaluated head**

Current Playwright coverage still proves a large share of the code-level MVP story: the app remains wallet-free in the standard user journey, auth-first routing and legacy-route containment still have explicit test coverage, and the enterprise onboarding / reporting / release-readiness surfaces that shipped through issues **#734**, **#736**, **#751**, and **#753** retain substantial browser-level coverage. However, the latest completed standard Playwright evidence for the product state the business is evaluating is failing across **three** current-head blocker classes on `35b6f80`: three retries of `e2e/compliance-notification-center.spec.ts`'s `filters events by freshness` assertion still hardcode a time-sensitive expectation that no longer matches the aged fixture set; `e2e/procurement-accessibility-evidence.spec.ts` again fails the unauthenticated home-page WCAG 2.1 AA axe scan; and `e2e/release-evidence-center.spec.ts` again fails the AC #4 next-actions / no-blockers rendering assertion. The lane is still red and therefore still unusable as current-head browser proof. Beyond that immediate red state, the merged/mainline Playwright portfolio still does **not** satisfy the full MVP blocker bar for release sign-off because (1) the newest strict workflow evidence is still an infrastructure-only `not_configured` artifact and trails the evaluated release head, (2) `mvp-stabilization.spec.ts` still mixes seeded auth with backend-attempted auth, (3) the two strict deployment/auth suites still contain fixed polling sleeps, (4) `mvp-backend-signoff.spec.ts` still relies on guarded skips whenever strict prerequisites are absent, and (5) stakeholder-facing test documentation still overstates strict-lane behavior and the launch-route contract. In short: Playwright remains strategically valuable, but it is **not** currently compliant with the MVP blocker expectations the business owner needs for trustworthy sign-off.

### Required Playwright Improvements Before MVP Sign-off

1. Fix the notification-center red state first: merge / port PR **#759**'s relative-timestamp `createDemoEvents()` / `createDemoTimelineEntries()` change (or equivalent) so `e2e/compliance-notification-center.spec.ts`'s `filters events by freshness` assertion becomes time-safe, then rerun `Playwright Tests` on the evaluated release head until that failure class is gone.
2. Merge / port PR **#755**'s accessibility helper hardening (or equivalent theme-initialization stabilization) so `e2e/procurement-accessibility-evidence.spec.ts` stops failing the unauthenticated home-page axe scan on slow CI runners.
3. Fix the current `e2e/release-evidence-center.spec.ts` AC #4 `next actions or no-blockers section is rendered` failure on `main`, then rerun the standard lane until that business-proof surface is green again.
4. Configure `SIGNOFF_API_BASE_URL`, `SIGNOFF_TEST_PASSWORD`, and (if needed) `SIGNOFF_TEST_EMAIL` in the `sign-off-protected` GitHub Environment, then run the strict lane on the actual release head (`35b6f80` or its successor) until it produces the first `is_release_evidence:true` artifact.
5. Remove the remaining polling sleeps from `e2e/mvp-backend-signoff.spec.ts` and the strict lane inside `e2e/backend-deployment-contract.spec.ts`, replacing them with a semantic polling/retry helper that matches the documented blocker-suite standard.
6. Finish the auth-helper cleanup by moving the remaining blocker-facing seeded-auth assertions in `e2e/mvp-stabilization.spec.ts` to `loginWithCredentials()`, and document the intentionally permissive status of any surviving `withAuth()` usage elsewhere.
7. Refresh `docs/testing/PLAYWRIGHT_STATUS.md`, `docs/implementations/MVP_SIGNOFF_READINESS_BLOCKER_MAPPING.md`, and `e2e/README.md` so stakeholder-facing guidance matches current run IDs, helper usage, strict-lane prerequisites, actual `waitForTimeout()` posture, true metric counts, the workflow's successful-but-not-configured artifact behavior, and the real `/launch/workspace` -> `/launch/guided` route contract.
8. Improve local Playwright reproducibility for constrained environments by providing a reliable non-watch startup path and documented file-scoped execution guidance so representative blocker suites can be executed outside GitHub Actions.
9. Keep the notification-center, procurement accessibility, and release-evidence proof surfaces under active regression watch until the next fully green current-head browser run restores trust across all three.

### Priority Action Items

- **URGENT:** Merge / port PR **#759**'s relative-timestamp notification-center fix, then rerun `Playwright Tests` on `35b6f80` (or its immediate successor) until the `critical` freshness filter no longer fails.
- **URGENT:** Merge / port PR **#755**'s procurement accessibility / theme-init hardening, then rerun the unauthenticated home-page axe coverage until the blocking violation is gone on current head.
- **URGENT:** Fix the `release-evidence-center.spec.ts` AC #4 next-actions / no-blockers regression on `main`, then rerun the standard lane until that failure class is gone.
- **URGENT:** Provision the `sign-off-protected` environment and obtain the first `is_release_evidence:true` artifact-backed strict real-backend run on current `main` head `35b6f80` (or its immediate successor).
- **HIGH:** Treat the newest strict workflow artifact (**23844787156**) as infrastructure-only proof, not release proof, until the artifact stops reporting `not_configured`.
- **HIGH:** Remove the remaining strict-lane `waitForTimeout()` polling in `mvp-backend-signoff.spec.ts` and `backend-deployment-contract.spec.ts`.
- **HIGH:** Finish converting blocker-facing seeded-auth usage in `mvp-stabilization.spec.ts` to `loginWithCredentials()` or explicitly downgrade those assertions from blocker-grade evidence.
- **HIGH:** Refresh `docs/testing/PLAYWRIGHT_STATUS.md`, `docs/implementations/MVP_SIGNOFF_READINESS_BLOCKER_MAPPING.md`, and `e2e/README.md` so they stop overstating current strict-suite posture, run freshness, metric counts, and the canonical launch-route contract.
- **MEDIUM:** Trigger or require a fresh strict run for `35b6f80` whenever release-critical auth, onboarding, reporting, evidence, or blocker-spec posture changes so the protected artifact the business cites is always current.
- **MEDIUM:** Convert the now-merged regulator-ready reporting / audit-export milestone across frontend PR **#737** and backend PR **scholtz/BiatecTokensApi#614** into customer-facing proof: demo scripts, release notes, and strict sign-off evidence should all reference the shipped workflow.
- **MEDIUM:** Convert the newly shipped notification-center / remediation / branding work into customer-facing proof: demo flows, release notes, and protected sign-off evidence should show operators how those surfaces improve enterprise readiness.
- **MEDIUM:** Address the local Playwright `EMFILE` reproducibility problem so roadmap stakeholders can run representative blocker suites outside CI when needed.
- **MEDIUM:** Continue reducing broad suppressors, skip guards, and seeded-auth shortcuts in the rest of the E2E corpus.

### Roadmap Adjustment

- **Lower MVP confidence until the standard lane is green again:** current `main` has green `Run Tests` evidence on `35b6f80`, but `Playwright Tests` on that same head failed with **1891 passed, 5 failed, 23 skipped** across notification-center freshness drift, procurement accessibility, and release-evidence next-actions rendering; the latest FE deploy build evidence still remains the prior product-bearing head `d70a0ab`, and there is still no backend-confirmed `is_release_evidence:true` artifact on the head being signed off.
- **Treat issue #734 / PR #735 as a closed enterprise-onboarding evidence milestone, not as sign-off proof:** the biggest remaining gaps are standard-lane determinism, strict-environment provisioning, release-evidence rendering stability, blocker-suite helper / wait discipline, and stakeholder-document freshness.
- **Treat frontend PR #737 and backend PR #614 as shipped roadmap progress, not hypothetical pipeline work:** they materially raise enterprise-compliance and audit-export maturity, but they still need protected release evidence and customer-facing validation before they count as business-owner sign-off proof.
- **Re-open current-head browser credibility, strict credibility, and stakeholder-doc drift as active maintenance risks:** the roadmap is current again after this update, but `PLAYWRIGHT_STATUS.md`, the blocker-mapping doc, and parts of `e2e/README.md` should not be treated as authoritative until refreshed.
- **Treat remaining blocker-facing seeded-auth usage and fixed polling sleeps as quality debt, not invisible implementation details:** PR **#744** reduced this debt materially, but it did not eliminate it, and the remainder still keeps the suite short of the business-owner release bar.
- **Keep PR #731, PR #735, and PR #737 hardening as the baseline for commercially credible E2E evidence:** the core enterprise suites plus the KYC/AML operator journey and reporting workspace now define the minimum acceptable quality bar for supporting Playwright proof.
- **Use backend PR #610 plus frontend issue #734 / PR #735 as enterprise-compliance inputs, not as proof by themselves:** provider-backed lifecycle APIs and their frontend evidence improve the roadmap, but they do not count as business-owner sign-off until exercised through protected release evidence.
- **Treat the newly shipped notification-center / remediation / branding surfaces as shipped UX progress, not sign-off proof:** they improve enterprise readiness and demos immediately, but they still need protected release evidence, live-data validation, and green current-head Playwright evidence before they count as business-owner MVP sign-off.
- **Treat procurement accessibility and release-evidence rendering as active blockers again, not regression-watch items:** both fail on the latest current-head Playwright run and must be cleared before business-owner sign-off confidence can be restored.

## UX/Design Improvement Roadmap (Added February 18, 2026)

### Critical UX/Design Issues Identified 🟡

Based on comprehensive product review including source code analysis, E2E test coverage review, and component structure assessment, the following design and UX issues require immediate attention:

#### 1. **Accessibility Evidence Maintenance & Trust Hardening** 🟡 **PRIORITY: MEDIUM**

**Issue:** Accessibility proof remains strategically important, but it is now a regression-watch item rather than the current-head blocker. The latest current-head Playwright failure list no longer includes `e2e/procurement-accessibility-evidence.spec.ts`, yet the standard lane is still red for notification-center drift and the previous home-page contrast regression was recent enough that procurement-facing accessibility trust should not be treated as fully restored until the next green current-head browser run.

**Evidence:**
- PRs **#632**, **#634**, **#636**, **#638**, and **#640** still provide the underlying axe/contrast verification, dedicated screen-reader preservation tests, and explicit manual-review artifacts.
- `e2e/accessibility-enterprise-journeys.spec.ts`, `e2e/procurement-accessibility-evidence.spec.ts`, and `e2e/screen-reader-review-evidence.spec.ts` still define the automated evidence surface for the highest-value enterprise journeys.
- The latest current-head `Playwright Tests` run (**24054175570** on `22d96fb`) fails only for `e2e/compliance-notification-center.spec.ts`; the prior unauthenticated home-page contrast failure is not in that latest failure list.
- `docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md` and `docs/accessibility/SCREEN_READER_RELEASE_EVIDENCE.md` still provide the business-owned manual-review layer that was missing in the earlier roadmap.
- Open PR **#755** plus issue **#758** remain the relevant candidate remediation stream for theme/determinism hardening if the home-page accessibility regression reappears; open PR **#759** is routine dependency maintenance and not accessibility sign-off evidence.

**Business Impact:** 
- Procurement and regulatory trust are improving because the latest current-head browser evidence no longer reproduces the home-page contrast failure.
- However, the business still cannot claim fully current procurement-grade browser proof while the overall Playwright lane is red and the accessibility recovery has not yet been reconfirmed by a fully green current-head run.
- Sustained evidence quality still supports enterprise sales, trials, and internal customer approvals for higher subscription tiers, but only if the recovered accessibility path stays green release after release.

**Required Actions:**
1. Keep procurement accessibility evidence in the regular release review and rerun `e2e/procurement-accessibility-evidence.spec.ts` whenever shell/theme changes land.
2. Keep automated axe/contrast verification green in CI for the home page, Guided Launch, Compliance, Compliance Setup Workspace, whitelist management, Team Workspace, and new evidence-pack surfaces.
3. Update the screen-reader review artifact whenever a covered journey changes materially.
4. Tie accessibility evidence updates to release sign-off so procurement-facing proof stays current.

**Acceptance Criteria:**
- Automated accessibility checks run in CI for the highest-value routes and stay green on current `main` head.
- The home-page procurement accessibility evidence remains green on the release head being evaluated.
- Keyboard-only navigation is proven across the shared shell and critical routes.
- Contrast-sensitive UI and status/error patterns are validated, not assumed.
- Screen-reader review artifacts stay current for the highest-value enterprise flows.

**Estimated Effort:** 4-8 hours per release cycle for evidence refresh and maintenance

---

#### 2. **Navigation Discoverability & Mobile-Proof Evidence** ✅ **PRIORITY: MEDIUM**

**Issue:** The primary navigation blocker is materially reduced. `src/constants/navItems.ts` still enforces a 7-item shared nav model for desktop and mobile, and PR **#618** now adds durable mobile-menu and keyboard proof for the shared shell. The remaining risk is preserving that parity as more enterprise routes and shell affordances are added.

**Evidence:**
- `src/constants/navItems.ts` uses a single source of truth with **7** top-level destinations: Home, Guided Launch, Dashboard, Portfolio, Operations, Compliance, Settings.
- `e2e/mobile-first-shell-parity.spec.ts` now opens the mobile menu on a phone-sized viewport, verifies route discoverability/reachability, checks `aria-current`, and proves Escape-key focus restoration plus route-announcer behavior.
- Issue **#617** is closed by PR **#618**, which means the shell-level navigation parity blocker is no longer the primary MVP risk.

**Business Impact:**
- Enterprise prospects now see a more credible, procurement-friendly shell during demos and trials.
- Mobile-safe discoverability has moved from assumed to demonstrated for the shared shell.
- Remaining commercial risk is now more about sustained parity as routes evolve than about missing basic mobile proof.

**Required Actions:**
1. Keep the 7-item shared nav model intact as new enterprise destinations are introduced.
2. Extend the mobile-shell parity suite whenever new primary routes or shell widgets are added.
3. Collect demo / user feedback on whether the current labels and grouping stay understandable to non-crypto-native operators.

**Acceptance Criteria:**
- 7 or fewer top-level navigation items remain the shared source of truth.
- Mobile and desktop continue to expose the same critical destinations in tested, user-observable behavior.
- Keyboard and focus behavior remain verified for the shared shell.
- Demo feedback confirms the shell remains understandable as compliance and team workflows expand.

**Estimated Effort:** 8-12 hours ongoing maintenance

---

#### 3. **Legacy Wizard Flow Cleanup** ✅ **PRIORITY: LOW**

**Status:** `/create/wizard` direct navigation is now correctly isolated to `wizard-redirect-compat.spec.ts`.

**Evidence:**
- Direct `goto('/create/wizard')` calls now appear only in `e2e/wizard-redirect-compat.spec.ts` (**3** redirect-source assertions).
- Canonical flow coverage is centered on the real split now enforced by code and blocker suites: `/launch/workspace` is the canonical nav/workspace entry, and `/launch/guided` remains the downstream token-parameter wizard.

**Business Impact:**
- Reduced route ambiguity in MVP-critical E2E journeys
- Lower regression risk for canonical launch path messaging

**Remaining Action:**
1. Keep redirect-compat tests isolated to the dedicated compatibility spec.
2. Reject any new direct `/create/wizard` navigation in non-compat tests during review.
3. Preserve `/launch/workspace` as the canonical top-level entry and `/launch/guided` as the downstream guided-wizard destination in new blocker-facing coverage.

---

#### 4. **Error Message User Experience** 🟡 **PRIORITY: MEDIUM**

**Issue:** Error messages sometimes expose technical details instead of user-friendly guidance

**Evidence:**
- Components use `err.message` patterns which may show stack traces or error codes
- Good patterns exist (`StateMessage` component with `userGuidance` and `nextAction` fields) but not used consistently
- Some errors show "Temporary Issue" vs "Error" semantic differentiation (good) but inconsistent

**Business Impact:**
- Non-technical users confused by error messages (target audience per roadmap)
- Increased support ticket volume
- Reduced user trust and confidence
- Longer time to resolution for user errors

**Required Actions:**
1. Audit all error handling code for user-facing error messages
2. Implement consistent error message translation layer
3. Ensure all errors include:
   - What happened (user-friendly language)
   - Why it matters (business impact)
   - How to fix it (actionable next steps)
   - Support contact (for unresolvable errors)
4. Add error message testing to QA checklist
5. Document error message patterns in style guide

**Acceptance Criteria:**
- 100% of user-facing errors use translation layer
- All errors include 3-part structure (what/why/how)
- No technical error codes or stack traces shown to users
- Error messages tested with non-technical users
- Style guide documented with 10+ examples

**Estimated Effort:** 32-48 hours (2 weeks, 1 developer)

---

#### 5. **View/Component Consolidation** 🟡 **PRIORITY: LOW**

**Issue:** 42 views detected, with more overlap risk now that onboarding, evidence, reporting, and cockpit surfaces have expanded rapidly.

**Evidence:**
- `src/views/` contains **42** view files
- Multiple similar flows: GuidedTokenLaunch.vue, TokenCreationWizard.vue, TokenCreator.vue
- Unclear which flow is recommended for different user types
- Increases maintenance burden and testing surface

**Business Impact:**
- Confuses users about which flow to use
- Increased development and QA costs
- Risk of feature drift between duplicate flows
- Harder to measure conversion metrics (split across flows)

**Required Actions:**
1. Map all 42 views to user journeys
2. Identify duplicate/overlapping functionality
3. Consolidate to single recommended flow per use case
4. Archive or remove deprecated views
5. Update navigation to reflect consolidated structure
6. Add flow selection guidance for edge cases

**Acceptance Criteria:**
- Single recommended token creation flow documented
- Deprecated views removed from codebase
- Navigation updated to reflect consolidated structure
- User journey map shows clear paths (no overlap)
- Analytics tracking on single consolidated flow

**Estimated Effort:** 40-60 hours (2-3 weeks, 1 developer)

---

### Low Priority UX Improvements 🟢

#### 6. **Loading State Consistency** 🟢 **PRIORITY: LOW**

**Issue:** Loading states exist (Button component has loading spinner) but consistency across views not verified

**Required Actions:**
1. Audit all async operations for loading state indicators
2. Standardize loading state patterns (skeleton loaders, spinners, progress bars)
3. Ensure loading states accessible (aria-busy, aria-live announcements)
4. Document loading state guidelines

**Estimated Effort:** 16-24 hours

---

#### 7. **Form Validation UX** 🟢 **PRIORITY: LOW**

**Issue:** Form validation present (Input/Select components have error states) but validation timing not documented

**Required Actions:**
1. Audit validation timing (on blur vs on submit vs on change)
2. Standardize validation feedback patterns
3. Add inline validation hints before errors occur
4. Test validation UX with real users

**Estimated Effort:** 16-24 hours

---

#### 8. **Progressive Disclosure** 🟢 **PRIORITY: LOW**

**Issue:** Some components use `<details>` for technical information (good pattern) but not consistent across complex flows

**Required Actions:**
1. Identify complex workflows with 5+ steps
2. Implement progressive disclosure (show essential, hide advanced)
3. Add "Show advanced options" toggles
4. Test with beginner vs expert users

**Estimated Effort:** 24-32 hours

---

### Recommended Implementation Priority

**Phase 1 (MVP Blockers - Next 2 Weeks):**
1. 🔴 **Configure and pass the strict backend sign-off lane** - Provision protected-environment secrets, execute the real backend Playwright lane, and obtain the first green `is_release_evidence:true` artifact on the actual release candidate / current `main` head
2. 🔴 **Promote strict sign-off to a real release gate** - Treat the workflow result as required evidence for MVP / business-owner sign-off
3. 🟡 **Keep strict-evidence UX and docs aligned** - Preserve the merged PR **#733** fail-closed artifact panel, and refresh operator-facing documentation whenever strict workflow behavior or artifact semantics change

**Phase 2 (Post-MVP Hardening - Weeks 3-6):**
4. 🟡 **Maintain human-reviewed accessibility evidence** - Keep the new screen-reader and procurement artifacts current for procurement-sensitive flows
5. 🟡 **Reduce permissive Playwright patterns** - Restrict broad `suppressBrowserErrors()`, reduce `withAuth()` dependence, and keep blocker-adjacent suites closer to production reality
6. 🟡 **Productize the operations cockpit with live case-management parity** - Extend the shipped role-aware cockpit with deployed backend data, workflow handoffs, and case-management parity so upstream operations match downstream governance surfaces

**Phase 3 (Commercial Maturity - Q2 2026):**
7. 🟡 **Maintain shell parity as enterprise routes grow** - Extend PR **#618** coverage whenever navigation groups, destinations, or shell widgets change
8. 🟡 **Backend-backed compliance/team operations** - Replace remaining mock-only compliance/team workflow data with production-grade integrations and sign-off evidence

---

### Success Metrics

**Accessibility:**
- Automated WCAG / contrast evidence on critical routes: **Accessibility-specific evidence remains strategically important, and the latest current-head Playwright run again reproduces the unauthenticated home-page axe failure, so procurement accessibility is back to active blocker status until the next fully green current-head run**
- Screen-reader and keyboard validation on highest-value flows: **Keyboard shell proof automated and screen-reader review now documented with release evidence artifacts; both still need active refresh as product surfaces evolve**

**Navigation:**
- Primary navigation complexity: **9-item / inconsistent mental model → 7 shared top-level destinations in code**
- Mobile feature access proof: **Assumed parity → Demonstrated parity in real mobile viewport tests on `main`**
- Task completion time: Baseline → -20%

**Error UX:**
- Support tickets (error-related): Baseline → -30%
- User satisfaction (error scenarios): Baseline → +40%

**Code Quality:**
- Playwright skip calls (`test.skip` + `test.describe.skip`): **47 currently remain across the `e2e/` corpus**; target stays **0 in blocker-facing suites**
- Broad Playwright error-suppression references: **268 broad-suppressor references currently remain in `e2e/`**; narrow suppressor usage is **89 references**
- Playwright auth split: **46 files with `withAuth()`** vs **24 files with `loginWithCredentials()`** vs **4 files with `loginWithCredentialsStrict()`**
- Legacy route debt: direct `goto('/create/wizard')` still appears in only **1 spec file**, the dedicated redirect-compat suite
- `waitForTimeout` debt: **86 `waitForTimeout(...)` references currently remain across the `e2e/` corpus**, and the live polling sleeps that matter most for sign-off quality are still inside `e2e/mvp-backend-signoff.spec.ts` and `e2e/backend-deployment-contract.spec.ts`
- Documentation drift: the roadmap is current again, but `PLAYWRIGHT_STATUS.md`, `MVP_SIGNOFF_READINESS_BLOCKER_MAPPING.md`, and parts of `e2e/README.md` still do not match the April 7 observed `main` head `35b6f80`; `Run Tests` is green on run **24076141196**, `Playwright Tests` failed on run **24076141206** (**1891 passed, 5 failed, 23 skipped**), the newest strict artifact is still run **23844787156** on older head `d70a0ab`, and the docs still lag the real `/launch/workspace` -> `/launch/guided` launch-route contract plus the current notification-center, procurement-accessibility, and release-evidence regressions and the successful-but-not-configured strict-lane behavior

---

**Last Updated:** April 7, 2026 (reality check for observed `main` head `35b6f80`; `Run Tests` **24076141196** is green on that exact commit, while `Playwright Tests` **24076141206** failed on the same head with **1891 passed, 5 failed, 23 skipped** across three retries in `e2e/compliance-notification-center.spec.ts` (`Expected: 1`, `Received: 7` for the `critical` freshness filter), a renewed `e2e/procurement-accessibility-evidence.spec.ts` unauthenticated home-page axe failure, and a renewed `e2e/release-evidence-center.spec.ts` AC #4 next-actions / no-blockers rendering failure; the latest `Build and Deploy FE` success remains **23844787131** on prior product-bearing head `d70a0ab` because `build-fe.yml` is path-scoped away from docs-only changes, and the newest `Strict Backend Sign-off Gate` artifact remains **23844787156** on that older head as a successful-but-`not_configured` infrastructure artifact because `SIGNOFF_API_BASE_URL` / `SIGNOFF_TEST_PASSWORD` are not set and `is_release_evidence` remains `false`; issues **#753**, **#751**, **#749**, and **#747** plus merged PR **#754** still count as shipped enterprise UX progress on `main`, open PR **#755** now carries the procurement-accessibility / theme-init hardening, open PR **#759** now carries the relative-timestamp notification-center fix alongside dependency work, open issue **#758** remains open, PR **#744** remains the last merged blocker-suite hardening milestone, and the remaining business-owner blockers are restoring current-head Playwright credibility, protected release-evidence credibility, release-evidence rendering stability, fresh strict-run provenance on current head, residual blocker-suite helper / wait discipline, local Playwright reproducibility, and stale stakeholder-facing Playwright documentation including the canonical launch-route contract)
**Next Review:** April 14, 2026
