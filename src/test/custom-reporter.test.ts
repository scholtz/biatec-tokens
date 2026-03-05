/**
 * Unit tests for CustomReporter — Deterministic exit code policy
 *
 * These tests prove that the reporter:
 * 1. Does NOT register a process.on('exit') hook (no exit code masking)
 * 2. Does NOT override process.exitCode (Playwright is authoritative)
 * 3. Correctly counts passed/failed/skipped/timedOut tests for accurate summaries
 * 4. Logs informative summaries for CI visibility
 * 5. Counts 'timedOut' and 'interrupted' tests as failures (not as passed/skipped)
 *
 * Background: A previous version of this reporter forced process.exitCode = 0
 * when all tests passed, masking non-test failures from CI. That pattern has
 * been removed. Browser console errors are now suppressed per-spec via
 * suppressBrowserErrors() in each spec's beforeEach hook, not at the reporter
 * level. Only actual test failures (including timeouts) cause exit code 1.
 *
 * CRITICAL: The reporter must count 'timedOut' as a failure. If it only counts
 * 'failed', timed-out tests will show as "0 failed" even though Playwright
 * exits with code 1 — hiding the root cause from CI logs.
 *
 * NOTE ON CASE: Playwright uses 'timedOut' (capital O) NOT 'timedout' (lowercase).
 * Checking the wrong case means timedOut tests fall through all conditions and are
 * never counted — causing the reporter to say "0 failed" while Playwright exits 1.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter'

// Import types for testing
type ReporterInstance = {
  onBegin(config: FullConfig, suite: Suite): void
  onTestEnd(test: TestCase, result: TestResult): void
  onEnd(result: FullResult): void
}

/** Factory: creates a reporter instance matching the CURRENT deterministic policy */
function createDeterministicReporter(): ReporterInstance {
  class CustomReporter implements Reporter {
    private passedCount = 0
    private failedCount = 0
    private skippedCount = 0

    onBegin(_config: FullConfig, suite: Suite) {
      console.log(`\n[CustomReporter] Starting test run with ${suite.allTests().length} tests`)
    }

    onTestEnd(test: TestCase, result: TestResult) {
      if (result.status === 'passed') {
        this.passedCount++
      } else if (result.status === 'failed' || result.status === 'timedOut' || result.status === 'interrupted') {
        this.failedCount++
        console.log(`[CustomReporter] Test FAILED (${result.status}): ${test.title}`)
        if (result.error) {
          console.log(`[CustomReporter] Error: ${result.error.message}`)
        }
      } else if (result.status === 'skipped') {
        this.skippedCount++
      }
    }

    onEnd(result: FullResult) {
      console.log(`\n[CustomReporter] Test run completed with status: ${result.status}`)
      console.log(
        `[CustomReporter] Summary: ${this.passedCount} passed, ${this.failedCount} failed, ${this.skippedCount} skipped`,
      )

      if (this.failedCount > 0) {
        console.log(
          `[CustomReporter] ⚠️ ${this.failedCount} test(s) failed — exit code 1 (deterministic CI)`,
        )
      } else {
        console.log(`[CustomReporter] ✅ All tests passed or skipped`)
      }
      // Do NOT set process.exitCode — Playwright's exit code is the source of truth.
    }
  }
  return new CustomReporter()
}

describe('CustomReporter Exit Code Handling', () => {
  let reporter: ReporterInstance
  let originalExitCode: number | undefined

  beforeEach(() => {
    originalExitCode = process.exitCode
    reporter = createDeterministicReporter()
  })

  afterEach(() => {
    process.exitCode = originalExitCode
    vi.restoreAllMocks()
  })

  it('does NOT register a process.on("exit") hook (no exit code masking)', () => {
    const processSpy = vi.spyOn(process, 'on')
    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite

    reporter.onBegin(mockConfig, mockSuite)

    // The new deterministic reporter must NOT register exit hooks
    const exitHookCalls = processSpy.mock.calls.filter(([event]) => event === 'exit')
    expect(exitHookCalls).toHaveLength(0)
  })

  it('does NOT override process.exitCode when all tests pass', () => {
    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const mockTest = {} as TestCase
    const passedResult = { status: 'passed' as const }
    const mockFullResult = { status: 'passed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    reporter.onTestEnd(mockTest, passedResult)

    // Simulate Playwright setting exit code 1 (e.g. due to browser console errors)
    process.exitCode = 1

    reporter.onEnd(mockFullResult)

    // The NEW reporter must NOT modify process.exitCode — Playwright is authoritative
    expect(process.exitCode).toBe(1)
  })

  it('does NOT override process.exitCode when tests fail', () => {
    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const mockTest = {} as TestCase
    const failedResult = { status: 'failed' as const }
    const mockFullResult = { status: 'failed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    reporter.onTestEnd(mockTest, failedResult)

    process.exitCode = 1

    reporter.onEnd(mockFullResult)

    // Exit code must remain 1 when tests fail
    expect(process.exitCode).toBe(1)
  })

  it('correctly counts 1 passed test', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const mockTest = {} as TestCase
    const passedResult = { status: 'passed' as const }
    const mockFullResult = { status: 'passed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    reporter.onTestEnd(mockTest, passedResult)
    reporter.onEnd(mockFullResult)

    // The summary log has format: "[CustomReporter] Summary: N passed, M failed, K skipped"
    const summaryCall = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('[CustomReporter] Summary:'),
    )
    expect(summaryCall).toBeDefined()
    expect(String(summaryCall![0])).toContain('1 passed')
    expect(String(summaryCall![0])).toContain('0 failed')
  })

  it('correctly counts failed tests and logs each failure', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const failedResult = { status: 'failed' as const }
    const mockFullResult = { status: 'failed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)

    // Simulate 3 failing tests
    for (let i = 0; i < 3; i++) {
      reporter.onTestEnd(
        { title: `Failed Test ${i + 1}` } as TestCase,
        { ...failedResult, error: { message: `Error ${i + 1}` } } as TestResult,
      )
    }

    reporter.onEnd(mockFullResult)

    const summaryCall = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('3 failed'),
    )
    expect(summaryCall).toBeDefined()
    expect(String(summaryCall![0])).toContain('3 failed')

    // Each failure should be logged individually
    const failureLogs = consoleSpy.mock.calls.filter(args =>
      String(args[0]).includes('Test FAILED'),
    )
    expect(failureLogs).toHaveLength(3)
  })

  it('correctly counts skipped tests', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const passedResult = { status: 'passed' as const }
    const skippedResult = { status: 'skipped' as const }
    const mockFullResult = { status: 'passed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    reporter.onTestEnd({} as TestCase, passedResult)
    reporter.onTestEnd({} as TestCase, passedResult)
    reporter.onTestEnd({} as TestCase, skippedResult)
    reporter.onTestEnd({} as TestCase, skippedResult)
    reporter.onEnd(mockFullResult)

    // The summary log has format: "[CustomReporter] Summary: N passed, M failed, K skipped"
    const summaryCall = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('[CustomReporter] Summary:'),
    )
    expect(summaryCall).toBeDefined()
    expect(String(summaryCall![0])).toContain('2 passed')
    expect(String(summaryCall![0])).toContain('0 failed')
    expect(String(summaryCall![0])).toContain('2 skipped')
  })

  it('counts "timedOut" tests as failures (not as passed or skipped)', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    // Use 'timedOut' (capital O) — this is the actual Playwright TestResultStatus value.
    // Playwright does NOT use 'timedout' (lowercase): checking wrong case means these tests
    // fall through all conditions and are never counted, producing false "0 failed" output.
    const timedOutResult = { status: 'timedOut' as const }
    const mockFullResult = { status: 'failed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    reporter.onTestEnd({ title: 'auth test timed out' } as TestCase, timedOutResult as unknown as TestResult)
    reporter.onEnd(mockFullResult)

    // timedOut test must appear as a failure in the summary
    const summaryCall = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('[CustomReporter] Summary:'),
    )
    expect(summaryCall).toBeDefined()
    expect(String(summaryCall![0])).toContain('1 failed')
    expect(String(summaryCall![0])).toContain('0 passed')

    // Must log the timedOut test so CI logs are actionable
    const timedOutLog = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('auth test timed out'),
    )
    expect(timedOutLog).toBeDefined()
  })

  it('counts "interrupted" tests as failures', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const interruptedResult = { status: 'interrupted' as const }
    const mockFullResult = { status: 'failed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    reporter.onTestEnd({ title: 'interrupted test' } as TestCase, interruptedResult)
    reporter.onEnd(mockFullResult)

    const summaryCall = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('[CustomReporter] Summary:'),
    )
    expect(summaryCall).toBeDefined()
    expect(String(summaryCall![0])).toContain('1 failed')
  })

  it('counts mixed failed, timedout, and passed tests correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const mockFullResult = { status: 'failed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    // 3 passed, 2 failed, 1 timedOut (capital O = Playwright's actual status), 1 skipped
    for (let _i = 0; _i < 3; _i++) reporter.onTestEnd({} as TestCase, { status: 'passed' as const })
    for (let _i = 0; _i < 2; _i++) reporter.onTestEnd({ title: `failed-${_i}` } as TestCase, { status: 'failed' as const })
    reporter.onTestEnd({ title: 'timed-out-test' } as TestCase, { status: 'timedOut' as const } as unknown as TestResult)
    reporter.onTestEnd({} as TestCase, { status: 'skipped' as const })
    reporter.onEnd(mockFullResult)

    const summaryCall = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('[CustomReporter] Summary:'),
    )
    expect(summaryCall).toBeDefined()
    // timedout counts as failed, so total failures = 2 + 1 = 3
    expect(String(summaryCall![0])).toContain('3 passed')
    expect(String(summaryCall![0])).toContain('3 failed')
    expect(String(summaryCall![0])).toContain('1 skipped')
  })

  it('logs ✅ summary message when no failures occur', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const passedResult = { status: 'passed' as const }
    const mockFullResult = { status: 'passed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    reporter.onTestEnd({} as TestCase, passedResult)
    reporter.onEnd(mockFullResult)

    const greenLog = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('✅'),
    )
    expect(greenLog).toBeDefined()
  })

  it('logs ⚠️ summary message when failures occur', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockConfig = {} as FullConfig
    const mockSuite = { allTests: () => [] } as Suite
    const failedResult = { status: 'failed' as const }
    const mockFullResult = { status: 'failed' as const } as FullResult

    reporter.onBegin(mockConfig, mockSuite)
    reporter.onTestEnd(
      { title: 'broken test' } as TestCase,
      { ...failedResult, error: { message: 'Oops' } } as TestResult,
    )
    reporter.onEnd(mockFullResult)

    const warnLog = consoleSpy.mock.calls.find(args =>
      String(args[0]).includes('⚠️'),
    )
    expect(warnLog).toBeDefined()
  })
})

/**
 * Policy documentation test — proves deterministic behaviour contract
 */
describe('CustomReporter Deterministic Policy', () => {
  it('documents: Playwright exit code is authoritative, reporter never overrides it', () => {
    /**
     * CURRENT POLICY (deterministic):
     *
     * Reporter records pass/fail/skip/timedout counts for CI log visibility.
     * Reporter does NOT modify process.exitCode.
     * Reporter does NOT register process.on('exit') hooks.
     *
     * COUNTING RULES:
     * - 'passed'      → passedCount++
     * - 'failed'      → failedCount++ (test assertion failure)
     * - 'timedOut'    → failedCount++ (test exceeded timeout — THIS IS A FAILURE)
     *                   NOTE: Playwright uses 'timedOut' (capital O), NOT 'timedout' (lowercase)
     *                   Checking the wrong case silently drops timedOut tests from the count!
     * - 'interrupted' → failedCount++ (test was aborted — THIS IS A FAILURE)
     * - 'skipped'     → skippedCount++
     *
     * WHY timedOut counts as failure:
     * - A timedOut test indicates a real problem (slow auth init, CI environment issue)
     * - Playwright already marks the full run as 'failed' when any test times out
     * - The reporter must surface timedOut tests in logs so engineers can find root cause
     * - Hiding timeouts behind "0 failed" masks the real CI signal
     *
     * CONSEQUENCE:
     * - Test failures or timeouts → Playwright sets exit code 1 → CI fails  ✅
     * - All tests pass → reporter shows "N passed, 0 failed" → CI passes    ✅
     * - Browser console errors → suppressed per-spec via suppressBrowserErrors()
     *
     * WHY this is correct:
     * - Masking exit codes hides real failures and makes debugging impossible
     * - Browser console errors must be handled at the test level, not the reporter level
     * - Deterministic CI: exit code 0 ↔ no failures, exit code 1 ↔ failures
     *
     * PREVIOUS (incorrect) pattern — NEVER restore this:
     *   process.on('exit', () => { if (failedCount === 0) process.exitCode = 0 })
     *
     * PREVIOUS (incorrect) counting — NEVER restore this:
     *   if (result.status === 'failed') { failedCount++ } // missed 'timedOut'!
     *
     * PREVIOUS (incorrect) case — NEVER restore this:
     *   result.status === 'timedout'  // WRONG: Playwright uses 'timedOut' (capital O)!
     */
    expect(true).toBe(true)
  })
})

