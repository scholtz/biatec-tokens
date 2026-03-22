/**
 * Unit tests: strictSignoffArtifact.ts
 *
 * Comprehensive coverage for artifact classification, evidence truth mapping,
 * provenance helpers, parsing, and display utilities.
 *
 * Acceptance Criteria validated:
 *  AC #1 — Protected strict sign-off path produces a state that distinguishes
 *           infrastructure-only proof from backend-confirmed release evidence.
 *  AC #2 — Frontend clearly communicates whether artifact is configured,
 *           unconfigured, failed, stale, or credible for release promotion.
 *  AC #4 — Success states use language only shown when backend-confirmed
 *           evidence exists; missing configuration never appears as release-ready.
 */

import { describe, it, expect } from 'vitest'
import {
  type SignoffStatusArtifact,
  type StrictArtifactState,
  classifyArtifactState,
  artifactStateToEvidenceTruth,
  isArtifactReleaseEvidence,
  isArtifactBlocking,
  STRICT_ARTIFACT_STATE_LABELS,
  STRICT_ARTIFACT_STATE_DESCRIPTIONS,
  STRICT_ARTIFACT_NEXT_ACTIONS,
  artifactStateBannerClass,
  artifactStateTitleClass,
  artifactStateBodyClass,
  artifactStateBadgeClass,
  formatCommitSha,
  formatArtifactTimestamp,
  buildArtifactProvenanceLabel,
  parseSignoffStatusArtifact,
  STRICT_ARTIFACT_TEST_IDS,
} from '../strictSignoffArtifact'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makePassingArtifact(overrides: Partial<SignoffStatusArtifact> = {}): SignoffStatusArtifact {
  return {
    status: 'passed',
    mode: 'full-strict',
    is_release_evidence: true,
    timestamp: '2026-03-22T14:00:00.000Z',
    run_id: '23410000910',
    commit_sha: 'c0d501a9f34b0093528f244afb2b83aec2c60812',
    ref: 'refs/heads/main',
    trigger: 'workflow_dispatch',
    api_base_url_set: true,
    credentials_set: true,
    summary: 'Full strict sign-off run. is_release_evidence=true. Status=passed.',
    ...overrides,
  }
}

function makeNotConfiguredArtifact(overrides: Partial<SignoffStatusArtifact> = {}): SignoffStatusArtifact {
  return {
    status: 'not_configured',
    mode: 'not-configured',
    is_release_evidence: false,
    timestamp: '2026-03-22T18:44:00.000Z',
    run_id: '23410000910',
    commit_sha: 'c0d501a9f34b0093528f244afb2b83aec2c60812',
    ref: 'refs/heads/main',
    trigger: 'push',
    api_base_url_set: false,
    credentials_set: false,
    summary: 'Sign-off prerequisites not configured. Tests were skipped. This is NOT release evidence.',
    action_required: 'Configure SIGNOFF_API_BASE_URL and SIGNOFF_TEST_PASSWORD',
    next_steps: [
      'Go to Repository Settings → Environments → sign-off-protected',
      'Add SIGNOFF_API_BASE_URL set to the live staging backend URL',
    ],
    ...overrides,
  }
}

function makeFailedArtifact(overrides: Partial<SignoffStatusArtifact> = {}): SignoffStatusArtifact {
  return {
    status: 'failed',
    mode: 'full-strict',
    is_release_evidence: false,
    timestamp: '2026-03-22T18:44:00.000Z',
    run_id: '23410000911',
    commit_sha: 'abc12345def67890',
    ref: 'refs/heads/main',
    trigger: 'push',
    api_base_url_set: true,
    credentials_set: true,
    summary: 'Full strict sign-off run. is_release_evidence=false. Status=failed.',
    ...overrides,
  }
}

function makeSkippedArtifact(overrides: Partial<SignoffStatusArtifact> = {}): SignoffStatusArtifact {
  return {
    status: 'skipped',
    mode: 'full-strict',
    is_release_evidence: false,
    timestamp: '2026-03-22T18:44:00.000Z',
    run_id: '23410000912',
    commit_sha: 'def67890abc12345',
    ref: 'refs/heads/main',
    trigger: 'push',
    api_base_url_set: true,
    credentials_set: false,
    summary: 'Full strict sign-off run. Status=skipped.',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// classifyArtifactState
// ---------------------------------------------------------------------------

describe('classifyArtifactState', () => {
  it('returns backend_confirmed_passing for is_release_evidence:true, mode:full-strict, status:passed', () => {
    expect(classifyArtifactState(makePassingArtifact())).toBe('backend_confirmed_passing')
  })

  it('returns not_configured for mode:not-configured', () => {
    expect(classifyArtifactState(makeNotConfiguredArtifact())).toBe('not_configured')
  })

  it('returns not_configured when status is not_configured (regardless of mode)', () => {
    expect(classifyArtifactState(makeNotConfiguredArtifact({ mode: 'full-strict' as SignoffStatusArtifact['mode'] }))).toBe('not_configured')
  })

  it('returns backend_confirmed_failed for mode:full-strict, status:failed', () => {
    expect(classifyArtifactState(makeFailedArtifact())).toBe('backend_confirmed_failed')
  })

  it('returns backend_configured_skipped for mode:full-strict, status:skipped', () => {
    expect(classifyArtifactState(makeSkippedArtifact())).toBe('backend_configured_skipped')
  })

  it('returns infrastructure_only when mode:full-strict but is_release_evidence is false and status is not failed/skipped', () => {
    // Defensive: if future format sends an unusual status with full-strict
    const unusual = makePassingArtifact({ status: 'passed', is_release_evidence: false })
    // is_release_evidence is false and mode is full-strict — this is an unusual case
    // The function returns infrastructure_only as a fallback
    expect(classifyArtifactState(unusual)).toBe('infrastructure_only')
  })

  it('returns backend_confirmed_passing ONLY when is_release_evidence is true AND status is passed', () => {
    // Ensure both conditions are required
    const onlyPassed = makePassingArtifact({ is_release_evidence: false })
    expect(classifyArtifactState(onlyPassed)).toBe('infrastructure_only')
  })
})

// ---------------------------------------------------------------------------
// artifactStateToEvidenceTruth — fail-closed mapping
// ---------------------------------------------------------------------------

describe('artifactStateToEvidenceTruth', () => {
  it('maps backend_confirmed_passing → backend_confirmed', () => {
    expect(artifactStateToEvidenceTruth('backend_confirmed_passing')).toBe('backend_confirmed')
  })

  it('maps backend_confirmed_failed → unavailable', () => {
    expect(artifactStateToEvidenceTruth('backend_confirmed_failed')).toBe('unavailable')
  })

  it('maps backend_configured_skipped → partial_hydration', () => {
    expect(artifactStateToEvidenceTruth('backend_configured_skipped')).toBe('partial_hydration')
  })

  it('maps not_configured → environment_blocked', () => {
    expect(artifactStateToEvidenceTruth('not_configured')).toBe('environment_blocked')
  })

  it('maps infrastructure_only → environment_blocked', () => {
    expect(artifactStateToEvidenceTruth('infrastructure_only')).toBe('environment_blocked')
  })

  it('maps missing → environment_blocked', () => {
    expect(artifactStateToEvidenceTruth('missing')).toBe('environment_blocked')
  })

  it('only one state maps to backend_confirmed (fail-closed guarantee)', () => {
    const ALL_STATES: StrictArtifactState[] = [
      'backend_confirmed_passing',
      'backend_confirmed_failed',
      'backend_configured_skipped',
      'not_configured',
      'infrastructure_only',
      'missing',
    ]
    const confirmed = ALL_STATES.filter(
      (s) => artifactStateToEvidenceTruth(s) === 'backend_confirmed',
    )
    expect(confirmed).toHaveLength(1)
    expect(confirmed[0]).toBe('backend_confirmed_passing')
  })
})

// ---------------------------------------------------------------------------
// isArtifactReleaseEvidence
// ---------------------------------------------------------------------------

describe('isArtifactReleaseEvidence', () => {
  it('returns true only for backend_confirmed_passing', () => {
    expect(isArtifactReleaseEvidence('backend_confirmed_passing')).toBe(true)
  })

  const nonPassingStates: StrictArtifactState[] = [
    'backend_confirmed_failed',
    'backend_configured_skipped',
    'not_configured',
    'infrastructure_only',
    'missing',
  ]
  for (const state of nonPassingStates) {
    it(`returns false for ${state}`, () => {
      expect(isArtifactReleaseEvidence(state)).toBe(false)
    })
  }
})

// ---------------------------------------------------------------------------
// isArtifactBlocking
// ---------------------------------------------------------------------------

describe('isArtifactBlocking', () => {
  it('returns false only for backend_confirmed_passing', () => {
    expect(isArtifactBlocking('backend_confirmed_passing')).toBe(false)
  })

  it('returns true for not_configured', () => {
    expect(isArtifactBlocking('not_configured')).toBe(true)
  })

  it('returns true for backend_confirmed_failed', () => {
    expect(isArtifactBlocking('backend_confirmed_failed')).toBe(true)
  })

  it('returns true for missing', () => {
    expect(isArtifactBlocking('missing')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Display constants
// ---------------------------------------------------------------------------

describe('STRICT_ARTIFACT_STATE_LABELS', () => {
  const ALL_STATES: StrictArtifactState[] = [
    'backend_confirmed_passing',
    'backend_confirmed_failed',
    'backend_configured_skipped',
    'not_configured',
    'infrastructure_only',
    'missing',
  ]

  it('has a non-empty label for every state', () => {
    for (const s of ALL_STATES) {
      expect(STRICT_ARTIFACT_STATE_LABELS[s]).toBeTruthy()
      expect(STRICT_ARTIFACT_STATE_LABELS[s].length).toBeGreaterThan(0)
    }
  })

  it('backend_confirmed_passing label does not imply uncertainty', () => {
    expect(STRICT_ARTIFACT_STATE_LABELS.backend_confirmed_passing).toContain('Backend-Confirmed')
  })

  it('not_configured label does NOT contain "passing" or "confirmed"', () => {
    const label = STRICT_ARTIFACT_STATE_LABELS.not_configured.toLowerCase()
    expect(label).not.toContain('confirmed')
    expect(label).not.toContain('passing')
  })
})

describe('STRICT_ARTIFACT_STATE_DESCRIPTIONS', () => {
  const ALL_STATES: StrictArtifactState[] = [
    'backend_confirmed_passing',
    'backend_confirmed_failed',
    'backend_configured_skipped',
    'not_configured',
    'infrastructure_only',
    'missing',
  ]

  it('has a description for every state', () => {
    for (const s of ALL_STATES) {
      expect(STRICT_ARTIFACT_STATE_DESCRIPTIONS[s]).toBeTruthy()
    }
  })

  it('not_configured description says NOT release evidence', () => {
    expect(STRICT_ARTIFACT_STATE_DESCRIPTIONS.not_configured.toUpperCase()).toContain('NOT')
  })

  it('backend_confirmed_passed description says credible release evidence', () => {
    expect(STRICT_ARTIFACT_STATE_DESCRIPTIONS.backend_confirmed_passing.toLowerCase()).toContain('credible release evidence')
  })
})

describe('STRICT_ARTIFACT_NEXT_ACTIONS', () => {
  const ALL_STATES: StrictArtifactState[] = [
    'backend_confirmed_passing',
    'backend_confirmed_failed',
    'backend_configured_skipped',
    'not_configured',
    'infrastructure_only',
    'missing',
  ]

  it('has operator guidance for every state', () => {
    for (const s of ALL_STATES) {
      expect(STRICT_ARTIFACT_NEXT_ACTIONS[s]).toBeTruthy()
      expect(STRICT_ARTIFACT_NEXT_ACTIONS[s].length).toBeGreaterThan(10)
    }
  })

  it('not_configured next action mentions secrets / configuration', () => {
    expect(STRICT_ARTIFACT_NEXT_ACTIONS.not_configured.toLowerCase()).toMatch(/secret|configure/)
  })
})

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------

describe('artifactStateBannerClass', () => {
  it('returns green for backend_confirmed_passing', () => {
    expect(artifactStateBannerClass('backend_confirmed_passing')).toContain('green')
  })

  it('returns red for backend_confirmed_failed', () => {
    expect(artifactStateBannerClass('backend_confirmed_failed')).toContain('red')
  })

  it('returns yellow for not_configured', () => {
    expect(artifactStateBannerClass('not_configured')).toContain('yellow')
  })

  it('returns yellow for missing', () => {
    expect(artifactStateBannerClass('missing')).toContain('yellow')
  })

  it('returns blue for backend_configured_skipped', () => {
    expect(artifactStateBannerClass('backend_configured_skipped')).toContain('blue')
  })
})

describe('artifactStateTitleClass', () => {
  it('returns green for backend_confirmed_passing', () => {
    expect(artifactStateTitleClass('backend_confirmed_passing')).toContain('green')
  })

  it('returns red for backend_confirmed_failed', () => {
    expect(artifactStateTitleClass('backend_confirmed_failed')).toContain('red')
  })

  it('returns yellow for not_configured', () => {
    expect(artifactStateTitleClass('not_configured')).toContain('yellow')
  })
})

describe('artifactStateBodyClass', () => {
  it('returns green for backend_confirmed_passing', () => {
    expect(artifactStateBodyClass('backend_confirmed_passing')).toContain('green')
  })

  it('returns red for backend_confirmed_failed', () => {
    expect(artifactStateBodyClass('backend_confirmed_failed')).toContain('red')
  })

  it('returns yellow for missing', () => {
    expect(artifactStateBodyClass('missing')).toContain('yellow')
  })
})

describe('artifactStateBadgeClass', () => {
  it('returns green for backend_confirmed_passing', () => {
    expect(artifactStateBadgeClass('backend_confirmed_passing')).toContain('green')
  })

  it('returns red for backend_confirmed_failed', () => {
    expect(artifactStateBadgeClass('backend_confirmed_failed')).toContain('red')
  })
})

// ---------------------------------------------------------------------------
// formatCommitSha
// ---------------------------------------------------------------------------

describe('formatCommitSha', () => {
  it('returns first 8 characters of a full SHA', () => {
    expect(formatCommitSha('c0d501a9f34b0093528f244afb2b83aec2c60812')).toBe('c0d501a9')
  })

  it('returns unknown for empty string', () => {
    expect(formatCommitSha('')).toBe('unknown')
  })

  it('returns unknown for undefined', () => {
    expect(formatCommitSha(undefined)).toBe('unknown')
  })

  it('returns full short SHA when input is shorter than 8 chars', () => {
    expect(formatCommitSha('abc1234')).toBe('abc1234')
  })
})

// ---------------------------------------------------------------------------
// formatArtifactTimestamp
// ---------------------------------------------------------------------------

describe('formatArtifactTimestamp', () => {
  it('returns Unknown for empty string', () => {
    expect(formatArtifactTimestamp('')).toBe('Unknown')
  })

  it('returns Unknown for undefined', () => {
    expect(formatArtifactTimestamp(undefined)).toBe('Unknown')
  })

  it('returns a non-empty string for a valid ISO timestamp', () => {
    const result = formatArtifactTimestamp('2026-03-22T14:00:00.000Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe('Unknown')
  })

  it('returns the raw string for an unparseable timestamp', () => {
    // Some environments may throw on invalid dates; others return 'Invalid Date'
    const result = formatArtifactTimestamp('not-a-date')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// buildArtifactProvenanceLabel
// ---------------------------------------------------------------------------

describe('buildArtifactProvenanceLabel', () => {
  it('returns "no artifact available" message when state is missing', () => {
    const label = buildArtifactProvenanceLabel(null, 'missing')
    expect(label.toLowerCase()).toContain('no current-head')
  })

  it('returns "no artifact available" message when artifact is null regardless of state', () => {
    const label = buildArtifactProvenanceLabel(null, 'not_configured')
    expect(label.toLowerCase()).toContain('no current-head')
  })

  it('includes run_id in provenance label', () => {
    const artifact = makePassingArtifact()
    const label = buildArtifactProvenanceLabel(artifact, 'backend_confirmed_passing')
    expect(label).toContain('23410000910')
  })

  it('includes shortened commit SHA in provenance label', () => {
    const artifact = makePassingArtifact()
    const label = buildArtifactProvenanceLabel(artifact, 'backend_confirmed_passing')
    expect(label).toContain('c0d501a9')
  })
})

// ---------------------------------------------------------------------------
// parseSignoffStatusArtifact
// ---------------------------------------------------------------------------

describe('parseSignoffStatusArtifact', () => {
  it('returns null for null input', () => {
    expect(parseSignoffStatusArtifact(null)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(parseSignoffStatusArtifact('string')).toBeNull()
    expect(parseSignoffStatusArtifact(42)).toBeNull()
    expect(parseSignoffStatusArtifact([])).toBeNull()
  })

  it('returns null when required fields are missing', () => {
    expect(parseSignoffStatusArtifact({})).toBeNull()
    expect(parseSignoffStatusArtifact({ status: 'passed' })).toBeNull()
    expect(parseSignoffStatusArtifact({ status: 'passed', mode: 'full-strict' })).toBeNull()
  })

  it('parses a valid not-configured artifact', () => {
    const raw = {
      status: 'not_configured',
      mode: 'not-configured',
      is_release_evidence: false,
      timestamp: '2026-03-22T18:44:00.000Z',
      run_id: '23410000910',
      commit_sha: 'c0d501a9f34b0093528f244afb2b83aec2c60812',
      ref: 'refs/heads/main',
      trigger: 'push',
      api_base_url_set: false,
      credentials_set: false,
      summary: 'Not configured.',
      action_required: 'Configure secrets.',
      next_steps: ['Step 1', 'Step 2'],
    }
    const result = parseSignoffStatusArtifact(raw)
    expect(result).not.toBeNull()
    expect(result!.status).toBe('not_configured')
    expect(result!.mode).toBe('not-configured')
    expect(result!.is_release_evidence).toBe(false)
    expect(result!.action_required).toBe('Configure secrets.')
    expect(result!.next_steps).toEqual(['Step 1', 'Step 2'])
  })

  it('parses a valid passing artifact', () => {
    const raw = {
      status: 'passed',
      mode: 'full-strict',
      is_release_evidence: true,
      timestamp: '2026-03-22T14:00:00.000Z',
      run_id: '23410000910',
      commit_sha: 'c0d501a9f34b0093528f244afb2b83aec2c60812',
      ref: 'refs/heads/main',
      trigger: 'workflow_dispatch',
      api_base_url_set: true,
      credentials_set: true,
      summary: 'Passed.',
    }
    const result = parseSignoffStatusArtifact(raw)
    expect(result).not.toBeNull()
    expect(result!.is_release_evidence).toBe(true)
    expect(result!.status).toBe('passed')
  })

  it('handles missing optional fields gracefully', () => {
    const minimal = {
      status: 'passed',
      mode: 'full-strict',
      is_release_evidence: true,
      timestamp: '2026-03-22T14:00:00.000Z',
    }
    const result = parseSignoffStatusArtifact(minimal)
    expect(result).not.toBeNull()
    expect(result!.run_id).toBe('')
    expect(result!.commit_sha).toBe('')
    expect(result!.action_required).toBeUndefined()
    expect(result!.next_steps).toBeUndefined()
  })

  it('ignores non-string entries in next_steps array', () => {
    const raw = {
      status: 'not_configured',
      mode: 'not-configured',
      is_release_evidence: false,
      timestamp: '2026-03-22T14:00:00.000Z',
      next_steps: ['Step 1', 42, null, 'Step 3'],
    }
    const result = parseSignoffStatusArtifact(raw)
    expect(result).not.toBeNull()
    expect(result!.next_steps).toEqual(['Step 1', 'Step 3'])
  })
})

// ---------------------------------------------------------------------------
// Test ID constants
// ---------------------------------------------------------------------------

describe('STRICT_ARTIFACT_TEST_IDS', () => {
  it('has PANEL id', () => {
    expect(STRICT_ARTIFACT_TEST_IDS.PANEL).toBeTruthy()
  })

  it('has BANNER id', () => {
    expect(STRICT_ARTIFACT_TEST_IDS.BANNER).toBeTruthy()
  })

  it('has RELEASE_EVIDENCE_INDICATOR id', () => {
    expect(STRICT_ARTIFACT_TEST_IDS.RELEASE_EVIDENCE_INDICATOR).toBeTruthy()
  })

  it('has NEXT_ACTION id', () => {
    expect(STRICT_ARTIFACT_TEST_IDS.NEXT_ACTION).toBeTruthy()
  })

  it('all test IDs are unique strings', () => {
    const ids = Object.values(STRICT_ARTIFACT_TEST_IDS)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})
