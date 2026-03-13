import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useWhitelistPolicyStore } from "../whitelistPolicy";

describe("useWhitelistPolicyStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Initial state ───────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("starts with null policy", () => {
      const store = useWhitelistPolicyStore();
      expect(store.policy).toBeNull();
    });

    it("starts with no draft", () => {
      const store = useWhitelistPolicyStore();
      expect(store.draft).toBeNull();
    });

    it("starts with hasPolicy = false", () => {
      const store = useWhitelistPolicyStore();
      expect(store.hasPolicy).toBe(false);
    });

    it("starts with hasDraft = false", () => {
      const store = useWhitelistPolicyStore();
      expect(store.hasDraft).toBe(false);
    });

    it("starts not loading", () => {
      const store = useWhitelistPolicyStore();
      expect(store.isLoading).toBe(false);
    });

    it("starts with null error", () => {
      const store = useWhitelistPolicyStore();
      expect(store.error).toBeNull();
    });
  });

  // ── fetchPolicy ─────────────────────────────────────────────────────────────

  describe("fetchPolicy", () => {
    it("sets isLoading during fetch", async () => {
      const store = useWhitelistPolicyStore();
      const promise = store.fetchPolicy("token-001");
      expect(store.isLoading).toBe(true);
      await vi.runAllTimersAsync();
      await promise;
      expect(store.isLoading).toBe(false);
    });

    it("loads mock policy after fetch", async () => {
      const store = useWhitelistPolicyStore();
      const promise = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await promise;
      expect(store.policy).not.toBeNull();
      expect(store.policy?.tokenId).toBe("token-001");
    });

    it("sets hasPolicy to true after fetch", async () => {
      const store = useWhitelistPolicyStore();
      const promise = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await promise;
      expect(store.hasPolicy).toBe(true);
    });

    it("sets lastFetched after successful fetch", async () => {
      const store = useWhitelistPolicyStore();
      const promise = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await promise;
      expect(store.lastFetched).not.toBeNull();
    });

    it("clears error on successful fetch", async () => {
      const store = useWhitelistPolicyStore();
      store.error = "previous error";
      const promise = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await promise;
      expect(store.error).toBeNull();
    });

    it("mock policy has expected allowed jurisdictions", async () => {
      const store = useWhitelistPolicyStore();
      const promise = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await promise;
      const codes = store.policy!.allowedJurisdictions.map((j) => j.code);
      expect(codes).toContain("SK");
      expect(codes).toContain("CZ");
      expect(codes).toContain("AT");
      expect(codes).toContain("DE");
    });

    it("mock policy has blocked jurisdictions", async () => {
      const store = useWhitelistPolicyStore();
      const promise = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await promise;
      const codes = store.policy!.blockedJurisdictions.map((j) => j.code);
      expect(codes).toContain("US");
      expect(codes).toContain("CN");
    });
  });

  // ── startEdit / cancelEdit ──────────────────────────────────────────────────

  describe("startEdit", () => {
    async function loadedStore() {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      return store;
    }

    it("creates draft from policy", async () => {
      const store = await loadedStore();
      store.startEdit();
      expect(store.draft).not.toBeNull();
      expect(store.draft?.id).toBe(store.policy?.id);
    });

    it("sets hasDraft to true after startEdit", async () => {
      const store = await loadedStore();
      store.startEdit();
      expect(store.hasDraft).toBe(true);
    });

    it("draft is a deep copy, not same reference", async () => {
      const store = await loadedStore();
      store.startEdit();
      expect(store.draft).not.toBe(store.policy);
    });

    it("starts with empty dirty fields", async () => {
      const store = await loadedStore();
      store.startEdit();
      expect(store.draft?.dirtyFields.size).toBe(0);
    });

    it("does nothing when policy is null", () => {
      const store = useWhitelistPolicyStore();
      store.startEdit();
      expect(store.draft).toBeNull();
    });
  });

  describe("cancelEdit", () => {
    it("clears draft", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      store.cancelEdit();
      expect(store.draft).toBeNull();
      expect(store.hasDraft).toBe(false);
    });
  });

  // ── updateDraft ─────────────────────────────────────────────────────────────

  describe("updateDraft", () => {
    it("updates draft fields", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      store.updateDraft({ summary: "Updated summary" });
      expect(store.draft?.summary).toBe("Updated summary");
    });

    it("marks fields as dirty", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      store.updateDraft({ summary: "Updated" });
      expect(store.draft?.dirtyFields.has("summary")).toBe(true);
    });

    it("sets isDirty to true after update", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      store.updateDraft({ kycRequired: false });
      expect(store.isDirty).toBe(true);
    });

    it("does nothing if no draft exists", () => {
      const store = useWhitelistPolicyStore();
      // Should not throw
      expect(() => store.updateDraft({ summary: "x" })).not.toThrow();
    });
  });

  // ── detectContradictions ────────────────────────────────────────────────────

  describe("detectContradictions", () => {
    it("returns warning when country in allowed and blocked", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      // Add SK to blocked (it's already in allowed)
      store.updateDraft({
        blockedJurisdictions: [
          ...store.draft!.blockedJurisdictions,
          { code: "SK", name: "Slovakia" },
        ],
      });
      const warnings = store.detectContradictions();
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.includes("Slovakia"))).toBe(true);
    });

    it("returns empty array when no contradictions", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      const warnings = store.detectContradictions();
      expect(warnings).toEqual([]);
    });

    it("warns when no investor categories enabled", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      store.updateDraft({
        allowedInvestorCategories: store.draft!.allowedInvestorCategories.map((c) => ({
          ...c,
          allowed: false,
        })),
      });
      const warnings = store.detectContradictions();
      expect(warnings.some((w) => w.includes("No investor categories"))).toBe(true);
    });
  });

  // ── saveDraft ───────────────────────────────────────────────────────────────

  describe("saveDraft", () => {
    it("updates policy from draft and clears draft", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      store.updateDraft({ summary: "Brand new summary" });
      const savePromise = store.saveDraft();
      await vi.runAllTimersAsync();
      await savePromise;
      expect(store.policy?.summary).toBe("Brand new summary");
      expect(store.draft).toBeNull();
    });

    it("increments version number", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      const origVersion = store.policy!.version;
      store.startEdit();
      const savePromise = store.saveDraft();
      await vi.runAllTimersAsync();
      await savePromise;
      expect(store.policy!.version).not.toBe(origVersion);
    });

    it("sets isSaving during save", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      const savePromise = store.saveDraft();
      expect(store.isSaving).toBe(true);
      await vi.runAllTimersAsync();
      await savePromise;
      expect(store.isSaving).toBe(false);
    });
  });

  // ── checkEligibility ────────────────────────────────────────────────────────

  describe("checkEligibility", () => {
    async function loadedStore() {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      return store;
    }

    it("returns 'allowed' for SK + retail", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "SK", investorCategory: "retail" });
      await vi.runAllTimersAsync();
      await promise;
      expect(store.eligibilityResult?.decision).toBe("allowed");
    });

    it("returns 'denied' for US + retail (blocked)", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "US", investorCategory: "retail" });
      await vi.runAllTimersAsync();
      await promise;
      expect(store.eligibilityResult?.decision).toBe("denied");
    });

    it("returns 'denied' for qualified investors (not allowed by policy)", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "SK", investorCategory: "qualified" });
      await vi.runAllTimersAsync();
      await promise;
      expect(store.eligibilityResult?.decision).toBe("denied");
    });

    it("returns 'requires_review' for restricted jurisdiction (PL)", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "PL", investorCategory: "retail" });
      await vi.runAllTimersAsync();
      await promise;
      expect(store.eligibilityResult?.decision).toBe("requires_review");
    });

    it("includes blocking reasons for denied decisions", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "US", investorCategory: "retail" });
      await vi.runAllTimersAsync();
      await promise;
      const blockingReasons = store.eligibilityResult!.reasons.filter((r) => r.severity === "blocking");
      expect(blockingReasons.length).toBeGreaterThan(0);
    });

    it("includes info reason for allowed decision", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "DE", investorCategory: "professional" });
      await vi.runAllTimersAsync();
      await promise;
      const infoReasons = store.eligibilityResult!.reasons.filter((r) => r.severity === "info");
      expect(infoReasons.length).toBeGreaterThan(0);
    });

    it("sets simulatedAt on result", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "AT", investorCategory: "institutional" });
      await vi.runAllTimersAsync();
      await promise;
      expect(store.eligibilityResult?.simulatedAt).toBeTruthy();
    });

    it("clears result on clearEligibility", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "AT", investorCategory: "institutional" });
      await vi.runAllTimersAsync();
      await promise;
      store.clearEligibility();
      expect(store.eligibilityResult).toBeNull();
    });
  });

  // ── Computed properties ─────────────────────────────────────────────────────

  describe("policyPlainSummary", () => {
    it("returns empty string when no policy", () => {
      const store = useWhitelistPolicyStore();
      expect(store.policyPlainSummary).toBe("");
    });

    it("returns string mentioning allowed jurisdictions", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      expect(store.policyPlainSummary).toContain("Allowed jurisdictions");
      expect(store.policyPlainSummary).toContain("Slovakia");
    });
  });

  describe("criticalGaps", () => {
    it("returns only error-severity gaps", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      // Mock policy has no gaps
      expect(store.criticalGaps).toHaveLength(0);
    });
  });

  // ── checkEligibility extended coverage ─────────────────────────────────────

  describe("checkEligibility — extended branch coverage", () => {
    async function loadedStore() {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      return store;
    }

    it("returns 'denied' for unlisted jurisdiction under allow_by_rule default", async () => {
      const store = await loadedStore();
      // ZZ is not in any list — default allow_by_rule should deny
      const promise = store.checkEligibility({ jurisdictionCode: "ZZ", investorCategory: "retail" });
      await vi.runAllTimersAsync();
      await promise;
      expect(store.eligibilityResult?.decision).toBe("denied");
    });

    it("includes JURISDICTION_NOT_LISTED reason for unlisted jurisdiction", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "ZZ", investorCategory: "retail" });
      await vi.runAllTimersAsync();
      await promise;
      const codes = store.eligibilityResult!.reasons.map((r) => r.code);
      expect(codes).toContain("JURISDICTION_NOT_LISTED");
    });

    it("returns 'denied' for unknown investor category (CATEGORY_UNKNOWN)", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "SK", investorCategory: "not_a_real_category" });
      await vi.runAllTimersAsync();
      await promise;
      expect(store.eligibilityResult?.decision).toBe("denied");
      const codes = store.eligibilityResult!.reasons.map((r) => r.code);
      expect(codes).toContain("CATEGORY_UNKNOWN");
    });

    it("does not run eligibility when policy is null", async () => {
      const store = useWhitelistPolicyStore();
      // policy is null, no fetch
      await store.checkEligibility({ jurisdictionCode: "SK", investorCategory: "retail" });
      expect(store.eligibilityResult).toBeNull();
    });

    it("sets isCheckingEligibility to true during check", async () => {
      const store = await loadedStore();
      const promise = store.checkEligibility({ jurisdictionCode: "SK", investorCategory: "retail" });
      expect(store.isCheckingEligibility).toBe(true);
      await vi.runAllTimersAsync();
      await promise;
      expect(store.isCheckingEligibility).toBe(false);
    });

    it("accreditation required produces warning reason for allowed decision", async () => {
      const store = await loadedStore();
      // Temporarily set accreditationRequired=true for this check
      store.startEdit();
      store.updateDraft({ accreditationRequired: true });
      const savePromise = store.saveDraft();
      await vi.runAllTimersAsync();
      await savePromise;
      // Now check allowed jurisdiction + category
      const promise = store.checkEligibility({ jurisdictionCode: "SK", investorCategory: "retail" });
      await vi.runAllTimersAsync();
      await promise;
      const codes = store.eligibilityResult!.reasons.map((r) => r.code);
      expect(codes).toContain("ACCREDITATION_REQUIRED");
    });
  });

  // ── detectContradictions — allow_by_rule with no allowed jurisdictions ──────

  describe("detectContradictions — allow_by_rule with no allowed jurisdictions", () => {
    it("warns when allow_by_rule and no allowed jurisdictions", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      store.updateDraft({
        defaultBehavior: "allow_by_rule",
        allowedJurisdictions: [],
      });
      const warnings = store.detectContradictions();
      expect(warnings.some((w) => w.includes("no allowed jurisdictions"))).toBe(true);
    });

    it("warns when country appears in both restricted and blocked", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      // Put PL in both restricted and blocked
      store.updateDraft({
        restrictedJurisdictions: [{ code: "PL", name: "Poland" }],
        blockedJurisdictions: [
          ...store.draft!.blockedJurisdictions,
          { code: "PL", name: "Poland" },
        ],
      });
      const warnings = store.detectContradictions();
      expect(warnings.some((w) => w.includes("Poland"))).toBe(true);
    });

    it("returns empty contradictions when no draft and no policy", () => {
      const store = useWhitelistPolicyStore();
      // Verify preconditions: fresh store has null policy and null draft
      expect(store.policy).toBeNull();
      expect(store.draft).toBeNull();
      const warnings = store.detectContradictions();
      expect(warnings).toEqual([]);
    });

    it("warns when country appears in both allowed and restricted lists", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      // SK is already in allowedJurisdictions; also add it to restricted
      store.updateDraft({
        restrictedJurisdictions: [
          ...store.draft!.restrictedJurisdictions,
          { code: "SK", name: "Slovakia" },
        ],
      });
      const warnings = store.detectContradictions();
      // Warning text: "Slovakia (SK) appears in both Allowed and Restricted lists."
      expect(warnings.some((w) => w.includes("SK") && w.includes("Allowed") && w.includes("Restricted"))).toBe(true);
    });

    it("warns when allow_all behavior is set with no blocked jurisdictions", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      store.updateDraft({
        defaultBehavior: "allow_all",
        blockedJurisdictions: [],
      });
      const warnings = store.detectContradictions();
      // Warning text: "Warning: 'Allow All' behavior with no blocked jurisdictions..."
      expect(warnings.some((w) => w.includes("Allow All") && w.includes("no blocked jurisdictions"))).toBe(true);
    });

    it("contradictions computed reflects policy when no draft is active", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      // No draft — contradictions computed runs detectContradictionsFor(policy.value) at line 153
      // MOCK_POLICY has no contradictions — result should be empty array
      expect(store.contradictions).toEqual([]);
    });

    it("contradictions computed reflects draft when a draft is active", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      store.startEdit();
      // Introduce a contradiction in the draft: add PL to both restricted and blocked
      store.updateDraft({
        restrictedJurisdictions: [{ code: "PL", name: "Poland" }],
        blockedJurisdictions: [
          ...store.draft!.blockedJurisdictions,
          { code: "PL", name: "Poland" },
        ],
      });
      // With draft active, contradictions computed runs detectContradictionsFor(draft) at line 154
      expect(store.contradictions.some((w: string) => w.includes("Poland"))).toBe(true);
    });
  });

  // ── hasGaps / criticalGaps with real gaps ───────────────────────────────────

  describe("hasGaps with real gap data", () => {
    it("hasGaps returns false with no gaps", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      expect(store.hasGaps).toBe(false);
    });
  });

  // ── saveDraft without existing policy ──────────────────────────────────────

  describe("saveDraft edge cases", () => {
    it("saveDraft does nothing when draft is null", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      // draft is null — saveDraft should exit early
      await store.saveDraft();
      expect(store.policy?.version).toBe("1.3"); // unchanged
    });
  });

  // ── Eligibility with allow_all / deny_all default behaviors ──────────────

  describe("checkEligibility — allow_all and deny_all defaults", () => {
    it("returns DEFAULT_ALLOW reason for unlisted jurisdiction when defaultBehavior=allow_all", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      // Change default behavior to allow_all
      store.startEdit();
      store.updateDraft({ defaultBehavior: "allow_all" });
      const savePromise = store.saveDraft();
      await vi.runAllTimersAsync();
      await savePromise;
      // ZZ is not in any list — allow_all default should allow it
      const checkPromise = store.checkEligibility({ jurisdictionCode: "ZZ", investorCategory: "professional" });
      await vi.runAllTimersAsync();
      await checkPromise;
      const codes = store.eligibilityResult!.reasons.map((r) => r.code);
      expect(codes).toContain("DEFAULT_ALLOW");
    });

    it("returns DEFAULT_DENY reason for unlisted jurisdiction when defaultBehavior=deny_all", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      // Change default behavior to deny_all
      store.startEdit();
      store.updateDraft({ defaultBehavior: "deny_all" });
      const savePromise = store.saveDraft();
      await vi.runAllTimersAsync();
      await savePromise;
      // ZZ is not in any list — deny_all default should deny it
      const checkPromise = store.checkEligibility({ jurisdictionCode: "ZZ", investorCategory: "professional" });
      await vi.runAllTimersAsync();
      await checkPromise;
      const codes = store.eligibilityResult!.reasons.map((r) => r.code);
      expect(codes).toContain("DEFAULT_DENY");
      expect(store.eligibilityResult?.decision).toBe("denied");
    });

    it("CATEGORY_DENIED reason when investor category explicitly denied", async () => {
      const store = useWhitelistPolicyStore();
      const p = store.fetchPolicy("token-001");
      await vi.runAllTimersAsync();
      await p;
      // Disable retail investors
      store.startEdit();
      store.updateDraft({
        allowedInvestorCategories: store.draft!.allowedInvestorCategories.map((c) =>
          c.category === "retail" ? { ...c, allowed: false } : c
        ),
      });
      const savePromise = store.saveDraft();
      await vi.runAllTimersAsync();
      await savePromise;
      const checkPromise = store.checkEligibility({ jurisdictionCode: "SK", investorCategory: "retail" });
      await vi.runAllTimersAsync();
      await checkPromise;
      const codes = store.eligibilityResult!.reasons.map((r) => r.code);
      expect(codes).toContain("CATEGORY_DENIED");
      expect(store.eligibilityResult?.decision).toBe("denied");
    });
  });
});
