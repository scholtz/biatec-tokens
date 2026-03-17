    | Yes
/compliance/release               | ReleaseEvidenceCenter           | ReleaseEvidenceCenterView        | Yes
/compliance/reporting             | ComplianceReportingWorkspace    | ComplianceReportingWorkspace     | Yes
/compliance/risk-report           | EnterpriseRiskReportBuilder     | EnterpriseRiskReportBuilder      | Yes
/compliance/approval              | EnterpriseApprovalCockpit       | EnterpriseApprovalCockpit        | Yes
/compliance/onboarding            | InvestorComplianceOnboarding    | InvestorComplianceOnboardingWorkspace | Yes
/compliance/operations            | ComplianceOperationsCockpit     | ComplianceOperationsCockpit      | Yes
/compliance/reporting-center      | ReportingCommandCenter          | ReportingCommandCenterView       | Yes
```
### Authentication Guard
- All compliance routes require `requiresAuth: true` meta flag
- Uses email/password (ARC76) authentication, no wallet connectors
- Uses `algorand_user` localStorage key for session
- Structural session validation via `isIssuanceSessionValid()` for issuance routes
---
## 9. Sidebar Navigation
### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/src/components/layout/Sidebar.vue` (250+ lines)
### Compliance Navigation Links
```
Quick Actions Section:
├── Release Evidence (icon: ClipboardDocumentCheckIcon) → /compliance/evidence
├── Sign-off Readiness (icon: ShieldCheckIcon) → /compliance/release
├── Investor Onboarding (icon: UsersIcon) → /compliance/onboarding
├── Compliance Reporting (icon: ClipboardDocumentListIcon) → /compliance/reporting
├── Risk Report Builder (icon: ShieldExclamationIcon) → /compliance/risk-report
├── Approval Queue (icon: ClipboardDocumentListIcon) → /compliance/approval
├── Operations Cockpit (icon: ChartBarSquareIcon) → /compliance/operations
├── Compliance Monitoring (icon: ShieldCheckIcon) → /compliance-monitoring
├── Whitelist Management (icon: UsersIcon) → /compliance/whitelists
└── Reporting Center (icon: CalendarDaysIcon) → /compliance/reporting-center
```
### WCAG Compliance
- Uses `aria-current="page"` for active routes
- Focus-visible rings on all interactive links
- Dark mode support with `dark:` prefixes
- Active link styling with blue highlights
---
## 10. E2E Test Files
### Location
Test files in `/home/runner/work/biatec-tokens/biatec-tokens/e2e/`:
| Test File | Purpose |
|-----------|---------|
| `compliance-operations-cockpit.spec.ts` | E2E tests for operations cockpit (12 acceptance criteria) |
| `compliance-setup-workspace.spec.ts` | E2E for setup workspace |
| `enterprise-approval-cockpit.spec.ts` | E2E for approval queue |
| `investor-compliance-onboarding.spec.ts` | E2E for investor onboarding workspace |
| `compliance-evidence-pack.spec.ts` | E2E for evidence pack view |
| `compliance-reporting-workspace.spec.ts` | E2E for reporting workspace |
| `compliance-delivery-slice.spec.ts` | E2E for delivery slice |
| `compliance-orchestration.spec.ts` | E2E for orchestration view |
| `compliance-dashboard.spec.ts` | E2E for compliance dashboard |
| `compliance-launch-console.spec.ts` | E2E for launch console |
| `compliance-auth-first.spec.ts` | E2E for auth-first flow |
| `enterprise-compliance-workspace-journeys.spec.ts` | E2E for workspace journey flows |
| `live-compliance-integration.spec.ts` | E2E for live integration tests |
| `lifecycle-cockpit.spec.ts` | E2E for lifecycle cockpit |
### Compliance Operations Cockpit E2E (AC #1-#12)
```typescript
// AC #1 — Reachability
route /compliance/operations is accessible when authenticated
// AC #2 — Queue Health Panel
queue health panel shows totals, overdue, blocked, approval-ready counts
// AC #3 — Worklist Panel & Persona Filtering
worklist renders work items with ownership, urgency, stage badges
filter select updates visible worklist by operator role
// AC #4 — Bottleneck Analysis
bottleneck panel shows stage-level concentration
// AC #5 — Handoff Readiness & Role Summaries
handoff panel links to onboarding, approval, reporting workspaces
role-aware summaries for compliance manager, ops lead, executive
// AC #6 — Degraded State
degraded alert shown on data errors (fail-closed)
// AC #7-#8 — Refresh Control
refresh button triggers data reload
// AC #9 — No Wallet UI
no wallet connector UI (email/password only)
// AC #10 — Auth Required
unauthenticated users are redirected to home
// AC #11 — Accessibility
ARIA landmarks, headings, keyboard navigation (WCAG compliant)
// AC #12 — Sidebar Integration
sidebar link "Operations Cockpit" navigates to workspace
```
---
## 11. E2E Test Helpers
### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/e2e/helpers/auth.ts`
### Session Contract
```typescript
export interface ARC76SessionContract {
  address: string        // Non-empty ARC76-derived address
  email: string          // User email for account derivation
  isConnected: boolean   // Must be true for issuance route access
}
export interface AuthUser extends ARC76SessionContract {
  name?: string
  provisioningStatus?: string
  canDeploy?: boolean
}
export interface SessionValidationResult {
  valid: boolean
  errors: string[]
}
```
### Key Helper Functions
```typescript
// Permissive (CI default): seeds validated localStorage session
withAuth(page): Promise<void>
loginWithCredentials(page, email, password): Promise<void>
// Strict (sign-off lane): real backend auth, fails if unavailable
loginWithCredentialsStrict(page, email, password): Promise<void>
// Utility functions
suppressBrowserErrors(page): void
setupAuthAndNavigate(page, path): Promise<void>
clearAuthScript(page): Promise<void>
```
### Authentication Strategy
- **Tier 1 (Permissive)**: Seeds validated localStorage session
- **Tier 2 (Strict)**: Requires backend `POST /api/auth/login`
- Validates session against ARC76 contract before seeding
- Falls back to seeding if backend unavailable (unless strict mode)
---
## 12. Directory Listings
### src/utils/ Contents (81 files)
Key compliance-related utilities:
- `complianceOperationsCockpit.ts` — Operations cockpit logic
- `investorComplianceOnboarding.ts` — Investor onboarding logic
- `releaseReadiness.ts` — Sign-off readiness assessment
- `approvalCockpit.ts` — Approval workflow logic
- `remediationWorkflow.ts` — Remediation task management
- `complianceEvidencePack.ts` — Evidence pack types
- `complianceReportingWorkspace.ts` — Reporting workspace logic
- `complianceCaseNormalizer.ts` — Case normalization
- `complianceDeliverySlice.ts` — Delivery slice logic
- `complianceLaunchReadiness.ts` — Launch readiness
- `compliance.ts` — Core compliance types
- `complianceStatus.ts` — Status derivation
- And 69+ other utilities for token creation, analytics, validation, etc.
### src/views/ Contents (52 items)
Key compliance-related views:
- `ComplianceOperationsCockpit.vue` — Operations cockpit UI
- `InvestorComplianceOnboardingWorkspace.vue` — Investor onboarding UI
- `EnterpriseApprovalCockpit.vue` — Approval queue UI
- `ComplianceEvidencePackView.vue` — Evidence pack UI
- `ComplianceReportingWorkspace.vue` — Reporting workspace UI
- `ComplianceLaunchConsole.vue` — Launch console UI
- `ComplianceSetupWorkspace.vue` — Setup workspace UI
- `ComplianceDashboard.vue` — Compliance dashboard
- `ComplianceMonitoringDashboard.vue` — Monitoring dashboard
- `ComplianceOrchestrationView.vue` — Orchestration view
- `EnterpriseRiskReportBuilder.vue` — Risk reporting UI
- `ReleaseEvidenceCenterView.vue` — Release evidence center UI
- `ReportingCommandCenterView.vue` — Reporting command center UI
- And 39+ other views for token creation, onboarding, etc.
---
## 13. Key Architecture Principles
### Design Patterns
1. **Fail-Closed**: Absent data treated as degraded, not optimistic
2. **Backend-Ready**: All interfaces can be hydrated from API responses
3. **No Wallet Assumptions**: Enterprise/compliance-oriented language throughout
4. **Role-Aware**: Different views and filters for compliance_analyst, operations_lead, sign_off_approver, team_lead
5. **Type-Safe**: Full TypeScript coverage with comprehensive interfaces
6. **Accessibility-First**: WCAG 2.4.1+ compliant with ARIA landmarks and keyboard navigation
7. **Deterministic Testing**: Mock fixtures use fixed timestamps for reproducible CI tests
### State Management
- Reactive Vue 3 Composition API with `ref<>` and `computed<>`
- Derived state functions for metrics, posture, readiness
- Frontend-derived state when backend unavailable (degraded mode)
### UI/UX Patterns
- **Posture Banner**: Overall queue health at-a-glance
- **Role Summary Cards**: Persona-specific metrics and action prompts
- **Persona Selector Tabs**: Filter by operator role perspective
- **Worklist Rows**: Work items with ownership, urgency, stage badges
- **Bottleneck Panel**: Stage concentration analysis
- **Handoff Cards**: Downstream readiness with blocker/warning counts
- **Aging Analysis**: Items grouped by inactivity duration (fresh/aging/stale/critical)
### Testing Strategy
- E2E tests cover 12+ acceptance criteria per major component
- Mock data deterministic (fixed ISO timestamps)
- Auth helpers with permissive/strict tiers
- Test IDs throughout for reliable element selection
- WCAG accessibility assertions in E2E tests
---
## 14. Key Integration Points
### Workspace Flow
```
ComplianceOperationsCockpit
  ├─ Routes items to → InvestorComplianceOnboardingWorkspace (/compliance/onboarding)
  ├─ Routes items to → EnterpriseApprovalCockpit (/compliance/approval)
  └─ Routes items to → ComplianceReportingWorkspace (/compliance/reporting)
InvestorComplianceOnboardingWorkspace
  ├─ Stages: intake → documentation → KYC/AML → jurisdiction → evidence → approval_handoff
  └─ Hands off to → EnterpriseApprovalCockpit
EnterpriseApprovalCockpit
  ├─ Reviews prepared by → InvestorComplianceOnboardingWorkspace
  ├─ Stages: compliance_operator → legal_reviewer → procurement_reviewer → executive_sponsor
  ├─ May trigger → RemediationWorkflow (for blockers)
  └─ Final sign-off enables → ComplianceReportingWorkspace
ComplianceReportingWorkspace
  ├─ Generates audience-specific reports: all, compliance, procurement, executive
  ├─ Exports compliance packages
  └─ Integrates evidence from → ComplianceEvidencePackView
ComplianceEvidencePackView
  └─ Displays evidence from all upstream stages
```
### Data Flow
1. **Intake** → ComplianceOperationsCockpit detects new work items
2. **Onboarding** → InvestorComplianceOnboardingWorkspace processes KYC/AML
3. **Handoff** → Operations cockpit recognizes approval_ready items
4. **Approval** → EnterpriseApprovalCockpit stages for sign-off
5. **Resolution** → RemediationWorkflow escalates blockers
6. **Reporting** → ComplianceReportingWorkspace exports final evidence
7. **Release** → ReleaseReadiness validates sign-off readiness
---
## Summary Table
| Component | Lines | Type | Route | Purpose |
|-----------|-------|------|-------|---------|
| ComplianceOperationsCockpit.ts | 1,111 | Utility | — | Queue health, SLA, ownership, handoff logic |
| ComplianceOperationsCockpit.vue | 935 | View | /compliance/operations | Operations cockpit UI |
| InvestorComplianceOnboarding.ts | 1,116 | Utility | — | Onboarding stages, KYC/AML, blockers |
| InvestorComplianceOnboardingWorkspace.vue | 50,668 | View | /compliance/onboarding | Investor onboarding UI |
| ReleaseReadiness.ts | ~42KB | Utility | — | Sign-off readiness assessment |
| ApprovalCockpit.ts | 23,627 | Utility | — | Approval stages, reviewer roles, blockers |
| EnterpriseApprovalCockpit.vue | 40,208 | View | /compliance/approval | Approval queue UI |
| RemediationWorkflow.ts | 19,787 | Utility | — | Remediation tasks, urgency, ownership |
| ComplianceEvidencePack.ts | 3,127 | Utility | — | Evidence pack types |
| ComplianceEvidencePackView.vue | 38,479 | View | /compliance/evidence | Evidence pack UI |
| ComplianceReportingWorkspace.ts | 24,698 | Utility | — | Audience presets, approval history |
| ComplianceReportingWorkspace.vue | 77,030 | View | /compliance/reporting | Reporting workspace UI |
EOF
cat /tmp/compliance_exploration_summary.md
                EC=$?
                echo "___BEGIN___COMMAND_DONE_MARKER___$EC"
            }
___BEGIN___COMMAND_OUTPUT_MARKER___
# Compliance-Related Files Exploration Summary

## Overview
The biatec-tokens repository contains a sophisticated enterprise compliance operations framework with multiple interconnected workspaces, utilities, and E2E tests. The compliance cockpit is a role-aware task coordination system designed for investor onboarding, approvals, remediation, and reporting.

---

## 1. Compliance Operations Cockpit Structure

### Location
- **Utility**: `/home/runner/work/biatec-tokens/biatec-tokens/src/utils/complianceOperationsCockpit.ts` (1,111 lines)
- **View**: `/home/runner/work/biatec-tokens/biatec-tokens/src/views/ComplianceOperationsCockpit.vue` (935 lines)
- **Route**: `/compliance/operations` (requires auth)
- **Sidebar Navigation**: `src/components/layout/Sidebar.vue` (line 147-157)

### Key Types & Enums

#### Operator Roles
```typescript
export type OperatorRole = 
  | 'compliance_analyst' 
  | 'operations_lead' 
  | 'sign_off_approver' 
  | 'team_lead'
```

#### Ownership States
```typescript
export type OwnershipState = 
  | 'assigned_to_me' 
  | 'assigned_to_team' 
  | 'unassigned' 
  | 'blocked_by_external' 
  | 'escalated'
```

#### SLA Urgency Classification
```typescript
export type SlaUrgency = 'overdue' | 'due_soon' | 'on_track' | 'no_deadline'
export const SLA_DUE_SOON_HOURS = 24
export function classifySlaUrgency(duAt: string | null, now?: number): SlaUrgency
```

#### Workflow Stages
```typescript
export type CockpitWorkflowStage =
  | 'onboarding'
  | 'document_review'
  | 'kyc_aml'
  | 'remediation'
  | 'approval'
  | 'reporting'

export const WORKFLOW_STAGE_ORDER: CockpitWorkflowStage[] = [
  'onboarding', 'document_review', 'kyc_aml', 'remediation', 'approval', 'reporting'
]
```

#### Work Item Status
```typescript
export type WorkItemStatus =
  | 'open'
  | 'in_progress'
  | 'pending_review'
  | 'blocked'
  | 'approval_ready'
  | 'overdue'
  | 'escalated'
  | 'complete'
```

### Core Interfaces

#### WorkItem
```typescript
export interface WorkItem {
  id: string
  title: string
  stage: CockpitWorkflowStage
  status: WorkItemStatus
  ownership: OwnershipState
  lastActionAt: string | null
  dueAt: string | null
  workspacePath: string
  note: string | null
  isLaunchBlocking: boolean
}
```

#### QueueHealthMetrics
```typescript
export interface QueueHealthMetrics {
  total: number
  overdue: number
  dueSoon: number
  blocked: number
  approvalReady: number
  unassigned: number
  assignedToMe: number
}
```

#### StageBottleneck
```typescript
export interface StageBottleneck {
  stage: CockpitWorkflowStage
  label: string
  count: number
  percentOfTotal: number
  concentration: 'low' | 'medium' | 'high'
  avgAge: number
  oldestItemAge: number
}
```

#### DownstreamHandoff
```typescript
export interface DownstreamHandoff {
  id: string
  label: string
  description: string
  path: string
  readiness: HandoffReadiness
  blockerCount: number
  warningCount: number
}
```

#### CockpitPosture
```typescript
export type CockpitPosture = 'clear' | 'attention_required' | 'critical' | 'degraded'
```

#### AgingBucketSummary
```typescript
export interface AgingBucketSummary {
  bucket: AgingBucket
  label: string
  count: number
  items: WorkItem[]
  avgAgeMs: number
}

export type AgingBucket = 'fresh' | 'aging' | 'stale' | 'critical'
export const AGING_BUCKET_THRESHOLDS = {
  fresh: 7 * 24 * 60 * 60 * 1000,      // 7 days
  aging: 14 * 24 * 60 * 60 * 1000,     // 14 days
  stale: 30 * 24 * 60 * 60 * 1000,     // 30 days
  critical: Infinity,                   // beyond 30 days
}
```

#### Role-Aware Summaries (AC #5)
```typescript
export type CockpitPersona = 'compliance_manager' | 'operations_lead' | 'executive_sponsor'

export interface RoleSummaryMetric {
  label: string
  value: number
  severity: 'red' | 'yellow' | 'green' | 'gray'
  prompt: string | null
}

export interface RoleSummaryCard {
  persona: CockpitPersona
  label: string
  description: string
  metrics: RoleSummaryMetric[]
  needsAttention: boolean
}
```

#### Work Item Handoff Context (AC #5)
```typescript
export interface WorkItemHandoffContext {
  previousStage: CockpitWorkflowStage | null
  nextAction: string
  missingEvidence: string[]
  isUrgent: boolean
}
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `deriveQueueHealth(items, now)` | Calculate totals, overdue, blocked, approval-ready counts |
| `deriveStageBottlenecks(items, now)` | Identify workflow stage concentration and aging |
| `deriveHandoffReadiness(stage, items, now)` | Determine if handoff to next workspace is ready |
| `deriveCockpitPosture(health, isHealthy)` | Classify overall cockpit health state |
| `filterWorkItemsByPersona(items, role)` | Filter items relevant to operator role (AC #3) |
| `deriveRoleSummaries(items, health, now)` | Generate role-aware summary cards (AC #5) |
| `deriveWorkItemHandoffContext(item, now)` | Provide next-step guidance for work item |
| `deriveAgingBuckets(items, now)` | Classify items by inactivity age |
| `buildDefaultHandoffs(items, now)` | Build three handoff cards (onboarding, approval, reporting) |
| `cockpitPostureBannerClass(posture)` | Tailwind CSS classes for posture banner |
| `workItemStatusBadgeClass(status)` | Tailwind CSS classes for status badges |
| `ownershipBadgeClass(ownership)` | Tailwind CSS classes for ownership badges |
| `slaUrgencyBadgeClass(urgency)` | Tailwind CSS classes for SLA urgency badges |

### Test IDs (COCKPIT_TEST_IDS)
```typescript
COCKPIT_TEST_IDS = {
  ROOT: 'compliance-operations-cockpit',
  HEADING: 'cockpit-ops-heading',
  POSTURE_BANNER: 'cockpit-posture-banner',
  POSTURE_LABEL: 'cockpit-posture-label',
  QUEUE_HEALTH_PANEL: 'queue-health-panel',
  HEALTH_TOTAL: 'health-total',
  HEALTH_OVERDUE: 'health-overdue',
  HEALTH_BLOCKED: 'health-blocked',
  HEALTH_APPROVAL_READY: 'health-approval-ready',
  HEALTH_UNASSIGNED: 'health-unassigned',
  HEALTH_ASSIGNED_TO_ME: 'health-assigned-to-me',
  WORKLIST_PANEL: 'worklist-panel',
  WORKLIST_EMPTY: 'worklist-empty',
  WORK_ITEM_ROW: 'work-item-row',
  WORK_ITEM_HANDOFF_CONTEXT: 'work-item-handoff-context',
  BOTTLENECK_PANEL: 'bottleneck-panel',
  BOTTLENECK_EMPTY: 'bottleneck-empty',
  HANDOFF_PANEL: 'handoff-panel',
  HANDOFF_CARD: 'handoff-card',
  DEGRADED_ALERT: 'degraded-alert',
  REFRESH_BTN: 'cockpit-refresh-btn',
  REFRESHED_AT: 'cockpit-refreshed-at',
  FILTER_SELECT: 'worklist-filter-select',
  LOADING_STATE: 'cockpit-loading-state',
  ROLE_SUMMARY_PANEL: 'role-summary-panel',
  ROLE_SUMMARY_CARD: 'role-summary-card',
  PERSONA_SELECTOR: 'persona-selector',
  PERSONA_TAB: 'persona-tab',
  AGING_PANEL: 'aging-analysis-panel',
  AGING_FRESH: 'aging-fresh',
  AGING_AGING: 'aging-aging',
  AGING_STALE: 'aging-stale',
  AGING_CRITICAL: 'aging-critical',
  AGING_AVERAGE: 'aging-average-days',
}
```

### Mock Data
```typescript
export const MOCK_WORK_ITEMS_HEALTHY: WorkItem[]  // 3 items, healthy state
export const MOCK_WORK_ITEMS_DEGRADED: WorkItem[] // 4 items, includes overdue/blocked
export const MOCK_COCKPIT_REFRESHED_AT = NOW_ISO  // Deterministic timestamp
```

### Vue Component Architecture
- Uses `MainLayout` wrapper
- Reactive state management with `ref<>` and `computed<>`
- Skip link for WCAG 2.4.1 compliance
- Three main sections:
  1. **Posture Banner** — overall queue health classification
  2. **Role-Aware Summaries** — three persona cards (compliance manager, ops lead, executive)
  3. **Persona Selector** — filter workitems by operator role
  4. **Worklist Panel** — active work items with status, ownership, SLA urgency
  5. **Bottleneck Panel** — stage-level concentration analysis
  6. **Handoff Panel** — downstream readiness (onboarding, approval, reporting)
  7. **Aging Analysis** — items grouped by inactivity duration

---

## 2. Investor Compliance Onboarding Workspace

### Location
- **Utility**: `/home/runner/work/biatec-tokens/biatec-tokens/src/utils/investorComplianceOnboarding.ts` (1,116 lines)
- **View**: `/home/runner/work/biatec-tokens/biatec-tokens/src/views/InvestorComplianceOnboardingWorkspace.vue` (50,668 lines)
- **Route**: `/compliance/onboarding` (requires auth)
- **Sidebar Navigation**: `src/components/layout/Sidebar.vue` (line 103-113)

### Onboarding Stages
```typescript
export type OnboardingStageId =
  | 'intake'
  | 'documentation_review'
  | 'identity_kyc_review'
  | 'aml_risk_review'
  | 'jurisdiction_review'
  | 'evidence_preparation'
  | 'approval_handoff'

export const ONBOARDING_STAGE_ORDER: OnboardingStageId[]
export const ONBOARDING_STAGE_LABELS: Record<OnboardingStageId, string>
export const ONBOARDING_STAGE_DESCRIPTIONS: Record<OnboardingStageId, string>
```

### Stage Readiness Status
```typescript
export type OnboardingStageStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'stale'
  | 'blocked'
  | 'complete'

export function isOnboardingStageBlocking(status: OnboardingStageStatus): boolean
export function isOnboardingStageComplete(status: OnboardingStageStatus): boolean
```

### Core Entities

#### IntakeEntity
```typescript
export interface IntakeEntity {
  id: string
  displayName: string
  role: 'issuer' | 'investor'
  jurisdiction: string
  submittedAt: string
  isComplete: boolean
  note: string | null
}
```

#### DocumentItem
```typescript
export type DocumentStatus = 'present' | 'missing' | 'expired' | 'pending_review'

export interface DocumentItem {
  id: string
  title: string
  status: DocumentStatus
  updatedAt: string | null
  expiresAt: string | null
  note: string | null
}

export function isDocumentActionRequired(doc: DocumentItem): boolean
```

#### KYC Review
```typescript
export type KYCReviewStatus = 'not_started' | 'in_progress' | 'approved' | 'rejected' | 'pending_update'

export interface KYCReviewRecord {
  entityId: string
  status: KYCReviewStatus
  verificationMethod: string
  completedAt: string | null
  note: string | null
}

export function isKYCApproved(record: KYCReviewRecord): boolean
```

#### AML Screening
```typescript
export type AMLScreeningStatus = 'not_screened' | 'in_progress' | 'passed' | 'failed' | 'pending_review'
export type AMLRiskRating = 'low' | 'medium' | 'high' | 'unrated'

export interface AMLScreeningRecord {
  entityId: string
  status: AMLScreeningStatus
  riskRating: AMLRiskRating
  screeningProvider: string
  completedAt: string | null
  expiresAt: string | null
  note: string | null
}

export function isAMLClear(record: AMLScreeningRecord): boolean
```

#### Jurisdiction Entry
```typescript
export type JurisdictionDecision = 'permitted' | 'restricted' | 'pending' | 'contradicted'

export interface JurisdictionEntry {
  jurisdiction: string
  decision: JurisdictionDecision
  reviewedAt: string | null
  note: string | null
}

export function isJurisdictionBlocking(entry: JurisdictionEntry): boolean
```

#### OnboardingBlocker
```typescript
export type OnboardingBlockerSeverity = 'critical' | 'high' | 'medium' | 'informational'

export interface OnboardingBlocker {
  id: string
  stage: OnboardingStageId
  title: string
  severity: OnboardingBlockerSeverity
  description: string
  resolution: string
  staleSince: string | null
  evidence: Array<{ label: string; path: string }> | null
}
```

#### OnboardingStage
```typescript
export interface OnboardingStage {
  id: OnboardingStageId
  status: OnboardingStageStatus
  label: string
  summary: string
  blockerCount: number
  blockers: OnboardingBlocker[]
  entities: IntakeEntity[]
  documents?: DocumentItem[]
  kycRecords?: KYCReviewRecord[]
  amlRecords?: AMLScreeningRecord[]
  jurisdictions?: JurisdictionEntry[]
  lastActionAt: string | null
}
```

### Readiness Assessment

#### WorkspaceReadinessPosture
```typescript
export type WorkspaceReadinessPosture = 'ready' | 'warning' | 'blocked' | 'stale' | 'degraded'

export function deriveWorkspacePosture(stages: OnboardingStage[]): WorkspaceReadinessPosture
export function deriveReadinessScore(stages: OnboardingStage[]): number  // 0-100
export function deriveOnboardingWorkspaceState(stages: OnboardingStage[]): OnboardingWorkspaceState
export function getTopOnboardingBlockers(stages: OnboardingStage[], limit = 5): OnboardingBlocker[]
```

#### OnboardingWorkspaceState
```typescript
export interface OnboardingWorkspaceState {
  posture: WorkspaceReadinessPosture
  readinessScore: number
  totalBlockers: number
  criticalBlockers: number
  staleStages: number
  allStagesComplete: boolean
}
```

### Key Functions
| Function | Purpose |
|----------|---------|
| `buildReadinessHeadline(posture, blockerCount)` | Generate headline text for readiness |
| `buildReadinessRationale(stages)` | Generate explanation of current readiness state |
| `deriveQueueHealth(cases)` | Calculate onboarding queue metrics |
| `applyQueueFilter(cases, filter)` | Filter cases by status/severity/waiting time |
| `sortCases(cases, sortKey)` | Sort by priority, lastUpdated, waitingDays, or stage |
| `deriveCaseNextAction(stage)` | Determine next action for a case |
| `deriveDegradedState(apiError)` | Handle degraded/error state |

### Mock Fixtures
```typescript
MOCK_ONBOARDING_STAGES_READY: OnboardingStage[]       // All complete
MOCK_ONBOARDING_STAGES_BLOCKED: OnboardingStage[]     // Critical blockers
MOCK_ONBOARDING_STAGES_PARTIAL: OnboardingStage[]     // Mixed states
MOCK_ONBOARDING_STAGES_STALE: OnboardingStage[]       // Stale evidence
```

---

## 3. Release Readiness Utility

### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/src/utils/releaseReadiness.ts` (41,946 bytes)
- **Route**: `/compliance/release` (Release Evidence Center)

### Sign-Off Readiness State
```typescript
export type SignOffReadinessState =
  | 'ready'
  | 'stale_evidence'
  | 'missing_evidence'
  | 'configuration_blocked'
  | 'advisory_follow_up'

export function isSignOffBlocking(state: SignOffReadinessState): boolean
export function isSignOffClear(state: SignOffReadinessState): boolean
```

### Evidence Dimension
```typescript
export interface EvidenceDimension {
  id: string
  title: string
  description: string
  state: SignOffReadinessState
  isLaunchCritical: boolean
  lastEvidenceAt: string | null
  freshnessLabel: string
  ownerDomain: OwnerDomain
  nextActionSummary: string
  evidencePath: string | null
}
```

---

## 4. Approval Cockpit

### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/src/utils/approvalCockpit.ts` (23,627 bytes)
- **View**: `/home/runner/work/biatec-tokens/biatec-tokens/src/views/EnterpriseApprovalCockpit.vue`
- **Route**: `/compliance/approval` (Enterprise Approval Queue)

### Reviewer Roles
```typescript
export type ReviewerRole =
  | 'compliance_operator'
  | 'legal_reviewer'
  | 'procurement_reviewer'
  | 'executive_sponsor'
```

### Approval Stage Status
```typescript
export type ApprovalStageStatus =
  | 'not_started'
  | 'ready_for_review'
  | 'in_review'
  | 'needs_attention'
  | 'conditionally_approved'
  | 'approved'
  | 'blocked'

export function isBlockingStatus(status: ApprovalStageStatus): boolean
export function isSignedOff(status: ApprovalStageStatus): boolean
```

### Blocker Severity
```typescript
export type BlockerSeverity = 'critical' | 'high' | 'medium' | 'informational'

export interface StageBlocker {
  id: string
  severity: BlockerSeverity
  title: string
  reason: string
  action: string
  evidencePath: string | null
  isLaunchBlocking: boolean
  staleSince: string | null
}
```

### ApprovalStage
```typescript
export interface ApprovalStage {
  id: string
  label: string
  role: ReviewerRole
  status: ApprovalStageStatus
  summary: string
  blockers: StageBlocker[]
  reviewScope: string
  lastActionAt: string | null
  dueAt: string | null
  evidenceLinks: Array<{ label: string; path: string }>
  conditions: string | null
}
```

### Release Posture
```typescript
export type ReleasePosture = 'ready' | 'conditionally_ready' | 'not_ready'
```

---

## 5. Remediation Workflow

### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/src/utils/remediationWorkflow.ts` (19,787 bytes)

### Owner Domains
```typescript
export type OwnerDomain =
  | 'compliance'
  | 'legal'
  | 'procurement'
  | 'executive'
  | 'shared_ops'
  | 'unassigned'

export const ROLE_TO_DOMAIN: Record<ReviewerRole, OwnerDomain> = {
  compliance_operator: 'compliance',
  legal_reviewer: 'legal',
  procurement_reviewer: 'procurement',
  executive_sponsor: 'executive',
}
```

### Remediation Urgency
```typescript
export type RemediationUrgency = 'critical' | 'high' | 'medium' | 'advisory'
```

### Evidence Freshness
```typescript
export type EvidenceFreshness = 'fresh' | 'stale' | 'missing'

export const EVIDENCE_FRESHNESS_LABELS: Record<EvidenceFreshness, string>
export const EVIDENCE_FRESHNESS_EXPLANATIONS: Record<EvidenceFreshness, string>
```

### Handoff State
```typescript
export type HandoffState =
  | 'no_handoff'
  | 'waiting_on_compliance'
  | 'waiting_on_legal'
  | 'waiting_on_procurement'
  | 'waiting_on_executive'
  | 'waiting_on_shared_ops'
  | 'waiting_on_multiple'
```

### RemediationTask
```typescript
export interface RemediationTask {
  id: string
  stageId: string
  title: string
  description: string
  actionSummary: string
  impactStatement: string
  ownerDomain: OwnerDomain
  urgency: RemediationUrgency
  isLaunchBlocking: boolean
}
```

---

## 6. Compliance Evidence Pack

### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/src/utils/complianceEvidencePack.ts` (3,127 bytes)
- **View**: `/home/runner/work/biatec-tokens/biatec-tokens/src/views/ComplianceEvidencePackView.vue`
- **Route**: `/compliance/evidence`

### Types
```typescript
export type EvidenceStatus = 'ready' | 'warning' | 'failed' | 'pending' | 'unavailable'

export interface EvidenceSection {
  id: string
  title: string
  status: EvidenceStatus
  releaseGrade: boolean
  summary: string
  details: string[]
  timestamp: string | null
  actionLabel: string | null
  actionPath: string | null
}

export interface ComplianceReportBundle {
  generatedAt: string
  launchName: string | null
  overallStatus: EvidenceStatus
  readinessScore: number
  jurisdiction: JurisdictionSummary
  kycAml: KYCAMLSummary
  whitelist: WhitelistSummary
  investorEligibility: InvestorEligibilitySummary
  evidenceSections: EvidenceSection[]
  exportVersion: '1.0'
}
```

---

## 7. Compliance Reporting Workspace

### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/src/utils/complianceReportingWorkspace.ts` (24,698 bytes)
- **View**: `/home/runner/work/biatec-tokens/biatec-tokens/src/views/ComplianceReportingWorkspace.vue` (77,030 bytes)
- **Route**: `/compliance/reporting`

### Audience Presets
```typescript
export type AudiencePreset = 'all' | 'compliance' | 'procurement' | 'executive'

export const AUDIENCE_PRESET_LABELS: Record<AudiencePreset, string>
export const AUDIENCE_PRESET_DESCRIPTIONS: Record<AudiencePreset, string>
export const AUDIENCE_SECTION_PRIORITIES: Record<AudiencePreset, string[]>
```

### Approval History
```typescript
export type ApprovalOutcome = 'approved' | 'conditionally_approved' | 'blocked' | 'pending' | 'not_started'

export interface ApprovalHistoryEntry {
  id: string
  label: string
  reviewerRole: string
  outcome: ApprovalOutcome
  actionedAt: string | null
  conditions: string | null
  summary: string
  isLaunchBlocking: boolean
}

export interface ApprovalHistorySummary {
  totalStages: number
  approvedCount: number
  conditionalCount: number
  blockedCount: number
  pendingCount: number
  allLaunchCriticalSigned: boolean
  entries: ApprovalHistoryEntry[]
  lastActionAt: string | null
}
```

---

## 8. Router Configuration

### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/src/router/index.ts` (406 lines)

### Compliance Routes
```typescript
// Route                          | Name                            | Component                        | Auth Required
/compliance/:id?                  | ComplianceDashboard             | ComplianceDashboard              | Yes
/compliance/orchestration         | ComplianceOrchestration         | ComplianceOrchestrationView      | Yes
/compliance/setup                 | ComplianceSetupWorkspace        | ComplianceSetupWorkspace         | Yes
/compliance/launch                | ComplianceLaunchConsole         | ComplianceLaunchConsole          | Yes
/compliance/evidence              | ComplianceEvidencePack          | ComplianceEvidencePackView       | Yes
/compliance/release               | ReleaseEvidenceCenter           | ReleaseEvidenceCenterView        | Yes
/compliance/reporting             | ComplianceReportingWorkspace    | ComplianceReportingWorkspace     | Yes
/compliance/risk-report           | EnterpriseRiskReportBuilder     | EnterpriseRiskReportBuilder      | Yes
/compliance/approval              | EnterpriseApprovalCockpit       | EnterpriseApprovalCockpit        | Yes
/compliance/onboarding            | InvestorComplianceOnboarding    | InvestorComplianceOnboardingWorkspace | Yes
/compliance/operations            | ComplianceOperationsCockpit     | ComplianceOperationsCockpit      | Yes
/compliance/reporting-center      | ReportingCommandCenter          | ReportingCommandCenterView       | Yes
```

### Authentication Guard
- All compliance routes require `requiresAuth: true` meta flag
- Uses email/password (ARC76) authentication, no wallet connectors
- Uses `algorand_user` localStorage key for session
- Structural session validation via `isIssuanceSessionValid()` for issuance routes

---

## 9. Sidebar Navigation

### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/src/components/layout/Sidebar.vue` (250+ lines)

### Compliance Navigation Links
```
Quick Actions Section:
├── Release Evidence (icon: ClipboardDocumentCheckIcon) → /compliance/evidence
├── Sign-off Readiness (icon: ShieldCheckIcon) → /compliance/release
├── Investor Onboarding (icon: UsersIcon) → /compliance/onboarding
├── Compliance Reporting (icon: ClipboardDocumentListIcon) → /compliance/reporting
├── Risk Report Builder (icon: ShieldExclamationIcon) → /compliance/risk-report
├── Approval Queue (icon: ClipboardDocumentListIcon) → /compliance/approval
├── Operations Cockpit (icon: ChartBarSquareIcon) → /compliance/operations
├── Compliance Monitoring (icon: ShieldCheckIcon) → /compliance-monitoring
├── Whitelist Management (icon: UsersIcon) → /compliance/whitelists
└── Reporting Center (icon: CalendarDaysIcon) → /compliance/reporting-center
```

### WCAG Compliance
- Uses `aria-current="page"` for active routes
- Focus-visible rings on all interactive links
- Dark mode support with `dark:` prefixes
- Active link styling with blue highlights

---

## 10. E2E Test Files

### Location
Test files in `/home/runner/work/biatec-tokens/biatec-tokens/e2e/`:

| Test File | Purpose |
|-----------|---------|
| `compliance-operations-cockpit.spec.ts` | E2E tests for operations cockpit (12 acceptance criteria) |
| `compliance-setup-workspace.spec.ts` | E2E for setup workspace |
| `enterprise-approval-cockpit.spec.ts` | E2E for approval queue |
| `investor-compliance-onboarding.spec.ts` | E2E for investor onboarding workspace |
| `compliance-evidence-pack.spec.ts` | E2E for evidence pack view |
| `compliance-reporting-workspace.spec.ts` | E2E for reporting workspace |
| `compliance-delivery-slice.spec.ts` | E2E for delivery slice |
| `compliance-orchestration.spec.ts` | E2E for orchestration view |
| `compliance-dashboard.spec.ts` | E2E for compliance dashboard |
| `compliance-launch-console.spec.ts` | E2E for launch console |
| `compliance-auth-first.spec.ts` | E2E for auth-first flow |
| `enterprise-compliance-workspace-journeys.spec.ts` | E2E for workspace journey flows |
| `live-compliance-integration.spec.ts` | E2E for live integration tests |
| `lifecycle-cockpit.spec.ts` | E2E for lifecycle cockpit |

### Compliance Operations Cockpit E2E (AC #1-#12)
```typescript
// AC #1 — Reachability
route /compliance/operations is accessible when authenticated

// AC #2 — Queue Health Panel
queue health panel shows totals, overdue, blocked, approval-ready counts

// AC #3 — Worklist Panel & Persona Filtering
worklist renders work items with ownership, urgency, stage badges
filter select updates visible worklist by operator role

// AC #4 — Bottleneck Analysis
bottleneck panel shows stage-level concentration

// AC #5 — Handoff Readiness & Role Summaries
handoff panel links to onboarding, approval, reporting workspaces
role-aware summaries for compliance manager, ops lead, executive

// AC #6 — Degraded State
degraded alert shown on data errors (fail-closed)

// AC #7-#8 — Refresh Control
refresh button triggers data reload

// AC #9 — No Wallet UI
no wallet connector UI (email/password only)

// AC #10 — Auth Required
unauthenticated users are redirected to home

// AC #11 — Accessibility
ARIA landmarks, headings, keyboard navigation (WCAG compliant)

// AC #12 — Sidebar Integration
sidebar link "Operations Cockpit" navigates to workspace
```

---

## 11. E2E Test Helpers

### Location
- **File**: `/home/runner/work/biatec-tokens/biatec-tokens/e2e/helpers/auth.ts`

### Session Contract
```typescript
export interface ARC76SessionContract {
  address: string        // Non-empty ARC76-derived address
  email: string          // User email for account derivation
  isConnected: boolean   // Must be true for issuance route access
}

export interface AuthUser extends ARC76SessionContract {
  name?: string
  provisioningStatus?: string
  canDeploy?: boolean
}

export interface SessionValidationResult {
  valid: boolean
  errors: string[]
}
```

### Key Helper Functions
```typescript
// Permissive (CI default): seeds validated localStorage session
withAuth(page): Promise<void>
loginWithCredentials(page, email, password): Promise<void>

// Strict (sign-off lane): real backend auth, fails if unavailable
loginWithCredentialsStrict(page, email, password): Promise<void>

// Utility functions
suppressBrowserErrors(page): void
setupAuthAndNavigate(page, path): Promise<void>
clearAuthScript(page): Promise<void>
```

### Authentication Strategy
- **Tier 1 (Permissive)**: Seeds validated localStorage session
- **Tier 2 (Strict)**: Requires backend `POST /api/auth/login`
- Validates session against ARC76 contract before seeding
- Falls back to seeding if backend unavailable (unless strict mode)

---

## 12. Directory Listings

### src/utils/ Contents (81 files)
Key compliance-related utilities:
- `complianceOperationsCockpit.ts` — Operations cockpit logic
- `investorComplianceOnboarding.ts` — Investor onboarding logic
- `releaseReadiness.ts` — Sign-off readiness assessment
- `approvalCockpit.ts` — Approval workflow logic
- `remediationWorkflow.ts` — Remediation task management
- `complianceEvidencePack.ts` — Evidence pack types
- `complianceReportingWorkspace.ts` — Reporting workspace logic
- `complianceCaseNormalizer.ts` — Case normalization
- `complianceDeliverySlice.ts` — Delivery slice logic
- `complianceLaunchReadiness.ts` — Launch readiness
- `compliance.ts` — Core compliance types
- `complianceStatus.ts` — Status derivation
- And 69+ other utilities for token creation, analytics, validation, etc.

### src/views/ Contents (52 items)
Key compliance-related views:
- `ComplianceOperationsCockpit.vue` — Operations cockpit UI
- `InvestorComplianceOnboardingWorkspace.vue` — Investor onboarding UI
- `EnterpriseApprovalCockpit.vue` — Approval queue UI
- `ComplianceEvidencePackView.vue` — Evidence pack UI
- `ComplianceReportingWorkspace.vue` — Reporting workspace UI
- `ComplianceLaunchConsole.vue` — Launch console UI
- `ComplianceSetupWorkspace.vue` — Setup workspace UI
- `ComplianceDashboard.vue` — Compliance dashboard
- `ComplianceMonitoringDashboard.vue` — Monitoring dashboard
- `ComplianceOrchestrationView.vue` — Orchestration view
- `EnterpriseRiskReportBuilder.vue` — Risk reporting UI
- `ReleaseEvidenceCenterView.vue` — Release evidence center UI
- `ReportingCommandCenterView.vue` — Reporting command center UI
- And 39+ other views for token creation, onboarding, etc.

---

## 13. Key Architecture Principles

### Design Patterns
1. **Fail-Closed**: Absent data treated as degraded, not optimistic
2. **Backend-Ready**: All interfaces can be hydrated from API responses
3. **No Wallet Assumptions**: Enterprise/compliance-oriented language throughout
4. **Role-Aware**: Different views and filters for compliance_analyst, operations_lead, sign_off_approver, team_lead
5. **Type-Safe**: Full TypeScript coverage with comprehensive interfaces
6. **Accessibility-First**: WCAG 2.4.1+ compliant with ARIA landmarks and keyboard navigation
7. **Deterministic Testing**: Mock fixtures use fixed timestamps for reproducible CI tests

### State Management
- Reactive Vue 3 Composition API with `ref<>` and `computed<>`
- Derived state functions for metrics, posture, readiness
- Frontend-derived state when backend unavailable (degraded mode)

### UI/UX Patterns
- **Posture Banner**: Overall queue health at-a-glance
- **Role Summary Cards**: Persona-specific metrics and action prompts
- **Persona Selector Tabs**: Filter by operator role perspective
- **Worklist Rows**: Work items with ownership, urgency, stage badges
- **Bottleneck Panel**: Stage concentration analysis
- **Handoff Cards**: Downstream readiness with blocker/warning counts
- **Aging Analysis**: Items grouped by inactivity duration (fresh/aging/stale/critical)

### Testing Strategy
- E2E tests cover 12+ acceptance criteria per major component
- Mock data deterministic (fixed ISO timestamps)
- Auth helpers with permissive/strict tiers
- Test IDs throughout for reliable element selection
- WCAG accessibility assertions in E2E tests

---

## 14. Key Integration Points

### Workspace Flow
```
ComplianceOperationsCockpit
  ├─ Routes items to → InvestorComplianceOnboardingWorkspace (/compliance/onboarding)
  ├─ Routes items to → EnterpriseApprovalCockpit (/compliance/approval)
  └─ Routes items to → ComplianceReportingWorkspace (/compliance/reporting)

InvestorComplianceOnboardingWorkspace
  ├─ Stages: intake → documentation → KYC/AML → jurisdiction → evidence → approval_handoff
  └─ Hands off to → EnterpriseApprovalCockpit

EnterpriseApprovalCockpit
  ├─ Reviews prepared by → InvestorComplianceOnboardingWorkspace
  ├─ Stages: compliance_operator → legal_reviewer → procurement_reviewer → executive_sponsor
  ├─ May trigger → RemediationWorkflow (for blockers)
  └─ Final sign-off enables → ComplianceReportingWorkspace

ComplianceReportingWorkspace
  ├─ Generates audience-specific reports: all, compliance, procurement, executive
  ├─ Exports compliance packages
  └─ Integrates evidence from → ComplianceEvidencePackView

ComplianceEvidencePackView
  └─ Displays evidence from all upstream stages
```

### Data Flow
1. **Intake** → ComplianceOperationsCockpit detects new work items
2. **Onboarding** → InvestorComplianceOnboardingWorkspace processes KYC/AML
3. **Handoff** → Operations cockpit recognizes approval_ready items
4. **Approval** → EnterpriseApprovalCockpit stages for sign-off
5. **Resolution** → RemediationWorkflow escalates blockers
6. **Reporting** → ComplianceReportingWorkspace exports final evidence
7. **Release** → ReleaseReadiness validates sign-off readiness

---

## Summary Table

| Component | Lines | Type | Route | Purpose |
|-----------|-------|------|-------|---------|
| ComplianceOperationsCockpit.ts | 1,111 | Utility | — | Queue health, SLA, ownership, handoff logic |
| ComplianceOperationsCockpit.vue | 935 | View | /compliance/operations | Operations cockpit UI |
| InvestorComplianceOnboarding.ts | 1,116 | Utility | — | Onboarding stages, KYC/AML, blockers |
| InvestorComplianceOnboardingWorkspace.vue | 50,668 | View | /compliance/onboarding | Investor onboarding UI |
| ReleaseReadiness.ts | ~42KB | Utility | — | Sign-off readiness assessment |
| ApprovalCockpit.ts | 23,627 | Utility | — | Approval stages, reviewer roles, blockers |
| EnterpriseApprovalCockpit.vue | 40,208 | View | /compliance/approval | Approval queue UI |
| RemediationWorkflow.ts | 19,787 | Utility | — | Remediation tasks, urgency, ownership |
| ComplianceEvidencePack.ts | 3,127 | Utility | — | Evidence pack types |
| ComplianceEvidencePackView.vue | 38,479 | View | /compliance/evidence | Evidence pack UI |
| ComplianceReportingWorkspace.ts | 24,698 | Utility | — | Audience presets, approval history |
| ComplianceReportingWorkspace.vue | 77,030 | View | /compliance/reporting | Reporting workspace UI |

___BEGIN___COMMAND_DONE_MARKER___0
