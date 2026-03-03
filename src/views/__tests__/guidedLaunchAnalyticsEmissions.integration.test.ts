/**
 * Integration tests: analytics event emission and payload schema stability
 *
 * Validates that:
 * - LAUNCH_ANALYTICS_EVENTS constants are unique, non-empty strings
 * - All payload builders return structured objects with required fields
 * - progressPercent is calculated correctly at various step positions
 * - Edge-case inputs (empty arrays, zero counts, custom reasons) behave correctly
 * - Timestamp fields are always present and numeric
 * - LaunchAnalyticsEventName type accepts valid event names (compile-time check)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  LAUNCH_ANALYTICS_EVENTS,
  buildStepEnteredPayload,
  buildStepCompletedPayload,
  buildValidationFailedPayload,
  buildDraftSavedPayload,
  buildLaunchSucceededPayload,
  buildLaunchCancelledPayload,
  buildLaunchFailedPayload,
  buildPreflightCheckedPayload,
  buildTransactionPreviewOpenedPayload,
  buildRiskAcknowledgedPayload,
  type LaunchAnalyticsEventName,
} from '../../utils/launchAnalyticsEvents'

const FIXED_NOW = 1_700_000_000_000

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── LAUNCH_ANALYTICS_EVENTS constants ────────────────────────────────────────

describe('LAUNCH_ANALYTICS_EVENTS constants', () => {
  it('all event names are non-empty strings', () => {
    for (const value of Object.values(LAUNCH_ANALYTICS_EVENTS)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('all event names are unique (no duplicates)', () => {
    const values = Object.values(LAUNCH_ANALYTICS_EVENTS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  it('has 10 event constants', () => {
    expect(Object.keys(LAUNCH_ANALYTICS_EVENTS)).toHaveLength(10)
  })

  it('STEP_ENTERED equals "launch:step_entered"', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.STEP_ENTERED).toBe('launch:step_entered')
  })

  it('RISK_ACKNOWLEDGED equals "launch:risk_acknowledged"', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.RISK_ACKNOWLEDGED).toBe('launch:risk_acknowledged')
  })

  it('all values start with "launch:" namespace prefix', () => {
    for (const value of Object.values(LAUNCH_ANALYTICS_EVENTS)) {
      expect(value).toMatch(/^launch:/)
    }
  })

  it('LaunchAnalyticsEventName type allows all event constant values', () => {
    // Compile-time check: assign each value to typed variable
    const names: LaunchAnalyticsEventName[] = Object.values(LAUNCH_ANALYTICS_EVENTS)
    expect(names.length).toBe(10)
  })

  it('event constant values are stable across multiple accesses', () => {
    const first = LAUNCH_ANALYTICS_EVENTS.STEP_ENTERED
    const second = LAUNCH_ANALYTICS_EVENTS.STEP_ENTERED
    expect(first).toBe(second)
  })
})

// ── buildStepEnteredPayload ───────────────────────────────────────────────────

describe('buildStepEnteredPayload', () => {
  it('includes stepId in payload', () => {
    const payload = buildStepEnteredPayload('organization', 0, 6)
    expect(payload.stepId).toBe('organization')
  })

  it('includes stepIndex in payload', () => {
    const payload = buildStepEnteredPayload('intent', 1, 6)
    expect(payload.stepIndex).toBe(1)
  })

  it('includes totalSteps in payload', () => {
    const payload = buildStepEnteredPayload('intent', 1, 6)
    expect(payload.totalSteps).toBe(6)
  })

  it('includes timestamp in payload', () => {
    const payload = buildStepEnteredPayload('intent', 1, 6)
    expect(payload.timestamp).toBe(FIXED_NOW)
  })

  it('step 0 of 6 → progressPercent = 0', () => {
    const payload = buildStepEnteredPayload('organization', 0, 6)
    expect(payload.progressPercent).toBe(0)
  })

  it('step 3 of 6 → progressPercent = 50', () => {
    const payload = buildStepEnteredPayload('template', 3, 6)
    expect(payload.progressPercent).toBe(50)
  })

  it('step 6 of 6 → progressPercent = 100', () => {
    const payload = buildStepEnteredPayload('review', 6, 6)
    expect(payload.progressPercent).toBe(100)
  })

  it('payload is stable across repeated calls with same inputs', () => {
    const a = buildStepEnteredPayload('compliance', 2, 6)
    const b = buildStepEnteredPayload('compliance', 2, 6)
    expect(a).toEqual(b)
  })
})

// ── buildStepCompletedPayload ─────────────────────────────────────────────────

describe('buildStepCompletedPayload', () => {
  it('includes stepId', () => {
    const payload = buildStepCompletedPayload('organization', 5000)
    expect(payload.stepId).toBe('organization')
  })

  it('includes durationMs', () => {
    const payload = buildStepCompletedPayload('intent', 12345)
    expect(payload.durationMs).toBe(12345)
  })

  it('includes timestamp', () => {
    const payload = buildStepCompletedPayload('intent', 100)
    expect(payload.timestamp).toBe(FIXED_NOW)
  })

  it('payload is stable across repeated calls', () => {
    const a = buildStepCompletedPayload('template', 200)
    const b = buildStepCompletedPayload('template', 200)
    expect(a).toEqual(b)
  })
})

// ── buildValidationFailedPayload ──────────────────────────────────────────────

describe('buildValidationFailedPayload', () => {
  it('includes stepId', () => {
    const payload = buildValidationFailedPayload('organization', ['name'], 1)
    expect(payload.stepId).toBe('organization')
  })

  it('includes fieldIds array', () => {
    const payload = buildValidationFailedPayload('organization', ['name', 'email'], 2)
    expect(payload.fieldIds).toEqual(['name', 'email'])
  })

  it('includes errorCount', () => {
    const payload = buildValidationFailedPayload('intent', ['purpose'], 1)
    expect(payload.errorCount).toBe(1)
  })

  it('includes timestamp', () => {
    const payload = buildValidationFailedPayload('intent', [], 0)
    expect(payload.timestamp).toBe(FIXED_NOW)
  })

  it('0 errors → fieldIds=[] and errorCount=0', () => {
    const payload = buildValidationFailedPayload('intent', [], 0)
    expect(payload.fieldIds).toEqual([])
    expect(payload.errorCount).toBe(0)
  })

  it('payload is stable across repeated calls', () => {
    const a = buildValidationFailedPayload('compliance', ['mica'], 1)
    const b = buildValidationFailedPayload('compliance', ['mica'], 1)
    expect(a).toEqual(b)
  })
})

// ── buildDraftSavedPayload ────────────────────────────────────────────────────

describe('buildDraftSavedPayload', () => {
  it('includes stepId', () => {
    const payload = buildDraftSavedPayload('template')
    expect(payload.stepId).toBe('template')
  })

  it('includes timestamp', () => {
    const payload = buildDraftSavedPayload('economics')
    expect(payload.timestamp).toBe(FIXED_NOW)
  })
})

// ── buildLaunchSucceededPayload ───────────────────────────────────────────────

describe('buildLaunchSucceededPayload', () => {
  it('includes submissionId', () => {
    const payload = buildLaunchSucceededPayload('sub_123', 'ARC200', 'algorand_mainnet')
    expect(payload.submissionId).toBe('sub_123')
  })

  it('includes template', () => {
    const payload = buildLaunchSucceededPayload('sub_123', 'ARC200', 'algorand_mainnet')
    expect(payload.template).toBe('ARC200')
  })

  it('includes network', () => {
    const payload = buildLaunchSucceededPayload('sub_123', 'ARC200', 'algorand_mainnet')
    expect(payload.network).toBe('algorand_mainnet')
  })

  it('includes timestamp', () => {
    const payload = buildLaunchSucceededPayload('sub_123', 'ARC200', 'algorand_mainnet')
    expect(payload.timestamp).toBe(FIXED_NOW)
  })
})

// ── buildLaunchCancelledPayload ───────────────────────────────────────────────

describe('buildLaunchCancelledPayload', () => {
  it('default reason is "user_initiated"', () => {
    const payload = buildLaunchCancelledPayload('organization')
    expect(payload.reason).toBe('user_initiated')
  })

  it('custom reason is preserved', () => {
    const payload = buildLaunchCancelledPayload('intent', 'timeout')
    expect(payload.reason).toBe('timeout')
  })

  it('includes stepId', () => {
    const payload = buildLaunchCancelledPayload('compliance')
    expect(payload.stepId).toBe('compliance')
  })

  it('includes timestamp', () => {
    const payload = buildLaunchCancelledPayload('review')
    expect(payload.timestamp).toBe(FIXED_NOW)
  })
})

// ── buildLaunchFailedPayload ──────────────────────────────────────────────────

describe('buildLaunchFailedPayload', () => {
  it('includes error message', () => {
    const payload = buildLaunchFailedPayload('Network timeout', 'review')
    expect(payload.error).toBe('Network timeout')
  })

  it('includes stepId', () => {
    const payload = buildLaunchFailedPayload('403 Forbidden', 'review')
    expect(payload.stepId).toBe('review')
  })

  it('includes timestamp', () => {
    const payload = buildLaunchFailedPayload('Unknown error', 'review')
    expect(payload.timestamp).toBe(FIXED_NOW)
  })
})

// ── buildPreflightCheckedPayload ──────────────────────────────────────────────

describe('buildPreflightCheckedPayload', () => {
  it('passed=true is reflected', () => {
    const payload = buildPreflightCheckedPayload(true, 0, 0)
    expect(payload.passed).toBe(true)
  })

  it('passed=false is reflected', () => {
    const payload = buildPreflightCheckedPayload(false, 2, 1)
    expect(payload.passed).toBe(false)
  })

  it('blockerCount is accurate', () => {
    const payload = buildPreflightCheckedPayload(false, 3, 0)
    expect(payload.blockerCount).toBe(3)
  })

  it('warningCount is accurate', () => {
    const payload = buildPreflightCheckedPayload(true, 0, 2)
    expect(payload.warningCount).toBe(2)
  })

  it('includes timestamp', () => {
    const payload = buildPreflightCheckedPayload(true, 0, 0)
    expect(payload.timestamp).toBe(FIXED_NOW)
  })

  it('0 blockers, 0 warnings → passed=true', () => {
    const payload = buildPreflightCheckedPayload(true, 0, 0)
    expect(payload.blockerCount).toBe(0)
    expect(payload.warningCount).toBe(0)
    expect(payload.passed).toBe(true)
  })
})

// ── buildTransactionPreviewOpenedPayload ──────────────────────────────────────

describe('buildTransactionPreviewOpenedPayload', () => {
  it('includes tokenName', () => {
    const payload = buildTransactionPreviewOpenedPayload('Loyalty Token', 'ARC200', 'algorand_mainnet')
    expect(payload.tokenName).toBe('Loyalty Token')
  })

  it('includes tokenStandard', () => {
    const payload = buildTransactionPreviewOpenedPayload('Token', 'ERC20', 'ethereum_mainnet')
    expect(payload.tokenStandard).toBe('ERC20')
  })

  it('includes network', () => {
    const payload = buildTransactionPreviewOpenedPayload('Token', 'ARC3', 'algorand_testnet')
    expect(payload.network).toBe('algorand_testnet')
  })

  it('includes timestamp', () => {
    const payload = buildTransactionPreviewOpenedPayload('T', 'ARC200', 'algorand_mainnet')
    expect(payload.timestamp).toBe(FIXED_NOW)
  })
})

// ── buildRiskAcknowledgedPayload ──────────────────────────────────────────────

describe('buildRiskAcknowledgedPayload', () => {
  it('includes tokenName', () => {
    const payload = buildRiskAcknowledgedPayload('My Token', 'algorand_mainnet')
    expect(payload.tokenName).toBe('My Token')
  })

  it('includes network', () => {
    const payload = buildRiskAcknowledgedPayload('My Token', 'algorand_testnet')
    expect(payload.network).toBe('algorand_testnet')
  })

  it('includes timestamp', () => {
    const payload = buildRiskAcknowledgedPayload('Token', 'algorand_mainnet')
    expect(payload.timestamp).toBe(FIXED_NOW)
  })
})
