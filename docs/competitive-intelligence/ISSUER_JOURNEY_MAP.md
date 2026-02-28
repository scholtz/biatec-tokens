# Issuer Journey Map

## Overview

This map documents the end-to-end journey of a **non-crypto-native issuer** — typically a regulated financial firm, SME, or asset manager — from initial discovery through post-launch compliance operations. For each step, we identify friction points, ambiguity moments, confidence breaks, and recommended improvements.

**Persona:** Sarah Chen, Head of Treasury at a mid-sized EU asset management firm. No blockchain background. Familiar with compliance workflows and SaaS tools. Has budget approval for a token issuance pilot.

---

## Journey Stages

### Stage 1: Initial Discovery

**Description:** Sarah finds Biatec through a Google search for "MICA-compliant token issuance platform EU", or via a fintech conference mention.

**User goal:** Understand if Biatec is the right fit before investing time in registration.

**Actions:**
- Lands on marketing homepage
- Looks for pricing, regulatory credibility, and case studies
- Checks if email/password registration is available (no wallet setup required)

**Friction Points:**
- Blockchain terminology on homepage may alienate non-crypto audience
- Unclear differentiation from "DIY blockchain" solutions
- No visible "trusted by" logos or regulatory certification badges

**Ambiguity Moments:**
- "Do I need a crypto wallet?" — common question that must be answered on landing page
- "Is this MICA-compliant by design or just claiming compliance?"

**Confidence Breaks:**
- If the homepage shows wallet connection UI, Sarah assumes this is not for her
- Missing explicit EU regulatory alignment messaging

**Recommended Improvements:**
- Add "No crypto knowledge required" headline on homepage
- Display MICA compliance badge and EU jurisdiction statement prominently
- Add 2–3 customer logos/case studies from regulated entities
- Include FAQ: "Do I need a crypto wallet?" → "No — we handle all blockchain operations securely on your behalf"

---

### Stage 2: Email Signup and Registration

**Description:** Sarah registers with her work email. She expects a professional B2B SaaS registration experience.

**User goal:** Create an account and reach the dashboard in under 3 minutes.

**Actions:**
- Enters email and password
- Confirms email via verification link
- Lands on dashboard or onboarding welcome screen

**Friction Points:**
- If confirmation email lands in spam, trust is immediately damaged
- Unclear what to do after confirming email — no progress indicator shown
- Password requirements not visible until submission attempt

**Ambiguity Moments:**
- "What happens after I confirm my email?"
- "Can I start exploring before completing full setup?"

**Confidence Breaks:**
- Any mention of "wallet address" during registration signals wrong product
- Generic "Welcome!" message with no clear next step

**Recommended Improvements:**
- Show password requirements inline before submission
- Send confirmation email within 30 seconds with clear CTA
- After confirmation: land on "Welcome — here's what to do first" screen
- Show estimated setup time: "Your account will be ready to use in about 15 minutes"

---

### Stage 3: Organization Profile Setup

**Description:** Sarah provides company information: legal name, registration number, jurisdiction, organization type.

**User goal:** Complete profile setup quickly with confidence that information is being used correctly.

**Actions:**
- Fills organization name, legal entity type, country/jurisdiction
- Uploads company registration document (optional at this stage)
- Confirms primary contact information

**Friction Points:**
- Too many required fields upfront creates "form fatigue"
- Unclear which fields affect compliance vs. which are optional
- No draft/save progress — any navigation loses entered data

**Ambiguity Moments:**
- "Legal entity type" — not all users understand the distinction between GmbH, Ltd, SAS
- "Primary jurisdiction" — should this be incorporation or operational jurisdiction?

**Confidence Breaks:**
- If form is lost on navigation, Sarah loses trust immediately
- No explanation of how this data will be used or protected

**Recommended Improvements:**
- Auto-save every field on change (no "save" button required)
- Add tooltip explanations for legal field terms
- Mark required fields with "(Required)" text, not just asterisk
- Show privacy notice inline: "Your data is encrypted and used only for compliance verification"
- Allow partial completion with clear progress indicator

---

### Stage 4: KYC/Identity Verification Submission

**Description:** Sarah submits identity documentation for herself (as authorized signatory) and organization.

**User goal:** Complete KYC with minimum document uploads, knowing exactly what the outcome will be.

**Actions:**
- Uploads passport or national ID
- Uploads proof of company registration
- Optionally uploads proof of regulatory license
- Waits for verification (manual review or automated)

**Friction Points:**
- Document format requirements unclear (JPEG, PDF, file size limits)
- No estimated review time shown
- If verification fails, no specific reason given — only "rejected"

**Ambiguity Moments:**
- "How long will KYC take?"
- "What happens to my data after verification is complete?"

**Confidence Breaks:**
- Verification failure with no explanation creates anxiety
- Long wait times with no status updates feel like process is broken
- Emails about "your KYC application" sound bureaucratic

**Recommended Improvements:**
- State accepted file formats and size limits before upload
- Show estimated review time after submission: "We'll review your documents within 24 hours"
- Send status email at each stage: submitted → in review → approved/needs clarification
- If rejected: provide specific, fixable reason ("Company document appears expired — please upload a document dated within 12 months")
- Replace "KYC" with "Identity Verification" in all user-facing copy

---

### Stage 5: Token Type Selection (Guided)

**Description:** Sarah selects what kind of token she wants to issue. She needs to understand business implications, not technical specifications.

**User goal:** Select the right token type with confidence, understanding what it means for her use case.

**Actions:**
- Views token type options (e.g., Fund Token, Bond Token, Equity Token, Utility Token)
- Reads descriptions of each type
- Selects the most relevant option
- Confirms selection before moving to configuration

**Friction Points:**
- Technical names (ASA, ERC-20, ARC-200) confuse non-crypto users
- "What's the difference between a Fund Token and a Bond Token?" — no comparison view
- Once selected, cannot go back without losing progress

**Ambiguity Moments:**
- "Does my selection affect what compliance requirements apply?"
- "Can I change this later if I choose wrong?"

**Confidence Breaks:**
- Presenting blockchain standard names (ARC-72, ERC-20) to a non-technical user signals complexity
- No "recommended for your use case" guidance

**Recommended Improvements:**
- Use business-language names: "Fund Token," "Bond Token," "Equity Share Token"
- Add a 3-question wizard: "What are you issuing?", "Who will hold it?", "What regulations apply?"
- Show recommended selection based on answers
- Explain: "You can always change your token type before deployment — nothing is permanent yet"
- Hide blockchain standard names from main UI; show as footnote for technical users

---

### Stage 6: Token Parameters Configuration

**Description:** Sarah configures token supply, name, symbol, and issuance rules.

**User goal:** Configure the token correctly on first attempt, with real-time validation.

**Actions:**
- Sets token name and symbol
- Sets total supply or supply model (fixed, capped, flexible)
- Sets decimal places
- Configures transfer restrictions or lock-up periods
- Reviews configuration summary

**Friction Points:**
- "Decimals" concept unfamiliar — why would a fund token need 18 decimal places?
- Jargon like "mint" and "burn" alongside business fields
- No example showing what the configured token will "look like" to investors

**Ambiguity Moments:**
- "What supply should I set for a €1M fund?"
- "Can investors see these parameters?"

**Confidence Breaks:**
- Validation errors appear only on submission, not inline
- Changing supply after configuration destroys downstream data

**Recommended Improvements:**
- Show example: "A €1M fund with 1,000,000 tokens means each token = €1.00 NAV"
- Replace "decimals" with a business-friendly selector: "Precision: Whole units / Cents / Microfraction"
- Add inline validation for every field
- Show "preview" of how token appears in investor dashboard

---

### Stage 7: Compliance Checklist Completion

**Description:** Sarah completes jurisdiction-specific compliance requirements before the token can be issued.

**User goal:** Understand exactly which compliance requirements apply, complete them efficiently, and know the outcome.

**Actions:**
- Reviews compliance checklist (MICA, AIFMD, or other applicable frameworks)
- Uploads required disclosures and prospectus documents
- Answers regulatory attestation questions
- Marks checklist items as complete

**Friction Points:**
- Compliance requirements shown without context — why is each item required?
- Some items require external coordination (legal team, auditor) but no timeline shown
- Checklist feels binary (complete/incomplete) without partial progress

**Ambiguity Moments:**
- "What happens if I skip an optional compliance item?"
- "When do I know I've passed compliance review?"

**Confidence Breaks:**
- Legal document requirements without templates — users don't know what format to use
- No indication of which items are blocking vs. advisory

**Recommended Improvements:**
- Add "Why this is required" tooltip for each checklist item
- Provide document templates for required disclosures
- Show estimated time per item: "~25 minutes with legal team support"
- Display two categories clearly: "Required for launch" vs. "Recommended for compliance excellence"
- Show overall compliance readiness score that updates in real time

---

### Stage 8: Whitelist Management Setup

**Description:** Sarah configures which investors (wallets, accounts) are permitted to hold the token.

**User goal:** Add authorized investors efficiently and understand the access control model.

**Actions:**
- Creates a new whitelist or uses existing one
- Adds investor entries by email or account identifier
- Sets whitelist as active for the token
- Reviews whitelist before finalizing

**Friction Points:**
- "Whitelist" terminology unfamiliar — some users say "allowlist" or "approved investors list"
- Bulk upload process not obvious (CSV format not documented)
- No confirmation that whitelisted investors have been notified

**Ambiguity Moments:**
- "Can investors be on multiple whitelists?"
- "What happens if I add an investor who fails KYC later?"

**Confidence Breaks:**
- If whitelist management screen looks like a developer tool (raw address entry), non-technical users are intimidated
- No clear connection between whitelist and compliance obligations

**Recommended Improvements:**
- Rename to "Approved Investor List" in user-facing copy
- Add CSV upload with clear format spec and template download
- Send automated notification emails to whitelisted investors
- Connect whitelist to compliance status: "All investors must complete verification before purchase"
- Show investor status inline: "Verified ✓ / Pending verification ○ / Failed ✗"

---

### Stage 9: Pre-Launch Compliance Review

**Description:** Sarah conducts a final review of all settings and compliance documentation before requesting deployment.

**User goal:** Have complete confidence that everything is correct before the irreversible step of deployment.

**Actions:**
- Reviews summary of all token parameters
- Reviews compliance checklist status
- Reviews whitelist (investor count, verification status)
- Signs final attestation: "I confirm all information is accurate"
- Submits deployment request

**Friction Points:**
- Summary page hard to read — too much information without hierarchy
- Attestation checkbox feels bureaucratic without explaining what it means legally
- No "preview" of how token will appear to investors

**Ambiguity Moments:**
- "Is deployment instant or does it take time?"
- "Can I make changes after deployment?"

**Confidence Breaks:**
- A "Submit" button without a clear description of what happens next
- No indication of deployment timeline

**Recommended Improvements:**
- Organize summary into three sections: "Token Details," "Compliance Status," "Investor Access"
- Show compliance readiness score prominently: "92/100 — Ready to deploy"
- Explain attestation: "By confirming, you take legal responsibility as authorized issuer"
- Set expectations: "Deployment typically completes within 2–5 minutes"
- Offer "Request expert review" option for high-value tokens

---

### Stage 10: Backend Deployment Confirmation

**Description:** Sarah's token is deployed by Biatec's backend infrastructure. She receives confirmation.

**User goal:** Know that deployment succeeded, understand what to do next.

**Actions:**
- Watches deployment progress indicator
- Receives deployment confirmation (in-app + email)
- Views deployed token summary with key identifiers
- Accesses investor sharing tools

**Friction Points:**
- Progress indicator doesn't communicate what's actually happening
- Technical identifiers (transaction hash, asset ID) shown without explanation
- No guidance on "what to do now that token is live"

**Ambiguity Moments:**
- "How do investors access the token?"
- "Where is my token on the blockchain — and does it matter?"

**Confidence Breaks:**
- If deployment takes longer than expected, no status updates cause anxiety
- Error during deployment with no recovery path

**Recommended Improvements:**
- Show deployment steps: "Setting up token → Configuring access rules → Activating compliance → Complete"
- Hide technical identifiers by default; offer "View technical details" for interested users
- After deployment: show "Your Next Steps" checklist
  - Share token details with investors
  - Set up ongoing compliance monitoring
  - Schedule periodic attestation review
- Send deployment confirmation email with clear investor communication template

---

### Stage 11: Post-Launch Monitoring Access

**Description:** Sarah accesses her token management dashboard to monitor activity, investor holdings, and compliance status.

**User goal:** Stay informed about token performance and maintain ongoing compliance without deep daily engagement.

**Actions:**
- Views token activity dashboard
- Checks investor holding distribution
- Reviews compliance status and upcoming renewal dates
- Receives alerts for events requiring attention

**Friction Points:**
- Dashboard metrics not explained — what does "token velocity" mean for a fund issuer?
- Compliance renewal dates buried in settings, not surfaced on dashboard
- No distinction between "action required" and "informational" notifications

**Ambiguity Moments:**
- "How often do I need to update compliance documentation?"
- "Who sees this dashboard — just me, or my investors too?"

**Confidence Breaks:**
- Alerts with no clear action create anxiety
- Missing data metrics create "is something broken?" uncertainty

**Recommended Improvements:**
- Explain each metric with plain-language labels: "Transfers This Month," "Active Investors," "Next Compliance Review Due"
- Show "Attention required" vs. "Informational" alert categories
- Display a compliance calendar: "Annual MICA attestation due in 47 days"
- Add "Share read-only dashboard" option for investors or auditors

---

### Stage 12: Ongoing Compliance Updates

**Description:** Sarah manages compliance updates — document renewals, regulatory changes, investor additions.

**User goal:** Maintain compliance with minimal effort, confident that nothing is slipping through the cracks.

**Actions:**
- Renews expired compliance documents
- Responds to regulatory change alerts
- Adds new investors to the whitelist
- Exports compliance reports for auditors

**Friction Points:**
- No proactive alerts for approaching renewal deadlines
- Regulatory change notifications too technical — need business interpretation
- Export format not suitable for regulatory submission (missing required fields)

**Ambiguity Moments:**
- "Which regulatory changes actually affect my token?"
- "What happens if my compliance documents expire?"

**Confidence Breaks:**
- Token suspended due to lapsed compliance — with no prior warning
- Export generates file but auditor says required field is missing

**Recommended Improvements:**
- Send email reminders 90, 30, and 7 days before compliance document expiry
- Frame regulatory change alerts in terms of impact: "This change affects tokens issued in the EU. You need to [specific action] by [date]."
- Provide auditor-ready export format with all required fields pre-populated
- Allow delegation: "Share compliance management with your legal team"

---

## Journey Summary: Key Improvement Themes

| Theme | Steps Affected | Priority |
|-------|---------------|----------|
| Plain-language copy (no crypto jargon) | 1, 5, 6, 8, 10 | **CRITICAL** |
| Auto-save and progress preservation | 3, 6, 7 | **HIGH** |
| Contextual guidance at each step | 4, 5, 7, 9 | **HIGH** |
| Proactive status communication | 4, 10, 11, 12 | **HIGH** |
| Post-launch "what next" guidance | 10, 11 | **MEDIUM** |
| Compliance calendar and reminders | 7, 11, 12 | **MEDIUM** |
| Audit-ready export | 11, 12 | **MEDIUM** |

---

*Last updated: 2025 | UX Research and Product Design*
