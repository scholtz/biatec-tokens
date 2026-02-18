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
 * This reporter logs test execution status and helps diagnose CI failures.
 * Error suppression is handled per-test via beforeEach hooks, not globally.
 * 
 * Per issue #[NUMBER]: Remove exit code forcing to allow real failures to surface.
 * Deterministic behavior requires tests to pass/fail based on actual results, not masking.
 */
class CustomReporter implements Reporter {
  private testCount = 0;
  private passedCount = 0;
  private failedCount = 0;
  private skippedCount = 0;

  onBegin(config: FullConfig, suite: Suite) {
    console.log(`\n[CustomReporter] Starting test run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase, result: TestResult) {
    this.testCount++;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'passed') {
      this.passedCount++;
    } else if (result.status === 'failed') {
      this.failedCount++;
      console.log(`[CustomReporter] Test FAILED: ${test.title}`);
      if (result.error) {
        console.log(`[CustomReporter] Error: ${result.error.message}`);
      }
    } else if (result.status === 'skipped') {
      this.skippedCount++;
    }
  }

  onEnd(result: FullResult) {
    console.log(`\n[CustomReporter] Test run completed with status: ${result.status}`);
    console.log(`[CustomReporter] Summary: ${this.passedCount} passed, ${this.failedCount} failed, ${this.skippedCount} skipped`);
    
    if (this.failedCount > 0) {
      console.log(`[CustomReporter] ⚠️ ${this.failedCount} test(s) failed - exit code will reflect failures`);
    } else {
      console.log(`[CustomReporter] ✅ All tests passed`);
    }
    
    // DO NOT force exit code - let Playwright report actual results
    // This ensures CI failures are visible and actionable
  }
}

export default CustomReporter;
