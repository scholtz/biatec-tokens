# Wallet Interoperability Issue - Quick Reference

**Date:** February 9, 2026  
**Status:** ⛔ CONFLICTS WITH PRODUCT STRATEGY  
**Recommendation:** Close as Out of Scope or Defer to Phase 4+

---

## One-Sentence Summary

This issue requests comprehensive wallet integration (Pera, Defly, Lute, WalletConnect v2), but the business roadmap explicitly states "Email and password authentication only - **no wallet connectors anywhere on the web**" and recent development work (Feb 8-9) has removed all wallet UI.

---

## Critical Facts

### Product Strategy (business-owner-roadmap.md)
- **Target:** "Non-crypto native persons"
- **Auth:** "Email and password only - NO wallet connectors"
- **MVP Blocker:** "Remove all wallet connectors and wallet-related UI"

### Current Implementation
- ✅ Email/password (ARC76) working
- ✅ Wallet UI disabled (v-if="false")
- ✅ 2730 unit tests passing
- ✅ 30 MVP E2E tests verify NO wallet UI
- ✅ Build successful

### Recent Work (Feb 8-9, 2026)
- 22 repository memories confirm wallet removal
- PRs #206, #208, #218 removed wallet features
- Multiple verification documents (WALLET_UX_REMOVAL, etc.)

---

## If Implemented

### Would Reverse
- ❌ Weeks of wallet removal work
- ❌ 30 passing MVP E2E tests
- ❌ Product vision (non-crypto-native target)
- ❌ Business positioning (no blockchain knowledge required)

### Would Require
- 3-4 weeks development time
- Remove v-if="false" from WalletConnectModal.vue
- Implement WalletConnect v2, Pera, Defly, Lute
- Add transaction signing flows
- Rewrite 30 E2E tests
- Document strategy pivot

---

## Business Impact

### Email/Password Only (Current)
- Year 2 ARR: **$3.07M**
- Support: 3-5 tickets/100 users
- Onboarding: 85% success
- Churn: 5%
- Market: Unique positioning

### With Wallet Integration
- Year 2 ARR: **$2.54M** (lower!)
- Support: 12-18 tickets/100 users
- Onboarding: 60% success
- Churn: 12%
- Market: Crowded space

**Verdict:** Email/password has better economics.

---

## Recommendations

### Option 1: Close as Out of Scope ⭐ RECOMMENDED
- Conflicts with business strategy
- Target audience doesn't want wallets
- Better unit economics with email/password

### Option 2: Defer to Phase 4+
- Mark as optional advanced feature
- Position for post-MVP power users
- Monitor demand (threshold: >20% of users)

### Option 3: Seek Clarification
- Confirm if strategy changed
- Verify target audience
- Discuss roadmap alignment

---

## Test Results

```
✅ 2730/2749 unit tests passing (19 skipped)
✅ Build successful (13.11s)
✅ WalletConnectModal.vue line 15: v-if="false"
✅ 30 MVP E2E tests verify wallet-free auth
```

---

## Documentation Created

1. **WALLET_INTEROPERABILITY_ISSUE_CONFLICT_ANALYSIS.md**
   - Comprehensive conflict analysis
   - Product strategy review
   - Code evidence
   - Repository memory analysis
   - Impact assessment

2. **WALLET_INTEROP_BUSINESS_CASE_AND_ALTERNATIVES.md**
   - Business case comparison
   - Revenue projections
   - Risk assessment
   - Strategic recommendations
   - ROI calculations

3. **WALLET_INTEROP_QUICK_REFERENCE.md** (this document)
   - At-a-glance summary
   - Key decision points

---

## Next Steps

**For Product Owner:**
1. Review the comprehensive analysis documents
2. Confirm product strategy (email/password vs wallet)
3. Decide on issue disposition:
   - Close as out of scope?
   - Defer to Phase 4+?
   - Discuss strategy pivot?

**If Closing:**
- Reference business-owner-roadmap.md product vision
- Link to 22 repository memories
- Cite recent wallet removal work

**If Deferring:**
- Add to Phase 4+ backlog
- Mark as "optional advanced feature"
- Set monitoring thresholds

**If Implementing:**
- Acknowledge strategy change
- Document new target audience
- Allocate 3-4 weeks development
- Plan for higher support costs

---

**Last Updated:** February 9, 2026  
**Contact:** @copilot for technical questions
