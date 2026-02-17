/**
 * Playwright Global Setup
 * 
 * This file configures global settings for all Playwright tests.
 * Used to suppress browser console errors that don't affect test functionality.
 */

import { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  // Global setup tasks can be added here
  console.log('Global Playwright setup completed')
}

export default globalSetup
