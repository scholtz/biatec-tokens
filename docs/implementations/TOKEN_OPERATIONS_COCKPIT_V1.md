# Token Operations Cockpit v1 — Information Architecture

## Overview

The Token Operations Cockpit is a unified command centre for token operators and compliance-aware
stakeholders. It aggregates health signals, prioritised actions, wallet diagnostics, activity history,
and risk indicators into a single, role-gated page accessible at `/cockpit`.

Roadmap alignment: **Token Operations Cockpit v1** milestone — lifecycle intelligence and guided
token lifecycle UX.

---

## Route

| Path      | Name              | Auth required |
|-----------|-------------------|---------------|
| `/cockpit` | `LifecycleCockpit` | ✅ Yes         |

Navigation link added to the main `NAV_ITEMS` constant (`src/constants/navItems.ts`).

---

## Role-based access

Four operator roles control widget visibility:

| Role             | Readiness | Telemetry | Actions | Wallet Diag | Risk | Evidence |
|------------------|:---------:|:---------:|:-------:|:-----------:|:----:|:--------:|
| `issuer_admin`   | ✅        | ✅        | ✅      | ✅          | ✅   | ✅       |
| `compliance`     | ✅        | ❌        | ✅      | ❌          | ✅   | ✅       |
| `operations`     | ❌        | ✅        | ✅      | ✅          | ✅   | ❌       |
| `treasury`       | ❌        | ✅        | ❌      | ❌          | ✅   | ❌       |

---

## Cockpit sections

### 1 · Launch Readiness (`ReadinessStatusWidget`)

Displays an overall score (0–100), blockers (critical issues that prevent launch), warnings, and
top-level recommendations. Blockers deep-link to the specific compliance or technical setup step.

### 2 · Post-Launch Telemetry (`TelemetrySummaryWidget`)

Available only after a token is deployed (requires `tokenId`). Shows:

- Total / active / inactive holder counts
- Transaction volume (24 h and 7 d)
- Concentration risk (top-holder, top-5, top-10 percentages with severity badge)
- Activity trend (increasing / stable / decreasing with change %)

### 3 · Guided Next Actions (`GuidedActionsWidget`)

Deterministic, priority-ordered action queue. Each action card shows:

- Priority badge (critical → high → medium → low)
- Title, description, rationale, expected impact
- Estimated time, assigned role, category tag
- "View" deep-link and optional "Mark Done" button (issuer_admin / compliance only)

Actions are filtered to `pending` or `in_progress` status and sorted first by priority, then by
creation date (oldest first, so long-standing items surface naturally).

### 4 · Wallet Diagnostics (`WalletDiagnosticsWidget`)

Per-wallet compatibility checks with pass / warn / fail status, remediation hints, and deep links to
documentation or setup steps.

### 5 · Lifecycle Risk Indicators (`RiskIndicatorsWidget`)

Three threshold-based indicators with severity colouring:

| Indicator           | Warning threshold | Critical threshold |
|---------------------|:-----------------:|:-----------------:|
| Holder concentration | ≥ 25 % top holder | ≥ 40 %            |
| Holder inactivity    | ≥ 40 % inactive   | ≥ 60 %            |
| Unusual activity     | ≥ 1 event         | ≥ 5 events        |

### 6 · Evidence Links (`EvidenceLinksWidget`)

Traceability panel linking cockpit signals (blockers, warnings, risks) to underlying audit logs,
attestations, or on-chain transactions.

### 7 · Activity Timeline (`TimelineWidget`)

Chronological feed of recent token-affecting events, grouped by calendar date. Each entry shows:

- Category icon and label
- Event title and one-sentence impact summary
- Actor (displayed safely — addresses are truncated, emails show local part only)
- Relative timestamp (e.g. "2 hours ago") with full ISO datetime on hover

---

## Health status derivation

All health indicators are computed by a single, auditable utility module:

```
src/utils/cockpitStatusDerivation.ts
```

The module exposes `deriveHealthIndicators(state: TokenHealthState)` which maps token state to a
`DerivedHealthIndicators` object. Each dimension is derived independently, then aggregated with
`worstStatus()` (critical > warning > healthy).

### Dimension rules

| Dimension             | Warning                    | Critical                        |
|-----------------------|----------------------------|---------------------------------|
| Mint policy           | —                          | `mintPolicyValid === false`     |
| Metadata              | —                          | `metadataComplete === false`    |
| Holder concentration  | top-holder ≥ 25 %          | top-holder ≥ 40 %               |
| Treasury movements    | anomaly count ≥ 1          | anomaly count ≥ 5               |
| Permission posture    | —                          | `permissionPostureConfigured === false` |
| KYC compliance        | —                          | `kycProviderConfigured === false` |
| Holder engagement     | inactive % ≥ 40 %          | inactive % ≥ 60 %               |

---

## Recommendation engine

```
src/utils/cockpitRecommendations.ts
```

`generateRecommendations(state, limit?)` returns an ordered list of `GuidedAction` objects derived
from `TokenHealthState`. Rules are evaluated in ascending `precedence` order — lower number fires
first. Identical inputs always produce identical outputs.

### Rule precedence table

| Precedence | Rule ID                       | Trigger condition                   | Priority    |
|:----------:|-------------------------------|-------------------------------------|:-----------:|
| 10         | `kyc_not_configured`          | KYC provider absent                 | critical    |
| 20         | `metadata_incomplete`         | Required metadata fields missing    | critical    |
| 30         | `mint_policy_invalid`         | Mint policy invalid or expired      | critical    |
| 40         | `permissions_unconfigured`    | Roles not configured                | high        |
| 50         | `high_concentration`          | Top holder ≥ 40 %                   | high        |
| 60         | `moderate_concentration`      | Top holder in [25 %, 40 %)          | medium      |
| 70         | `treasury_anomalies_critical` | Treasury anomalies ≥ 5              | critical    |
| 80         | `treasury_anomalies_warning`  | Treasury anomalies in [1, 5)        | high        |
| 90         | `high_inactivity`             | Inactive holders ≥ 60 %             | high        |
| 100        | `moderate_inactivity`         | Inactive holders in [40 %, 60 %)    | medium      |

---

## Timeline utilities

```
src/utils/cockpitTimeline.ts
```

Pure functions for transforming `TimelineEntry` objects:

| Function                   | Purpose                                              |
|----------------------------|------------------------------------------------------|
| `formatTimelineTimestamp`  | Relative label ("Just now", "3 minutes ago", …)     |
| `formatTimelineTimestampFull` | Full ISO-style label for tooltips                |
| `formatActorDisplay`       | Safe truncation of addresses / emails                |
| `getCategoryMeta`          | Icon, colour, and label for a `TimelineEventCategory` |
| `sortEntriesNewestFirst`   | Sorts entries newest-first (non-mutating)            |
| `filterEntriesWithinDays`  | Keeps entries within N calendar days                 |
| `groupEntriesByDate`       | Groups entries by date label for the timeline UI     |

### Actor display rules

| Input type              | Output                          |
|-------------------------|---------------------------------|
| Blockchain address (≥ 40 chars) | `ABCD…WXYZ` (first 4 + last 4) |
| Email address           | local part only (`alice`)       |
| Empty / whitespace      | `System`                        |
| `"system"` (any case)   | `System`                        |
| Other                   | value as-is                     |

---

## Analytics events

```
src/utils/cockpitAnalytics.ts
```

All analytics payloads are passed through `sanitizeAnalyticsPayload()` which recursively redacts
known sensitive field names (password, privateKey, mnemonic, accessToken, etc.) before dispatch.

### Event types

| Event type         | Fires when                        | Required metadata field |
|--------------------|-----------------------------------|------------------------|
| `page_view`        | Cockpit page loads                | —                      |
| `widget_expanded`  | A widget section is expanded      | —                      |
| `export_initiated` | Export flow starts                | —                      |
| `action_selected`  | An action card is clicked         | `actionId` (non-empty) |
| `action_completed` | "Mark Done" is clicked            | `actionId` (non-empty) |
| `evidence_viewed`  | An evidence link is followed      | `evidenceId` (non-empty)|

Events are suppressed (return `null`) when required metadata fields are absent, preventing
duplicate or invalid analytics records.

---

## State management

Store: `src/stores/lifecycleCockpit.ts` (`useLifecycleCockpitStore`)

The store aggregates all cockpit data via `initialize(tokenId?)` which calls six parallel loaders:
readiness status, telemetry, guided actions, wallet diagnostics, risk indicators, evidence traces,
and the activity timeline. Partial failures are surfaced via the `error` state; individual section
failures will not block the full page from rendering once the store handles per-section error
boundaries.

---

## File index

| File | Role |
|------|------|
| `src/views/LifecycleCockpit.vue` | Main cockpit page |
| `src/stores/lifecycleCockpit.ts` | Pinia store — state, computed, loaders |
| `src/types/lifecycleCockpit.ts` | All TypeScript types including `TimelineEntry`, `TimelineData` |
| `src/constants/navItems.ts` | Navigation — Cockpit link added |
| `src/utils/cockpitStatusDerivation.ts` | Deterministic health-status derivation |
| `src/utils/cockpitRecommendations.ts` | Recommendation engine |
| `src/utils/cockpitTimeline.ts` | Timeline transformation utilities |
| `src/utils/cockpitAnalytics.ts` | Privacy-safe analytics helpers |
| `src/components/lifecycleCockpit/ReadinessStatusWidget.vue` | Readiness section |
| `src/components/lifecycleCockpit/TelemetrySummaryWidget.vue` | Telemetry section |
| `src/components/lifecycleCockpit/GuidedActionsWidget.vue` | Actions queue |
| `src/components/lifecycleCockpit/WalletDiagnosticsWidget.vue` | Wallet checks |
| `src/components/lifecycleCockpit/RiskIndicatorsWidget.vue` | Risk indicators |
| `src/components/lifecycleCockpit/EvidenceLinksWidget.vue` | Evidence traceability |
| `src/components/lifecycleCockpit/TimelineWidget.vue` | Activity timeline |
| `src/components/lifecycleCockpit/RiskIndicatorCard.vue` | Reusable risk card |

---

## Lifecycle action taxonomy

Actions are categorised into five dimensions aligned with the operator workflow:

| Category      | Examples                                           |
|---------------|----------------------------------------------------|
| `setup`       | Complete metadata, configure roles, deploy token   |
| `compliance`  | Configure KYC, set whitelist, review jurisdiction  |
| `wallet`      | Verify wallet compatibility, add mobile deep links |
| `operations`  | Re-engage holders, update metadata, rotate keys    |
| `risk`        | Address concentration, investigate anomalies       |

---

## Roadmap alignment

This milestone directly supports the following roadmap objectives:

- **Post-creation value** — operators see token health immediately after launch
- **Guided lifecycle** — deterministic recommendations reduce trial-and-error
- **Trust signals** — plain-language health labels and evidence links improve auditability
- **Enterprise confidence** — role-based access and compliance-first signals meet procurement criteria
- **Retention** — lifecycle tooling keeps operators engaged beyond initial token creation
