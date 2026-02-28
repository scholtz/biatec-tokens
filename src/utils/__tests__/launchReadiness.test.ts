import { describe, it, expect } from 'vitest'
import {
  computeOverallReadiness,
  getReadinessStatusLabel,
  getReadinessStatusDescription,
  getReadinessStatusColor,
  buildDefaultReadinessItems,
  type ReadinessItem,
  type ReadinessStatus,
} from '../launchReadiness'

function makeItem(overrides: Partial<ReadinessItem> & { id: string }): ReadinessItem {
  return {
    label: `Item ${overrides.id}`,
    description: 'A test readiness item',
    status: 'not_started',
    isRequired: true,
    order: 1,
    ...overrides,
  }
}

describe('computeOverallReadiness', () => {
  it('returns empty report for empty items array', () => {
    const report = computeOverallReadiness([])

    expect(report.items).toHaveLength(0)
    expect(report.overallStatus).toBe('not_started')
    expect(report.completedCount).toBe(0)
    expect(report.totalCount).toBe(0)
    expect(report.readinessScore).toBe(0)
    expect(report.estimatedMinutesRemaining).toBe(0)
    expect(report.canProceedToLaunch).toBe(false)
    expect(report.nextActionItem).toBeNull()
  })

  it('returns ready status when all items are ready', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', order: 1 }),
      makeItem({ id: '2', status: 'ready', order: 2 }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.overallStatus).toBe('ready')
    expect(report.completedCount).toBe(2)
    expect(report.readinessScore).toBe(100)
    expect(report.canProceedToLaunch).toBe(true)
    expect(report.nextActionItem).toBeNull()
  })

  it('correctly counts required vs optional completed items', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', isRequired: true }),
      makeItem({ id: '2', status: 'ready', isRequired: false }),
      makeItem({ id: '3', status: 'not_started', isRequired: true }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.requiredTotalCount).toBe(2)
    expect(report.requiredCompletedCount).toBe(1)
    expect(report.totalCount).toBe(3)
    expect(report.completedCount).toBe(2)
  })

  it('returns blocked status when any item is blocked', () => {
    const items = [
      makeItem({ id: '1', status: 'ready' }),
      makeItem({ id: '2', status: 'blocked' }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.overallStatus).toBe('blocked')
  })

  it('returns blocked status for overall when optional item is blocked', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', isRequired: true }),
      makeItem({ id: '2', status: 'blocked', isRequired: false }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.overallStatus).toBe('blocked')
  })

  it('sets canProceedToLaunch to false when required item is blocked', () => {
    const items = [
      makeItem({ id: '1', status: 'blocked', isRequired: true }),
      makeItem({ id: '2', status: 'ready', isRequired: true }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.canProceedToLaunch).toBe(false)
  })

  it('sets canProceedToLaunch to true when only optional item is blocked and all required items are ready', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', isRequired: true }),
      makeItem({ id: '2', status: 'blocked', isRequired: false }),
    ]
    const report = computeOverallReadiness(items)

    // blocked optional item does NOT block launch when all required items are ready
    expect(report.canProceedToLaunch).toBe(true)
  })

  it('returns needs_attention status when an item needs attention and none are blocked', () => {
    const items = [
      makeItem({ id: '1', status: 'ready' }),
      makeItem({ id: '2', status: 'needs_attention' }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.overallStatus).toBe('needs_attention')
  })

  it('returns in_progress status when an item is in progress and none are blocked or need attention', () => {
    const items = [
      makeItem({ id: '1', status: 'ready' }),
      makeItem({ id: '2', status: 'in_progress' }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.overallStatus).toBe('in_progress')
  })

  it('returns not_started when all items are not started', () => {
    const items = [
      makeItem({ id: '1', status: 'not_started' }),
      makeItem({ id: '2', status: 'not_started' }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.overallStatus).toBe('not_started')
  })

  it('calculates readiness score as percentage of completed items', () => {
    const items = [
      makeItem({ id: '1', status: 'ready' }),
      makeItem({ id: '2', status: 'ready' }),
      makeItem({ id: '3', status: 'not_started' }),
      makeItem({ id: '4', status: 'not_started' }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.readinessScore).toBe(50)
  })

  it('calculates readiness score as 0 when no items are complete', () => {
    const items = [
      makeItem({ id: '1', status: 'not_started' }),
      makeItem({ id: '2', status: 'in_progress' }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.readinessScore).toBe(0)
  })

  it('finds next action item as first non-ready item by order', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', order: 1 }),
      makeItem({ id: '2', status: 'not_started', order: 2 }),
      makeItem({ id: '3', status: 'not_started', order: 3 }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.nextActionItem?.id).toBe('2')
  })

  it('prioritizes blocked items as next action over not_started', () => {
    const items = [
      makeItem({ id: '1', status: 'not_started', order: 1 }),
      makeItem({ id: '2', status: 'blocked', order: 2 }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.nextActionItem?.id).toBe('2')
  })

  it('prioritizes needs_attention over in_progress as next action', () => {
    const items = [
      makeItem({ id: '1', status: 'in_progress', order: 1 }),
      makeItem({ id: '2', status: 'needs_attention', order: 2 }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.nextActionItem?.id).toBe('2')
  })

  it('sets canProceedToLaunch true when all required items are ready', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', isRequired: true }),
      makeItem({ id: '2', status: 'not_started', isRequired: false }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.canProceedToLaunch).toBe(true)
  })

  it('calculates estimated minutes remaining from non-ready items', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', estimatedMinutes: 10 }),
      makeItem({ id: '2', status: 'not_started', estimatedMinutes: 15 }),
      makeItem({ id: '3', status: 'in_progress', estimatedMinutes: 20 }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.estimatedMinutesRemaining).toBe(35)
  })

  it('reports zero estimated minutes remaining when all items are complete', () => {
    const items = [
      makeItem({ id: '1', status: 'ready', estimatedMinutes: 10 }),
      makeItem({ id: '2', status: 'ready', estimatedMinutes: 15 }),
    ]
    const report = computeOverallReadiness(items)

    expect(report.estimatedMinutesRemaining).toBe(0)
  })
})

describe('getReadinessStatusLabel', () => {
  it('returns correct label for not_started', () => {
    expect(getReadinessStatusLabel('not_started')).toBe('Not Started')
  })

  it('returns correct label for in_progress', () => {
    expect(getReadinessStatusLabel('in_progress')).toBe('In Progress')
  })

  it('returns correct label for needs_attention', () => {
    expect(getReadinessStatusLabel('needs_attention')).toBe('Needs Your Attention')
  })

  it('returns correct label for ready', () => {
    expect(getReadinessStatusLabel('ready')).toBe('Complete')
  })

  it('returns correct label for blocked', () => {
    expect(getReadinessStatusLabel('blocked')).toBe('Action Required')
  })
})

describe('getReadinessStatusDescription', () => {
  it('returns a non-empty description for not_started', () => {
    expect(getReadinessStatusDescription('not_started')).toBeTruthy()
    expect(getReadinessStatusDescription('not_started').length).toBeGreaterThan(10)
  })

  it('returns a non-empty description for in_progress', () => {
    expect(getReadinessStatusDescription('in_progress')).toBeTruthy()
  })

  it('returns a non-empty description for needs_attention', () => {
    expect(getReadinessStatusDescription('needs_attention')).toBeTruthy()
  })

  it('returns a non-empty description for ready', () => {
    expect(getReadinessStatusDescription('ready')).toBeTruthy()
  })

  it('returns a non-empty description for blocked', () => {
    expect(getReadinessStatusDescription('blocked')).toBeTruthy()
  })

  it('returns distinct descriptions for each status', () => {
    const statuses: ReadinessStatus[] = ['not_started', 'in_progress', 'needs_attention', 'ready', 'blocked']
    const descriptions = statuses.map(getReadinessStatusDescription)
    const unique = new Set(descriptions)
    expect(unique.size).toBe(statuses.length)
  })
})

describe('getReadinessStatusColor', () => {
  it('returns gray color class for not_started', () => {
    expect(getReadinessStatusColor('not_started')).toContain('gray')
  })

  it('returns blue color class for in_progress', () => {
    expect(getReadinessStatusColor('in_progress')).toContain('blue')
  })

  it('returns amber color class for needs_attention', () => {
    expect(getReadinessStatusColor('needs_attention')).toContain('amber')
  })

  it('returns green color class for ready', () => {
    expect(getReadinessStatusColor('ready')).toContain('green')
  })

  it('returns red color class for blocked', () => {
    expect(getReadinessStatusColor('blocked')).toContain('red')
  })

  it('returns a string starting with text- for all statuses', () => {
    const statuses: ReadinessStatus[] = ['not_started', 'in_progress', 'needs_attention', 'ready', 'blocked']
    statuses.forEach((status) => {
      expect(getReadinessStatusColor(status)).toMatch(/^text-/)
    })
  })
})

describe('buildDefaultReadinessItems', () => {
  it('returns exactly 8 items', () => {
    const items = buildDefaultReadinessItems()
    expect(items).toHaveLength(8)
  })

  it('all items have required fields', () => {
    const items = buildDefaultReadinessItems()
    items.forEach((item) => {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.status).toBeTruthy()
      expect(typeof item.isRequired).toBe('boolean')
      expect(typeof item.order).toBe('number')
    })
  })

  it('all items have not_started status by default', () => {
    const items = buildDefaultReadinessItems()
    items.forEach((item) => {
      expect(item.status).toBe('not_started')
    })
  })

  it('all items have positive order numbers', () => {
    const items = buildDefaultReadinessItems()
    items.forEach((item) => {
      expect(item.order).toBeGreaterThan(0)
    })
  })

  it('includes organization profile as first required item', () => {
    const items = buildDefaultReadinessItems()
    const orgProfile = items.find((i) => i.id === 'organization-profile')
    expect(orgProfile).toBeDefined()
    expect(orgProfile?.isRequired).toBe(true)
    expect(orgProfile?.order).toBe(1)
    expect(orgProfile?.estimatedMinutes).toBe(15)
  })

  it('includes investor whitelist as optional item', () => {
    const items = buildDefaultReadinessItems()
    const whitelist = items.find((i) => i.id === 'investor-whitelist')
    expect(whitelist).toBeDefined()
    expect(whitelist?.isRequired).toBe(false)
  })

  it('all items have unique ids', () => {
    const items = buildDefaultReadinessItems()
    const ids = items.map((i) => i.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(items.length)
  })

  it('all items have action labels and routes', () => {
    const items = buildDefaultReadinessItems()
    items.forEach((item) => {
      expect(item.actionLabel).toBeTruthy()
      expect(item.actionRoute).toBeTruthy()
    })
  })

  it('includes required compliance-requirements item', () => {
    const items = buildDefaultReadinessItems()
    const compliance = items.find((i) => i.id === 'compliance-requirements')
    expect(compliance).toBeDefined()
    expect(compliance?.isRequired).toBe(true)
    expect(compliance?.estimatedMinutes).toBe(25)
  })

  it('items are in ascending order', () => {
    const items = buildDefaultReadinessItems()
    for (let i = 1; i < items.length; i++) {
      expect(items[i].order).toBeGreaterThan(items[i - 1].order)
    }
  })
})
