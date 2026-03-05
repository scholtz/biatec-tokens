import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';

/**
 * Custom Playwright reporter that provides detailed test execution summary.
 *
 * Deterministic exit code policy:
 * - Exit code 1 when tests actually fail (failedCount > 0)
 * - Playwright's own exit code is preserved in all cases
 * - Browser console errors are suppressed per-test via suppressBrowserErrors()
 *   in each spec's beforeEach — NOT masked via process.exitCode override here.
 *
 * Per copilot instructions: process.exitCode forcing is PROHIBITED because it
 * masks real failures and makes debugging impossible. Use suppressBrowserErrors()
 * in test beforeEach hooks instead of hiding exit codes here.
 */
class CustomReporter implements Reporter {
  private testCount = 0;
  private passedCount = 0;
  private failedCount = 0;
  private skippedCount = 0;

  onBegin(_config: FullConfig, suite: Suite) {
    console.log(`\n[CustomReporter] Starting test run with ${suite.allTests().length} tests`);
  }

  onTestBegin(_test: TestCase, _result: TestResult) {
    this.testCount++;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'passed') {
      this.passedCount++;
    } else if (result.status === 'failed' || result.status === 'timedOut' || result.status === 'interrupted') {
      this.failedCount++;
      console.log(`[CustomReporter] Test FAILED (${result.status}): ${test.title}`);
      if (result.error) {
        console.log(`[CustomReporter] Error: ${result.error.message}`);
      }
    } else if (result.status === 'skipped') {
      this.skippedCount++;
    }
  }

  onEnd(result: FullResult) {
    console.log(`\n[CustomReporter] Test run completed with status: ${result.status}`);
    console.log(
      `[CustomReporter] Summary: ${this.passedCount} passed, ${this.failedCount} failed, ${this.skippedCount} skipped`,
    );

    if (this.failedCount > 0) {
      console.log(
        `[CustomReporter] ⚠️ ${this.failedCount} test(s) failed — exit code 1 (deterministic CI)`,
      );
    } else {
      console.log(`[CustomReporter] ✅ All tests passed or skipped`);
    }
    // Do NOT set process.exitCode — Playwright's exit code is the source of truth.
  }
}

export default CustomReporter;
