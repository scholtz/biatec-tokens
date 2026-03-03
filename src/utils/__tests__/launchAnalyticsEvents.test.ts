/**
 * Unit tests for launchAnalyticsEvents utility
 *
 * Validates:
 * - All event name constants exist and are stable strings
 * - Payload builders return structurally correct objects
 * - Timestamps are present in all payloads
 * - Edge cases (zero values, empty strings) are handled gracefully
 *
 * Business value: Analytics event schema stability prevents silent data loss
 * in production dashboards.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
} from '../launchAnalyticsEvents'

describe('LAUNCH_ANALYTICS_EVENTS', () => {
  it('contains STEP_ENTERED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.STEP_ENTERED).toBe('launch:step_entered')
  })

  it('contains STEP_COMPLETED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.STEP_COMPLETED).toBe('launch:step_completed')
  })

  it('contains VALIDATION_FAILED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.VALIDATION_FAILED).toBe('launch:validation_failed')
  })

  it('contains DRAFT_SAVED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.DRAFT_SAVED).toBe('launch:draft_saved')
  })

  it('contains LAUNCH_SUCCEEDED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.LAUNCH_SUCCEEDED).toBe('launch:launch_succeeded')
  })

  it('contains LAUNCH_CANCELLED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.LAUNCH_CANCELLED).toBe('launch:launch_cancelled')
  })

  it('contains LAUNCH_FAILED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.LAUNCH_FAILED).toBe('launch:launch_failed')
  })

  it('contains PREFLIGHT_CHECKED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.PREFLIGHT_CHECKED).toBe('launch:preflight_checked')
  })

  it('contains TRANSACTION_PREVIEW_OPENED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.TRANSACTION_PREVIEW_OPENED).toBe('launch:transaction_preview_opened')
  })

  it('contains RISK_ACKNOWLEDGED event name', () => {
    expect(LAUNCH_ANALYTICS_EVENTS.RISK_ACKNOWLEDGED).toBe('launch:risk_acknowledged')
  })

  it('all event names start with "launch:" prefix', () => {
    for (const value of Object.values(LAUNCH_ANALYTICS_EVENTS)) {
      expect(value).toMatch(/^launch:/)
    }
  })

  it('all event names are unique', () => {
    const values = Object.values(LAUNCH_ANALYTICS_EVENTS)
    expect(new Set(values).size).toBe(values.length)
  })
})

describe('buildStepEnteredPayload', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns stepId, stepIndex, totalSteps', () => {
    const payload = buildStepEnteredPayload('organization-profile', 0, 6)
    expect(payload.stepId).toBe('organization-profile')
    expect(payload.stepIndex).toBe(0)
    expect(payload.totalSteps).toBe(6)
  })

  it('computes progressPercent correctly', () => {
    expect(buildStepEnteredPayload('step', 3, 6).progressPercent).toBe(50)
  })

  it('returns 0 progressPercent when totalSteps is 0', () => {
    expect(buildStepEnteredPayload('step', 0, 0).progressPercent).toBe(0)
  })

  it('includes timestamp', () => {
    expect(buildStepEnteredPayload('step', 1, 6).timestamp).toBe(1700000000000)
  })
})

describe('buildStepCompletedPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('returns stepId and durationMs', () => {
    const payload = buildStepCompletedPayload('token-intent', 4200)
    expect(payload.stepId).toBe('token-intent')
    expect(payload.durationMs).toBe(4200)
  })

  it('includes timestamp', () => {
    expect(buildStepCompletedPayload('step', 0).timestamp).toBe(1700000000000)
  })
})

describe('buildValidationFailedPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('returns stepId, fieldIds and errorCount', () => {
    const payload = buildValidationFailedPayload('economics', ['totalSupply', 'decimals'], 2)
    expect(payload.stepId).toBe('economics')
    expect(payload.fieldIds).toEqual(['totalSupply', 'decimals'])
    expect(payload.errorCount).toBe(2)
  })

  it('includes timestamp', () => {
    expect(buildValidationFailedPayload('step', [], 0).timestamp).toBe(1700000000000)
  })

  it('handles empty fieldIds array', () => {
    const payload = buildValidationFailedPayload('step', [], 0)
    expect(payload.fieldIds).toEqual([])
    expect(payload.errorCount).toBe(0)
  })
})

describe('buildDraftSavedPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('returns stepId', () => {
    const payload = buildDraftSavedPayload('template-selection')
    expect(payload.stepId).toBe('template-selection')
  })

  it('includes timestamp', () => {
    expect(buildDraftSavedPayload('step').timestamp).toBe(1700000000000)
  })
})

describe('buildLaunchSucceededPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('returns submissionId, template and network', () => {
    const payload = buildLaunchSucceededPayload('sub-123', 'ARC3', 'algorand')
    expect(payload.submissionId).toBe('sub-123')
    expect(payload.template).toBe('ARC3')
    expect(payload.network).toBe('algorand')
  })

  it('includes timestamp', () => {
    expect(buildLaunchSucceededPayload('sub-1', 'ARC3', 'algorand').timestamp).toBe(1700000000000)
  })
})

describe('buildLaunchCancelledPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('uses user_initiated reason by default', () => {
    const payload = buildLaunchCancelledPayload('review')
    expect(payload.reason).toBe('user_initiated')
  })

  it('accepts custom reason', () => {
    const payload = buildLaunchCancelledPayload('review', 'back_navigation')
    expect(payload.reason).toBe('back_navigation')
  })

  it('includes timestamp', () => {
    expect(buildLaunchCancelledPayload('review').timestamp).toBe(1700000000000)
  })
})

describe('buildLaunchFailedPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('returns error and stepId', () => {
    const payload = buildLaunchFailedPayload('Submission timeout', 'review-submit')
    expect(payload.error).toBe('Submission timeout')
    expect(payload.stepId).toBe('review-submit')
  })

  it('includes timestamp', () => {
    expect(buildLaunchFailedPayload('err', 'step').timestamp).toBe(1700000000000)
  })
})

describe('buildPreflightCheckedPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('returns passed, blockerCount, warningCount', () => {
    const payload = buildPreflightCheckedPayload(true, 0, 2)
    expect(payload.passed).toBe(true)
    expect(payload.blockerCount).toBe(0)
    expect(payload.warningCount).toBe(2)
  })

  it('returns false when failed', () => {
    expect(buildPreflightCheckedPayload(false, 3, 0).passed).toBe(false)
  })

  it('includes timestamp', () => {
    expect(buildPreflightCheckedPayload(true, 0, 0).timestamp).toBe(1700000000000)
  })
})

describe('buildTransactionPreviewOpenedPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('returns tokenName, tokenStandard, network', () => {
    const payload = buildTransactionPreviewOpenedPayload('MyToken', 'ARC3', 'algorand')
    expect(payload.tokenName).toBe('MyToken')
    expect(payload.tokenStandard).toBe('ARC3')
    expect(payload.network).toBe('algorand')
  })

  it('includes timestamp', () => {
    expect(buildTransactionPreviewOpenedPayload('T', 'ARC3', 'algorand').timestamp).toBe(1700000000000)
  })
})

describe('buildRiskAcknowledgedPayload', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1700000000000))
  afterEach(() => vi.restoreAllMocks())

  it('returns tokenName and network', () => {
    const payload = buildRiskAcknowledgedPayload('Biatec Token', 'algorand-testnet')
    expect(payload.tokenName).toBe('Biatec Token')
    expect(payload.network).toBe('algorand-testnet')
  })

  it('includes timestamp', () => {
    expect(buildRiskAcknowledgedPayload('T', 'algorand').timestamp).toBe(1700000000000)
  })
})

describe('LaunchAnalyticsEventName type (compile-time usage)', () => {
  it('can be assigned from LAUNCH_ANALYTICS_EVENTS values', () => {
    const event: LaunchAnalyticsEventName = LAUNCH_ANALYTICS_EVENTS.STEP_ENTERED
    expect(typeof event).toBe('string')
  })
})
