# Compliance Documentation Index

This index summarizes the compliance-related exploration and documentation for the biatec-tokens repository. All documentation is located in the repository root unless otherwise noted.

## 📚 Documentation Files

### 1. **COMPLIANCE_EXPLORATION_SUMMARY.md** (45 KB, 1,246 lines)
**Comprehensive Technical Deep-Dive**

The most detailed reference covering all 14 sections of compliance infrastructure:

- **Section 1**: Compliance Operations Cockpit structure with full type definitions
- **Section 2**: Investor Compliance Onboarding workspace (7 stages)
- **Section 3**: Release Readiness utility (sign-off assessment)
- **Section 4**: Approval Cockpit (4 reviewer stages)
- **Section 5**: Remediation Workflow (cross-domain handoffs)
- **Section 6**: Compliance Evidence Pack
- **Section 7**: Compliance Reporting Workspace (audience presets)
- **Section 8**: Router configuration (12 compliance routes)
- **Section 9**: Sidebar navigation (10 compliance links)
- **Section 10**: E2E test files (14 test suites)
- **Section 11**: E2E test helpers and authentication
- **Section 12**: Directory listings (81 utils, 52 views)
- **Section 13**: Architecture principles and patterns
- **Section 14**: Integration points and data flow

**Use when**: You need complete technical details, type definitions, interfaces, or architecture understanding.

---

### 2. **COMPLIANCE_QUICK_REFERENCE.md** (16 KB)
**Fast Lookup Tables & Checklists**

Organized for rapid reference during development:

- File locations & line counts for all compliance utilities & views
- Route table (path → component → purpose)
- Sidebar navigation map
- E2E test files quick list
- Test IDs for Playwright selectors
- Key enumerations (roles, statuses, urgency levels)
- Mock data locations
- Authentication contract & helpers
- WCAG accessibility checklist
- Integration pattern diagram
- Backend API integration points

**Use when**: You need quick facts, want to find a specific route, need test IDs, or want to understand the authentication model.

---

## 🗂️ Source Code Organization

### Core Compliance Utilities (src/utils/)

| File | Lines | Purpose |
|------|-------|---------|
| **complianceOperationsCockpit.ts** | 1,111 | Central operations hub: queue health, SLA, ownership, role-aware summaries |
| **investorComplianceOnboarding.ts** | 1,116 | Investor onboarding: 7 stages, KYC/AML, blockers |
| **releaseReadiness.ts** | 42 KB | Sign-off readiness: evidence dimensions, launch-critical assessment |
| **approvalCockpit.ts** | 23.6 KB | Approval workflow: 4 reviewer stages, blockers, conditions |
| **remediationWorkflow.ts** | 19.8 KB | Remediation tasks: urgency, owner domains, handoff states |
| **complianceEvidencePack.ts** | 3.1 KB | Evidence types: status, sections, release-grade marking |
| **complianceReportingWorkspace.ts** | 24.7 KB | Reporting: audience presets, approval history, export readiness |
| **complianceCaseNormalizer.ts** | 30.2 KB | Case normalization & data transformation |
| **complianceDeliverySlice.ts** | 14.5 KB | Delivery state management |
| **complianceLaunchReadiness.ts** | 13.4 KB | Launch readiness assessment |
| **compliance.ts** | 1.5 KB | Core compliance types |

### Compliance Views (src/views/)

| File | Lines | Purpose |
|------|-------|---------|
| **ComplianceOperationsCockpit.vue** | 935 | [NEW] Operations cockpit UI with 6 panels |
| **InvestorComplianceOnboardingWorkspace.vue** | 50,668 | Investor onboarding UI (7-stage progression) |
| **EnterpriseApprovalCockpit.vue** | 40,208 | Approval queue UI (4 reviewer stages) |
| **ComplianceEvidencePackView.vue** | 38,479 | Evidence pack UI with status indicators |
| **ComplianceReportingWorkspace.vue** | 77,030 | Reporting workspace with audience presets |
| **ComplianceLaunchConsole.vue** | 25,870 | Launch orchestration console |
| **ComplianceSetupWorkspace.vue** | 16,127 | Setup & configuration workspace |
| **ComplianceDashboard.vue** | 14,558 | Main compliance dashboard |
| **ComplianceMonitoringDashboard.vue** | 23,500 | Real-time compliance monitoring |
| **ComplianceOrchestrationView.vue** | 18,653 | Orchestration view |
| **EnterpriseRiskReportBuilder.vue** | 40,670 | Custom risk report builder |
| **ReleaseEvidenceCenterView.vue** | 12,015+ | Release evidence center UI |
| **ReportingCommandCenterView.vue** | 12,269+ | Reporting command center UI |

### Router & Navigation

| File | Lines | Contains |
|------|-------|----------|
| **src/router/index.ts** | 406 | 12 compliance routes, auth guards |
| **src/components/layout/Sidebar.vue** | 250+ | 10 compliance navigation links |

### E2E Tests (e2e/)

| Test File | Focus |
|-----------|-------|
| **compliance-operations-cockpit.spec.ts** | [PRIMARY] 12 acceptance criteria (AC #1-#12) |
| **compliance-setup-workspace.spec.ts** | Setup workspace E2E |
| **enterprise-approval-cockpit.spec.ts** | Approval queue workflows |
| **investor-compliance-onboarding.spec.ts** | Onboarding journeys |
| **compliance-evidence-pack.spec.ts** | Evidence pack functionality |
| **compliance-reporting-workspace.spec.ts** | Report generation |
| **compliance-delivery-slice.spec.ts** | Delivery state slice |
| **compliance-orchestration.spec.ts** | Orchestration workflows |
| **compliance-dashboard.spec.ts** | Dashboard functionality |
| **compliance-launch-console.spec.ts** | Launch console workflows |
| **compliance-auth-first.spec.ts** | Auth-first issuance flow |
| **enterprise-compliance-workspace-journeys.spec.ts** | Multi-workspace journeys |
| **live-compliance-integration.spec.ts** | Live backend integration |
| **lifecycle-cockpit.spec.ts** | Token lifecycle cockpit |

### Test Helpers (e2e/)

| File | Contains |
|------|----------|
| **e2e/helpers/auth.ts** | ARC76SessionContract, authentication helpers, session validation |

---

## 🎯 Key Compliance Routes

All routes require authentication (`meta: { requiresAuth: true }`):

```
GET /compliance/operations                  → ComplianceOperationsCockpit [NEW]
GET /compliance/onboarding                  → InvestorComplianceOnboardingWorkspace
GET /compliance/approval                    → EnterpriseApprovalCockpit
GET /compliance/evidence                    → ComplianceEvidencePackView
GET /compliance/release                     → ReleaseEvidenceCenterView
GET /compliance/reporting                   → ComplianceReportingWorkspace
GET /compliance/risk-report                 → EnterpriseRiskReportBuilder
GET /compliance-monitoring                  → ComplianceMonitoringDashboard
GET /compliance/whitelists                  → WhitelistsView
GET /compliance/reporting-center            → ReportingCommandCenterView
```

---

## 🔑 Key Types & Enumerations

### Operator Roles (for worklist filtering)
- `compliance_analyst` — Personal assignments + overdue/pending items
- `operations_lead` — Unassigned items, bottlenecks, workload distribution
- `sign_off_approver` — Approval-ready items + launch-blocking cases
- `team_lead` — Escalated items, blocked work, aging items

### Ownership States
- `assigned_to_me`, `assigned_to_team`, `unassigned`, `blocked_by_external`, `escalated`

### SLA Urgency
- `overdue` (missed deadline), `due_soon` (within 24h), `on_track` (in window), `no_deadline`

### Work Item Status
- `open`, `in_progress`, `pending_review`, `blocked`, `approval_ready`, `overdue`, `escalated`, `complete`

### Workflow Stages (6 stages, in order)
1. `onboarding` — Investor intake
2. `document_review` — Document validation
3. `kyc_aml` — KYC/AML screening
4. `remediation` — Fix blockers
5. `approval` — Multi-stage sign-off
6. `reporting` — Export & audit trail

### Cockpit Posture
- `clear` — All healthy
- `attention_required` — Some items need attention
- `critical` — Launch-blocking issues
- `degraded` — System error, fail-closed

### Aging Buckets
- `fresh` (< 7 days), `aging` (7-14 days), `stale` (14-30 days), `critical` (> 30 days)

---

## 🧪 E2E Test Coverage

### Compliance Operations Cockpit (12 Acceptance Criteria)

| AC # | Criterion | Test File |
|------|-----------|-----------|
| #1 | Route reachability & page structure | compliance-operations-cockpit.spec.ts |
| #2 | Queue health panel (totals, overdue, blocked) | compliance-operations-cockpit.spec.ts |
| #3 | Worklist filtering by operator role | compliance-operations-cockpit.spec.ts |
| #4 | Stage bottleneck analysis | compliance-operations-cockpit.spec.ts |
| #5 | Handoff readiness + role-aware summaries | compliance-operations-cockpit.spec.ts |
| #6 | Degraded state alert on errors | compliance-operations-cockpit.spec.ts |
| #7 | Filter select updates worklist | compliance-operations-cockpit.spec.ts |
| #8 | Refresh button triggers reload | compliance-operations-cockpit.spec.ts |
| #9 | No wallet UI (email/password only) | compliance-operations-cockpit.spec.ts |
| #10 | Auth-required redirect | compliance-operations-cockpit.spec.ts |
| #11 | WCAG accessibility | compliance-operations-cockpit.spec.ts |
| #12 | Sidebar integration | compliance-operations-cockpit.spec.ts |

### Playwright Test IDs (30+ selectors)

Essential test IDs for E2E element selection:
- `compliance-operations-cockpit` — Root container
- `cockpit-ops-heading`, `cockpit-posture-banner`, `cockpit-posture-label`
- `queue-health-panel`, `health-total`, `health-overdue`, `health-blocked`
- `worklist-panel`, `work-item-row`, `bottleneck-panel`
- `role-summary-panel`, `role-summary-card`, `persona-selector`
- `aging-analysis-panel`, `degraded-alert`, `cockpit-refresh-btn`

See **COMPLIANCE_QUICK_REFERENCE.md** for complete list.

---

## 🔐 Authentication

### Model
- **Type**: ARC76 email/password (no wallet connectors)
- **Session Key**: `algorand_user` (localStorage)
- **Session Contract**: `{ address, email, isConnected }`

### E2E Auth Helpers
- `withAuth(page)` — Permissive: seeds localStorage (default CI)
- `loginWithCredentials(page, email, password)` — Try backend, fall back to seeding
- `loginWithCredentialsStrict(page, email, password)` — Strict: requires backend
- `suppressBrowserErrors(page)` — Suppress console warnings

---

## ♿ Accessibility

### WCAG 2.4.1+ Compliance
- ✓ Skip links to main content
- ✓ ARIA landmarks (main, nav) with labels
- ✓ `aria-current="page"` on active routes
- ✓ Focus-visible rings on interactive elements
- ✓ Semantic heading hierarchy (h1 → h3)
- ✓ Dark mode support (Tailwind `dark:` prefixes)
- ✓ Keyboard navigation throughout

---

## 🔄 Integration Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE OPERATIONS COCKPIT                │
│     [Central Hub] Route: /compliance/operations                 │
│     • Queue health & SLA monitoring                             │
│     • Role-aware task assignment & filtering                    │
│     • Workflow handoff coordination                             │
└─────────────────────────────────────────────────────────────────┘
           │                    │                       │
           ▼                    ▼                       ▼
    ┌─────────────┐     ┌──────────────────┐   ┌─────────────────┐
    │ Onboarding  │     │ Approval Queue   │   │    Reporting    │
    │  Workspace  │     │    Cockpit       │   │   Workspace     │
    │             │     │                  │   │                 │
    │ KYC/AML     │────▶│ 4-stage sign-off │──▶│ Export packages │
    │ Remediation │     │ Legal/Proc/Exec  │   │ Audit trail     │
    └─────────────┘     └──────────────────┘   └─────────────────┘
         ▲                     ▲                        ▲
         │                     │                        │
         └─────────────────────┼────────────────────────┘
                    Evidence Pack
                    Release Readiness
```

---

## 📊 File Statistics

| Category | Count | Details |
|----------|-------|---------|
| **Compliance Utilities** | 11 | In src/utils/ (81 total) |
| **Compliance Views** | 13 | In src/views/ (52 total) |
| **E2E Test Suites** | 14 | Compliance-focused tests |
| **Routes** | 12 | All with auth required |
| **Sidebar Links** | 10 | In Quick Actions section |
| **Test IDs** | 30+ | In operations cockpit |
| **Types/Interfaces** | 100+ | Across all utilities |
| **Mock Fixtures** | 8+ | Deterministic test data |

---

## 🚀 Getting Started

### For Understanding the Architecture
1. Read **COMPLIANCE_QUICK_REFERENCE.md** for an overview
2. Review the integration pattern above
3. Check router configuration in `src/router/index.ts` (lines 212-217)

### For Development
1. Start with **COMPLIANCE_EXPLORATION_SUMMARY.md** Section 1 (Operations Cockpit)
2. Review type definitions in `src/utils/complianceOperationsCockpit.ts`
3. Examine Vue component in `src/views/ComplianceOperationsCockpit.vue`
4. Run E2E tests: `npm run test:e2e -- compliance-operations-cockpit.spec.ts`

### For Testing
1. Review test helpers in `e2e/helpers/auth.ts`
2. Check acceptance criteria in `e2e/compliance-operations-cockpit.spec.ts`
3. Use test IDs from **COMPLIANCE_QUICK_REFERENCE.md**
4. Run: `npm run test:e2e`

### For Backend Integration
1. All types in utilities are backend-ready (annotated with "hydrate from API")
2. Replace mock data (`MOCK_WORK_ITEMS_*`) with API calls
3. Update auth in `e2e/helpers/auth.ts` to use real backend endpoint
4. See Backend Integration Points in **COMPLIANCE_QUICK_REFERENCE.md**

---

## 📖 Additional Documentation

### In Repository Root
- `COMPLIANCE_DASHBOARD_IMPLEMENTATION.md` — Legacy dashboard reference
- `COMPLIANCE_SETUP_WORKSPACE_E2E_COMPLETE.md` — Setup workspace E2E details

### In Source Code
- All .ts/.vue files have inline JSDoc comments and type definitions
- Test files have acceptance criteria comments
- Mock data has deterministic timestamps (2026-03-16T10:00:00Z)

---

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| Operations Cockpit Utility | `src/utils/complianceOperationsCockpit.ts` |
| Operations Cockpit UI | `src/views/ComplianceOperationsCockpit.vue` |
| Onboarding Utility | `src/utils/investorComplianceOnboarding.ts` |
| Router Config | `src/router/index.ts` (lines 38-41, 212-217) |
| Sidebar Nav | `src/components/layout/Sidebar.vue` (lines 147-157) |
| E2E Tests | `e2e/compliance-*.spec.ts` |
| Auth Helpers | `e2e/helpers/auth.ts` |

---

**Last Updated**: March 17, 2026  
**Documentation Version**: 1.0  
**Status**: Complete ✓

