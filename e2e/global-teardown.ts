/**
 * Playwright Global Teardown
 * 
 * This file handles cleanup after all Playwright tests complete.
 * 
 * Per issue #[NUMBER]: Removed exit code forcing to allow real failures to surface.
 * Cleanup only - exit code reflects actual test results for CI visibility.
 */

import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('Global Playwright teardown completed')
  
  // DO NOT force exit code - let Playwright report actual results
  // This ensures CI failures are visible and actionable
  
  // Optional: Add any cleanup logic here (close connections, etc.)
}

export default globalTeardown
