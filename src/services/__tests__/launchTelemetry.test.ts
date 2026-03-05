/**
 * Unit Tests: LaunchTelemetryService
 *
 * Validates the telemetry service used to track the guided token launch flow.
 *
 * Coverage targets:
 *   - initialize: sets userId, subsequent events use that userId
 *   - trackFlowStarted: emits FLOW_STARTED with referrer/source
 *   - trackStepStarted: emits STEP_STARTED with stepId, stepTitle, stepIndex
 *   - trackStepCompleted: emits STEP_COMPLETED with timeSpentSeconds
 *   - trackValidationFailed: emits STEP_VALIDATION_FAILED with errors and warnings
 *   - trackDraftSaved: emits DRAFT_SAVED with draftId and step counts
 *   - trackDraftResumed: emits DRAFT_RESUMED with daysSinceModified
 *   - trackLaunchSuccess: emits LAUNCH_SUCCESS with submissionId and tokenId
 *   - trackLaunchFailed: emits LAUNCH_FAILED with error and retryable
 *   - trackFlowAbandoned: emits FLOW_ABANDONED with step info
 *   - getEvents: returns defensive copy of events array
 *   - clearEvents: empties the events array
 *   - anonymous userId used when initialize() not called
 *   - sessionId prefix and consistency
 *
 * Issue: MVP frontend sign-off hardening — increase critical-path test coverage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { launchTelemetryService } from '../launchTelemetry'
import { LaunchEventType } from '../../types/guidedLaunch'

// Isolate each test via clearEvents()
beforeEach(() => {
  launchTelemetryService.clearEvents()
})

// ---------------------------------------------------------------------------
// initialize
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — initialize', () => {
  it('uses "anonymous" userId when not initialized', () => {
    launchTelemetryService.trackFlowStarted()
    const events = launchTelemetryService.getEvents()
    expect(events[0].userId).toBe('anonymous')
  })

  it('uses the provided userId after initialize()', () => {
    launchTelemetryService.initialize('user@test.io')
    launchTelemetryService.trackFlowStarted()
    const events = launchTelemetryService.getEvents()
    expect(events[0].userId).toBe('user@test.io')
  })
})

// ---------------------------------------------------------------------------
// trackFlowStarted
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackFlowStarted', () => {
  it('emits a FLOW_STARTED event', () => {
    launchTelemetryService.trackFlowStarted({ referrer: 'https://example.com', source: 'cta' })
    const events = launchTelemetryService.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe(LaunchEventType.FLOW_STARTED)
  })

  it('includes referrer and source in event data', () => {
    launchTelemetryService.trackFlowStarted({ referrer: 'https://example.com', source: 'direct' })
    const events = launchTelemetryService.getEvents()
    expect(events[0].data.referrer).toBe('https://example.com')
    expect(events[0].data.source).toBe('direct')
  })

  it('emits event with empty data when called without arguments', () => {
    launchTelemetryService.trackFlowStarted()
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.FLOW_STARTED)
  })
})

// ---------------------------------------------------------------------------
// trackStepStarted
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackStepStarted', () => {
  it('emits a STEP_STARTED event with correct data', () => {
    launchTelemetryService.trackStepStarted('org-details', 'Organization Details', 0)
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.STEP_STARTED)
    expect(events[0].data.stepId).toBe('org-details')
    expect(events[0].data.stepTitle).toBe('Organization Details')
    expect(events[0].data.stepIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// trackStepCompleted
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackStepCompleted', () => {
  it('emits a STEP_COMPLETED event with timeSpentSeconds', () => {
    launchTelemetryService.trackStepCompleted('org-details', 'Organization Details', 0, 30)
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.STEP_COMPLETED)
    expect(events[0].data.timeSpentSeconds).toBe(30)
    expect(events[0].data.stepId).toBe('org-details')
  })
})

// ---------------------------------------------------------------------------
// trackValidationFailed
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackValidationFailed', () => {
  it('emits a STEP_VALIDATION_FAILED event with errors and warnings', () => {
    launchTelemetryService.trackValidationFailed('org-details', 'Org Details', ['Name required'], ['Email recommended'])
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.STEP_VALIDATION_FAILED)
    expect(events[0].data.errors).toEqual(['Name required'])
    expect(events[0].data.warnings).toEqual(['Email recommended'])
    expect(events[0].data.errorCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// trackDraftSaved
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackDraftSaved', () => {
  it('emits a DRAFT_SAVED event with draftId and step counts', () => {
    launchTelemetryService.trackDraftSaved('draft-001', 2, 5)
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.DRAFT_SAVED)
    expect(events[0].data.draftId).toBe('draft-001')
    expect(events[0].data.completedSteps).toBe(2)
    expect(events[0].data.totalSteps).toBe(5)
  })

  it('computes progressPercentage correctly', () => {
    launchTelemetryService.trackDraftSaved('draft-001', 2, 4)
    const events = launchTelemetryService.getEvents()
    expect(events[0].data.progressPercentage).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// trackDraftResumed
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackDraftResumed', () => {
  it('emits a DRAFT_RESUMED event with daysSinceModified', () => {
    const lastModified = new Date('2025-01-01T10:00:00Z')
    launchTelemetryService.trackDraftResumed('draft-002', lastModified, 3)
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.DRAFT_RESUMED)
    expect(events[0].data.draftId).toBe('draft-002')
    expect(events[0].data.daysSinceModified).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// trackLaunchSuccess
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackLaunchSuccess', () => {
  it('emits a LAUNCH_SUCCESS event with tokenId and timeToCompleteMinutes', () => {
    // timeToComplete is in SECONDS; service converts to minutes via Math.round(t / 60)
    launchTelemetryService.trackLaunchSuccess('sub-001', 'token-abc-123', 600)
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.LAUNCH_SUCCESS)
    expect(events[0].data.submissionId).toBe('sub-001')
    expect(events[0].data.tokenId).toBe('token-abc-123')
    // 600 seconds / 60 = 10 minutes
    expect(events[0].data.timeToCompleteMinutes).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// trackLaunchFailed
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackLaunchFailed', () => {
  it('emits a LAUNCH_FAILED event with error message and retryable flag', () => {
    launchTelemetryService.trackLaunchFailed('sub-002', 'Network timeout', true)
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.LAUNCH_FAILED)
    expect(events[0].data.error).toBe('Network timeout')
    expect(events[0].data.retryable).toBe(true)
  })

  it('sets retryable to false for non-retryable errors', () => {
    launchTelemetryService.trackLaunchFailed('sub-003', 'Validation error', false)
    const events = launchTelemetryService.getEvents()
    expect(events[0].data.retryable).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// trackFlowAbandoned
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — trackFlowAbandoned', () => {
  it('emits a FLOW_ABANDONED event with step info', () => {
    launchTelemetryService.trackFlowAbandoned('step-3', 2, 5)
    const events = launchTelemetryService.getEvents()
    expect(events[0].type).toBe(LaunchEventType.FLOW_ABANDONED)
    expect(events[0].data.lastStep).toBe('step-3')
    expect(events[0].data.completedSteps).toBe(2)
    expect(events[0].data.totalSteps).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// getEvents
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — getEvents', () => {
  it('returns a defensive copy of events', () => {
    launchTelemetryService.trackFlowStarted()
    const events1 = launchTelemetryService.getEvents()
    const events2 = launchTelemetryService.getEvents()
    expect(events1).toEqual(events2)
    expect(events1).not.toBe(events2) // different array references
  })

  it('returns empty array when no events', () => {
    expect(launchTelemetryService.getEvents()).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// clearEvents
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — clearEvents', () => {
  it('resets events array to empty', () => {
    launchTelemetryService.trackFlowStarted()
    launchTelemetryService.trackFlowStarted()
    expect(launchTelemetryService.getEvents()).toHaveLength(2)
    launchTelemetryService.clearEvents()
    expect(launchTelemetryService.getEvents()).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// event metadata
// ---------------------------------------------------------------------------
describe('LaunchTelemetryService — event metadata', () => {
  it('every event has a Date timestamp', () => {
    launchTelemetryService.trackFlowStarted()
    const events = launchTelemetryService.getEvents()
    expect(events[0].timestamp).toBeInstanceOf(Date)
  })

  it('every event has the same sessionId within a session', () => {
    launchTelemetryService.trackFlowStarted()
    launchTelemetryService.trackStepStarted('step-1', 'Step 1', 0)
    const events = launchTelemetryService.getEvents()
    expect(events[0].sessionId).toBe(events[1].sessionId)
  })

  it('sessionId starts with "session_"', () => {
    launchTelemetryService.trackFlowStarted()
    const events = launchTelemetryService.getEvents()
    expect(events[0].sessionId).toMatch(/^session_/)
  })
})
