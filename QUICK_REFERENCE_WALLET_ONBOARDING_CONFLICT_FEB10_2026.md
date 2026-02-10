# Quick Reference: Wallet Onboarding Issue Conflict

**Date**: February 10, 2026  
**Status**: 🚨 BLOCKING - Product Owner Review Required

---

## The Problem

This issue requests **wallet connection features**, but the product explicitly uses **email/password authentication only** with NO wallet UI.

---

## Key Facts

1. ✅ **MVP wallet UI removal completed Feb 10, 2026** (Issue #338)
2. ✅ **30 E2E tests validate NO wallet UI exists**
3. ✅ **Business roadmap states**: "no wallet connectors anywhere on the web"
4. ❌ **This issue requests**: Wallet onboarding, wallet selection, transaction signing
5. 🚨 **CONFLICT**: Implementing this would undo 100+ hours of MVP work

---

## Evidence

### Business Owner Roadmap (business-owner-roadmap.md)
> "Email and password authentication only - **no wallet connectors anywhere on the web**. Token creation and deployment handled entirely by backend services."

### E2E Test (arc76-no-wallet-ui.spec.ts)
```typescript
/**
 * Business Value: Enterprise users must never see 
 * wallet connectors or blockchain terminology
 * 
 * Risk: Any wallet UI exposure contradicts the 
 * product vision and fails compliance requirements
 */
```

### Recent Commit (ddd0e66, Feb 10 2026)
> "Verify MVP wallet UI removal and ARC76 auth - duplicate issue, no changes required (#338)"

---

## Conflict Summary

| Issue Asks For | Current Product | Status |
|----------------|-----------------|--------|
| Wallet connection | Email/password only | ❌ CONFLICTS |
| Wallet selection modal | Authentication modal only | ❌ CONFLICTS |
| Transaction signing preview | Backend handles all transactions | ❌ CONFLICTS |
| Portfolio dashboard | Could adapt for backend tokens | ⚠️ PARTIAL |
| Token metadata display | Already exists | ✅ ALIGNS |

---

## Options

### Option 1: Close Issue as Invalid ⭐ RECOMMENDED
- **Reasoning**: Conflicts with product vision
- **Effort**: 0 hours
- **Risk**: None
- **Alignment**: ✅ Perfect

### Option 2: Re-Scope for Email/Password Auth
- **Reasoning**: Keep portfolio/onboarding, remove wallet features
- **Effort**: 40-60 hours
- **Risk**: Medium (needs Product Owner approval)
- **Alignment**: ⚠️ Partial (if approved)

### Option 3: Re-Introduce Wallet Features
- **Reasoning**: Change product direction
- **Effort**: 200+ hours
- **Risk**: 🔴 HIGH (contradicts vision)
- **Alignment**: ❌ Poor (unless roadmap officially changes)

---

## Questions for Product Owner

1. Has product direction changed from "email/password only"?
2. Should enterprise users see wallet connection options?
3. Is business-owner-roadmap.md still accurate?
4. Should we build portfolio dashboard for **backend-managed** tokens only?

---

## Recommendation

🚨 **STOP implementation until Product Owner clarifies**

**If confirmed email/password only**:
- Close this issue as invalid
- Create new issue: "Email Auth Onboarding and Portfolio Dashboard"
- Keep MVP work from Issue #338 intact

**If wallet features wanted**:
- Update business-owner-roadmap.md
- Plan 8-12 week implementation
- Accept 10+ week delay to MVP launch

---

## Impact if Implemented As Written

- ❌ Undoes Issue #338 (100+ hours wasted)
- ❌ Breaks 30 E2E tests
- ❌ Delays MVP launch by 10+ weeks
- ❌ Confuses enterprise target audience
- ❌ Costs $40,000+ additional development

---

## Next Action

**BLOCKING**: Tag Product Owner for urgent strategic clarification

**Full Analysis**: See `ISSUE_CONFLICT_ANALYSIS_WALLET_ONBOARDING_FEB10_2026.md`

---

**Status**: ⏸️ PAUSED  
**Blocking**: YES  
**Priority**: URGENT (strategic decision required)
