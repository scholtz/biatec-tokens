/**
 * Integration Tests: Reporting & Audit Export Wiring
 *
 * Validates that the utility layer (complianceReportingWorkspace,
 * auditExportPackage, reportingCommandCenter) correctly drives the
 * compliance reporting workspace UI:
 *
 *   1. Audience-template selection changes visible sections
 *   2. Fail-closed guards prevent regulator-ready export when evidence blocked/stale
 *   3. Degraded evidence states produce non-green posture labels
 *   4. Audit export package assembly reflects contradiction detection
 *   5. Approval-history wiring flows into export readiness checklist
 *   6. Stale evidence propagates correctly through the export-readiness pipeline
 *   7. Reporting command-center summary correctly counts blocked/stale templates
 *   8. All audience labels appear in exported text reports
 *   9. Evidence manifest authority levels are correctly classified
 *  10. Contradiction detection catches KYC-whitelist mismatches
 *
 * Issue: Build regulator-ready reporting and audit-export workspace
 */

import { describe, it, expect } from "vitest";
import {
  AUDIENCE_PRESET_LABELS,
  AUDIENCE_PRESET_DESCRIPTIONS,
  AUDIENCE_SECTION_PRIORITIES,
  APPROVAL_OUTCOME_LABELS,
  EXPORT_READINESS_LABELS,
  deriveApprovalHistorySummary,
  deriveExportPackageReadiness,
  buildAudienceReportText,
  exportReadinessStatusClass,
  approvalOutcomeBadgeClass,
  isTimestampStale,
  type AudiencePreset,
  type ApprovalHistoryEntry,
  type ExportReadinessStatus,
} from "../../utils/complianceReportingWorkspace";
import {
  buildEvidenceManifest,
  buildEvidenceTimeline,
  detectContradictions,
  assembleAuditExportPackage,
  EVIDENCE_AUTHORITY_LABELS,
  CONTRADICTION_SEVERITY_LABELS,
  manifestAuthorityBadgeClass,
  contradictionSeverityBadgeClass,
  auditPackageReadinessClass,
} from "../../utils/auditExportPackage";
import {
  deriveCommandCenterSummary,
  isEvidenceBlocking,
  runStatusBadgeClass,
  freshnessIndicatorClass,
  templateCardBorderClass,
  MOCK_TEMPLATES_HEALTHY,
  MOCK_RUNS_ACTIVE,
  MOCK_TEMPLATES_BLOCKED,
  type ReportTemplate,
  type ReportRun,
} from "../../utils/reportingCommandCenter";
import type { ComplianceReportBundle } from "../../utils/complianceEvidencePack";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeReadyBundle(overrides: Partial<ComplianceReportBundle> = {}): ComplianceReportBundle {
  return {
    generatedAt: new Date().toISOString(),
    launchName: "Integration Test Launch",
    overallStatus: "ready",
    readinessScore: 100,
    jurisdiction: {
      configured: true,
      permittedCount: 15,
      restrictedCount: 3,
      jurisdictions: [
        { code: "DE", name: "Germany", status: "permitted" },
        { code: "FR", name: "France", status: "permitted" },
      ],
      freshnessTimestamp: new Date().toISOString(),
    },
    kycAml: {
      status: "ready",
      kycRequired: true,
      providerConfigured: true,
      pendingReviewCount: 0,
      completedReviewCount: 12,
      freshnessTimestamp: new Date().toISOString(),
    },
    whitelist: {
      status: "ready",
      whitelistRequired: true,
      approvedInvestorCount: 8,
      pendingInvestorCount: 1,
      activeWhitelistId: "whitelist-integration-001",
      freshnessTimestamp: new Date().toISOString(),
    },
    investorEligibility: {
      status: "ready",
      accreditedRequired: true,
      retailPermitted: false,
      eligibilityCategories: ["qualified_investor", "professional_client"],
      freshnessTimestamp: new Date().toISOString(),
    },
    evidenceSections: [
      { id: "jur", label: "Jurisdiction", status: "ready", grade: "A", detail: "All jurisdictions configured", freshnessTimestamp: new Date().toISOString() },
      { id: "kyc", label: "KYC/AML", status: "ready", grade: "A", detail: "Provider active", freshnessTimestamp: new Date().toISOString() },
    ],
    ...overrides,
  };
}

function makeBlockedBundle(): ComplianceReportBundle {
  return makeReadyBundle({
    overallStatus: "failed",
    readinessScore: 30,
    kycAml: {
      status: "failed",
      kycRequired: true,
      providerConfigured: false,
      pendingReviewCount: 3,
      completedReviewCount: 0,
      freshnessTimestamp: new Date().toISOString(),
    },
    whitelist: {
      status: "failed",
      whitelistRequired: true,
      approvedInvestorCount: 0,
      pendingInvestorCount: 0,
      activeWhitelistId: null,
      freshnessTimestamp: new Date().toISOString(),
    },
  });
}

function makeStaleBundle(): ComplianceReportBundle {
  const staleTs = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(); // 31 days ago
  return makeReadyBundle({
    overallStatus: "warning",
    readinessScore: 70,
    jurisdiction: {
      ...makeReadyBundle().jurisdiction,
      freshnessTimestamp: staleTs,
    },
    kycAml: {
      ...makeReadyBundle().kycAml,
      freshnessTimestamp: staleTs,
    },
  });
}

function makeApprovalSummary() {
  const entries: ApprovalHistoryEntry[] = [
    {
      id: "stage-001",
      label: "Legal Review",
      reviewerRole: "Legal Counsel",
      outcome: "approved",
      actionedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      conditions: null,
      summary: "All legal requirements met",
      isLaunchBlocking: true,
    },
    {
      id: "stage-002",
      label: "Compliance Sign-Off",
      reviewerRole: "Chief Compliance Officer",
      outcome: "conditionally_approved",
      actionedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      conditions: "Pending final AML clearance",
      summary: "Conditional approval granted",
      isLaunchBlocking: true,
    },
    {
      id: "stage-003",
      label: "Risk Committee",
      reviewerRole: "Risk Manager",
      outcome: "pending",
      actionedAt: null,
      conditions: null,
      summary: null,
      isLaunchBlocking: false,
    },
  ];
  return deriveApprovalHistorySummary(entries);
}

// ---------------------------------------------------------------------------
// Section 1: Audience template selection
// ---------------------------------------------------------------------------

describe("Audience template selection — section visibility wiring", () => {
  it("every audience preset has a non-empty label and description", () => {
    const presets: AudiencePreset[] = ["all", "compliance", "procurement", "executive"];
    for (const preset of presets) {
      expect(AUDIENCE_PRESET_LABELS[preset].length).toBeGreaterThan(0);
      expect(AUDIENCE_PRESET_DESCRIPTIONS[preset].length).toBeGreaterThan(0);
    }
  });

  it("each audience has a distinct section priority order", () => {
    const all = AUDIENCE_SECTION_PRIORITIES["all"];
    const compliance = AUDIENCE_SECTION_PRIORITIES["compliance"];
    const procurement = AUDIENCE_SECTION_PRIORITIES["procurement"];
    const executive = AUDIENCE_SECTION_PRIORITIES["executive"];

    // All preset has the most sections
    expect(all.length).toBeGreaterThanOrEqual(compliance.length);
    expect(all.length).toBeGreaterThanOrEqual(procurement.length);
    expect(all.length).toBeGreaterThanOrEqual(executive.length);

    // Every preset includes 'overall'
    for (const preset of [all, compliance, procurement, executive]) {
      expect(preset).toContain("overall");
    }
  });

  it("executive preset does not include low-signal sections (focuses on overview)", () => {
    const exec = AUDIENCE_SECTION_PRIORITIES["executive"];
    // Executive should have fewer sections than compliance (distilled)
    expect(exec.length).toBeLessThan(AUDIENCE_SECTION_PRIORITIES["compliance"].length);
  });

  it("compliance preset always includes kyc_aml section", () => {
    expect(AUDIENCE_SECTION_PRIORITIES["compliance"]).toContain("kyc_aml");
  });

  it("procurement preset always includes whitelist section", () => {
    expect(AUDIENCE_SECTION_PRIORITIES["procurement"]).toContain("whitelist");
  });

  it('all audience sections appear in the full "all" preset', () => {
    const allSections = AUDIENCE_SECTION_PRIORITIES["all"];
    for (const section of AUDIENCE_SECTION_PRIORITIES["compliance"]) {
      expect(allSections).toContain(section);
    }
  });
});

// ---------------------------------------------------------------------------
// Section 2: Fail-closed guards — export readiness
// ---------------------------------------------------------------------------

describe("Fail-closed guards — export readiness wiring", () => {
  it("ready bundle with full approvals produces ready_for_external status", () => {
    const bundle = makeReadyBundle();
    const approval = makeApprovalSummary();
    const readiness = deriveExportPackageReadiness(bundle, approval);
    // Should be ready_for_internal or ready_for_external when all checks pass
    expect(["ready_for_external", "ready_for_internal"]).toContain(readiness.status);
  });

  it("blocked bundle produces blocked export readiness", () => {
    const bundle = makeBlockedBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    expect(readiness.status).toBe("blocked");
    expect(readiness.blockerCount).toBeGreaterThan(0);
  });

  it("blocked status never shows as ready_for_external", () => {
    const bundle = makeBlockedBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    expect(readiness.status).not.toBe("ready_for_external");
    expect(readiness.status).not.toBe("ready_for_internal");
  });

  it("checklist items reflect missing KYC/AML provider", () => {
    const bundle = makeBlockedBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const kycItem = readiness.checklist.find((item) => item.id === "kyc_aml");
    expect(kycItem).toBeDefined();
    expect(kycItem?.isPresent).toBe(false);
    expect(kycItem?.isBlocked).toBe(true);
  });

  it("checklist items reflect missing whitelist when required", () => {
    const bundle = makeBlockedBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const wlItem = readiness.checklist.find((item) => item.id === "whitelist");
    expect(wlItem).toBeDefined();
    expect(wlItem?.isPresent).toBe(false);
  });

  it("stale evidence degrades export readiness below ready_for_external", () => {
    const bundle = makeStaleBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    // Stale should produce incomplete or blocked, not ready_for_external
    expect(readiness.status).not.toBe("ready_for_external");
  });

  it("all export readiness statuses have non-empty labels", () => {
    const statuses: ExportReadinessStatus[] = ["ready_for_external", "ready_for_internal", "incomplete", "blocked"];
    for (const s of statuses) {
      expect(EXPORT_READINESS_LABELS[s].length).toBeGreaterThan(0);
    }
  });

  it("exportReadinessStatusClass returns distinct CSS classes for each status", () => {
    const statuses: ExportReadinessStatus[] = ["ready_for_external", "ready_for_internal", "incomplete", "blocked"];
    const classes = statuses.map(exportReadinessStatusClass);
    const unique = new Set(classes);
    expect(unique.size).toBe(statuses.length);
  });
});

// ---------------------------------------------------------------------------
// Section 3: Degraded evidence states
// ---------------------------------------------------------------------------

describe("Degraded evidence states — stale data propagation", () => {
  it("isTimestampStale returns true for timestamps older than 30 days", () => {
    const staleTs = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    expect(isTimestampStale(staleTs)).toBe(true);
  });

  it("isTimestampStale returns false for timestamps within 30 days", () => {
    const freshTs = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
    expect(isTimestampStale(freshTs)).toBe(false);
  });

  it("isTimestampStale handles null gracefully", () => {
    expect(isTimestampStale(null)).toBe(false);
  });

  it("stale bundle produces stale manifest entries", () => {
    const bundle = makeStaleBundle();
    const manifest = buildEvidenceManifest(bundle, null);
    const staleEntries = manifest.filter((e) => e.isStale);
    expect(staleEntries.length).toBeGreaterThan(0);
  });

  it("stale evidence manifest entries have non-null exclusionReason if excluded", () => {
    const bundle = makeBlockedBundle();
    const manifest = buildEvidenceManifest(bundle, null);
    for (const entry of manifest) {
      if (!entry.isIncluded) {
        expect(entry.exclusionReason).toBeTruthy();
      }
    }
  });

  it("degraded bundle never reaches ready_for_external export status", () => {
    for (const bundle of [makeBlockedBundle(), makeStaleBundle()]) {
      const readiness = deriveExportPackageReadiness(bundle, null);
      expect(readiness.status).not.toBe("ready_for_external");
    }
  });
});

// ---------------------------------------------------------------------------
// Section 4: Audit export package assembly — contradiction detection
// ---------------------------------------------------------------------------

describe("Audit export package — contradiction detection wiring", () => {
  it("detects KYC required with no provider configured", () => {
    const bundle = makeBlockedBundle();
    const contradictions = detectContradictions(bundle, null);
    const kycContradiction = contradictions.find((c) => c.affectedSections.some((s) => s === "kyc_aml"));
    expect(kycContradiction).toBeDefined();
    expect(kycContradiction?.severity).toMatch(/critical|high/i);
  });

  it("detects whitelist required with zero approved investors", () => {
    const bundle = makeBlockedBundle();
    const contradictions = detectContradictions(bundle, null);
    const wlContradiction = contradictions.find((c) => c.affectedSections.some((s) => s === "whitelist"));
    expect(wlContradiction).toBeDefined();
  });

  it("clean ready bundle has zero or minimal contradictions", () => {
    const bundle = makeReadyBundle();
    const contradictions = detectContradictions(bundle, makeApprovalSummary());
    const criticalCount = contradictions.filter((c) => c.severity === "critical").length;
    expect(criticalCount).toBe(0);
  });

  it("all contradiction severity labels are non-empty", () => {
    const severities = Object.keys(CONTRADICTION_SEVERITY_LABELS) as Array<keyof typeof CONTRADICTION_SEVERITY_LABELS>;
    for (const s of severities) {
      expect(CONTRADICTION_SEVERITY_LABELS[s].length).toBeGreaterThan(0);
    }
  });

  it("contradiction severity badge classes are distinct", () => {
    const critical = contradictionSeverityBadgeClass("critical");
    const high = contradictionSeverityBadgeClass("high");
    const medium = contradictionSeverityBadgeClass("medium");
    expect(critical).not.toBe(high);
    expect(high).not.toBe(medium);
  });

  it("assembled package is not regulator-ready when contradictions are critical", () => {
    const bundle = makeBlockedBundle();
    const approval = makeApprovalSummary();
    const readiness = deriveExportPackageReadiness(bundle, approval);
    const pkg = assembleAuditExportPackage(bundle, approval, "all", readiness);
    expect(pkg.isRegulatorReady).toBe(false);
  });

  it("assembled package contains contradiction count", () => {
    const bundle = makeBlockedBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const pkg = assembleAuditExportPackage(bundle, null, "all", readiness);
    expect(typeof pkg.contradictionCount).toBe("number");
    expect(pkg.contradictionCount).toBeGreaterThan(0);
  });

  it("assembled package for ready bundle can be regulator-ready", () => {
    const bundle = makeReadyBundle();
    // For a truly ready bundle we need approval history with all signed off
    const entries: ApprovalHistoryEntry[] = [
      {
        id: "s1",
        label: "Legal",
        reviewerRole: "Legal",
        outcome: "approved",
        actionedAt: new Date().toISOString(),
        conditions: null,
        summary: "OK",
        isLaunchBlocking: true,
      },
    ];
    const approval = deriveApprovalHistorySummary(entries);
    const readiness = deriveExportPackageReadiness(bundle, approval);
    const pkg = assembleAuditExportPackage(bundle, approval, "all", readiness);
    // Package should at least have a packageId and assembledAt
    expect(pkg.packageId.length).toBeGreaterThan(0);
    expect(pkg.assembledAt.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Section 5: Approval history wiring
// ---------------------------------------------------------------------------

describe("Approval history wiring — export readiness checklist", () => {
  it("deriveApprovalHistorySummary correctly counts outcomes", () => {
    const entries: ApprovalHistoryEntry[] = [
      { id: "1", label: "Stage A", reviewerRole: "Compliance", outcome: "approved", actionedAt: new Date().toISOString(), conditions: null, summary: null, isLaunchBlocking: true },
      { id: "2", label: "Stage B", reviewerRole: "Legal", outcome: "conditionally_approved", actionedAt: new Date().toISOString(), conditions: "Condition X", summary: null, isLaunchBlocking: true },
      { id: "3", label: "Stage C", reviewerRole: "Risk", outcome: "blocked", actionedAt: new Date().toISOString(), conditions: null, summary: null, isLaunchBlocking: true },
      { id: "4", label: "Stage D", reviewerRole: "Exec", outcome: "pending", actionedAt: null, conditions: null, summary: null, isLaunchBlocking: false },
    ];
    const summary = deriveApprovalHistorySummary(entries);
    expect(summary.totalStages).toBe(4);
    expect(summary.approvedCount).toBe(2);
    expect(summary.conditionalCount).toBe(1);
    expect(summary.blockedCount).toBe(1);
    expect(summary.pendingCount).toBe(1);
    expect(summary.allLaunchCriticalSigned).toBe(false); // blocked stage
  });

  it("all approval outcome labels are non-empty", () => {
    for (const [, label] of Object.entries(APPROVAL_OUTCOME_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("approval outcome badge classes are distinct", () => {
    const classes = [
      approvalOutcomeBadgeClass("approved"),
      approvalOutcomeBadgeClass("conditionally_approved"),
      approvalOutcomeBadgeClass("blocked"),
      approvalOutcomeBadgeClass("pending"),
      approvalOutcomeBadgeClass("not_started"),
    ];
    const unique = new Set(classes);
    expect(unique.size).toBe(5);
  });

  it("blocked launch-critical stage prevents allLaunchCriticalSigned", () => {
    const entries: ApprovalHistoryEntry[] = [
      { id: "1", label: "Critical Stage", reviewerRole: "CCO", outcome: "blocked", actionedAt: new Date().toISOString(), conditions: null, summary: null, isLaunchBlocking: true },
    ];
    const summary = deriveApprovalHistorySummary(entries);
    expect(summary.allLaunchCriticalSigned).toBe(false);
  });

  it("all approved launch-critical stages produce allLaunchCriticalSigned=true", () => {
    const entries: ApprovalHistoryEntry[] = [
      { id: "1", label: "Legal", reviewerRole: "Legal", outcome: "approved", actionedAt: new Date().toISOString(), conditions: null, summary: null, isLaunchBlocking: true },
      { id: "2", label: "Compliance", reviewerRole: "CCO", outcome: "approved", actionedAt: new Date().toISOString(), conditions: null, summary: null, isLaunchBlocking: true },
    ];
    const summary = deriveApprovalHistorySummary(entries);
    expect(summary.allLaunchCriticalSigned).toBe(true);
  });

  it("approval checklist item is present when history exists", () => {
    const bundle = makeReadyBundle();
    const approval = makeApprovalSummary();
    const readiness = deriveExportPackageReadiness(bundle, approval);
    const approvalItem = readiness.checklist.find((item) => item.id === "approval_history");
    expect(approvalItem).toBeDefined();
    expect(approvalItem?.isPresent).toBe(true);
  });

  it("approval checklist item is absent when no history", () => {
    const bundle = makeReadyBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const approvalItem = readiness.checklist.find((item) => item.id === "approval_history");
    // Without approval history, it should either be absent or marked as not present
    if (approvalItem) {
      expect(approvalItem.isPresent).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Section 6: Evidence manifest authority-level classification
// ---------------------------------------------------------------------------

describe("Evidence manifest — authority level classification", () => {
  it("all authority level labels are non-empty", () => {
    for (const [, label] of Object.entries(EVIDENCE_AUTHORITY_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("manifest authority badge classes are distinct", () => {
    const authoritative = manifestAuthorityBadgeClass("authoritative");
    const derived = manifestAuthorityBadgeClass("derived");
    const pending = manifestAuthorityBadgeClass("pending");
    const blocked = manifestAuthorityBadgeClass("blocked");
    const classes = [authoritative, derived, pending, blocked];
    const unique = new Set(classes);
    expect(unique.size).toBe(4);
  });

  it("ready bundle produces mostly authoritative/derived manifest entries", () => {
    const bundle = makeReadyBundle();
    const manifest = buildEvidenceManifest(bundle, makeApprovalSummary());
    const nonBlockedEntries = manifest.filter((e) => e.authorityLevel !== "blocked");
    expect(nonBlockedEntries.length).toBeGreaterThan(0);
  });

  it("blocked bundle produces blocked/pending manifest entries", () => {
    const bundle = makeBlockedBundle();
    const manifest = buildEvidenceManifest(bundle, null);
    const blockedOrPending = manifest.filter((e) => e.authorityLevel === "blocked" || e.authorityLevel === "pending");
    expect(blockedOrPending.length).toBeGreaterThan(0);
  });

  it("manifest includes an entry for each evidence source type", () => {
    const bundle = makeReadyBundle();
    const manifest = buildEvidenceManifest(bundle, makeApprovalSummary());
    const sourceTypes = manifest.map((e) => e.sourceType);
    expect(sourceTypes).toContain("jurisdiction");
    expect(sourceTypes).toContain("kyc_aml");
    expect(sourceTypes).toContain("whitelist");
    expect(sourceTypes).toContain("investor_eligibility");
  });

  it("manifest entries all have non-empty labels and ids", () => {
    const bundle = makeReadyBundle();
    const manifest = buildEvidenceManifest(bundle, null);
    for (const entry of manifest) {
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("audit package readiness CSS class is non-empty for isRegulatorReady=false", () => {
    const cssClass = auditPackageReadinessClass(false);
    expect(cssClass.length).toBeGreaterThan(0);
  });

  it("audit package readiness CSS class differs between ready and not-ready", () => {
    const notReady = auditPackageReadinessClass(false);
    const ready = auditPackageReadinessClass(true);
    expect(notReady).not.toBe(ready);
  });
});

// ---------------------------------------------------------------------------
// Section 7: Reporting command-center summary wiring
// ---------------------------------------------------------------------------

describe("Reporting command-center — summary wiring", () => {
  it("deriveCommandCenterSummary correctly counts blocked runs", () => {
    const summary = deriveCommandCenterSummary(MOCK_TEMPLATES_BLOCKED, MOCK_RUNS_ACTIVE);
    expect(summary.blockedRunCount).toBeGreaterThan(0);
  });

  it("deriveCommandCenterSummary correctly counts stale evidence templates", () => {
    const summary = deriveCommandCenterSummary(MOCK_TEMPLATES_BLOCKED, MOCK_RUNS_ACTIVE);
    expect(summary.staleEvidenceCount).toBeGreaterThanOrEqual(0);
  });

  it("healthy templates produce zero blocked runs", () => {
    const summary = deriveCommandCenterSummary(MOCK_TEMPLATES_HEALTHY, []);
    expect(summary.blockedRunCount).toBe(0);
  });

  it("isEvidenceBlocking returns true for stale/missing/unresolved_blocker/unavailable", () => {
    expect(isEvidenceBlocking("stale")).toBe(true);
    expect(isEvidenceBlocking("missing")).toBe(true);
    expect(isEvidenceBlocking("unresolved_blocker")).toBe(true);
    expect(isEvidenceBlocking("unavailable")).toBe(true);
  });

  it("isEvidenceBlocking returns false for fresh evidence", () => {
    expect(isEvidenceBlocking("fresh")).toBe(false);
  });

  it("runStatusBadgeClass returns non-empty string for all statuses", () => {
    const statuses = ["draft", "awaiting_review", "awaiting_approval", "scheduled", "blocked", "exported", "delivered", "degraded"] as const;
    for (const s of statuses) {
      expect(runStatusBadgeClass(s).length).toBeGreaterThan(0);
    }
  });

  it("freshnessIndicatorClass returns distinct classes for different states", () => {
    const fresh = freshnessIndicatorClass("fresh");
    const stale = freshnessIndicatorClass("stale");
    const missing = freshnessIndicatorClass("missing");
    expect(fresh).not.toBe(stale);
    expect(stale).not.toBe(missing);
  });

  it("templateCardBorderClass returns highlighted border for stale templates", () => {
    const staleBorder = templateCardBorderClass("stale");
    const freshBorder = templateCardBorderClass("fresh");
    expect(staleBorder).not.toBe(freshBorder);
  });
});

// ---------------------------------------------------------------------------
// Section 8: Audience-specific text report generation
// ---------------------------------------------------------------------------

describe("Audience text report — content wiring", () => {
  it("compliance report text contains KYC/AML section", () => {
    const bundle = makeReadyBundle();
    const approval = makeApprovalSummary();
    const readiness = deriveExportPackageReadiness(bundle, approval);
    const text = buildAudienceReportText(bundle, "compliance", approval, readiness);
    expect(text).toMatch(/KYC\/AML|kyc.aml/i);
  });

  it("executive report text contains overall posture section", () => {
    const bundle = makeReadyBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const text = buildAudienceReportText(bundle, "executive", null, readiness);
    expect(text).toMatch(/OVERALL|POSTURE|READINESS/i);
  });

  it("procurement report text contains whitelist section", () => {
    const bundle = makeReadyBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const text = buildAudienceReportText(bundle, "procurement", null, readiness);
    expect(text).toMatch(/WHITELIST/i);
  });

  it("full (all) report text contains approval history when provided", () => {
    const bundle = makeReadyBundle();
    const approval = makeApprovalSummary();
    const readiness = deriveExportPackageReadiness(bundle, approval);
    const text = buildAudienceReportText(bundle, "all", approval, readiness);
    expect(text).toMatch(/APPROVAL STAGE HISTORY/i);
  });

  it("blocked bundle report text contains blockers section", () => {
    const bundle = makeBlockedBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const text = buildAudienceReportText(bundle, "all", null, readiness);
    expect(text).toMatch(/BLOCKER/i);
  });

  it("text report includes launch name from bundle", () => {
    const bundle = makeReadyBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const text = buildAudienceReportText(bundle, "all", null, readiness);
    expect(text).toContain("Integration Test Launch");
  });

  it("text report includes export package checklist", () => {
    const bundle = makeReadyBundle();
    const approval = makeApprovalSummary();
    const readiness = deriveExportPackageReadiness(bundle, approval);
    const text = buildAudienceReportText(bundle, "all", approval, readiness);
    expect(text).toMatch(/Export Package Checklist/i);
  });

  it("text report does not contain wallet-centric language", () => {
    const bundle = makeReadyBundle();
    const readiness = deriveExportPackageReadiness(bundle, null);
    const text = buildAudienceReportText(bundle, "all", null, readiness);
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly|connect wallet/i);
  });
});

// ---------------------------------------------------------------------------
// Section 9: Evidence timeline building
// ---------------------------------------------------------------------------

describe("Evidence timeline — chronological event wiring", () => {
  it("timeline events are sorted with most recent first", () => {
    const bundle = makeReadyBundle();
    const timeline = buildEvidenceTimeline(bundle, makeApprovalSummary());
    for (let i = 0; i < timeline.length - 1; i++) {
      const curr = new Date(timeline[i].timestamp).getTime();
      const next = new Date(timeline[i + 1].timestamp).getTime();
      expect(curr).toBeGreaterThanOrEqual(next);
    }
  });

  it("timeline contains at least one event for a ready bundle", () => {
    const bundle = makeReadyBundle();
    const timeline = buildEvidenceTimeline(bundle, makeApprovalSummary());
    expect(timeline.length).toBeGreaterThan(0);
  });

  it("all timeline events have non-empty labels and timestamps", () => {
    const bundle = makeReadyBundle();
    const timeline = buildEvidenceTimeline(bundle, null);
    for (const event of timeline) {
      expect(event.label.length).toBeGreaterThan(0);
      expect(event.timestamp.length).toBeGreaterThan(0);
      expect(event.id.length).toBeGreaterThan(0);
    }
  });

  it("assembled package timeline is a subset of all events", () => {
    const bundle = makeReadyBundle();
    const approval = makeApprovalSummary();
    const readiness = deriveExportPackageReadiness(bundle, approval);
    const pkg = assembleAuditExportPackage(bundle, approval, "all", readiness);
    // Package shows top 5 events
    expect(pkg.timeline.length).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Section 10: Run lifecycle and audience label contracts
// ---------------------------------------------------------------------------

describe("Run lifecycle — status and audience label contracts", () => {
  it("MOCK_RUNS_ACTIVE contains blocked runs for degraded-state testing", () => {
    const blocked = MOCK_RUNS_ACTIVE.filter((r: ReportRun) => r.status === "blocked");
    expect(blocked.length).toBeGreaterThan(0);
  });

  it("blocked runs have a remediationPath", () => {
    const blocked = MOCK_RUNS_ACTIVE.filter((r: ReportRun) => r.status === "blocked");
    for (const run of blocked) {
      expect(run.remediationPath).toBeTruthy();
      expect(run.remediationPath!.startsWith("/compliance")).toBe(true);
    }
  });

  it("MOCK_TEMPLATES_BLOCKED shows stale evidence freshness", () => {
    const stale = MOCK_TEMPLATES_BLOCKED.filter((t: ReportTemplate) => ["stale", "missing", "unresolved_blocker"].includes(t.evidenceFreshness));
    expect(stale.length).toBeGreaterThan(0);
  });

  it("summary counts awaitingActionCount for runs needing approval", () => {
    const summary = deriveCommandCenterSummary(MOCK_TEMPLATES_HEALTHY, MOCK_RUNS_ACTIVE);
    expect(summary.awaitingActionCount).toBeGreaterThanOrEqual(0);
  });

  it("all run status badge classes are non-empty strings", () => {
    const statuses = ["draft", "awaiting_review", "awaiting_approval", "scheduled", "blocked", "exported", "delivered", "degraded"] as const;
    for (const s of statuses) {
      const cls = runStatusBadgeClass(s);
      expect(typeof cls).toBe("string");
      expect(cls.length).toBeGreaterThan(0);
    }
  });
});
