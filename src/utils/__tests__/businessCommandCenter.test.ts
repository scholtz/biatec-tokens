import { describe, it, expect } from 'vitest';
import {
  mapApiStatusToSeverity,
  getSeverityLabel,
  getSeverityAriaRole,
  computePriorityCards,
  EMPTY_COMMAND_CENTER_CONTEXT,
  findForbiddenJargon,
  isJargonFree,
  validateCardCopy,
  buildStakeholderUpdateTemplate,
  buildCommandCenterVisitEvent,
  buildCardOpenEvent,
  buildTaskCompletionEvent,
  buildStatusFilterEvent,
  isCommandCenterPath,
  isLegacyOperationsPath,
  COMMAND_CENTER_CANONICAL_PATH,
  COMMAND_CENTER_LEGACY_PATHS,
  FORBIDDEN_JARGON_TERMS,
  type OperatorRole,
  type CommandCenterContext,
  type StatusSeverity,
} from '../businessCommandCenter';

// ---------------------------------------------------------------------------
// mapApiStatusToSeverity
// ---------------------------------------------------------------------------

describe('mapApiStatusToSeverity', () => {
  it('maps null to review_needed', () => {
    expect(mapApiStatusToSeverity(null)).toBe('review_needed');
  });

  it('maps undefined to review_needed', () => {
    expect(mapApiStatusToSeverity(undefined)).toBe('review_needed');
  });

  it('maps empty string to review_needed', () => {
    expect(mapApiStatusToSeverity('')).toBe('review_needed');
  });

  it('maps "healthy" to clear', () => {
    expect(mapApiStatusToSeverity('healthy')).toBe('clear');
  });

  it('maps "ok" to clear', () => {
    expect(mapApiStatusToSeverity('ok')).toBe('clear');
  });

  it('maps "active" to clear', () => {
    expect(mapApiStatusToSeverity('active')).toBe('clear');
  });

  it('maps "clear" to clear', () => {
    expect(mapApiStatusToSeverity('clear')).toBe('clear');
  });

  it('maps "warning" to review_needed', () => {
    expect(mapApiStatusToSeverity('warning')).toBe('review_needed');
  });

  it('maps "pending" to review_needed', () => {
    expect(mapApiStatusToSeverity('pending')).toBe('review_needed');
  });

  it('maps "in_review" to review_needed', () => {
    expect(mapApiStatusToSeverity('in_review')).toBe('review_needed');
  });

  it('maps "critical" to action_required', () => {
    expect(mapApiStatusToSeverity('critical')).toBe('action_required');
  });

  it('maps "error" to action_required', () => {
    expect(mapApiStatusToSeverity('error')).toBe('action_required');
  });

  it('maps "failed" to action_required', () => {
    expect(mapApiStatusToSeverity('failed')).toBe('action_required');
  });

  it('maps "blocked" to action_required', () => {
    expect(mapApiStatusToSeverity('blocked')).toBe('action_required');
  });

  it('is case-insensitive', () => {
    expect(mapApiStatusToSeverity('HEALTHY')).toBe('clear');
    expect(mapApiStatusToSeverity('WARNING')).toBe('review_needed');
    expect(mapApiStatusToSeverity('CRITICAL')).toBe('action_required');
  });

  it('trims whitespace before comparison', () => {
    expect(mapApiStatusToSeverity('  healthy  ')).toBe('clear');
  });

  it('maps unknown value to review_needed', () => {
    expect(mapApiStatusToSeverity('some_unknown_status')).toBe('review_needed');
  });
});

// ---------------------------------------------------------------------------
// getSeverityLabel
// ---------------------------------------------------------------------------

describe('getSeverityLabel', () => {
  it('returns "All clear" for clear', () => {
    expect(getSeverityLabel('clear')).toBe('All clear');
  });

  it('returns "Review needed" for review_needed', () => {
    expect(getSeverityLabel('review_needed')).toBe('Review needed');
  });

  it('returns "Action required" for action_required', () => {
    expect(getSeverityLabel('action_required')).toBe('Action required');
  });
});

// ---------------------------------------------------------------------------
// getSeverityAriaRole
// ---------------------------------------------------------------------------

describe('getSeverityAriaRole', () => {
  it('returns "alert" for action_required', () => {
    expect(getSeverityAriaRole('action_required')).toBe('alert');
  });

  it('returns "status" for review_needed', () => {
    expect(getSeverityAriaRole('review_needed')).toBe('status');
  });

  it('returns "status" for clear', () => {
    expect(getSeverityAriaRole('clear')).toBe('status');
  });
});

// ---------------------------------------------------------------------------
// computePriorityCards — no tokens deployed
// ---------------------------------------------------------------------------

describe('computePriorityCards — no tokens deployed', () => {
  const ctx: CommandCenterContext = {
    ...EMPTY_COMMAND_CENTER_CONTEXT,
    hasDeployedTokens: false,
  };

  it('includes no_tokens_deployed card', () => {
    const cards = computePriorityCards('issuer_operator', ctx);
    expect(cards.some((c) => c.id === 'no_tokens_deployed')).toBe(true);
  });

  it('no_tokens_deployed card has action_required severity', () => {
    const cards = computePriorityCards('issuer_operator', ctx);
    const card = cards.find((c) => c.id === 'no_tokens_deployed')!;
    expect(card.severity).toBe('action_required');
  });

  it('no_tokens_deployed card is role-relevant for both roles', () => {
    const issuerCards = computePriorityCards('issuer_operator', ctx);
    const complianceCards = computePriorityCards('compliance_manager', ctx);
    const issuerCard = issuerCards.find((c) => c.id === 'no_tokens_deployed')!;
    const compCard = complianceCards.find((c) => c.id === 'no_tokens_deployed')!;
    expect(issuerCard.roleRelevant).toBe(true);
    expect(compCard.roleRelevant).toBe(true);
  });

  it('CTA path points to /launch/guided', () => {
    const cards = computePriorityCards('issuer_operator', ctx);
    const card = cards.find((c) => c.id === 'no_tokens_deployed')!;
    expect(card.ctaPath).toBe('/launch/guided');
  });
});

// ---------------------------------------------------------------------------
// computePriorityCards — compliance checkpoints pending
// ---------------------------------------------------------------------------

describe('computePriorityCards — compliance checkpoints pending', () => {
  const ctx: CommandCenterContext = {
    ...EMPTY_COMMAND_CENTER_CONTEXT,
    hasDeployedTokens: true,
    pendingComplianceCount: 3,
    complianceStatusRaw: 'warning',
  };

  it('includes compliance_checkpoints_pending card', () => {
    const cards = computePriorityCards('compliance_manager', ctx);
    expect(cards.some((c) => c.id === 'compliance_checkpoints_pending')).toBe(true);
  });

  it('card "what" mentions the count', () => {
    const cards = computePriorityCards('compliance_manager', ctx);
    const card = cards.find((c) => c.id === 'compliance_checkpoints_pending')!;
    expect(card.what).toContain('3');
  });

  it('singular count uses correct grammar', () => {
    const singleCtx = { ...ctx, pendingComplianceCount: 1 };
    const cards = computePriorityCards('compliance_manager', singleCtx);
    const card = cards.find((c) => c.id === 'compliance_checkpoints_pending')!;
    expect(card.what).toContain('1 compliance checkpoint is incomplete');
  });

  it('card CTA points to /compliance/setup', () => {
    const cards = computePriorityCards('compliance_manager', ctx);
    const card = cards.find((c) => c.id === 'compliance_checkpoints_pending')!;
    expect(card.ctaPath).toBe('/compliance/setup');
  });
});

// ---------------------------------------------------------------------------
// computePriorityCards — deployment status issue
// ---------------------------------------------------------------------------

describe('computePriorityCards — deployment status issue', () => {
  const ctx: CommandCenterContext = {
    ...EMPTY_COMMAND_CENTER_CONTEXT,
    hasDeployedTokens: true,
    deploymentStatusRaw: 'critical',
  };

  it('includes deployment_status_issue card when status is critical', () => {
    const cards = computePriorityCards('issuer_operator', ctx);
    expect(cards.some((c) => c.id === 'deployment_status_issue')).toBe(true);
  });

  it('deployment_status_issue card has action_required severity for "critical"', () => {
    const cards = computePriorityCards('issuer_operator', ctx);
    const card = cards.find((c) => c.id === 'deployment_status_issue')!;
    expect(card.severity).toBe('action_required');
  });

  it('does NOT include deployment_status_issue when status is healthy', () => {
    const healthyCtx = { ...ctx, deploymentStatusRaw: 'healthy' };
    const cards = computePriorityCards('issuer_operator', healthyCtx);
    expect(cards.some((c) => c.id === 'deployment_status_issue')).toBe(false);
  });

  it('does NOT include deployment_status_issue when no tokens deployed', () => {
    const noTokenCtx = { ...ctx, hasDeployedTokens: false };
    const cards = computePriorityCards('issuer_operator', noTokenCtx);
    expect(cards.some((c) => c.id === 'deployment_status_issue')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computePriorityCards — pending distribution
// ---------------------------------------------------------------------------

describe('computePriorityCards — pending distribution', () => {
  const ctx: CommandCenterContext = {
    ...EMPTY_COMMAND_CENTER_CONTEXT,
    hasDeployedTokens: true,
    hasPendingDistribution: true,
  };

  it('includes pending_distribution card for issuer_operator', () => {
    const cards = computePriorityCards('issuer_operator', ctx);
    expect(cards.some((c) => c.id === 'pending_distribution')).toBe(true);
  });

  it('pending_distribution is NOT roleRelevant for compliance_manager', () => {
    const cards = computePriorityCards('compliance_manager', ctx);
    const card = cards.find((c) => c.id === 'pending_distribution')!;
    expect(card.roleRelevant).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computePriorityCards — compliance review overdue
// ---------------------------------------------------------------------------

describe('computePriorityCards — compliance review overdue', () => {
  it('includes card when 90+ days since last review', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      daysSinceLastComplianceReview: 95,
    };
    const cards = computePriorityCards('compliance_manager', ctx);
    expect(cards.some((c) => c.id === 'compliance_review_overdue')).toBe(true);
  });

  it('does NOT include card when < 90 days since last review', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      daysSinceLastComplianceReview: 30,
    };
    const cards = computePriorityCards('compliance_manager', ctx);
    expect(cards.some((c) => c.id === 'compliance_review_overdue')).toBe(false);
  });

  it('has action_required severity when 180+ days', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      daysSinceLastComplianceReview: 200,
    };
    const cards = computePriorityCards('compliance_manager', ctx);
    const card = cards.find((c) => c.id === 'compliance_review_overdue')!;
    expect(card.severity).toBe('action_required');
  });

  it('has review_needed severity when 90-179 days', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      daysSinceLastComplianceReview: 100,
    };
    const cards = computePriorityCards('compliance_manager', ctx);
    const card = cards.find((c) => c.id === 'compliance_review_overdue')!;
    expect(card.severity).toBe('review_needed');
  });

  it('is roleRelevant for compliance_manager only', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      daysSinceLastComplianceReview: 100,
    };
    const issuerCards = computePriorityCards('issuer_operator', ctx);
    const compCards = computePriorityCards('compliance_manager', ctx);
    const issuerCard = issuerCards.find((c) => c.id === 'compliance_review_overdue');
    const compCard = compCards.find((c) => c.id === 'compliance_review_overdue')!;
    if (issuerCard) {
      expect(issuerCard.roleRelevant).toBe(false);
    }
    expect(compCard.roleRelevant).toBe(true);
  });

  it('does NOT include card when daysSinceLastComplianceReview is null', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      daysSinceLastComplianceReview: null,
    };
    const cards = computePriorityCards('compliance_manager', ctx);
    expect(cards.some((c) => c.id === 'compliance_review_overdue')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computePriorityCards — stakeholder update due
// ---------------------------------------------------------------------------

describe('computePriorityCards — stakeholder update due', () => {
  const ctx: CommandCenterContext = {
    ...EMPTY_COMMAND_CENTER_CONTEXT,
    hasDeployedTokens: true,
    hasRecentStakeholderUpdate: false,
  };

  it('includes stakeholder_update_due card for issuer_operator', () => {
    const cards = computePriorityCards('issuer_operator', ctx);
    expect(cards.some((c) => c.id === 'stakeholder_update_due')).toBe(true);
  });

  it('does NOT include card when recent update exists', () => {
    const updatedCtx = { ...ctx, hasRecentStakeholderUpdate: true };
    const cards = computePriorityCards('issuer_operator', updatedCtx);
    expect(cards.some((c) => c.id === 'stakeholder_update_due')).toBe(false);
  });

  it('does NOT include card when no tokens deployed', () => {
    const noTokenCtx = { ...ctx, hasDeployedTokens: false };
    const cards = computePriorityCards('issuer_operator', noTokenCtx);
    expect(cards.some((c) => c.id === 'stakeholder_update_due')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computePriorityCards — sort order
// ---------------------------------------------------------------------------

describe('computePriorityCards — sort order', () => {
  it('action_required cards appear before review_needed cards', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      hasDeployedTokens: true,
      pendingComplianceCount: 2,
      complianceStatusRaw: 'critical',
      deploymentStatusRaw: 'critical',
      hasPendingDistribution: true,
    };
    const cards = computePriorityCards('issuer_operator', ctx);
    const actionRequiredIndices = cards
      .map((c, i) => ({ severity: c.severity, i }))
      .filter((x) => x.severity === 'action_required')
      .map((x) => x.i);
    const reviewNeededIndices = cards
      .map((c, i) => ({ severity: c.severity, i }))
      .filter((x) => x.severity === 'review_needed')
      .map((x) => x.i);
    if (actionRequiredIndices.length > 0 && reviewNeededIndices.length > 0) {
      expect(Math.max(...actionRequiredIndices)).toBeLessThan(Math.min(...reviewNeededIndices));
    }
  });

  it('returns empty array for fully healthy context', () => {
    const ctx: CommandCenterContext = {
      hasDeployedTokens: true,
      pendingComplianceCount: 0,
      deploymentStatusRaw: 'healthy',
      complianceStatusRaw: 'healthy',
      hasPendingDistribution: false,
      hasRecentStakeholderUpdate: true,
      hasOpenOnboardingTasks: false,
      daysSinceLastComplianceReview: 10,
    };
    const cards = computePriorityCards('issuer_operator', ctx);
    expect(cards).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Vocabulary guard — findForbiddenJargon / isJargonFree
// ---------------------------------------------------------------------------

describe('findForbiddenJargon', () => {
  it('finds "wallet" in text', () => {
    expect(findForbiddenJargon('Connect your wallet to continue')).toContain('wallet');
  });

  it('is case-insensitive', () => {
    expect(findForbiddenJargon('BLOCKCHAIN is not mentioned')).toContain('blockchain');
  });

  it('returns empty array for jargon-free text', () => {
    expect(findForbiddenJargon('Review your compliance status and send an update')).toHaveLength(0);
  });

  it('finds multiple forbidden terms', () => {
    const result = findForbiddenJargon('Connect your wallet and pay gas fees');
    expect(result).toContain('wallet');
    expect(result).toContain('gas');
  });
});

describe('isJargonFree', () => {
  it('returns true for clean text', () => {
    expect(isJargonFree('Complete compliance setup to maintain operator status.')).toBe(true);
  });

  it('returns false for text with wallet reference', () => {
    expect(isJargonFree('Connect your wallet')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateCardCopy — all computed cards must be jargon-free
// ---------------------------------------------------------------------------

describe('validateCardCopy — all computed cards must be jargon-free', () => {
  const contexts: Array<{ label: string; ctx: CommandCenterContext; role: OperatorRole }> = [
    {
      label: 'empty context (issuer)',
      ctx: EMPTY_COMMAND_CENTER_CONTEXT,
      role: 'issuer_operator',
    },
    {
      label: 'empty context (compliance manager)',
      ctx: EMPTY_COMMAND_CENTER_CONTEXT,
      role: 'compliance_manager',
    },
    {
      label: 'all flags active (issuer)',
      ctx: {
        hasDeployedTokens: true,
        pendingComplianceCount: 5,
        deploymentStatusRaw: 'critical',
        complianceStatusRaw: 'critical',
        hasPendingDistribution: true,
        hasRecentStakeholderUpdate: false,
        hasOpenOnboardingTasks: true,
        daysSinceLastComplianceReview: 200,
      },
      role: 'issuer_operator',
    },
    {
      label: 'all flags active (compliance manager)',
      ctx: {
        hasDeployedTokens: true,
        pendingComplianceCount: 5,
        deploymentStatusRaw: 'critical',
        complianceStatusRaw: 'critical',
        hasPendingDistribution: true,
        hasRecentStakeholderUpdate: false,
        hasOpenOnboardingTasks: true,
        daysSinceLastComplianceReview: 200,
      },
      role: 'compliance_manager',
    },
  ];

  for (const { label, ctx, role } of contexts) {
    it(`all cards are jargon-free: ${label}`, () => {
      const cards = computePriorityCards(role, ctx);
      const violations = cards.flatMap((card) => validateCardCopy(card));
      expect(violations).toHaveLength(0);
    });
  }
});

describe('FORBIDDEN_JARGON_TERMS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(FORBIDDEN_JARGON_TERMS)).toBe(true);
    expect(FORBIDDEN_JARGON_TERMS.length).toBeGreaterThan(5);
  });

  it('contains "wallet"', () => {
    expect(FORBIDDEN_JARGON_TERMS).toContain('wallet');
  });

  it('contains "blockchain"', () => {
    expect(FORBIDDEN_JARGON_TERMS).toContain('blockchain');
  });

  it('contains "gas"', () => {
    expect(FORBIDDEN_JARGON_TERMS).toContain('gas');
  });
});

// ---------------------------------------------------------------------------
// buildStakeholderUpdateTemplate
// ---------------------------------------------------------------------------

describe('buildStakeholderUpdateTemplate', () => {
  it('returns action_required template for critical context', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      deploymentStatusRaw: 'critical',
    };
    const template = buildStakeholderUpdateTemplate(ctx);
    expect(template.triggerSeverity).toBe('action_required');
    expect(template.subject).toBeTruthy();
    expect(template.body.length).toBeGreaterThan(0);
  });

  it('returns review_needed template for warning context', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      deploymentStatusRaw: 'warning',
    };
    const template = buildStakeholderUpdateTemplate(ctx);
    expect(template.triggerSeverity).toBe('review_needed');
  });

  it('returns clear template for healthy context', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      deploymentStatusRaw: 'healthy',
      complianceStatusRaw: 'healthy',
    };
    const template = buildStakeholderUpdateTemplate(ctx);
    expect(template.triggerSeverity).toBe('clear');
  });

  it('template subject and body are jargon-free', () => {
    const contexts: CommandCenterContext[] = [
      { ...EMPTY_COMMAND_CENTER_CONTEXT, deploymentStatusRaw: 'critical' },
      { ...EMPTY_COMMAND_CENTER_CONTEXT, deploymentStatusRaw: 'warning' },
      { ...EMPTY_COMMAND_CENTER_CONTEXT, deploymentStatusRaw: 'healthy', complianceStatusRaw: 'healthy' },
    ];
    for (const ctx of contexts) {
      const template = buildStakeholderUpdateTemplate(ctx);
      expect(isJargonFree(template.subject)).toBe(true);
      for (const paragraph of template.body) {
        expect(isJargonFree(paragraph)).toBe(true);
      }
    }
  });

  it('action_required takes precedence over warning in compliance', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      deploymentStatusRaw: 'warning',
      complianceStatusRaw: 'critical',
    };
    const template = buildStakeholderUpdateTemplate(ctx);
    expect(template.triggerSeverity).toBe('action_required');
  });
});

// ---------------------------------------------------------------------------
// Analytics event builders
// ---------------------------------------------------------------------------

describe('buildCommandCenterVisitEvent', () => {
  it('returns event with correct shape', () => {
    const event = buildCommandCenterVisitEvent('issuer_operator');
    expect(event.event).toBe('command_center_visit');
    expect(event.category).toBe('CommandCenter');
    expect(event.action).toBe('Visit');
    expect(event.label).toBe('issuer_operator');
    expect(event.metadata.role).toBe('issuer_operator');
    expect(typeof event.timestamp).toBe('string');
  });

  it('includes compliance_manager role in metadata', () => {
    const event = buildCommandCenterVisitEvent('compliance_manager');
    expect(event.metadata.role).toBe('compliance_manager');
  });
});

describe('buildCardOpenEvent', () => {
  const mockCard = computePriorityCards('issuer_operator', EMPTY_COMMAND_CENTER_CONTEXT)[0];

  it('returns event with correct shape', () => {
    if (!mockCard) return; // skip if no cards in context
    const event = buildCardOpenEvent(mockCard, 'issuer_operator');
    expect(event.event).toBe('command_center_card_open');
    expect(event.category).toBe('CommandCenter');
    expect(event.action).toBe('CardOpen');
    expect(event.metadata.cardId).toBe(mockCard.id);
    expect(event.metadata.severity).toBe(mockCard.severity);
  });
});

describe('buildTaskCompletionEvent', () => {
  const mockCard = computePriorityCards('issuer_operator', EMPTY_COMMAND_CENTER_CONTEXT)[0];

  it('returns event with correct shape', () => {
    if (!mockCard) return;
    const event = buildTaskCompletionEvent(mockCard, 'issuer_operator');
    expect(event.event).toBe('command_center_task_complete');
    expect(event.metadata.ctaPath).toBe(mockCard.ctaPath);
  });
});

describe('buildStatusFilterEvent', () => {
  it('builds event for action_required filter', () => {
    const event = buildStatusFilterEvent('action_required', 'issuer_operator');
    expect(event.event).toBe('command_center_filter_change');
    expect(event.label).toBe('action_required');
    expect(event.metadata.filter).toBe('action_required');
  });

  it('builds event for "all" filter', () => {
    const event = buildStatusFilterEvent('all', 'compliance_manager');
    expect(event.label).toBe('all');
  });

  it('includes role in metadata', () => {
    const event = buildStatusFilterEvent('clear', 'compliance_manager');
    expect(event.metadata.role).toBe('compliance_manager');
  });
});

// ---------------------------------------------------------------------------
// Analytics event metadata — no sensitive data
// ---------------------------------------------------------------------------

describe('analytics events — no sensitive data', () => {
  const sensitiveFields = ['email', 'password', 'address', 'privateKey', 'mnemonic'];

  it('visit event metadata has no sensitive fields', () => {
    const event = buildCommandCenterVisitEvent('issuer_operator');
    for (const field of sensitiveFields) {
      expect(field in event.metadata).toBe(false);
    }
  });

  it('filter event metadata has no sensitive fields', () => {
    const event = buildStatusFilterEvent('clear', 'issuer_operator');
    for (const field of sensitiveFields) {
      expect(field in event.metadata).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

describe('isCommandCenterPath', () => {
  it('returns true for canonical path', () => {
    expect(isCommandCenterPath(COMMAND_CENTER_CANONICAL_PATH)).toBe(true);
  });

  it('returns false for other paths', () => {
    expect(isCommandCenterPath('/dashboard')).toBe(false);
    expect(isCommandCenterPath('/cockpit')).toBe(false);
    expect(isCommandCenterPath('/')).toBe(false);
  });
});

describe('isLegacyOperationsPath', () => {
  it('returns true for each legacy path', () => {
    for (const path of COMMAND_CENTER_LEGACY_PATHS) {
      expect(isLegacyOperationsPath(path)).toBe(true);
    }
  });

  it('returns false for canonical path', () => {
    expect(isLegacyOperationsPath(COMMAND_CENTER_CANONICAL_PATH)).toBe(false);
  });

  it('returns false for other paths', () => {
    expect(isLegacyOperationsPath('/dashboard')).toBe(false);
  });
});

describe('COMMAND_CENTER_CANONICAL_PATH', () => {
  it('is /operations', () => {
    expect(COMMAND_CENTER_CANONICAL_PATH).toBe('/operations');
  });
});

// ---------------------------------------------------------------------------
// What/why/how structure validation
// ---------------------------------------------------------------------------

describe('priority cards — what/why/how structure', () => {
  it('all cards have non-empty what, why, how fields', () => {
    const ctx: CommandCenterContext = {
      hasDeployedTokens: true,
      pendingComplianceCount: 3,
      deploymentStatusRaw: 'critical',
      complianceStatusRaw: 'warning',
      hasPendingDistribution: true,
      hasRecentStakeholderUpdate: false,
      hasOpenOnboardingTasks: true,
      daysSinceLastComplianceReview: 100,
    };
    const cards = computePriorityCards('issuer_operator', ctx);
    for (const card of cards) {
      expect(card.what.length).toBeGreaterThan(0);
      expect(card.why.length).toBeGreaterThan(0);
      expect(card.how.length).toBeGreaterThan(0);
    }
  });

  it('all cards have non-empty heading and ctaLabel', () => {
    const ctx: CommandCenterContext = {
      ...EMPTY_COMMAND_CENTER_CONTEXT,
      hasDeployedTokens: false,
      pendingComplianceCount: 1,
    };
    const cards = computePriorityCards('compliance_manager', ctx);
    for (const card of cards) {
      expect(card.heading.length).toBeGreaterThan(0);
      expect(card.ctaLabel.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// EMPTY_COMMAND_CENTER_CONTEXT
// ---------------------------------------------------------------------------

describe('EMPTY_COMMAND_CENTER_CONTEXT', () => {
  it('has all expected fields', () => {
    expect(EMPTY_COMMAND_CENTER_CONTEXT).toMatchObject({
      hasDeployedTokens: false,
      pendingComplianceCount: 0,
      deploymentStatusRaw: null,
      complianceStatusRaw: null,
      hasPendingDistribution: false,
      hasRecentStakeholderUpdate: false,
      hasOpenOnboardingTasks: false,
      daysSinceLastComplianceReview: null,
    });
  });
});

// ---------------------------------------------------------------------------
// StatusSeverity exhaustive check via switch
// ---------------------------------------------------------------------------

describe('StatusSeverity coverage', () => {
  it('getSeverityLabel covers all variants', () => {
    const variants: StatusSeverity[] = ['clear', 'review_needed', 'action_required'];
    for (const v of variants) {
      expect(() => getSeverityLabel(v)).not.toThrow();
      expect(getSeverityLabel(v).length).toBeGreaterThan(0);
    }
  });
});
