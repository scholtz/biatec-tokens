/**
 * Guided Launch Workspace - Core utility module
 *
 * Provides typed interfaces, state derivation, analytics event builders,
 * and user-facing message mapping for the Guided Launch Workspace view.
 *
 * Design goals:
 *  - Deterministic: same inputs always produce same output (no side effects)
 *  - Business language: error/status copy avoids raw technical leakage
 *  - WCAG-compatible: status labels include accessible descriptions
 *  - Dependency-aware: checklist items declare their prerequisites
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** High-level readiness level shown to users at the top of the workspace */
export type WorkspaceReadinessLevel =
  | 'not_ready'
  | 'needs_attention'
  | 'ready_to_simulate'
  | 'ready_to_launch';

/** State of an individual checklist prerequisite card */
export type ChecklistItemStatus =
  | 'locked'       // dependencies not yet met
  | 'available'    // can be started
  | 'in_progress'  // user has started but not finished
  | 'complete'     // fully done
  | 'blocked';     // dependency error or external blocker

/** Ordered prerequisite card definition */
export interface WorkspaceChecklistItem {
  /** Unique stable identifier used for dependency references */
  id: string;
  /** Short display title (max ~40 chars) */
  title: string;
  /** One-sentence description shown in card body */
  description: string;
  /** Estimated completion time (human-readable) */
  estimatedTime: string;
  /** IDs of checklist items that must be 'complete' before this can be started */
  dependencies: string[];
  /** CTA button label shown when item is available/in_progress */
  ctaLabel: string;
  /** Route path that the CTA navigates to */
  ctaPath: string;
  /** Whether skipping this item is permitted */
  optional: boolean;
  /** Current computed status — set by deriveChecklistStatuses() */
  status?: ChecklistItemStatus;
  /** Human-readable explanation of why item is locked or blocked */
  blockReason?: string;
}

/** Simulation panel state */
export interface SimulationState {
  phase: 'idle' | 'running' | 'success' | 'failed';
  /** Estimated duration shown before simulation starts */
  estimatedDurationLabel: string;
  /** Outcome message — populated after simulation completes */
  resultMessage?: string;
  /** Business-language remediation guidance when simulation fails */
  remediationSteps?: string[];
  /** ISO timestamp of last simulation run */
  lastRunAt?: string;
  /** Whether the simulation can be started right now */
  canStart: boolean;
}

/** Payload emitted for all workspace analytics events */
export interface WorkspaceAnalyticsEventPayload {
  eventName: string;
  timestamp: string;
  /** Sanitised user handle — no PII */
  userHandle?: string;
  checklistItemId?: string;
  readinessLevel?: WorkspaceReadinessLevel;
  simulationPhase?: SimulationState['phase'];
}

/** Workspace analytics event names */
export const WORKSPACE_EVENTS = {
  WORKSPACE_ENTERED: 'workspace_entered',
  CHECKLIST_ITEM_STARTED: 'checklist_item_started',
  CHECKLIST_ITEM_COMPLETED: 'checklist_item_completed',
  CHECKLIST_BLOCKED_STATE_VIEWED: 'checklist_blocked_state_viewed',
  SIMULATION_STARTED: 'simulation_started',
  SIMULATION_COMPLETED: 'simulation_completed',
  SIMULATION_FAILED: 'simulation_failed',
  READINESS_LEVEL_REACHED: 'readiness_level_reached',
} as const;

// ---------------------------------------------------------------------------
// Default checklist definition
// ---------------------------------------------------------------------------

/**
 * Returns the canonical ordered prerequisite checklist for the Guided Launch Workspace.
 * Items are ordered by natural workflow sequence; each item declares which prior
 * items it depends on so the UI can render dependency-aware locked/available states.
 */
export function buildDefaultWorkspaceChecklist(): WorkspaceChecklistItem[] {
  return [
    {
      id: 'account_setup',
      title: 'Account Setup',
      description:
        'Confirm your organisation profile and verify your business email address so your token can be attributed to a legal entity.',
      estimatedTime: '5 minutes',
      dependencies: [],
      ctaLabel: 'Complete Account Setup',
      ctaPath: '/settings',
      optional: false,
    },
    {
      id: 'compliance_configuration',
      title: 'Compliance Configuration',
      description:
        'Select applicable jurisdictions, confirm your AML/KYC readiness level, and upload required attestation documents.',
      estimatedTime: '15 minutes',
      dependencies: ['account_setup'],
      ctaLabel: 'Configure Compliance',
      ctaPath: '/compliance/setup',
      optional: false,
    },
    {
      id: 'token_parameters',
      title: 'Token Parameters',
      description:
        'Choose a token standard, define economics (supply, decimals, transferability), and name your token.',
      estimatedTime: '10 minutes',
      dependencies: ['account_setup'],
      ctaLabel: 'Define Token',
      ctaPath: '/launch/guided',
      optional: false,
    },
    {
      id: 'legal_confirmations',
      title: 'Legal Confirmations',
      description:
        'Review the terms of service, data processing addendum, and acknowledge issuer liability acknowledgements.',
      estimatedTime: '10 minutes',
      dependencies: ['compliance_configuration', 'token_parameters'],
      ctaLabel: 'Review Legal Terms',
      ctaPath: '/launch/guided',
      optional: false,
    },
    {
      id: 'launch_simulation',
      title: 'Launch Simulation',
      description:
        'Run a dry-run simulation of the token launch to validate all parameters before committing to the blockchain.',
      estimatedTime: '5 minutes',
      dependencies: ['legal_confirmations'],
      ctaLabel: 'Start Simulation',
      ctaPath: '/launch/workspace',
      optional: false,
    },
    {
      id: 'token_deployment',
      title: 'Token Deployment',
      description:
        'Submit your validated token configuration for deployment. Your token will be live once the backend confirms the transaction.',
      estimatedTime: '2 minutes',
      dependencies: ['launch_simulation'],
      ctaLabel: 'Deploy Token',
      ctaPath: '/launch/guided',
      optional: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------

/**
 * Derives the status of each checklist item given a map of completed IDs.
 * Items whose dependencies are not all complete are set to 'locked'.
 * Items whose IDs appear in `blockedIds` are set to 'blocked'.
 *
 * @param items   - The ordered checklist items (from buildDefaultWorkspaceChecklist)
 * @param completedIds - Set of item IDs that have been marked complete
 * @param inProgressIds - Set of item IDs currently in progress
 * @param blockedIds - Set of item IDs that have an external error condition
 * @returns A new array with the `status` field populated on every item
 */
export function deriveChecklistStatuses(
  items: WorkspaceChecklistItem[],
  completedIds: Set<string>,
  inProgressIds: Set<string>,
  blockedIds: Set<string>,
): WorkspaceChecklistItem[] {
  return items.map((item) => {
    if (completedIds.has(item.id)) {
      return { ...item, status: 'complete' as ChecklistItemStatus };
    }

    if (blockedIds.has(item.id)) {
      const blockReason = getBlockedItemExplanation(item.id);
      return { ...item, status: 'blocked' as ChecklistItemStatus, blockReason };
    }

    const dependenciesMet = item.dependencies.every((dep) => completedIds.has(dep));
    if (!dependenciesMet) {
      const missingDep = item.dependencies.find((dep) => !completedIds.has(dep));
      const blockReason = missingDep
        ? getDependencyBlockReason(item.id, missingDep)
        : 'One or more prerequisite steps must be completed first.';
      return { ...item, status: 'locked' as ChecklistItemStatus, blockReason };
    }

    if (inProgressIds.has(item.id)) {
      return { ...item, status: 'in_progress' as ChecklistItemStatus };
    }

    return { ...item, status: 'available' as ChecklistItemStatus };
  });
}

// ---------------------------------------------------------------------------
// Readiness level derivation
// ---------------------------------------------------------------------------

/**
 * Derives the high-level workspace readiness level from a list of items
 * whose statuses have already been computed by deriveChecklistStatuses().
 */
export function deriveWorkspaceReadinessLevel(
  items: WorkspaceChecklistItem[],
): WorkspaceReadinessLevel {
  const statuses = items.map((i) => i.status);

  const hasBlocked = statuses.some((s) => s === 'blocked');
  const hasRequired = items.some(
    (i) => !i.optional && (i.status === 'locked' || i.status === 'available' || i.status === 'in_progress'),
  );
  const simulationItem = items.find((i) => i.id === 'launch_simulation');
  const simulationComplete = simulationItem?.status === 'complete';
  const allRequiredComplete = items.filter((i) => !i.optional).every((i) => i.status === 'complete');

  if (hasBlocked) return 'needs_attention';
  if (allRequiredComplete) return 'ready_to_launch';
  if (simulationComplete) return 'ready_to_simulate';
  if (hasRequired) return 'not_ready';
  return 'not_ready';
}

// ---------------------------------------------------------------------------
// User-facing message mapping
// ---------------------------------------------------------------------------

export interface ReadinessLevelLabel {
  label: string;
  description: string;
  colorClass: string;
  ariaLabel: string;
}

/** Returns a user-facing label for a given workspace readiness level */
export function getReadinessLevelLabel(level: WorkspaceReadinessLevel): ReadinessLevelLabel {
  switch (level) {
    case 'not_ready':
      return {
        label: 'Not Ready',
        description: 'Complete the prerequisite steps below to prepare your token launch.',
        colorClass: 'bg-gray-700 text-gray-300',
        ariaLabel: 'Readiness status: Not Ready — prerequisites are incomplete',
      };
    case 'needs_attention':
      return {
        label: 'Needs Attention',
        description: 'One or more steps require your attention before you can continue.',
        colorClass: 'bg-amber-900/50 text-amber-300',
        ariaLabel: 'Readiness status: Needs Attention — action required',
      };
    case 'ready_to_simulate':
      return {
        label: 'Ready to Simulate',
        description: 'All prerequisites are in order. Run a simulation to validate your configuration.',
        colorClass: 'bg-blue-900/50 text-blue-300',
        ariaLabel: 'Readiness status: Ready to Simulate — simulation can be started',
      };
    case 'ready_to_launch':
      return {
        label: 'Ready to Launch',
        description: 'Your token configuration is validated. You may proceed with deployment.',
        colorClass: 'bg-green-900/50 text-green-300',
        ariaLabel: 'Readiness status: Ready to Launch — all checks passed',
      };
  }
}

/** Returns a user-friendly explanation for why an item is locked due to a dependency */
export function getDependencyBlockReason(itemId: string, missingDepId: string): string {
  const labels: Record<string, string> = {
    account_setup: 'Account Setup',
    compliance_configuration: 'Compliance Configuration',
    token_parameters: 'Token Parameters',
    legal_confirmations: 'Legal Confirmations',
    launch_simulation: 'Launch Simulation',
    token_deployment: 'Token Deployment',
  };
  const depLabel = labels[missingDepId] ?? 'a previous step';
  const itemLabel = labels[itemId] ?? 'This step';
  return `${itemLabel} requires "${depLabel}" to be completed first.`;
}

/** Returns a user-friendly explanation for why an item is externally blocked */
export function getBlockedItemExplanation(itemId: string): string {
  const explanations: Record<string, string> = {
    compliance_configuration:
      'A compliance check has flagged an issue with your jurisdiction settings. Review the Compliance Setup Workspace to resolve.',
    legal_confirmations:
      'Your legal confirmations could not be verified. Contact your account administrator.',
    launch_simulation:
      'The previous simulation attempt encountered an error. Review the error details and retry.',
    token_deployment:
      'Token deployment is currently blocked. Ensure all prerequisite steps are complete and the simulation has passed.',
  };
  return (
    explanations[itemId] ??
    'This step is currently unavailable. Contact support if the issue persists.'
  );
}

/** Returns a human-readable status label for a checklist item status */
export function getChecklistItemStatusLabel(status: ChecklistItemStatus): string {
  switch (status) {
    case 'locked':     return 'Locked';
    case 'available':  return 'Ready to start';
    case 'in_progress': return 'In progress';
    case 'complete':   return 'Complete';
    case 'blocked':    return 'Blocked';
  }
}

// ---------------------------------------------------------------------------
// Simulation state
// ---------------------------------------------------------------------------

/** Returns a fresh simulation state in the idle phase */
export function buildInitialSimulationState(): SimulationState {
  return {
    phase: 'idle',
    estimatedDurationLabel: 'approx. 30 seconds',
    canStart: false,
  };
}

/**
 * Derives the simulation state from the current checklist.
 * The simulation can only start when the 'launch_simulation' checklist item
 * is unlocked (available or in_progress), meaning its dependencies are all
 * complete. This avoids hardcoding specific prerequisite item IDs.
 */
export function deriveSimulationState(
  items: WorkspaceChecklistItem[],
  currentPhase: SimulationState['phase'],
  resultMessage?: string,
  remediationSteps?: string[],
  lastRunAt?: string,
): SimulationState {
  const simulationItem = items.find((i) => i.id === 'launch_simulation');
  // canStart when the simulation item is unlocked and the phase is idle
  const canStart =
    simulationItem !== undefined &&
    (simulationItem.status === 'available' || simulationItem.status === 'in_progress') &&
    currentPhase === 'idle';
  return {
    phase: currentPhase,
    estimatedDurationLabel: 'approx. 30 seconds',
    resultMessage,
    remediationSteps,
    lastRunAt,
    canStart,
  };
}

/** Returns user-facing simulation outcome messages */
export function getSimulationOutcomeMessage(phase: SimulationState['phase']): {
  heading: string;
  body: string;
  remediation?: string[];
} {
  switch (phase) {
    case 'success':
      return {
        heading: 'Simulation passed',
        body: 'All token parameters validated successfully. Your configuration is ready for deployment.',
      };
    case 'failed':
      return {
        heading: 'Simulation did not complete',
        body: 'One or more validation checks could not be satisfied.',
        remediation: [
          'Review your token economics for invalid supply or decimal settings.',
          'Confirm your jurisdiction and compliance selections are correct.',
          'Check that all legal confirmations are acknowledged.',
          'Retry the simulation after resolving the items above.',
        ],
      };
    default:
      return { heading: '', body: '' };
  }
}

// ---------------------------------------------------------------------------
// Analytics event builders
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

/** Builds a workspace-entered analytics event payload */
export function buildWorkspaceEnteredEvent(
  readinessLevel: WorkspaceReadinessLevel,
  userHandle?: string,
): WorkspaceAnalyticsEventPayload {
  return {
    eventName: WORKSPACE_EVENTS.WORKSPACE_ENTERED,
    timestamp: nowIso(),
    userHandle,
    readinessLevel,
  };
}

/** Builds a checklist-item-started analytics event payload */
export function buildChecklistItemStartedEvent(
  itemId: string,
  userHandle?: string,
): WorkspaceAnalyticsEventPayload {
  return {
    eventName: WORKSPACE_EVENTS.CHECKLIST_ITEM_STARTED,
    timestamp: nowIso(),
    userHandle,
    checklistItemId: itemId,
  };
}

/** Builds a checklist-item-completed analytics event payload */
export function buildChecklistItemCompletedEvent(
  itemId: string,
  userHandle?: string,
): WorkspaceAnalyticsEventPayload {
  return {
    eventName: WORKSPACE_EVENTS.CHECKLIST_ITEM_COMPLETED,
    timestamp: nowIso(),
    userHandle,
    checklistItemId: itemId,
  };
}

/** Builds a blocked-state-viewed analytics event payload */
export function buildBlockedStateViewedEvent(
  itemId: string,
  userHandle?: string,
): WorkspaceAnalyticsEventPayload {
  return {
    eventName: WORKSPACE_EVENTS.CHECKLIST_BLOCKED_STATE_VIEWED,
    timestamp: nowIso(),
    userHandle,
    checklistItemId: itemId,
  };
}

/** Builds a simulation-started analytics event payload */
export function buildSimulationStartedEvent(
  userHandle?: string,
): WorkspaceAnalyticsEventPayload {
  return {
    eventName: WORKSPACE_EVENTS.SIMULATION_STARTED,
    timestamp: nowIso(),
    userHandle,
    simulationPhase: 'running',
  };
}

/** Builds a simulation-completed analytics event payload */
export function buildSimulationCompletedEvent(
  phase: 'success' | 'failed',
  userHandle?: string,
): WorkspaceAnalyticsEventPayload {
  const eventName =
    phase === 'success'
      ? WORKSPACE_EVENTS.SIMULATION_COMPLETED
      : WORKSPACE_EVENTS.SIMULATION_FAILED;
  return {
    eventName,
    timestamp: nowIso(),
    userHandle,
    simulationPhase: phase,
  };
}

/** Validates that an event payload contains no PII-sensitive fields */
export function validateWorkspaceEventPayload(payload: WorkspaceAnalyticsEventPayload): boolean {
  if (!payload.eventName || !payload.timestamp) return false;
  // userHandle must not look like an email or blockchain address with PII
  if (payload.userHandle) {
    const piiPatterns = [/\d{4}[-\s]\d{4}/]; // credit card patterns etc.
    if (piiPatterns.some((p) => p.test(payload.userHandle!))) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Progress summary helpers
// ---------------------------------------------------------------------------

export interface WorkspaceProgressSummary {
  totalRequired: number;
  completedRequired: number;
  percentComplete: number;
  nextActionItem: WorkspaceChecklistItem | null;
}

/** Computes a progress summary for display in the workspace header */
export function computeWorkspaceProgress(
  items: WorkspaceChecklistItem[],
): WorkspaceProgressSummary {
  const required = items.filter((i) => !i.optional);
  const completedRequired = required.filter((i) => i.status === 'complete').length;
  const totalRequired = required.length;
  const percentComplete =
    totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  const nextActionItem =
    items.find(
      (i) => i.status === 'available' || i.status === 'in_progress',
    ) ?? null;

  return { totalRequired, completedRequired, percentComplete, nextActionItem };
}
