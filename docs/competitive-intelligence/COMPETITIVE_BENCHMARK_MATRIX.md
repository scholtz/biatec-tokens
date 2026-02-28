# Competitive Benchmark Matrix

## Overview

This matrix benchmarks Biatec against leading tokenization and fintech onboarding platforms across six UX dimensions critical to non-crypto-native issuers. Each dimension is scored 1–5 (5 = best) with rationale. Conclusions map to Biatec's email/password-first, backend-deployment model.

**Evaluation Date:** 2025  
**Evaluator Perspective:** Non-crypto-native, regulated issuer (SME, asset manager)

---

## Platforms Evaluated

| # | Platform | Category | Primary User |
|---|----------|----------|--------------|
| 1 | **Tokeny** | Regulated token issuance | Enterprise compliance teams |
| 2 | **Securitize** | Security token platform | Investment managers |
| 3 | **Polymath** | Security token infrastructure | Developer teams |
| 4 | **Stripe Identity** | Onboarding/KYC reference | Product teams (UX benchmark) |
| 5 | **Coinbase Prime** | Institutional trading/custody | Financial institutions |
| 6 | **Fireblocks** | Digital asset custody | Enterprise treasury |
| 7 | **Biatec (current)** | Token issuance (email-first) | SME issuers, regulated entities |

---

## Evaluation Dimensions

### Dimension 1: Onboarding Simplicity
*How quickly can a non-technical user complete registration and reach the first meaningful action?*

| Platform | Score | Rationale |
|----------|-------|-----------|
| Tokeny | 2 | Enterprise-focused; requires sales call; no self-serve path |
| Securitize | 3 | Guided but complex; many KYC steps before value delivered |
| Polymath | 2 | Developer-first; CLI/SDK setup required; high technical barrier |
| Stripe Identity | 5 | Industry benchmark; minimal steps; instant feedback; clear progress |
| Coinbase Prime | 3 | Institutional; compliance-heavy; moderate self-serve |
| Fireblocks | 2 | Requires integration team; not self-serve |
| **Biatec (current)** | **3** | Email signup works; guided flow exists but some steps unclear |

**Dimension Weight:** 20%

---

### Dimension 2: Creation Flow Architecture
*Is the token creation path linear, discoverable, and recoverable?*

| Platform | Score | Rationale |
|----------|-------|-----------|
| Tokeny | 3 | Step-by-step wizard; can lose progress; no draft save |
| Securitize | 3 | Multi-step form; good section headers; occasional dead ends |
| Polymath | 2 | Code-first; no visual wizard; documentation required |
| Stripe Identity | 5 | Single canonical path; clear back/forward; state preserved |
| Coinbase Prime | 4 | Clear workflow sections; progress visible; professional layout |
| Fireblocks | 3 | Structured but requires setup before creation |
| **Biatec (current)** | **3** | /launch/guided exists; /create also exists (split canonical path) |

**Dimension Weight:** 20%

---

### Dimension 3: Compliance Communication
*Are regulatory requirements explained in plain business language?*

| Platform | Score | Rationale |
|----------|-------|-----------|
| Tokeny | 4 | Strong MICA/MiFID framing; compliance-aware copy |
| Securitize | 4 | Regulatory context inline; explains implications |
| Polymath | 2 | Developer docs only; no plain-language compliance guidance |
| Stripe Identity | 5 | Regulation explained in context; no jargon; immediate feedback |
| Coinbase Prime | 3 | Compliance present but assumes institutional knowledge |
| Fireblocks | 3 | Policy docs separate from workflow; not contextual |
| **Biatec (current)** | **3** | Compliance checklist present; some jargon visible |

**Dimension Weight:** 20%

---

### Dimension 4: Audit/Export Capability
*Can the issuer access, export, and present compliance records to regulators?*

| Platform | Score | Rationale |
|----------|-------|-----------|
| Tokeny | 4 | Audit trail with export; certification packages |
| Securitize | 4 | Regulatory reporting; SEC filing support |
| Polymath | 2 | On-chain only; no UI export |
| Stripe Identity | 4 | Dashboard export; webhook logs; developer access |
| Coinbase Prime | 4 | Institutional-grade reporting; CSV/API export |
| Fireblocks | 5 | Comprehensive audit; policy engine logs; API export |
| **Biatec (current)** | **3** | Attestation panel exists; export in progress |

**Dimension Weight:** 15%

---

### Dimension 5: Error Clarity
*When something goes wrong, does the system explain the problem and guide recovery?*

| Platform | Score | Rationale |
|----------|-------|-----------|
| Tokeny | 3 | Generic error messages; support ticket required |
| Securitize | 3 | Some inline validation; others require page reload |
| Polymath | 2 | SDK error codes; no user-friendly messages |
| Stripe Identity | 5 | Specific, actionable errors; inline; immediate |
| Coinbase Prime | 4 | Good error patterns; contextual recovery steps |
| Fireblocks | 3 | Technical errors; support-oriented resolution |
| **Biatec (current)** | **3** | Error messages improving; some generic fallbacks |

**Dimension Weight:** 15%

---

### Dimension 6: Trust-Building UI
*Does the UI convey credibility, security, and regulatory alignment to the user?*

| Platform | Score | Rationale |
|----------|-------|-----------|
| Tokeny | 4 | Professional; EU compliance branding; secure indicators |
| Securitize | 4 | SEC-registered framing; institutional design |
| Polymath | 2 | Technical aesthetic; no trust signals for non-developers |
| Stripe Identity | 5 | Clean; trusted brand; security iconography; social proof |
| Coinbase Prime | 5 | Institutional credibility; regulated entity indicators |
| Fireblocks | 4 | Enterprise design; certification badges visible |
| **Biatec (current)** | **3** | Modern UI; trust signals could be more prominent |

**Dimension Weight:** 10%

---

## Weighted Scorecard

| Platform | Onboarding (20%) | Flow Arch (20%) | Compliance (20%) | Audit (15%) | Errors (15%) | Trust (10%) | **Weighted Total** |
|----------|-----------------|-----------------|-----------------|-------------|--------------|-------------|-------------------|
| Tokeny | 0.40 | 0.60 | 0.80 | 0.60 | 0.45 | 0.40 | **3.25** |
| Securitize | 0.60 | 0.60 | 0.80 | 0.60 | 0.45 | 0.40 | **3.45** |
| Polymath | 0.40 | 0.40 | 0.40 | 0.30 | 0.30 | 0.20 | **2.00** |
| Stripe Identity | 1.00 | 1.00 | 1.00 | 0.60 | 0.75 | 0.50 | **4.85** |
| Coinbase Prime | 0.60 | 0.80 | 0.60 | 0.60 | 0.60 | 0.50 | **3.70** |
| Fireblocks | 0.40 | 0.60 | 0.60 | 0.75 | 0.45 | 0.40 | **3.20** |
| **Biatec (current)** | **0.60** | **0.60** | **0.60** | **0.45** | **0.45** | **0.30** | **3.00** |

---

## Gap Analysis

### Biatec vs. Best-in-Class (Stripe Identity = 4.85)

| Dimension | Biatec | Best-in-Class | Gap | Priority |
|-----------|--------|---------------|-----|----------|
| Onboarding Simplicity | 3.0 | 5.0 (Stripe) | -2.0 | **HIGH** |
| Creation Flow Architecture | 3.0 | 5.0 (Stripe) | -2.0 | **HIGH** |
| Compliance Communication | 3.0 | 5.0 (Stripe) | -2.0 | **HIGH** |
| Audit/Export | 3.0 | 5.0 (Fireblocks) | -2.0 | **MEDIUM** |
| Error Clarity | 3.0 | 5.0 (Stripe) | -2.0 | **HIGH** |
| Trust-Building UI | 3.0 | 5.0 (Stripe/Coinbase) | -2.0 | **MEDIUM** |

### Biatec vs. Nearest Competitor (Securitize = 3.45)

Biatec trails Securitize by **0.45 points** — closable in 1–2 sprint cycles with focused UX investment.

---

## Conclusions Mapped to Biatec Model

### 1. Single Canonical Flow Is Competitive Advantage
Stripe Identity and Coinbase Prime win on **flow architecture** by maintaining one clear path. Biatec's current split between `/create` and `/launch/guided` dilutes clarity. **Action: consolidate to `/launch/guided` as canonical route.**

### 2. Email/Password First Is a Differentiator
Competitors like Polymath and Fireblocks require technical setup. Biatec's email/password signup is a **competitive moat** for non-crypto-native issuers. This must be protected — no wallet connector UI should appear.

### 3. Compliance Language Needs Plain-English Investment
Tokeny and Securitize lead on compliance communication because they explain regulatory implications in context. Biatec should add **status-based guidance text** at each compliance checkpoint (see COMPLIANCE_UX_SPECIFICATION.md).

### 4. Backend Deployment Is a Trust Signal
Fireblocks wins on trust because it abstracts blockchain complexity. Biatec's backend deployment model (no frontend signing) should be **explicitly communicated** as a security and compliance benefit.

### 5. Error Messages Are Table Stakes
Every top performer (Stripe, Coinbase Prime) provides specific, actionable error recovery. Biatec must replace generic error messages with **contextual recovery guidance** per error type.

### 6. Audit Export Closes Enterprise Deals
Securitize, Coinbase Prime, and Fireblocks all have strong audit/export capabilities because enterprise buyers require them for regulatory filing. Biatec's attestation panel must reach **export parity** to compete at the $299/month tier.

---

## Recommendations for Next Sprint

1. **Consolidate creation flows** → single `/launch/guided` path
2. **Add compliance status labels** → 5 statuses with plain-language descriptions
3. **Improve error messages** → contextual recovery for each error type
4. **Surface trust signals** → display compliance badges and audit evidence inline
5. **Measure with KPIs** → time-to-first-token, completion rate, support tickets

---

*Last updated: 2025 | Competitive Intelligence Working Group*
