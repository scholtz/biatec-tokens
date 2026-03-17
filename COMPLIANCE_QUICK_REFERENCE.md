# Compliance Operations Cockpit — Quick Reference

## File Locations & Line Counts

### Core Utilities (Backend-Ready Data Models)
- **complianceOperationsCockpit.ts** (1,111 lines)
  - Types: OperatorRole, OwnershipState, SlaUrgency, CockpitWorkflowStage, WorkItemStatus, HandoffReadiness, CockpitPosture, AgingBucket, CockpitPersona
  - Functions: classifySlaUrgency, deriveQueueHealth, deriveStageBottlenecks, deriveCockpitPosture, filterWorkItemsByPersona, deriveRoleSummaries, deriveWorkItemHandoffContext
  - Test IDs: 30+ constants for E2E selector coverage

- **investorComplianceOnboarding.ts** (1,116 lines)
  - Types: OnboardingStageId (7 stages), OnboardingStageStatus, OnboardingBlockerSeverity, DocumentStatus, KYCReviewStatus, AMLScreeningStatus, AMLRiskRating, JurisdictionDecision, WorkspaceReadinessPosture
  - Interfaces: IntakeEntity, DocumentItem, KYCReviewRecord, AMLScreeningRecord, JurisdictionEntry, OnboardingBlocker, OnboardingStage, OnboardingWorkspaceState
  - Functions: deriveWorkspacePosture, deriveReadinessScore, buildReadinessHeadline, deriveOnboardingWorkspaceState, getTopOnboardingBlockers

- **releaseReadiness.ts** (42 KB)
  - Types: SignOffReadinessState (5 states)
  - Interfaces: EvidenceDimension, SignOffReadinessSummary
  - Functions: isSignOffBlocking, isSignOffClear

- **approvalCockpit.ts** (23.6 KB)
  - Types: ReviewerRole (4 roles), ApprovalStageStatus (7 states), BlockerSeverity (4 levels), ReleasePosture (3 states)
  - Interfaces: StageBlocker, ApprovalStage
  - Functions: isBlockingStatus, isSignedOff, formatStalenessLabel, isEvidenceStale

- **remediationWorkflow.ts** (19.8 KB)
  - Types: OwnerDomain (6 domains), RemediationUrgency (4 levels), EvidenceFreshness (3 states), HandoffState (7 states)
  - Interfaces: RemediationTask
  - Mapping: ROLE_TO_DOMAIN bridges ReviewerRole → OwnerDomain

- **complianceEvidencePack.ts** (3.1 KB)
  - Types: EvidenceStatus (5 states)
  - Interfaces: EvidenceSection, JurisdictionSummary, KYCAMLSummary, WhitelistSummary, InvestorEligibilitySummary, ComplianceReportBundle

- **complianceReportingWorkspace.ts** (24.7 KB)
  - Types: AudiencePreset (4 types), ApprovalOutcome (5 states)
  - Interfaces: ApprovalHistoryEntry, ApprovalHistorySummary
  - Config: AUDIENCE_SECTION_PRIORITIES (audience-aware report filtering)

### Vue Components
- **ComplianceOperationsCockpit.vue** (935 lines)
  - Six main panels: Posture Banner, Role-Aware Summaries, Persona Selector, Worklist, Bottleneck, Handoff, Aging Analysis
  - Computed properties: queueHealth, agingBuckets, stageBottlenecks, handoffs, roleSummaries, posture, filteredWorkItems
  - Test coverage: 12 acceptance criteria (AC #1-#12)

- **InvestorComplianceOnboardingWorkspace.vue** (50,668 lines)
  - Displays 7 onboarding stages with step-by-step progression
  - Integrates KYC, AML, documentation, jurisdiction validation
  - Hands off to approval cockpit via workspaceReadiness

- **EnterpriseApprovalCockpit.vue** (40,208 lines)
  - 4 reviewer stages (compliance → legal → procurement → executive)
  - Displays blockers and conditions for each stage
  - Integrates remediation workflow for unblocking

- **ComplianceReportingWorkspace.vue** (77,030 lines)
  - Audience-aware report generation (all, compliance, procurement, executive)
  - Export package readiness assessment
  - Evidence manifest and approval history

- **ComplianceEvidencePackView.vue** (38,479 lines)
  - Displays evidence sections by status (ready, warning, failed, pending, unavailable)
  - Release-grade vs. developer feedback distinction
  - Export and audit trail generation

## Routes (All Require Auth)

| Path | Component | Purpose |
|------|-----------|---------|
| `/compliance/operations` | ComplianceOperationsCockpit | **[NEW]** Role-aware task coordination, SLA monitoring, workflow handoffs |
| `/compliance/onboarding` | InvestorComplianceOnboardingWorkspace | KYC/AML review, jurisdiction checks, evidence staging |
| `/compliance/approval` | EnterpriseApprovalCockpit | Release sign-off cockpit with 4 reviewer stages |
| `/compliance/evidence` | ComplianceEvidencePackView | Regulator-ready evidence review and export |
| `/compliance/release` | ReleaseEvidenceCenterView | Integrated sign-off readiness, evidence inventory, diagnostics |
| `/compliance/reporting` | ComplianceReportingWorkspace | Enterprise compliance reporting, export packages |
| `/compliance/risk-report` | EnterpriseRiskReportBuilder | Custom compliance reports with configurable risk scoring |
| `/compliance-monitoring` | ComplianceMonitoringDashboard | Live compliance monitoring dashboard |
| `/compliance/whitelists` | WhitelistsView | Investor whitelist management |
| `/compliance/reporting-center` | ReportingCommandCenterView | Scheduled recurring compliance reporting |

## Sidebar Navigation

All links in `src/components/layout/Sidebar.vue` "Quick Actions" section:
```
Release Evidence → /compliance/evidence
Sign-off Readiness → /compliance/release
Investor Onboarding → /compliance/onboarding
Compliance Reporting → /compliance/reporting
Risk Report Builder → /compliance/risk-report
Approval Queue → /compliance/approval
Operations Cockpit → /compliance/operations  [NEW]
Compliance Monitoring → /compliance-monitoring
Whitelist Management → /compliance/whitelists
Reporting Center → /compliance/reporting-center
```

## E2E Test Files

### Compliance Operations Cockpit (12 Acceptance Criteria)
- **`e2e/compliance-operations-cockpit.spec.ts`**
  - AC #1: Route reachability at `/compliance/operations`
  - AC #2: Queue health panel (totals, overdue, blocked, approval-ready)
  - AC #3: Worklist filtering by operator role
  - AC #4: Stage bottleneck concentration analysis
  - AC #5: Handoff readiness + role-aware summaries
  - AC #6: Degraded state alert on errors
  - AC #7-#8: Filter select + refresh button
  - AC #9: No wallet connector (email/password only)
  - AC #10: Auth-required redirect
  - AC #11: WCAG accessibility (landmarks, headings, keyboard nav)
  - AC #12: Sidebar integration

### Other E2E Tests
- `compliance-setup-workspace.spec.ts`
- `enterprise-approval-cockpit.spec.ts`
- `investor-compliance-onboarding.spec.ts`
- `compliance-evidence-pack.spec.ts`
- `compliance-reporting-workspace.spec.ts`
- `compliance-delivery-slice.spec.ts`
- `compliance-orchestration.spec.ts`
- `compliance-dashboard.spec.ts`
- `compliance-launch-console.spec.ts`
- `compliance-auth-first.spec.ts`
- `enterprise-compliance-workspace-journeys.spec.ts`
- `live-compliance-integration.spec.ts`
- `lifecycle-cockpit.spec.ts`

## Test IDs for Operations Cockpit

Use these in E2E tests via `page.getByTestId()`:

```typescript
compliance-operations-cockpit           // Root container
cockpit-ops-heading                     // Main heading
cockpit-posture-banner                  // Posture banner section
cockpit-posture-label                   // Posture label text
queue-health-panel                      // Queue health metrics panel
health-total, health-overdue, health-blocked, health-approval-ready, health-unassigned
worklist-panel                          // Work items list
work-item-row                           // Individual work item
bottleneck-panel                        // Stage bottleneck analysis
handoff-panel                           // Downstream handoff cards
role-summary-panel                      // Role-aware summary section
role-summary-card                       // Individual persona card
persona-selector                        // Role filter tabs
aging-analysis-panel                    // Item aging analysis
cockpit-refresh-btn                     // Refresh button
cockpit-refreshed-at                    // Last refreshed timestamp
degraded-alert                          // Degraded state notification
```

## Key Enumerations

### Operator Roles (for filtering)
- `compliance_analyst` — Items assigned to them + overdue/pending items
- `operations_lead` — Unassigned items, bottlenecks, escalations
- `sign_off_approver` — Approval-ready items + launch-blocking cases
- `team_lead` — Escalated items, blocked work, critical aging items

### Ownership States
- `assigned_to_me` — Direct owner
- `assigned_to_team` — Owned by team, not yet claimed
- `unassigned` — No owner assigned
- `blocked_by_external` — Waiting on external input
- `escalated` — Escalated to senior leadership

### SLA Urgency
- `overdue` — Past deadline
- `due_soon` — Within 24 hours of deadline
- `on_track` — Within SLA window
- `no_deadline` — No deadline set

### Work Item Status
- `open` — New, not yet claimed
- `in_progress` — Being worked on
- `pending_review` — Awaiting review
- `blocked` — Cannot progress
- `approval_ready` — Ready for handoff to approval cockpit
- `overdue` — Past SLA deadline
- `escalated` — Escalated
- `complete` — Done

### Workflow Stages
1. `onboarding` — Investor intake
2. `document_review` — Document validation
3. `kyc_aml` — KYC/AML screening
4. `remediation` — Fix blockers
5. `approval` — Sign-off stages
6. `reporting` — Export + audit trail

### Cockpit Posture
- `clear` — All healthy, no urgent action needed
- `attention_required` — Some items need attention but not blocking
- `critical` — Launch-blocking issues present
- `degraded` — Data unavailable or system error

### Aging Buckets
- `fresh` — < 7 days inactive
- `aging` — 7-14 days inactive
- `stale` — 14-30 days inactive
- `critical` — > 30 days inactive

## Mock Data for Testing

```typescript
// Healthy state (3 items, no issues)
MOCK_WORK_ITEMS_HEALTHY

// Degraded state (4 items, includes overdue + blocked)
MOCK_WORK_ITEMS_DEGRADED

// Deterministic timestamp (always 2026-03-16T10:00:00Z)
MOCK_COCKPIT_REFRESHED_AT

// Three handoff scenarios (onboarding, approval, reporting)
buildDefaultHandoffs(items, now)
```

## Authentication

### Session Contract (ARC76)
```typescript
{
  address: string        // Non-empty derived address
  email: string          // User email
  isConnected: boolean   // Must be true
}
```

### E2E Auth Helpers
- `withAuth(page)` — Permissive: seeds localStorage (default CI)
- `loginWithCredentials(page, email, password)` — Tries backend, falls back to seeding
- `loginWithCredentialsStrict(page, email, password)` — Strict: requires backend (sign-off lane)
- `suppressBrowserErrors(page)` — Suppress console warnings
- `clearAuthScript(page)` — Remove auth token

## Accessibility (WCAG 2.4.1+)

- ✓ Skip link to main content
- ✓ Role regions with aria-label
- ✓ ARIA landmarks (main, nav)
- ✓ aria-current="page" on active routes
- ✓ Focus-visible rings on all interactive elements
- ✓ Heading hierarchy (h1, h2, h3, ...)
- ✓ Dark mode support
- ✓ Keyboard navigation throughout

## Integration Pattern

```
[ComplianceOperationsCockpit] — Central task hub
    ├─ detects new work items
    ├─ classifies urgency via SLA
    ├─ assigns ownership
    ├─ routes to [InvestorComplianceOnboardingWorkspace] for KYC/AML
    ├─ routes to [EnterpriseApprovalCockpit] for sign-off
    └─ routes to [ComplianceReportingWorkspace] for export

[InvestorComplianceOnboardingWorkspace]
    ├─ intake → documentation → KYC/AML → jurisdiction → evidence
    └─ hands off to [EnterpriseApprovalCockpit]

[EnterpriseApprovalCockpit]
    ├─ compliance_operator review
    ├─ legal_reviewer review
    ├─ procurement_reviewer review
    ├─ executive_sponsor sign-off
    └─ generates [ComplianceReportingWorkspace] export

[ComplianceReportingWorkspace]
    ├─ audience-specific reports (compliance, procurement, executive)
    ├─ evidence manifest
    ├─ approval history
    └─ export packages
```

## Performance Notes

- Queue health: O(n) with single pass through work items
- Stage bottlenecks: O(n) grouped by stage
- Role filtering: O(n) per persona selector change
- Aging analysis: O(n) with timestamp comparisons
- Mock data: Deterministic (fixed ISO timestamps) for reproducible tests
- Degraded mode: Frontend-derived state when API unavailable

## Future Backend Integration Points

All types are designed for direct API hydration:
- `GET /api/compliance/operations/queue` → WorkItem[]
- `GET /api/compliance/operations/health` → QueueHealthMetrics
- `GET /api/compliance/onboarding/stages/:id` → OnboardingStage
- `GET /api/compliance/approval/stages` → ApprovalStage[]
- `POST /api/compliance/operations/items/:id/assign` → WorkItem
- `POST /api/compliance/operations/items/:id/resolve` → WorkItem

No breaking changes needed; simply replace mock data with API responses.
