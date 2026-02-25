/**
 * Business Command Center Utility
 *
 * Deterministic, testable helpers for the post-launch operations command center.
 * Provides:
 * - Role-aware priority card computation (issuer operator, compliance manager)
 * - Vocabulary guard — no wallet/protocol/chain jargon in user-facing outputs
 * - What/why/how message structure for every action card
 * - Analytics event builders aligned with existing cockpit naming conventions
 * - Status mapping from API response shapes to business-language severity labels
 *
 * Design goals:
 * - Pure functions, no side effects (side-effectful analytics helpers are marked)
 * - Deterministic: identical inputs always produce identical outputs
 * - Composable with router guards, E2E fixture setup, and existing stores
 * - Zero references to wallets, blockchain internals, or protocol terminology
 *
 * Related files:
 * - src/utils/canonicalLaunchWorkspace.ts  (workspace state derivation)
 * - src/utils/cockpitStatusDerivation.ts   (health indicator derivation)
 * - src/utils/cockpitAnalytics.ts          (analytics dispatch helpers)
 * - src/utils/operationsErrorMessages.ts   (error message catalogue)
 *
 * Issue: Next MVP — business command center for post-launch token operations
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Operator role types
// ---------------------------------------------------------------------------

/**
 * The role from which the command center is being used.
 * Only roles that have distinct priority-card sets are represented here.
 */
export type OperatorRole = 'issuer_operator' | 'compliance_manager';

// ---------------------------------------------------------------------------
// Severity and status types
// ---------------------------------------------------------------------------

/**
 * Business-language severity label for status cards.
 * Uses plain words that non-technical operators understand immediately.
 */
export type StatusSeverity = 'clear' | 'review_needed' | 'action_required';

/**
 * Maps a raw API status string to a business-language severity label.
 * Accepts any case; normalises before comparison.
 *
 * @param raw - The status string returned by the API (e.g., 'healthy', 'warning', 'critical')
 * @returns StatusSeverity
 */
export function mapApiStatusToSeverity(raw: string | null | undefined): StatusSeverity {
  if (!raw) return 'review_needed';
  const normalised = raw.trim().toLowerCase();
  if (normalised === 'healthy' || normalised === 'ok' || normalised === 'active' || normalised === 'clear') {
    return 'clear';
  }
  if (normalised === 'warning' || normalised === 'pending' || normalised === 'in_review') {
    return 'review_needed';
  }
  if (normalised === 'critical' || normalised === 'error' || normalised === 'failed' || normalised === 'blocked') {
    return 'action_required';
  }
  return 'review_needed';
}

/**
 * Returns the human-readable label for a StatusSeverity value.
 * Used in card headings and ARIA live-region announcements.
 */
export function getSeverityLabel(severity: StatusSeverity): string {
  switch (severity) {
    case 'clear':           return 'All clear';
    case 'review_needed':   return 'Review needed';
    case 'action_required': return 'Action required';
  }
}

/**
 * Returns the ARIA role attribute string appropriate for a status card severity.
 */
export function getSeverityAriaRole(severity: StatusSeverity): 'status' | 'alert' {
  return severity === 'action_required' ? 'alert' : 'status';
}

// ---------------------------------------------------------------------------
// Priority action card types
// ---------------------------------------------------------------------------

/**
 * A single priority action card shown on the command center.
 * Every card follows the what/why/how structure to guide non-technical operators.
 */
export interface PriorityActionCard {
  /** Stable identifier used for analytics and test selection */
  id: string;
  /** Business-language heading (≤70 chars) */
  heading: string;
  /** What happened — plain sentence describing the current state (≤150 chars) */
  what: string;
  /** Why it matters — business consequence of not acting (≤150 chars) */
  why: string;
  /** How to act — single-step next action the operator should take (≤100 chars) */
  how: string;
  /** The severity / urgency of this card */
  severity: StatusSeverity;
  /** CTA button label (≤40 chars) */
  ctaLabel: string;
  /** Router path or absolute URL the CTA navigates to */
  ctaPath: string;
  /** Whether this card is relevant to this operator's role */
  roleRelevant: boolean;
}

/**
 * Subset of token and deployment context required to compute priority cards.
 * Mirrors shapes returned by the token and compliance API contracts.
 */
export interface CommandCenterContext {
  /** Whether any tokens have been deployed successfully */
  hasDeployedTokens: boolean;
  /** Number of compliance checkpoints that are not yet complete */
  pendingComplianceCount: number;
  /** Raw deployment status string from API (e.g., 'healthy', 'warning', 'critical') */
  deploymentStatusRaw: string | null;
  /** Raw compliance status string from API */
  complianceStatusRaw: string | null;
  /** Whether there is a pending distribution or transfer awaiting review */
  hasPendingDistribution: boolean;
  /** Whether a stakeholder update has been drafted or sent recently */
  hasRecentStakeholderUpdate: boolean;
  /** Whether the operator's team has any open onboarding tasks */
  hasOpenOnboardingTasks: boolean;
  /** Number of days since the last compliance review was completed */
  daysSinceLastComplianceReview: number | null;
}

/**
 * Default empty context — useful in tests and for degraded-state rendering.
 */
export const EMPTY_COMMAND_CENTER_CONTEXT: CommandCenterContext = {
  hasDeployedTokens: false,
  pendingComplianceCount: 0,
  deploymentStatusRaw: null,
  complianceStatusRaw: null,
  hasPendingDistribution: false,
  hasRecentStakeholderUpdate: false,
  hasOpenOnboardingTasks: false,
  daysSinceLastComplianceReview: null,
};

// ---------------------------------------------------------------------------
// Priority card computation
// ---------------------------------------------------------------------------

/**
 * Computes the ordered list of priority action cards for a given operator role
 * and context. Cards are returned in descending urgency order (most urgent first).
 *
 * This is the primary entry point for the command center priority panel.
 *
 * @param role    - The operator's current role
 * @param context - The current deployment and compliance context
 * @returns       Ordered array of PriorityActionCard
 */
export function computePriorityCards(
  role: OperatorRole,
  context: CommandCenterContext,
): PriorityActionCard[] {
  const cards: PriorityActionCard[] = [];

  const deploymentSeverity = mapApiStatusToSeverity(context.deploymentStatusRaw);
  const complianceSeverity = mapApiStatusToSeverity(context.complianceStatusRaw);

  // --- Card: no tokens deployed yet (always shown, highest priority if applicable) ---
  if (!context.hasDeployedTokens) {
    cards.push({
      id: 'no_tokens_deployed',
      heading: 'Launch your first token',
      what: 'No tokens have been deployed to the network yet.',
      why: 'Your investors and stakeholders cannot interact with the token until it is live.',
      how: 'Open the Guided Launch wizard to create and deploy your first token.',
      severity: 'action_required',
      ctaLabel: 'Start Guided Launch',
      ctaPath: '/launch/guided',
      roleRelevant: true,
    });
  }

  // --- Card: compliance checkpoints pending ---
  if (context.pendingComplianceCount > 0) {
    const label = context.pendingComplianceCount === 1
      ? '1 compliance checkpoint is incomplete'
      : `${context.pendingComplianceCount} compliance checkpoints are incomplete`;
    cards.push({
      id: 'compliance_checkpoints_pending',
      heading: 'Complete compliance setup',
      what: label + '.',
      why: 'Unresolved compliance items may limit transfer eligibility and trigger regulatory review.',
      how: 'Review and complete the outstanding compliance checkpoints now.',
      severity: complianceSeverity === 'clear' ? 'review_needed' : complianceSeverity,
      ctaLabel: 'Review Compliance',
      ctaPath: '/compliance/setup',
      roleRelevant: true,
    });
  }

  // --- Card: deployment status warning or critical ---
  if (deploymentSeverity !== 'clear' && context.hasDeployedTokens) {
    cards.push({
      id: 'deployment_status_issue',
      heading: 'Deployment health needs attention',
      what: 'One or more deployed tokens have a status that requires your review.',
      why: 'Unresolved deployment issues may prevent token operations from completing successfully.',
      how: 'Open the token dashboard to see what needs attention.',
      severity: deploymentSeverity,
      ctaLabel: 'View Token Dashboard',
      ctaPath: '/dashboard',
      roleRelevant: true,
    });
  }

  // --- Card: pending distribution review (issuer operator only) ---
  if (context.hasPendingDistribution) {
    cards.push({
      id: 'pending_distribution',
      heading: 'Approve pending distribution',
      what: 'A transfer or distribution is waiting for your review and approval.',
      why: 'Distributions left pending may delay investor allocations and raise audit questions.',
      how: 'Open the compliance dashboard to review and approve the pending items.',
      severity: 'review_needed',
      ctaLabel: 'Review Distribution',
      ctaPath: '/compliance/setup',
      roleRelevant: role === 'issuer_operator',
    });
  }

  // --- Card: overdue compliance review ---
  const COMPLIANCE_REVIEW_OVERDUE_DAYS = 90;
  if (
    context.daysSinceLastComplianceReview !== null &&
    context.daysSinceLastComplianceReview >= COMPLIANCE_REVIEW_OVERDUE_DAYS
  ) {
    cards.push({
      id: 'compliance_review_overdue',
      heading: 'Schedule compliance review',
      what: `Your last compliance review was ${context.daysSinceLastComplianceReview} days ago.`,
      why: 'Regular compliance reviews are required to maintain good standing with regulators and auditors.',
      how: 'Schedule a compliance review or update your compliance documentation.',
      severity: context.daysSinceLastComplianceReview >= 180 ? 'action_required' : 'review_needed',
      ctaLabel: 'Start Compliance Review',
      ctaPath: '/compliance/setup',
      roleRelevant: role === 'compliance_manager',
    });
  }

  // --- Card: stakeholder update overdue ---
  if (!context.hasRecentStakeholderUpdate && context.hasDeployedTokens) {
    cards.push({
      id: 'stakeholder_update_due',
      heading: 'Send investor status update',
      what: 'No recent stakeholder update has been sent for your deployed tokens.',
      why: 'Regular updates build investor trust and reduce inbound support questions.',
      how: 'Use the stakeholder communication helper to draft and send a status summary.',
      severity: 'review_needed',
      ctaLabel: 'Draft Update',
      ctaPath: '/operations#stakeholder',
      roleRelevant: role === 'issuer_operator',
    });
  }

  // --- Card: open onboarding tasks ---
  if (context.hasOpenOnboardingTasks) {
    cards.push({
      id: 'open_onboarding_tasks',
      heading: 'Finish team onboarding',
      what: 'Your team has onboarding tasks that have not been completed.',
      why: 'Incomplete onboarding may limit your team\'s ability to perform critical operations.',
      how: 'Open the enterprise onboarding guide to complete the remaining tasks.',
      severity: 'review_needed',
      ctaLabel: 'Continue Onboarding',
      ctaPath: '/enterprise/onboarding',
      roleRelevant: role === 'issuer_operator',
    });
  }

  // Sort: action_required first, then review_needed, then clear
  const SEVERITY_ORDER: Record<StatusSeverity, number> = {
    action_required: 0,
    review_needed:   1,
    clear:           2,
  };

  return cards.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ---------------------------------------------------------------------------
// Vocabulary guard
// ---------------------------------------------------------------------------

/**
 * List of protocol/wallet terms that must not appear in user-facing command-center copy.
 * Used to enforce plain-language requirements in tests and content validation.
 */
export const FORBIDDEN_JARGON_TERMS: string[] = [
  'wallet',
  'blockchain',
  'on-chain',
  'transaction hash',
  'txid',
  'gas',
  'nonce',
  'private key',
  'mnemonic',
  'seed phrase',
  'smart contract',
  'defi',
  'dex',
  'ledger',
  'metamask',
  'pera',
  'defly',
  'wormhole',
  'algorand',    // internal network name — not for primary guidance copy
  'ethereum',    // internal network name
  'solidity',
];

/**
 * Checks whether a user-facing string contains any forbidden jargon terms.
 * Single-word terms use word-boundary matching to avoid false positives in
 * common English words (e.g., "pera" must not match "operator").
 * Multi-word and hyphenated terms use substring matching.
 *
 * @param text - The string to check
 * @returns Array of forbidden terms found in the text (empty if none)
 */
export function findForbiddenJargon(text: string): string[] {
  const lower = text.toLowerCase();
  return FORBIDDEN_JARGON_TERMS.filter((term) => {
    const lowerTerm = term.toLowerCase();
    // Multi-word or hyphenated terms: use substring match
    if (lowerTerm.includes(' ') || lowerTerm.includes('-')) {
      return lower.includes(lowerTerm);
    }
    // Single-word terms: use word-boundary regex to avoid false positives
    // (e.g., 'pera' must not match 'operator'; 'dex' must not match 'index')
    const escapedTerm = lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escapedTerm}\\b`).test(lower);
  });
}

/**
 * Returns true if the text is free of forbidden jargon.
 */
export function isJargonFree(text: string): boolean {
  return findForbiddenJargon(text).length === 0;
}

/**
 * Validates that all user-facing copy on a PriorityActionCard is jargon-free.
 * Returns an array of violation descriptions (empty if all clear).
 */
export function validateCardCopy(card: PriorityActionCard): string[] {
  const violations: string[] = [];
  const fieldsToCheck: Array<keyof Pick<PriorityActionCard, 'heading' | 'what' | 'why' | 'how' | 'ctaLabel'>> =
    ['heading', 'what', 'why', 'how', 'ctaLabel'];
  for (const field of fieldsToCheck) {
    const jargon = findForbiddenJargon(card[field]);
    if (jargon.length > 0) {
      violations.push(`Card "${card.id}" field "${field}" contains forbidden terms: ${jargon.join(', ')}`);
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Stakeholder communication helpers
// ---------------------------------------------------------------------------

/**
 * A templated stakeholder update block.
 */
export interface StakeholderUpdateTemplate {
  /** Short subject line for the update (≤80 chars) */
  subject: string;
  /** Plain-language body paragraphs (2–4 sentences per paragraph) */
  body: string[];
  /** The severity context that triggered the template */
  triggerSeverity: StatusSeverity;
}

/**
 * Returns a pre-populated stakeholder update template for the current context.
 * The template uses business outcomes only — no chain references.
 *
 * @param context - Current command center context
 * @returns StakeholderUpdateTemplate
 */
export function buildStakeholderUpdateTemplate(context: CommandCenterContext): StakeholderUpdateTemplate {
  const deploymentSeverity = mapApiStatusToSeverity(context.deploymentStatusRaw);
  const complianceSeverity = mapApiStatusToSeverity(context.complianceStatusRaw);

  const overallSeverity: StatusSeverity =
    deploymentSeverity === 'action_required' || complianceSeverity === 'action_required'
      ? 'action_required'
      : deploymentSeverity === 'review_needed' || complianceSeverity === 'review_needed'
        ? 'review_needed'
        : 'clear';

  if (overallSeverity === 'action_required') {
    return {
      subject: 'Important: Token operations update requires your attention',
      body: [
        'We are writing to inform you that one or more items related to your token issuance require prompt attention. Our team is actively working to resolve the outstanding items.',
        'Until these items are resolved, certain token operations may be temporarily limited. We will provide a further update once the situation is resolved.',
        'If you have questions, please contact our support team directly.',
      ],
      triggerSeverity: 'action_required',
    };
  }

  if (overallSeverity === 'review_needed') {
    return {
      subject: 'Token operations status update',
      body: [
        'This is a routine update on the status of your token issuance. All core operations are running normally, and our team is reviewing a small number of items for completeness.',
        'No immediate action is required from you at this time. We will follow up if anything requires your input.',
      ],
      triggerSeverity: 'review_needed',
    };
  }

  return {
    subject: 'Token operations: all systems clear',
    body: [
      'We are pleased to confirm that all token operations are running smoothly. Compliance checkpoints are up to date, and there are no outstanding items requiring your attention.',
      'This is your regular operational status summary. We will continue to send updates on a scheduled basis.',
    ],
    triggerSeverity: 'clear',
  };
}

// ---------------------------------------------------------------------------
// Analytics event builders
// ---------------------------------------------------------------------------

/**
 * Shape of a command-center analytics event.
 * Aligned with the cockpit analytics taxonomy (cockpitAnalytics.ts).
 */
export interface CommandCenterAnalyticsEvent {
  event: string;
  category: 'CommandCenter';
  action: string;
  label: string;
  metadata: Record<string, string | number | boolean | null>;
  timestamp: string;
}

/**
 * Builds an analytics event for a command-center page visit.
 */
export function buildCommandCenterVisitEvent(role: OperatorRole): CommandCenterAnalyticsEvent {
  return {
    event: 'command_center_visit',
    category: 'CommandCenter',
    action: 'Visit',
    label: role,
    metadata: { role },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds an analytics event for a priority action card being opened/expanded.
 */
export function buildCardOpenEvent(card: PriorityActionCard, role: OperatorRole): CommandCenterAnalyticsEvent {
  return {
    event: 'command_center_card_open',
    category: 'CommandCenter',
    action: 'CardOpen',
    label: card.id,
    metadata: { cardId: card.id, severity: card.severity, role },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds an analytics event for a task CTA being clicked.
 */
export function buildTaskCompletionEvent(card: PriorityActionCard, role: OperatorRole): CommandCenterAnalyticsEvent {
  return {
    event: 'command_center_task_complete',
    category: 'CommandCenter',
    action: 'TaskComplete',
    label: card.id,
    metadata: { cardId: card.id, severity: card.severity, role, ctaPath: card.ctaPath },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds an analytics event for a status filter change.
 */
export function buildStatusFilterEvent(
  filterValue: StatusSeverity | 'all',
  role: OperatorRole,
): CommandCenterAnalyticsEvent {
  return {
    event: 'command_center_filter_change',
    category: 'CommandCenter',
    action: 'FilterChange',
    label: filterValue,
    metadata: { filter: filterValue, role },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Dispatches a command-center analytics event via window.dispatchEvent.
 * Side-effectful — do not call in pure unit tests without mocking window.dispatchEvent.
 */
export function dispatchCommandCenterEvent(event: CommandCenterAnalyticsEvent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('biatec:analytics', { detail: event }));
  }
}

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

/** Canonical path for the post-launch command center */
export const COMMAND_CENTER_CANONICAL_PATH = '/operations';

/** Legacy paths that should redirect to the canonical command-center route */
export const COMMAND_CENTER_LEGACY_PATHS: string[] = ['/operations/legacy'];

/**
 * Returns true if the given path is the canonical command-center path.
 */
export function isCommandCenterPath(path: string): boolean {
  return path === COMMAND_CENTER_CANONICAL_PATH;
}

/**
 * Returns true if the given path is a legacy operations path that should redirect.
 */
export function isLegacyOperationsPath(path: string): boolean {
  return COMMAND_CENTER_LEGACY_PATHS.includes(path);
}
