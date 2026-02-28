# Compliance UX Specification

## Overview

This specification defines the five compliance readiness statuses used throughout the Biatec issuer dashboard and compliance checklist. Each status has a defined label, description, visual indicator, guidance text, and action prompt.

> **Note on status model scope:** This specification covers **compliance document statuses** (how far along a specific regulatory requirement is). The separate `LaunchReadinessPanel` component uses a parallel status model (`not_started | in_progress | needs_attention | ready | blocked`) where `blocked` replaces `compliant` — because launch readiness items can be blocked by dependencies, whereas compliance documents reach `compliant` only after full deployment attestation. These two models are intentionally distinct: compliance document status describes regulatory state, while launch readiness status describes workflow progress.

**Design principles:**
- All labels and descriptions use plain business language (no regulatory acronyms in primary copy)
- Status is always actionable — users know exactly what to do next
- Visual indicators follow WCAG 2.1 AA contrast requirements
- Status definitions align with MICA's issuer compliance model

---

## Status Definitions

### Status 1: `not_started`

**User-Readable Label:** "Not Started"

**Short Description:** "You haven't completed this requirement yet."

**Full Description:**  
This compliance step hasn't been begun. It's either waiting for you to start, or depends on a previous step being completed first. No action has been taken, no data has been saved.

**MICA-Aligned Setup Guidance:**  
Under MICA, issuers must complete all required compliance steps before their token can be offered to the public. Starting early gives you time to gather documents, coordinate with your legal team, and address any questions during review.

**Visual Indicator:**
- **Color:** Gray (`text-gray-400`, `bg-gray-400/10`, `border-gray-400/20`)
- **Icon:** Circle outline (`○`) — signals "empty, awaiting action"
- **Badge style:** Muted, no fill, dashed border
- **Priority indicator:** None (unless this is the "next recommended" item)

**Action Prompt:** "Get Started →"

**Action Route:** Route specific to the compliance item (e.g., `/compliance/legal-docs`)

**Trust Signal Placement:** Not applicable (no evidence yet). Show estimated time: "~25 minutes with legal team."

---

### Status 2: `in_progress`

**User-Readable Label:** "In Progress"

**Short Description:** "You've started this — keep going to complete it."

**Full Description:**  
You've begun this compliance step but haven't finished. Your progress is saved automatically. Return here when you're ready to continue, or if you need to gather additional documents.

**MICA-Aligned Setup Guidance:**  
In-progress items don't block you from continuing to set up your token, but all required items must be fully completed before you can request deployment. If you're waiting for external input (e.g., from your auditor), you can continue other steps in parallel.

**Visual Indicator:**
- **Color:** Blue (`text-blue-400`, `bg-blue-400/10`, `border-blue-400/20`)
- **Icon:** Clock/refresh (`◷`) — signals "work happening, time investment"
- **Badge style:** Soft blue fill, animated pulse if actively processing
- **Progress bar:** Shows estimated % complete based on sub-steps if available

**Action Prompt:** "Continue →"

**Action Route:** Route to continue the specific step where user left off

**Trust Signal Placement:** Show what has been saved: "3 of 7 sections complete. Progress saved."

---

### Status 3: `needs_attention`

**User-Readable Label:** "Needs Your Attention"

**Short Description:** "Something needs to be fixed or updated before this can be approved."

**Full Description:**  
A reviewer (automated or manual) has identified an issue with this compliance item. It may be a document that's expired, an answer that conflicts with other information, or a missing required field. This item will remain incomplete until the issue is resolved.

**MICA-Aligned Setup Guidance:**  
MICA requires issuers to maintain accurate and up-to-date compliance documentation. Documents that are expired or contain inconsistencies may delay your token's approval. Review the specific issue below and update the affected information as soon as possible.

**Visual Indicator:**
- **Color:** Amber/yellow (`text-amber-400`, `bg-amber-400/10`, `border-amber-400/20`)
- **Icon:** Warning triangle (`⚠`) — signals "action required, not blocking"
- **Badge style:** Amber fill with icon — visually distinct from blue but not as severe as red
- **Alert banner:** Show issue description inline below the item label

**Action Prompt:** "Fix Issue →"

**Action Route:** Route directly to the specific field or section with the issue

**Trust Signal Placement:** Show what was previously submitted: "Document submitted: 15 Jan 2025 — Reason for flag: Document expired 31 Dec 2024."

---

### Status 4: `ready`

**User-Readable Label:** "Ready"

**Short Description:** "This requirement is complete and accepted."

**Full Description:**  
This compliance step is fully complete. All required information has been submitted and verified. No further action is needed unless circumstances change (e.g., document expiry) or regulations require an update.

**MICA-Aligned Setup Guidance:**  
Once all required compliance steps reach "Ready" status, your token is eligible for deployment. Biatec's compliance team performs a final review before deployment is confirmed. Keep your contact details up to date so we can reach you if any questions arise during review.

**Visual Indicator:**
- **Color:** Green (`text-green-400`, `bg-green-400/10`, `border-green-400/20`)
- **Icon:** Checkmark (`✓`) — signals "complete, no action needed"
- **Badge style:** Green fill with checkmark — clear visual confirmation
- **Completion timestamp:** Show "Verified on [date]" below label

**Action Prompt:** "View Details →" (informational only — no further action required)

**Action Route:** Read-only view of submitted compliance data

**Trust Signal Placement:** Show verification evidence inline: "Verified by Biatec Compliance Team on 15 Jan 2025. Reference: ATT-2025-1234." Offer option to "Download verification certificate."

---

### Status 5: `compliant`

**User-Readable Label:** "Fully Compliant"

**Short Description:** "All requirements are met. This token meets regulatory standards."

**Full Description:**  
Every compliance requirement for this token has been completed and verified. Your token is in full regulatory alignment and eligible for ongoing operation under applicable frameworks. Continue monitoring for renewal dates and regulatory changes that may require updates.

**MICA-Aligned Setup Guidance:**  
"Fully Compliant" means your token meets the requirements of applicable frameworks including MICA, where applicable. This status must be maintained by renewing documentation before expiry, responding to regulatory change alerts, and completing annual attestation reviews. Biatec will notify you before any renewal deadlines.

**Visual Indicator:**
- **Color:** Purple/biatec-accent (`text-purple-400`, `bg-purple-400/10`, `border-purple-400/20`)
- **Icon:** Shield with checkmark (`🛡`) — signals "fully protected, no gaps"
- **Badge style:** Gradient fill (blue-to-purple, brand-aligned) — premium signal
- **Compliance score:** Show "100/100" or "Compliant" score prominently

**Action Prompt:** "Download Compliance Certificate →"

**Action Route:** Certificate download endpoint

**Trust Signal Placement:** Prominent compliance certificate panel showing:
- All completed items with verification dates
- Token name and identifier
- Compliance framework(s) covered
- Issuer attestation signature
- Biatec verification seal

---

## Visual Indicator Summary

| Status | Label | Color | Icon | Badge Style |
|--------|-------|-------|------|-------------|
| `not_started` | Not Started | Gray | `○` (circle) | Muted, dashed |
| `in_progress` | In Progress | Blue | `◷` (clock) | Soft fill, pulse |
| `needs_attention` | Needs Your Attention | Amber | `⚠` (triangle) | Amber fill, alert |
| `ready` | Ready | Green | `✓` (check) | Green fill, timestamp |
| `compliant` | Fully Compliant | Purple | `🛡` (shield) | Gradient, certificate |

---

## Tailwind CSS Class Reference

```typescript
export const STATUS_CLASSES = {
  not_started: {
    text: 'text-gray-400',
    bg: 'bg-gray-400/10',
    border: 'border-gray-400/20',
    badge: 'text-gray-300 bg-gray-700/50 border border-gray-600',
  },
  in_progress: {
    text: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    badge: 'text-blue-300 bg-blue-900/50 border border-blue-700',
  },
  needs_attention: {
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    badge: 'text-amber-300 bg-amber-900/50 border border-amber-700',
  },
  ready: {
    text: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
    badge: 'text-green-300 bg-green-900/50 border border-green-700',
  },
  compliant: {
    text: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
    badge: 'text-purple-300 bg-purple-900/50 border border-purple-700',
  },
}
```

---

## Status Transition Rules

```
not_started → in_progress     (user begins any sub-step)
in_progress → needs_attention (automated or manual review finds issue)
in_progress → ready           (all sub-steps complete and verified)
needs_attention → in_progress (user edits and resubmits)
ready → needs_attention       (document expires or regulatory change)
ready → compliant             (all required items = ready + final attestation complete)
compliant → needs_attention   (annual review due or regulatory change)
```

---

## Trust Signal Placement

### Where Audit Evidence Appears

| Location | Trust Signal | Purpose |
|----------|-------------|---------|
| Compliance checklist item | Verification date + reference number | Prove individual item is approved |
| Token detail page | "Compliance Score: 94/100" | Give at-a-glance readiness view |
| Pre-launch review | Full compliance summary | Final confidence check before deployment |
| Token dashboard | Compliance badge (green shield) | Reassurance during ongoing operations |
| Investor-facing token page | "Verified Issuer" badge | Build investor confidence |
| Audit export | Complete compliance package with signatures | Regulatory submission evidence |

---

## Accessibility Requirements

- All status indicators must not rely on color alone — icons are required alongside color
- All badges must meet WCAG 2.1 AA contrast (minimum 4.5:1 for text, 3:1 for UI components)
- Status icons must have `aria-label` attributes describing the status
- Focus indicators must be visible on all interactive status elements
- Screen reader announcement when status changes dynamically

---

*Last updated: 2025 | Product Design and Compliance*
