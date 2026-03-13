/**
 * Whitelist Policy Store
 * Manages policy-level whitelist state for post-launch compliance operators.
 * This is distinct from individual entry management – it governs the RULES.
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JurisdictionPolicyEntry {
  code: string;
  name: string;
  reason?: string;
  effectiveDate?: string;
}

export interface InvestorCategoryRule {
  category: string;
  label: string;
  allowed: boolean;
  kycRequired: boolean;
  notes?: string;
}

export type PolicyGapSeverity = "warning" | "error";

export interface PolicyGap {
  id: string;
  severity: PolicyGapSeverity;
  message: string;
  field?: string;
}

export type PolicyStatus = "active" | "draft" | "pending_review";
export type DefaultBehavior = "allow_all" | "deny_all" | "allow_by_rule";
export type ReviewStatus = "approved" | "pending_review" | "changes_requested";

export interface WhitelistPolicy {
  id: string;
  tokenId: string;
  version: string;
  status: PolicyStatus;
  defaultBehavior: DefaultBehavior;
  allowedJurisdictions: JurisdictionPolicyEntry[];
  restrictedJurisdictions: JurisdictionPolicyEntry[];
  blockedJurisdictions: JurisdictionPolicyEntry[];
  allowedInvestorCategories: InvestorCategoryRule[];
  kycRequired: boolean;
  accreditationRequired: boolean;
  summary: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  lastUpdatedByEmail: string;
  createdAt: string;
  reviewStatus: ReviewStatus;
  gaps: PolicyGap[];
}

export interface WhitelistPolicyDraft extends WhitelistPolicy {
  dirtyFields: Set<string>;
}

export type EligibilityDecision = "allowed" | "denied" | "requires_review";
export type EligibilityReasonSeverity = "info" | "warning" | "blocking";

export interface EligibilityReason {
  code: string;
  message: string;
  severity: EligibilityReasonSeverity;
}

export interface EligibilityResult {
  jurisdictionCode: string;
  jurisdictionName: string;
  investorCategory: string;
  decision: EligibilityDecision;
  reasons: EligibilityReason[];
  simulatedAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_POLICY: WhitelistPolicy = {
  id: "policy-demo-001",
  tokenId: "token-001",
  version: "1.3",
  status: "active",
  defaultBehavior: "allow_by_rule",
  allowedJurisdictions: [
    { code: "SK", name: "Slovakia" },
    { code: "CZ", name: "Czechia" },
    { code: "AT", name: "Austria" },
    { code: "DE", name: "Germany" },
  ],
  restrictedJurisdictions: [
    { code: "PL", name: "Poland", reason: "Pending regulatory review" },
  ],
  blockedJurisdictions: [
    { code: "US", name: "United States", reason: "SEC registration required" },
    { code: "CN", name: "China", reason: "Market restrictions" },
  ],
  allowedInvestorCategories: [
    { category: "retail", label: "Retail Investors", allowed: true, kycRequired: true },
    { category: "professional", label: "Professional Investors", allowed: true, kycRequired: true },
    { category: "institutional", label: "Institutional Investors", allowed: true, kycRequired: false },
    { category: "qualified", label: "Qualified Investors", allowed: false, kycRequired: true },
  ],
  kycRequired: true,
  accreditationRequired: false,
  summary:
    "Retail and professional investors from Slovakia, Czechia, Austria, and Germany are eligible. Poland is under review. US and China investors are blocked.",
  lastUpdatedAt: "2026-03-01T10:00:00Z",
  lastUpdatedBy: "compliance-manager-001",
  lastUpdatedByEmail: "compliance@company.com",
  createdAt: "2026-01-15T09:00:00Z",
  reviewStatus: "approved",
  gaps: [],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWhitelistPolicyStore = defineStore("whitelistPolicy", () => {
  // State
  const policy = ref<WhitelistPolicy | null>(null);
  const draft = ref<WhitelistPolicyDraft | null>(null);
  const eligibilityResult = ref<EligibilityResult | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const isCheckingEligibility = ref(false);
  const error = ref<string | null>(null);
  const lastFetched = ref<string | null>(null);

  // ── Computed ────────────────────────────────────────────────────────────────

  const hasPolicy = computed(() => policy.value !== null);

  const hasDraft = computed(() => draft.value !== null);

  const hasGaps = computed(() => (policy.value?.gaps.length ?? 0) > 0);

  const criticalGaps = computed(() =>
    (policy.value?.gaps ?? []).filter((g) => g.severity === "error")
  );

  const isDirty = computed(() => {
    if (!draft.value || !policy.value) return false;
    return draft.value.dirtyFields.size > 0;
  });

  const contradictions = computed<string[]>(() => {
    if (!draft.value) return detectContradictionsFor(policy.value);
    return detectContradictionsFor(draft.value);
  });

  const policyPlainSummary = computed<string>(() => {
    const p = policy.value;
    if (!p) return "";

    const allowed = p.allowedJurisdictions.map((j) => j.name).join(", ");
    const blocked = p.blockedJurisdictions.map((j) => j.name).join(", ");
    const restricted = p.restrictedJurisdictions.map((j) => j.name).join(", ");
    const enabledCategories = p.allowedInvestorCategories
      .filter((c) => c.allowed)
      .map((c) => c.label)
      .join(", ");

    const parts: string[] = [];
    if (allowed) parts.push(`Allowed jurisdictions: ${allowed}.`);
    if (restricted) parts.push(`Under review: ${restricted}.`);
    if (blocked) parts.push(`Blocked: ${blocked}.`);
    if (enabledCategories) parts.push(`Eligible investor types: ${enabledCategories}.`);
    if (p.kycRequired) parts.push("KYC verification required for all participants.");

    return parts.join(" ");
  });

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function fetchPolicy(_tokenId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      // Simulate network latency for realistic UX
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      policy.value = { ...MOCK_POLICY };
      lastFetched.value = new Date().toISOString();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load policy";
    } finally {
      isLoading.value = false;
    }
  }

  function startEdit(): void {
    if (!policy.value) return;
    draft.value = {
      ...JSON.parse(JSON.stringify(policy.value)),
      dirtyFields: new Set<string>(),
    };
  }

  function updateDraft(changes: Partial<WhitelistPolicyDraft>): void {
    if (!draft.value) return;
    const dirty = draft.value.dirtyFields;
    Object.keys(changes).forEach((k) => dirty.add(k));
    Object.assign(draft.value, changes);
  }

  function detectContradictions(): string[] {
    return detectContradictionsFor(draft.value ?? policy.value);
  }

  function detectContradictionsFor(p: WhitelistPolicy | null): string[] {
    if (!p) return [];
    const warnings: string[] = [];

    const allowedCodes = new Set(p.allowedJurisdictions.map((j) => j.code));
    const restrictedCodes = new Set(p.restrictedJurisdictions.map((j) => j.code));
    const blockedCodes = new Set(p.blockedJurisdictions.map((j) => j.code));

    p.allowedJurisdictions.forEach((j) => {
      if (restrictedCodes.has(j.code))
        warnings.push(`${j.name} (${j.code}) appears in both Allowed and Restricted lists.`);
      if (blockedCodes.has(j.code))
        warnings.push(`${j.name} (${j.code}) appears in both Allowed and Blocked lists.`);
    });

    p.restrictedJurisdictions.forEach((j) => {
      if (blockedCodes.has(j.code))
        warnings.push(`${j.name} (${j.code}) appears in both Restricted and Blocked lists.`);
    });

    if (p.defaultBehavior === "allow_all" && blockedCodes.size === 0) {
      warnings.push("Warning: 'Allow All' behavior with no blocked jurisdictions creates an unrestricted policy open to all regions. Review if this is intentional.");
    }

    if (p.defaultBehavior === "allow_by_rule" && allowedCodes.size === 0) {
      warnings.push("Default behavior is 'Apply Rules' but no allowed jurisdictions are configured.");
    }

    const allowedCategories = p.allowedInvestorCategories.filter((c) => c.allowed);
    if (allowedCategories.length === 0) {
      warnings.push("No investor categories are enabled — no investors can participate.");
    }

    return warnings;
  }

  async function saveDraft(): Promise<void> {
    if (!draft.value) return;
    isSaving.value = true;
    error.value = null;

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      const { dirtyFields: _df, ...policyData } = draft.value;
      const versionParts = (policy.value?.version ?? "1.0").split(".").map(Number);
      // Ensure at least a two-part version; default minor segment to 0 if missing
      if (versionParts.length < 2) versionParts.push(0);
      const currentMinor = Number.isNaN(versionParts[1]) ? 0 : (versionParts[1] ?? 0);
      versionParts[1] = currentMinor + 1;
      policy.value = {
        ...policyData,
        version: versionParts.join("."),
        lastUpdatedAt: new Date().toISOString(),
      };
      draft.value = null;
      lastFetched.value = new Date().toISOString();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to save policy";
    } finally {
      isSaving.value = false;
    }
  }

  function cancelEdit(): void {
    draft.value = null;
  }

  async function checkEligibility(params: {
    jurisdictionCode: string;
    investorCategory: string;
  }): Promise<void> {
    if (!policy.value) return;
    isCheckingEligibility.value = true;

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      eligibilityResult.value = simulateEligibility(policy.value, params);
    } finally {
      isCheckingEligibility.value = false;
    }
  }

  function clearEligibility(): void {
    eligibilityResult.value = null;
  }

  // ── Eligibility simulation ──────────────────────────────────────────────────

  function simulateEligibility(
    p: WhitelistPolicy,
    params: { jurisdictionCode: string; investorCategory: string }
  ): EligibilityResult {
    const { jurisdictionCode, investorCategory } = params;

    const jAllowed = p.allowedJurisdictions.find((j) => j.code === jurisdictionCode);
    const jRestricted = p.restrictedJurisdictions.find((j) => j.code === jurisdictionCode);
    const jBlocked = p.blockedJurisdictions.find((j) => j.code === jurisdictionCode);

    const categoryRule = p.allowedInvestorCategories.find(
      (c) => c.category === investorCategory
    );

    const reasons: EligibilityReason[] = [];
    // Start optimistic; each check may downgrade
    let decision: EligibilityDecision = "allowed";

    if (jBlocked) {
      reasons.push({
        code: "JURISDICTION_BLOCKED",
        message: `${jBlocked.name} is blocked. Reason: ${jBlocked.reason ?? "Market restrictions."}`,
        severity: "blocking",
      });
      decision = "denied";
    } else if (jRestricted) {
      reasons.push({
        code: "JURISDICTION_RESTRICTED",
        message: `${jRestricted.name} is currently under review. ${jRestricted.reason ?? ""}`,
        severity: "warning",
      });
      decision = "requires_review";
    } else if (jAllowed) {
      reasons.push({
        code: "JURISDICTION_ALLOWED",
        message: `${jAllowed.name} is on the approved jurisdiction list.`,
        severity: "info",
      });
      // decision stays "allowed"
    } else if (p.defaultBehavior === "allow_all") {
      reasons.push({
        code: "DEFAULT_ALLOW",
        message: "Jurisdiction not explicitly listed; default policy allows all.",
        severity: "info",
      });
      // decision stays "allowed"
    } else if (p.defaultBehavior === "deny_all") {
      reasons.push({
        code: "DEFAULT_DENY",
        message: "Jurisdiction not on the approved list; default policy denies unlisted jurisdictions.",
        severity: "blocking",
      });
      decision = "denied";
    } else {
      reasons.push({
        code: "JURISDICTION_NOT_LISTED",
        message: "Jurisdiction is not on the allowed list. Under rule-based policy, unlisted jurisdictions are denied.",
        severity: "blocking",
      });
      decision = "denied";
    }

    if (!categoryRule) {
      reasons.push({
        code: "CATEGORY_UNKNOWN",
        message: `Investor category '${investorCategory}' is not configured in this policy.`,
        severity: "blocking",
      });
      decision = "denied";
    } else if (!categoryRule.allowed) {
      reasons.push({
        code: "CATEGORY_DENIED",
        message: `${categoryRule.label} are not permitted under the current policy.`,
        severity: "blocking",
      });
      decision = "denied";
    } else {
      // Category is allowed — apply any info/warning annotations
      if (categoryRule.kycRequired && decision !== "denied") {
        reasons.push({
          code: "KYC_REQUIRED",
          message: `${categoryRule.label} must complete KYC verification before participating.`,
          severity: "info",
        });
      }
      if (p.accreditationRequired && decision !== "denied") {
        reasons.push({
          code: "ACCREDITATION_REQUIRED",
          message: "Investor accreditation documentation must be provided.",
          severity: "warning",
        });
      }
    }

    const jurisdictionName =
      jAllowed?.name ??
      jRestricted?.name ??
      jBlocked?.name ??
      jurisdictionCode;

    return {
      jurisdictionCode,
      jurisdictionName,
      investorCategory,
      decision,
      reasons: reasons.sort((a, b) => {
        const order = { blocking: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      }),
      simulatedAt: new Date().toISOString(),
    };
  }

  return {
    // State
    policy,
    draft,
    eligibilityResult,
    isLoading,
    isSaving,
    isCheckingEligibility,
    error,
    lastFetched,
    // Computed
    hasPolicy,
    hasDraft,
    hasGaps,
    criticalGaps,
    isDirty,
    contradictions,
    policyPlainSummary,
    // Actions
    fetchPolicy,
    startEdit,
    updateDraft,
    detectContradictions,
    saveDraft,
    cancelEdit,
    checkEligibility,
    clearEligibility,
  };
});
