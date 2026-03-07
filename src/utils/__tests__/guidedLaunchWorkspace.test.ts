/**
 * Unit Tests: Guided Launch Workspace Utility
 *
 * Validates the complete workspace utility contract:
 *   AC #1  Checklist items are correctly defined with valid dependencies
 *   AC #2  Checklist status derivation is correct for all state combinations
 *   AC #3  Readiness level derivation reflects checklist state accurately
 *   AC #4  User-facing messages are business-language (no technical leakage)
 *   AC #5  Simulation state derivation enforces prerequisites
 *   AC #6  Analytics event builders produce valid, PII-safe payloads
 *   AC #7  Progress summary computation is accurate
 *   AC #8  All helpers are deterministic — same input, same output
 *
 * Zero arbitrary timeouts. Zero async I/O. Pure synchronous unit tests.
 */

import { describe, it, expect } from 'vitest';
import {
  buildDefaultWorkspaceChecklist,
  deriveChecklistStatuses,
  deriveWorkspaceReadinessLevel,
  getReadinessLevelLabel,
  getDependencyBlockReason,
  getBlockedItemExplanation,
  getChecklistItemStatusLabel,
  buildInitialSimulationState,
  deriveSimulationState,
  getSimulationOutcomeMessage,
  buildWorkspaceEnteredEvent,
  buildChecklistItemStartedEvent,
  buildChecklistItemCompletedEvent,
  buildBlockedStateViewedEvent,
  buildSimulationStartedEvent,
  buildSimulationCompletedEvent,
  validateWorkspaceEventPayload,
  computeWorkspaceProgress,
  WORKSPACE_EVENTS,
  type WorkspaceChecklistItem,
  type WorkspaceReadinessLevel,
  type ChecklistItemStatus,
} from '../guidedLaunchWorkspace';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusMap(items: WorkspaceChecklistItem[]): Record<string, ChecklistItemStatus> {
  const map: Record<string, ChecklistItemStatus> = {};
  for (const item of items) {
    if (item.status) map[item.id] = item.status;
  }
  return map;
}

// ---------------------------------------------------------------------------
// AC #1: Default checklist definition
// ---------------------------------------------------------------------------

describe('buildDefaultWorkspaceChecklist', () => {
  it('returns at least 5 items', () => {
    const items = buildDefaultWorkspaceChecklist();
    expect(items.length).toBeGreaterThanOrEqual(5);
  });

  it('all items have required fields', () => {
    const items = buildDefaultWorkspaceChecklist();
    for (const item of items) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.ctaLabel).toBeTruthy();
      expect(item.ctaPath).toBeTruthy();
      expect(Array.isArray(item.dependencies)).toBe(true);
      expect(typeof item.optional).toBe('boolean');
    }
  });

  it('first item (account_setup) has no dependencies', () => {
    const items = buildDefaultWorkspaceChecklist();
    const first = items.find((i) => i.id === 'account_setup');
    expect(first).toBeDefined();
    expect(first!.dependencies).toHaveLength(0);
  });

  it('compliance_configuration depends on account_setup', () => {
    const items = buildDefaultWorkspaceChecklist();
    const compliance = items.find((i) => i.id === 'compliance_configuration');
    expect(compliance!.dependencies).toContain('account_setup');
  });

  it('token_parameters depends on account_setup', () => {
    const items = buildDefaultWorkspaceChecklist();
    const tokenParams = items.find((i) => i.id === 'token_parameters');
    expect(tokenParams!.dependencies).toContain('account_setup');
  });

  it('legal_confirmations depends on both compliance_configuration and token_parameters', () => {
    const items = buildDefaultWorkspaceChecklist();
    const legal = items.find((i) => i.id === 'legal_confirmations');
    expect(legal!.dependencies).toContain('compliance_configuration');
    expect(legal!.dependencies).toContain('token_parameters');
  });

  it('launch_simulation depends on legal_confirmations', () => {
    const items = buildDefaultWorkspaceChecklist();
    const sim = items.find((i) => i.id === 'launch_simulation');
    expect(sim!.dependencies).toContain('legal_confirmations');
  });

  it('token_deployment depends on launch_simulation', () => {
    const items = buildDefaultWorkspaceChecklist();
    const deploy = items.find((i) => i.id === 'token_deployment');
    expect(deploy!.dependencies).toContain('launch_simulation');
  });

  it('all required items have optional = false', () => {
    const items = buildDefaultWorkspaceChecklist();
    // All default items are required
    const required = items.filter((i) => !i.optional);
    expect(required.length).toBeGreaterThanOrEqual(5);
  });

  it('all dependency IDs reference valid item IDs', () => {
    const items = buildDefaultWorkspaceChecklist();
    const ids = new Set(items.map((i) => i.id));
    for (const item of items) {
      for (const dep of item.dependencies) {
        expect(ids.has(dep), `item "${item.id}" references unknown dep "${dep}"`).toBe(true);
      }
    }
  });

  it('cta paths start with /', () => {
    const items = buildDefaultWorkspaceChecklist();
    for (const item of items) {
      expect(item.ctaPath.startsWith('/')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #2: Checklist status derivation
// ---------------------------------------------------------------------------

describe('deriveChecklistStatuses', () => {
  const baseItems = buildDefaultWorkspaceChecklist();

  it('all items are locked when nothing is completed', () => {
    const result = deriveChecklistStatuses(baseItems, new Set(), new Set(), new Set());
    const statuses = statusMap(result);
    // Only account_setup (no deps) should be available; all others locked
    expect(statuses.account_setup).toBe('available');
    expect(statuses.compliance_configuration).toBe('locked');
    expect(statuses.token_parameters).toBe('locked');
    expect(statuses.legal_confirmations).toBe('locked');
    expect(statuses.launch_simulation).toBe('locked');
    expect(statuses.token_deployment).toBe('locked');
  });

  it('account_setup completion unlocks compliance_configuration and token_parameters', () => {
    const completed = new Set(['account_setup']);
    const result = deriveChecklistStatuses(baseItems, completed, new Set(), new Set());
    const statuses = statusMap(result);
    expect(statuses.account_setup).toBe('complete');
    expect(statuses.compliance_configuration).toBe('available');
    expect(statuses.token_parameters).toBe('available');
    expect(statuses.legal_confirmations).toBe('locked');
  });

  it('legal_confirmations unlocks only when BOTH compliance and token_params are complete', () => {
    const onlyCompliance = new Set(['account_setup', 'compliance_configuration']);
    const r1 = deriveChecklistStatuses(baseItems, onlyCompliance, new Set(), new Set());
    expect(statusMap(r1).legal_confirmations).toBe('locked');

    const both = new Set(['account_setup', 'compliance_configuration', 'token_parameters']);
    const r2 = deriveChecklistStatuses(baseItems, both, new Set(), new Set());
    expect(statusMap(r2).legal_confirmations).toBe('available');
  });

  it('marks item as in_progress when in inProgressIds and not complete', () => {
    const completed = new Set(['account_setup']);
    const inProgress = new Set(['compliance_configuration']);
    const result = deriveChecklistStatuses(baseItems, completed, inProgress, new Set());
    expect(statusMap(result).compliance_configuration).toBe('in_progress');
  });

  it('complete status takes priority over in_progress', () => {
    const completed = new Set(['account_setup', 'compliance_configuration']);
    const inProgress = new Set(['compliance_configuration']); // conflict
    const result = deriveChecklistStatuses(baseItems, completed, inProgress, new Set());
    expect(statusMap(result).compliance_configuration).toBe('complete');
  });

  it('blocked status takes priority over dependency locking when both apply', () => {
    // account_setup not complete → compliance_configuration would be locked
    // but if compliance_configuration is also in blockedIds → show blocked with message
    const blocked = new Set(['compliance_configuration']);
    const result = deriveChecklistStatuses(baseItems, new Set(), new Set(), blocked);
    expect(statusMap(result).compliance_configuration).toBe('blocked');
    const item = result.find((i) => i.id === 'compliance_configuration');
    expect(item!.blockReason).toBeTruthy();
  });

  it('full completion marks all items complete', () => {
    const allIds = new Set(baseItems.map((i) => i.id));
    const result = deriveChecklistStatuses(baseItems, allIds, new Set(), new Set());
    for (const item of result) {
      expect(item.status).toBe('complete');
    }
  });

  it('locked item has a blockReason explaining the missing dependency', () => {
    const result = deriveChecklistStatuses(baseItems, new Set(), new Set(), new Set());
    const locked = result.find((i) => i.id === 'compliance_configuration');
    expect(locked!.blockReason).toContain('Account Setup');
  });

  it('does not mutate original items array', () => {
    const items = buildDefaultWorkspaceChecklist();
    const origStatuses = items.map((i) => i.status);
    deriveChecklistStatuses(items, new Set(['account_setup']), new Set(), new Set());
    items.forEach((i, idx) => {
      expect(i.status).toBe(origStatuses[idx]);
    });
  });
});

// ---------------------------------------------------------------------------
// AC #3: Readiness level derivation
// ---------------------------------------------------------------------------

describe('deriveWorkspaceReadinessLevel', () => {
  const baseItems = buildDefaultWorkspaceChecklist();

  it('returns not_ready when nothing is complete', () => {
    const items = deriveChecklistStatuses(baseItems, new Set(), new Set(), new Set());
    expect(deriveWorkspaceReadinessLevel(items)).toBe<WorkspaceReadinessLevel>('not_ready');
  });

  it('returns needs_attention when any item is blocked', () => {
    const blocked = new Set(['compliance_configuration']);
    const items = deriveChecklistStatuses(baseItems, new Set(['account_setup']), new Set(), blocked);
    expect(deriveWorkspaceReadinessLevel(items)).toBe<WorkspaceReadinessLevel>('needs_attention');
  });

  it('returns ready_to_simulate when simulation is complete but deployment is not', () => {
    const completedExceptDeploy = new Set([
      'account_setup',
      'compliance_configuration',
      'token_parameters',
      'legal_confirmations',
      'launch_simulation',
    ]);
    const items = deriveChecklistStatuses(baseItems, completedExceptDeploy, new Set(), new Set());
    expect(deriveWorkspaceReadinessLevel(items)).toBe<WorkspaceReadinessLevel>('ready_to_simulate');
  });

  it('returns ready_to_launch when all required items are complete', () => {
    const allIds = new Set(baseItems.map((i) => i.id));
    const items = deriveChecklistStatuses(baseItems, allIds, new Set(), new Set());
    expect(deriveWorkspaceReadinessLevel(items)).toBe<WorkspaceReadinessLevel>('ready_to_launch');
  });
});

// ---------------------------------------------------------------------------
// AC #4: User-facing messages (no technical leakage)
// ---------------------------------------------------------------------------

describe('getReadinessLevelLabel', () => {
  const levels: WorkspaceReadinessLevel[] = [
    'not_ready',
    'needs_attention',
    'ready_to_simulate',
    'ready_to_launch',
  ];

  it('returns a non-empty label for every level', () => {
    for (const level of levels) {
      const result = getReadinessLevelLabel(level);
      expect(result.label).toBeTruthy();
      expect(result.description).toBeTruthy();
      expect(result.colorClass).toBeTruthy();
      expect(result.ariaLabel).toBeTruthy();
    }
  });

  it('labels do not contain raw error codes or stack traces', () => {
    for (const level of levels) {
      const { label, description, ariaLabel } = getReadinessLevelLabel(level);
      for (const text of [label, description, ariaLabel]) {
        expect(text).not.toMatch(/error\s+\d+/i);
        expect(text).not.toMatch(/0x[0-9a-f]+/i);
        expect(text).not.toMatch(/TypeError|ReferenceError/);
      }
    }
  });

  it('needs_attention label uses amber color class', () => {
    expect(getReadinessLevelLabel('needs_attention').colorClass).toContain('amber');
  });

  it('ready_to_launch label uses green color class', () => {
    expect(getReadinessLevelLabel('ready_to_launch').colorClass).toContain('green');
  });
});

describe('getDependencyBlockReason', () => {
  it('returns a human-readable sentence referencing both items', () => {
    const msg = getDependencyBlockReason('legal_confirmations', 'compliance_configuration');
    expect(msg).toContain('Legal Confirmations');
    expect(msg).toContain('Compliance Configuration');
  });

  it('handles unknown IDs gracefully', () => {
    const msg = getDependencyBlockReason('unknown_item', 'unknown_dep');
    expect(msg).toBeTruthy();
    expect(msg.length).toBeGreaterThan(10);
  });
});

describe('getBlockedItemExplanation', () => {
  it('returns a non-empty message for known blocked items', () => {
    const known = [
      'compliance_configuration',
      'legal_confirmations',
      'launch_simulation',
      'token_deployment',
    ];
    for (const id of known) {
      expect(getBlockedItemExplanation(id)).toBeTruthy();
    }
  });

  it('returns a fallback for unknown item IDs', () => {
    expect(getBlockedItemExplanation('unknown_thing')).toBeTruthy();
  });

  it('does not expose raw error code patterns', () => {
    const msg = getBlockedItemExplanation('launch_simulation');
    expect(msg).not.toMatch(/\d{3,}/); // no numeric error codes
  });
});

describe('getChecklistItemStatusLabel', () => {
  const statuses: ChecklistItemStatus[] = [
    'locked', 'available', 'in_progress', 'complete', 'blocked',
  ];

  it('returns a non-empty label for every status', () => {
    for (const status of statuses) {
      expect(getChecklistItemStatusLabel(status)).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// AC #5: Simulation state derivation
// ---------------------------------------------------------------------------

describe('buildInitialSimulationState', () => {
  it('returns idle phase', () => {
    expect(buildInitialSimulationState().phase).toBe('idle');
  });

  it('canStart is false initially', () => {
    expect(buildInitialSimulationState().canStart).toBe(false);
  });

  it('has a human-readable duration label', () => {
    expect(buildInitialSimulationState().estimatedDurationLabel).toBeTruthy();
  });
});

describe('deriveSimulationState', () => {
  const baseItems = buildDefaultWorkspaceChecklist();

  it('canStart is false when launch_simulation item is still locked (prerequisites not met)', () => {
    const items = deriveChecklistStatuses(baseItems, new Set(), new Set(), new Set());
    const sim = deriveSimulationState(items, 'idle');
    expect(sim.canStart).toBe(false);
  });

  it('canStart is true when launch_simulation item is available (all prerequisites met) and phase is idle', () => {
    const completed = new Set([
      'account_setup',
      'compliance_configuration',
      'token_parameters',
      'legal_confirmations',
    ]);
    const items = deriveChecklistStatuses(baseItems, completed, new Set(), new Set());
    const sim = deriveSimulationState(items, 'idle');
    expect(sim.canStart).toBe(true);
  });

  it('canStart is false when phase is running (already in progress)', () => {
    const completed = new Set([
      'account_setup',
      'compliance_configuration',
      'token_parameters',
      'legal_confirmations',
    ]);
    const items = deriveChecklistStatuses(baseItems, completed, new Set(), new Set());
    const sim = deriveSimulationState(items, 'running');
    expect(sim.canStart).toBe(false);
  });

  it('preserves resultMessage and remediationSteps', () => {
    const items = deriveChecklistStatuses(baseItems, new Set(), new Set(), new Set());
    const remediation = ['Step 1', 'Step 2'];
    const sim = deriveSimulationState(items, 'failed', 'Error occurred', remediation, '2026-01-01T00:00:00Z');
    expect(sim.resultMessage).toBe('Error occurred');
    expect(sim.remediationSteps).toEqual(remediation);
    expect(sim.lastRunAt).toBe('2026-01-01T00:00:00Z');
  });
});

describe('getSimulationOutcomeMessage', () => {
  it('returns success heading and body for success phase', () => {
    const outcome = getSimulationOutcomeMessage('success');
    expect(outcome.heading).toBeTruthy();
    expect(outcome.body).toBeTruthy();
    expect(outcome.remediation).toBeUndefined();
  });

  it('returns failure heading, body, and remediation for failed phase', () => {
    const outcome = getSimulationOutcomeMessage('failed');
    expect(outcome.heading).toBeTruthy();
    expect(outcome.body).toBeTruthy();
    expect(outcome.remediation).toBeDefined();
    expect(outcome.remediation!.length).toBeGreaterThan(0);
  });

  it('returns empty strings for idle/running phases', () => {
    const idle = getSimulationOutcomeMessage('idle');
    expect(idle.heading).toBe('');
    const running = getSimulationOutcomeMessage('running');
    expect(running.heading).toBe('');
  });

  it('remediation steps do not contain raw technical error codes', () => {
    const outcome = getSimulationOutcomeMessage('failed');
    for (const step of outcome.remediation ?? []) {
      expect(step).not.toMatch(/0x[0-9a-fA-F]+/);
      expect(step).not.toMatch(/TypeError|ReferenceError/);
    }
  });
});

// ---------------------------------------------------------------------------
// AC #6: Analytics event builders
// ---------------------------------------------------------------------------

describe('analytics event builders', () => {
  it('WORKSPACE_EVENTS has required event names', () => {
    expect(WORKSPACE_EVENTS.WORKSPACE_ENTERED).toBe('workspace_entered');
    expect(WORKSPACE_EVENTS.CHECKLIST_ITEM_STARTED).toBe('checklist_item_started');
    expect(WORKSPACE_EVENTS.CHECKLIST_ITEM_COMPLETED).toBe('checklist_item_completed');
    expect(WORKSPACE_EVENTS.CHECKLIST_BLOCKED_STATE_VIEWED).toBe('checklist_blocked_state_viewed');
    expect(WORKSPACE_EVENTS.SIMULATION_STARTED).toBe('simulation_started');
    expect(WORKSPACE_EVENTS.SIMULATION_COMPLETED).toBe('simulation_completed');
    expect(WORKSPACE_EVENTS.SIMULATION_FAILED).toBe('simulation_failed');
  });

  it('buildWorkspaceEnteredEvent sets correct event name and readiness level', () => {
    const event = buildWorkspaceEnteredEvent('not_ready', 'test-user');
    expect(event.eventName).toBe(WORKSPACE_EVENTS.WORKSPACE_ENTERED);
    expect(event.readinessLevel).toBe('not_ready');
    expect(event.timestamp).toBeTruthy();
  });

  it('buildChecklistItemStartedEvent captures itemId', () => {
    const event = buildChecklistItemStartedEvent('compliance_configuration', 'user-1');
    expect(event.eventName).toBe(WORKSPACE_EVENTS.CHECKLIST_ITEM_STARTED);
    expect(event.checklistItemId).toBe('compliance_configuration');
  });

  it('buildChecklistItemCompletedEvent captures itemId', () => {
    const event = buildChecklistItemCompletedEvent('account_setup');
    expect(event.eventName).toBe(WORKSPACE_EVENTS.CHECKLIST_ITEM_COMPLETED);
    expect(event.checklistItemId).toBe('account_setup');
  });

  it('buildBlockedStateViewedEvent captures itemId', () => {
    const event = buildBlockedStateViewedEvent('launch_simulation');
    expect(event.eventName).toBe(WORKSPACE_EVENTS.CHECKLIST_BLOCKED_STATE_VIEWED);
    expect(event.checklistItemId).toBe('launch_simulation');
  });

  it('buildSimulationStartedEvent uses simulation_started', () => {
    const event = buildSimulationStartedEvent('user-1');
    expect(event.eventName).toBe(WORKSPACE_EVENTS.SIMULATION_STARTED);
    expect(event.simulationPhase).toBe('running');
  });

  it('buildSimulationCompletedEvent distinguishes success and failed', () => {
    const success = buildSimulationCompletedEvent('success');
    expect(success.eventName).toBe(WORKSPACE_EVENTS.SIMULATION_COMPLETED);

    const failed = buildSimulationCompletedEvent('failed');
    expect(failed.eventName).toBe(WORKSPACE_EVENTS.SIMULATION_FAILED);
  });

  it('all event builders produce ISO timestamps', () => {
    const events = [
      buildWorkspaceEnteredEvent('not_ready'),
      buildChecklistItemStartedEvent('account_setup'),
      buildChecklistItemCompletedEvent('account_setup'),
      buildBlockedStateViewedEvent('account_setup'),
      buildSimulationStartedEvent(),
      buildSimulationCompletedEvent('success'),
    ];
    for (const event of events) {
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });

  it('validateWorkspaceEventPayload accepts valid events', () => {
    const event = buildWorkspaceEnteredEvent('not_ready', 'test-user');
    expect(validateWorkspaceEventPayload(event)).toBe(true);
  });

  it('validateWorkspaceEventPayload rejects event with missing eventName', () => {
    const event = buildWorkspaceEnteredEvent('not_ready');
    const invalid = { ...event, eventName: '' };
    expect(validateWorkspaceEventPayload(invalid)).toBe(false);
  });

  it('validateWorkspaceEventPayload rejects event with missing timestamp', () => {
    const event = buildWorkspaceEnteredEvent('not_ready');
    const invalid = { ...event, timestamp: '' };
    expect(validateWorkspaceEventPayload(invalid)).toBe(false);
  });

  it('all event builders without userHandle produce valid events', () => {
    const event = buildWorkspaceEnteredEvent('ready_to_launch');
    expect(event.userHandle).toBeUndefined();
    expect(validateWorkspaceEventPayload(event)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #7: Progress summary computation
// ---------------------------------------------------------------------------

describe('computeWorkspaceProgress', () => {
  const baseItems = buildDefaultWorkspaceChecklist();

  it('returns 0% and correct total when nothing is complete', () => {
    const items = deriveChecklistStatuses(baseItems, new Set(), new Set(), new Set());
    const progress = computeWorkspaceProgress(items);
    expect(progress.percentComplete).toBe(0);
    expect(progress.totalRequired).toBeGreaterThan(0);
    expect(progress.completedRequired).toBe(0);
  });

  it('returns 100% when all required items are complete', () => {
    const allIds = new Set(baseItems.map((i) => i.id));
    const items = deriveChecklistStatuses(baseItems, allIds, new Set(), new Set());
    const progress = computeWorkspaceProgress(items);
    expect(progress.percentComplete).toBe(100);
    expect(progress.nextActionItem).toBeNull();
  });

  it('nextActionItem points to first available or in_progress item', () => {
    const items = deriveChecklistStatuses(baseItems, new Set(), new Set(), new Set());
    const progress = computeWorkspaceProgress(items);
    // account_setup is available (no deps)
    expect(progress.nextActionItem?.id).toBe('account_setup');
  });

  it('progress percentage is a whole number between 0 and 100', () => {
    const completed = new Set(['account_setup']);
    const items = deriveChecklistStatuses(baseItems, completed, new Set(), new Set());
    const progress = computeWorkspaceProgress(items);
    expect(progress.percentComplete).toBeGreaterThanOrEqual(0);
    expect(progress.percentComplete).toBeLessThanOrEqual(100);
    expect(Number.isInteger(progress.percentComplete)).toBe(true);
  });

  it('totalRequired matches the number of non-optional items', () => {
    const items = deriveChecklistStatuses(baseItems, new Set(), new Set(), new Set());
    const expected = baseItems.filter((i) => !i.optional).length;
    expect(computeWorkspaceProgress(items).totalRequired).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// AC #8: Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('deriveChecklistStatuses returns same output for same input', () => {
    const items = buildDefaultWorkspaceChecklist();
    const completed = new Set(['account_setup']);
    const result1 = deriveChecklistStatuses(items, completed, new Set(), new Set());
    const result2 = deriveChecklistStatuses(items, completed, new Set(), new Set());
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });

  it('deriveWorkspaceReadinessLevel returns same output for same input', () => {
    const items = deriveChecklistStatuses(
      buildDefaultWorkspaceChecklist(),
      new Set(['account_setup']),
      new Set(),
      new Set(),
    );
    const r1 = deriveWorkspaceReadinessLevel(items);
    const r2 = deriveWorkspaceReadinessLevel(items);
    expect(r1).toBe(r2);
  });

  it('computeWorkspaceProgress returns same output for same input', () => {
    const items = deriveChecklistStatuses(
      buildDefaultWorkspaceChecklist(),
      new Set(['account_setup']),
      new Set(),
      new Set(),
    );
    const p1 = computeWorkspaceProgress(items);
    const p2 = computeWorkspaceProgress(items);
    expect(p1.percentComplete).toBe(p2.percentComplete);
    expect(p1.nextActionItem?.id).toBe(p2.nextActionItem?.id);
  });
});
