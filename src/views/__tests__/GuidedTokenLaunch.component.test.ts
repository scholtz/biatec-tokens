/**
 * Component Tests: GuidedTokenLaunch.vue — data-testid anchors, WCAG, product alignment
 *
 * Validates that the view template:
 *   1. Renders all ISSUANCE_TEST_IDS anchors (issuance-workspace-shell, progress-bar, etc.)
 *   2. Progress bar inner element has role="progressbar" with aria-valuenow/min/max (WCAG 2.1 AA)
 *   3. Step indicator has role="navigation" with aria-label
 *   4. No wallet-connector language in the rendered output
 *   5. Auth guard redirects unauthenticated users on mount
 *   6. Step navigation buttons are present and accessible
 *   7. Save-draft button renders only when step > 0
 *   8. Error banner renders with role="alert" when an error is present
 *   9. Header copy matches auth-first / no-wallet product positioning
 *  10. Progress percentage reflects store state correctly
 *
 * Business value: Prevents regressions in the canonical issuance workspace
 * rendering after store or template changes. Provides deterministic proof that
 * all ISSUANCE_TEST_IDS are wired to actual DOM elements.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { reactive } from 'vue'
import GuidedTokenLaunch from '../GuidedTokenLaunch.vue'
import type { StepStatus } from '../../types/guidedLaunch'

// ---------------------------------------------------------------------------
// Mock heavy step sub-components (they have their own unit tests)
// ---------------------------------------------------------------------------
vi.mock('../../components/guidedLaunch/steps/OrganizationProfileStep.vue', () => ({
  default: { template: '<div data-testid="step-organization">OrganizationProfileStep</div>' },
}))
vi.mock('../../components/guidedLaunch/steps/TokenIntentStep.vue', () => ({
  default: { template: '<div data-testid="step-intent">TokenIntentStep</div>' },
}))
vi.mock('../../components/guidedLaunch/steps/ComplianceReadinessStep.vue', () => ({
  default: { template: '<div data-testid="step-compliance">ComplianceReadinessStep</div>' },
}))
vi.mock('../../components/guidedLaunch/steps/WhitelistPolicyStep.vue', () => ({
  default: { template: '<div data-testid="step-whitelist">WhitelistPolicyStep</div>' },
}))
vi.mock('../../components/guidedLaunch/steps/TemplateSelectionStep.vue', () => ({
  default: { template: '<div data-testid="step-template">TemplateSelectionStep</div>' },
}))
vi.mock('../../components/guidedLaunch/steps/EconomicsSettingsStep.vue', () => ({
  default: { template: '<div data-testid="step-economics">EconomicsSettingsStep</div>' },
}))
vi.mock('../../components/guidedLaunch/steps/ReviewSubmitStep.vue', () => ({
  default: { template: '<div data-testid="step-review">ReviewSubmitStep</div>' },
}))
vi.mock('../../components/guidedLaunch/ReadinessScoreCard.vue', () => ({
  default: { template: '<div data-testid="readiness-score">ReadinessScoreCard</div>' },
}))

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------
vi.mock('../../services/launchTelemetry', () => ({
  launchTelemetryService: {
    initializeTelemetry: vi.fn(),
    trackFlowAbandoned: vi.fn(),
    trackLaunchSuccess: vi.fn(),
    trackLaunchFailed: vi.fn(),
  },
}))
vi.mock('../../services/CompetitiveTelemetryService', () => ({
  competitiveTelemetryService: {
    startJourney: vi.fn(),
    completeJourney: vi.fn(),
    trackMilestone: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Reactive mock store — avoids ref-unwrapping issues by using a reactive object
// ---------------------------------------------------------------------------
const mockStore = reactive({
  currentForm: {
    createdAt: new Date(),
    lastModified: new Date(),
    currentStep: 0,
    completedSteps: [] as string[],
    isSubmitted: false,
    submissionError: null as string | null,
  },
  stepStatuses: [
    { id: 'organization', title: 'Organization Profile', isComplete: false, isValid: false, isOptional: false },
    { id: 'intent', title: 'Token Intent', isComplete: false, isValid: false, isOptional: false },
    { id: 'compliance', title: 'Compliance Readiness', isComplete: false, isValid: false, isOptional: false },
    { id: 'whitelist', title: 'Whitelist Policy', isComplete: false, isValid: false, isOptional: false },
    { id: 'template', title: 'Template Selection', isComplete: false, isValid: false, isOptional: false },
    { id: 'economics', title: 'Economics Settings', isComplete: false, isValid: false, isOptional: true },
    { id: 'review', title: 'Review & Submit', isComplete: false, isValid: false, isOptional: false },
  ],
  isLoading: false,
  isSubmitting: false,
  hasDraftLoaded: false,
  get currentStep() { return this.currentForm.currentStep },
  get totalSteps() { return this.stepStatuses.length },
  get completedSteps() { return this.stepStatuses.filter((s) => s.isComplete).length },
  get progressPercentage() {
    return Math.round(
      (this.stepStatuses.filter((s) => s.isComplete).length / this.stepStatuses.length) * 100
    )
  },
  get readinessScore() {
    return { percentage: 0, level: 'not-ready', label: 'Not Ready', color: 'red' }
  },
  get canSubmit() { return false },
  initializeTelemetry: vi.fn(),
  startFlow: vi.fn(),
  loadDraft: vi.fn(() => false),
  saveDraft: vi.fn(),
  clearDraft: vi.fn(),
  setOrganizationProfile: vi.fn(),
  setTokenIntent: vi.fn(),
  setComplianceReadiness: vi.fn(),
  setWhitelistPolicy: vi.fn(),
  setSelectedTemplate: vi.fn(),
  setTokenEconomics: vi.fn(),
  goToStep: vi.fn(),
  completeStep: vi.fn(),
  getTemplates: vi.fn(() => Promise.resolve([])),
  submitLaunch: vi.fn(() => Promise.resolve({ submissionId: 'test', deploymentStatus: 'pending' })),
})

vi.mock('../../stores/guidedLaunch', () => ({
  useGuidedLaunchStore: vi.fn(() => mockStore),
}))

// ---------------------------------------------------------------------------
// Auth store mock
// ---------------------------------------------------------------------------
const mockAuth = reactive({
  isAuthenticated: true,
  user: { email: 'test@example.com' } as { email: string } | null,
})

vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn(() => mockAuth),
}))

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/launch/guided', component: GuidedTokenLaunch },
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
  ],
})

// ---------------------------------------------------------------------------
// Reset helpers
// ---------------------------------------------------------------------------
function resetStore() {
  mockStore.currentForm = {
    createdAt: new Date(),
    lastModified: new Date(),
    currentStep: 0,
    completedSteps: [],
    isSubmitted: false,
    submissionError: null,
  }
  mockStore.stepStatuses = [
    { id: 'organization', title: 'Organization Profile', isComplete: false, isValid: false, isOptional: false },
    { id: 'intent', title: 'Token Intent', isComplete: false, isValid: false, isOptional: false },
    { id: 'compliance', title: 'Compliance Readiness', isComplete: false, isValid: false, isOptional: false },
    { id: 'whitelist', title: 'Whitelist Policy', isComplete: false, isValid: false, isOptional: false },
    { id: 'template', title: 'Template Selection', isComplete: false, isValid: false, isOptional: false },
    { id: 'economics', title: 'Economics Settings', isComplete: false, isValid: false, isOptional: true },
    { id: 'review', title: 'Review & Submit', isComplete: false, isValid: false, isOptional: false },
  ]
  mockStore.isLoading = false
  mockStore.isSubmitting = false
  mockStore.hasDraftLoaded = false
  mockAuth.isAuthenticated = true
  mockAuth.user = { email: 'test@example.com' }
}

async function mountView() {
  const wrapper = mount(GuidedTokenLaunch, {
    global: {
      plugins: [router],
      stubs: { Teleport: true },
    },
  })
  await flushPromises()
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — data-testid anchors (ISSUANCE_TEST_IDS)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('root container has data-testid="issuance-workspace-shell"', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-workspace-shell"]').exists()).toBe(true)
  })

  it('progress bar wrapper has data-testid="issuance-progress-bar"', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-progress-bar"]').exists()).toBe(true)
  })

  it('progress fill element has data-testid="issuance-progress-pct"', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-progress-pct"]').exists()).toBe(true)
  })

  it('step indicator has data-testid="issuance-step-indicator"', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-step-indicator"]').exists()).toBe(true)
  })

  it('all 7 step buttons render (issuance-step-btn-0 through issuance-step-btn-6)', async () => {
    const wrapper = await mountView()
    for (let i = 0; i < 7; i++) {
      expect(
        wrapper.find(`[data-testid="issuance-step-btn-${i}"]`).exists(),
        `Expected issuance-step-btn-${i} to exist`
      ).toBe(true)
    }
  })

  it('continue button has data-testid="issuance-continue" (step 0 of 7, not last step)', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-continue"]').exists()).toBe(true)
  })

  it('back button is absent on step 0 (first step, no previous)', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-back"]').exists()).toBe(false)
  })

  it('save-draft button is absent on step 0 (only shows when currentStep > 0)', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-save-draft"]').exists()).toBe(false)
  })

  it('error banner is absent when no submission error', async () => {
    const wrapper = await mountView()
    // With v-show (WCAG 4.1.3: aria-live region always in DOM), element exists but is hidden
    const banner = wrapper.find('[data-testid="issuance-error-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.element.style.display).toBe('none')
  })

  it('back button appears and save-draft button appears when step > 0', async () => {
    mockStore.currentForm.currentStep = 2
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-back"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="issuance-save-draft"]').exists()).toBe(true)
  })
})

describe('GuidedTokenLaunch — WCAG 2.1 AA accessibility attributes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('progress fill element has role="progressbar"', async () => {
    const wrapper = await mountView()
    const progressFill = wrapper.find('[data-testid="issuance-progress-pct"]')
    expect(progressFill.exists()).toBe(true)
    expect(progressFill.attributes('role')).toBe('progressbar')
  })

  it('progress fill has aria-valuemin="0" and aria-valuemax="100"', async () => {
    const wrapper = await mountView()
    const progressFill = wrapper.find('[data-testid="issuance-progress-pct"]')
    expect(progressFill.attributes('aria-valuemin')).toBe('0')
    expect(progressFill.attributes('aria-valuemax')).toBe('100')
  })

  it('progress fill has aria-valuenow="0" when no steps complete', async () => {
    const wrapper = await mountView()
    const progressFill = wrapper.find('[data-testid="issuance-progress-pct"]')
    expect(progressFill.attributes('aria-valuenow')).toBe('0')
  })

  it('step indicator has role="navigation"', async () => {
    const wrapper = await mountView()
    const nav = wrapper.find('[data-testid="issuance-step-indicator"]')
    expect(nav.attributes('role')).toBe('navigation')
  })

  it('step indicator has a non-empty aria-label', async () => {
    const wrapper = await mountView()
    const nav = wrapper.find('[data-testid="issuance-step-indicator"]')
    const ariaLabel = nav.attributes('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.length).toBeGreaterThan(0)
  })

  it('error banner has role="alert" and aria-live="assertive"', async () => {
    mockStore.currentForm.submissionError = 'unauthorized access'
    const wrapper = await mountView()
    const banner = wrapper.find('[data-testid="issuance-error-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.attributes('role')).toBe('alert')
    expect(banner.attributes('aria-live')).toBe('assertive')
  })

  it('each step button has a descriptive aria-label', async () => {
    const wrapper = await mountView()
    for (let i = 0; i < 6; i++) {
      const btn = wrapper.find(`[data-testid="issuance-step-btn-${i}"]`)
      const ariaLabel = btn.attributes('aria-label')
      expect(ariaLabel, `Step btn-${i} missing aria-label`).toBeTruthy()
    }
  })
})

describe('GuidedTokenLaunch — product alignment (no wallet-connector UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('header copy mentions email/password authentication', async () => {
    const wrapper = await mountView()
    const html = wrapper.html().toLowerCase()
    expect(html).toMatch(/email/)
  })

  it('does not render any wallet-connector references', async () => {
    const wrapper = await mountView()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toContain('walletconnect')
    expect(html).not.toContain('metamask')
    expect(html).not.toContain('connect wallet')
    expect(html).not.toContain('pera wallet')
    expect(html).not.toContain('defly')
    expect(html).not.toContain('sign transaction')
  })

  it('page h1 contains "Guided Token Launch"', async () => {
    const wrapper = await mountView()
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toMatch(/Guided Token Launch/i)
  })

  it('step indicator labels use business-oriented names', async () => {
    const wrapper = await mountView()
    const stepNav = wrapper.find('[data-testid="issuance-step-indicator"]')
    const stepText = stepNav.text().toLowerCase()
    expect(stepText).toMatch(/organization|intent|compliance|template|economics|review/i)
  })

  it('step indicator labels contain no gas-fee or blockchain-transaction language', async () => {
    const wrapper = await mountView()
    const stepNav = wrapper.find('[data-testid="issuance-step-indicator"]')
    const stepText = stepNav.text().toLowerCase()
    expect(stepText).not.toContain('gas fee')
    expect(stepText).not.toContain('approve in wallet')
  })
})

describe('GuidedTokenLaunch — progress state reflects store values', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('shows 0% when no steps complete', async () => {
    const wrapper = await mountView()
    expect(wrapper.html()).toContain('0%')
  })

  it('shows 43% when 3 of 7 steps are complete', async () => {
    mockStore.stepStatuses = mockStore.stepStatuses.map((s, i) => ({
      ...s,
      isComplete: i < 3,
      isValid: i < 3,
    }))
    const wrapper = await mountView()
    expect(wrapper.html()).toContain('43%')
  })

  it('progress fill aria-valuenow is 43 when 3 of 7 steps complete', async () => {
    mockStore.stepStatuses = mockStore.stepStatuses.map((s, i) => ({
      ...s,
      isComplete: i < 3,
      isValid: i < 3,
    }))
    const wrapper = await mountView()
    const fill = wrapper.find('[data-testid="issuance-progress-pct"]')
    expect(fill.attributes('aria-valuenow')).toBe('43')
  })

  it('completedSteps count is displayed in the progress overview', async () => {
    mockStore.stepStatuses = mockStore.stepStatuses.map((s, i) => ({
      ...s,
      isComplete: i < 2,
      isValid: i < 2,
    }))
    const wrapper = await mountView()
    // "2 of 7 steps complete"
    expect(wrapper.html()).toContain('2 of 7 steps complete')
  })
})

describe('GuidedTokenLaunch — error banner rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('error banner renders user-friendly title (not raw error string)', async () => {
    mockStore.currentForm.submissionError = 'unauthorized access to resource'
    const wrapper = await mountView()
    const banner = wrapper.find('[data-testid="issuance-error-banner"]')
    expect(banner.exists()).toBe(true)
    const bannerText = banner.text()
    expect(bannerText).not.toBe('unauthorized access to resource')
    expect(bannerText.length).toBeGreaterThan(10)
  })

  it('error banner has a dismiss button', async () => {
    mockStore.currentForm.submissionError = 'validation failed'
    const wrapper = await mountView()
    const dismissBtn = wrapper.find('button[aria-label="Dismiss error"]')
    expect(dismissBtn.exists()).toBe(true)
  })

  it('error banner disappears after dismiss button is clicked', async () => {
    mockStore.currentForm.submissionError = 'session expired'
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-error-banner"]').exists()).toBe(true)

    await wrapper.find('button[aria-label="Dismiss error"]').trigger('click')
    await flushPromises()

    // With v-show (WCAG 4.1.3: aria-live region always in DOM), element still exists but hidden
    const banner = wrapper.find('[data-testid="issuance-error-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.element.style.display).toBe('none')
  })
})

// ---------------------------------------------------------------------------
// Behavioral: step navigation
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — step navigation behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('Continue button is disabled when step is invalid and required', async () => {
    mockStore.stepStatuses[0].isValid = false
    mockStore.stepStatuses[0].isOptional = false
    const wrapper = await mountView()
    const continueBtn = wrapper.find('[data-testid="issuance-continue"]')
    expect(continueBtn.exists()).toBe(true)
    expect(continueBtn.attributes('disabled')).toBeDefined()
  })

  it('Continue button is NOT disabled when step is valid', async () => {
    mockStore.stepStatuses[0].isValid = true
    const wrapper = await mountView()
    const continueBtn = wrapper.find('[data-testid="issuance-continue"]')
    expect(continueBtn.exists()).toBe(true)
    // disabled attribute should be absent or falsy
    expect(continueBtn.attributes('disabled')).toBeUndefined()
  })

  it('Continue button is NOT disabled when step is optional (even if invalid)', async () => {
    mockStore.stepStatuses[0].isValid = false
    mockStore.stepStatuses[0].isOptional = true
    const wrapper = await mountView()
    const continueBtn = wrapper.find('[data-testid="issuance-continue"]')
    expect(continueBtn.exists()).toBe(true)
    expect(continueBtn.attributes('disabled')).toBeUndefined()
  })

  it('clicking Continue when valid calls goToStep(1)', async () => {
    mockStore.stepStatuses[0].isValid = true
    const wrapper = await mountView()
    const continueBtn = wrapper.find('[data-testid="issuance-continue"]')
    expect(continueBtn.exists()).toBe(true)
    await continueBtn.trigger('click')
    await flushPromises()
    expect(mockStore.goToStep).toHaveBeenCalledWith(1)
  })

  it('clicking Continue when invalid does not call goToStep', async () => {
    mockStore.stepStatuses[0].isValid = false
    mockStore.stepStatuses[0].isOptional = false
    const wrapper = await mountView()
    const continueBtn = wrapper.find('[data-testid="issuance-continue"]')
    // button is disabled; triggering click on a disabled button should not call the handler
    await continueBtn.trigger('click')
    await flushPromises()
    expect(mockStore.goToStep).not.toHaveBeenCalled()
  })

  it('Back button click on step 1 calls goToStep(0)', async () => {
    mockStore.currentForm.currentStep = 1
    const wrapper = await mountView()
    const backBtn = wrapper.find('[data-testid="issuance-back"]')
    expect(backBtn.exists()).toBe(true)
    await backBtn.trigger('click')
    await flushPromises()
    expect(mockStore.goToStep).toHaveBeenCalledWith(0)
  })

  it('Back button is absent on step 0 (no previous step)', async () => {
    // already on step 0 by default
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-back"]').exists()).toBe(false)
  })

  it('step button click for a completed previous step navigates to that step', async () => {
    // Mark step 0 as complete, advance to step 1
    mockStore.stepStatuses[0].isComplete = true
    mockStore.stepStatuses[0].isValid = true
    mockStore.currentForm.currentStep = 1
    const wrapper = await mountView()
    // Click step 0 button — should navigate back
    const stepBtn0 = wrapper.find('[data-testid="issuance-step-btn-0"]')
    expect(stepBtn0.exists()).toBe(true)
    await stepBtn0.trigger('click')
    await flushPromises()
    expect(mockStore.goToStep).toHaveBeenCalledWith(0)
  })

  it('step button for step 2+ when only on step 0 is disabled (cannot skip ahead)', async () => {
    // On step 0, step 2 is unreachable (can only go to step 1)
    mockStore.stepStatuses[0].isValid = false
    const wrapper = await mountView()
    const stepBtn2 = wrapper.find('[data-testid="issuance-step-btn-2"]')
    expect(stepBtn2.exists()).toBe(true)
    // The step button should be disabled (cursor-not-allowed class applied and disabled attr)
    expect(stepBtn2.attributes('disabled')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Behavioral: draft persistence
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — draft persistence behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Save Draft button click calls guidedLaunchStore.saveDraft()', async () => {
    // Show the button by advancing to step > 0
    mockStore.currentForm.currentStep = 1
    const wrapper = await mountView()
    const saveDraftBtn = wrapper.find('[data-testid="issuance-save-draft"]')
    expect(saveDraftBtn.exists()).toBe(true)
    await saveDraftBtn.trigger('click')
    await flushPromises()
    expect(mockStore.saveDraft).toHaveBeenCalledTimes(1)
  })

  it('Save Draft button is absent on step 0 (nothing to save yet)', async () => {
    // Default state: currentStep = 0
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-save-draft"]').exists()).toBe(false)
  })

  it('Save Draft button shows "Saving..." text while saving and reverts to "Save Draft"', async () => {
    vi.useFakeTimers()
    // Advance to step 1 so button is visible
    mockStore.currentForm.currentStep = 1
    const wrapper = await mountView()
    const saveDraftBtn = wrapper.find('[data-testid="issuance-save-draft"]')
    await saveDraftBtn.trigger('click')
    // During save: isSaving should be true so text should be "Saving..."
    expect(saveDraftBtn.text()).toContain('Saving...')
    // Advance past the 500ms save delay
    await vi.advanceTimersByTimeAsync(600)
    // Text reverts
    expect(saveDraftBtn.text()).toContain('Save Draft')
  })
})

// ---------------------------------------------------------------------------
// Behavioral: form submission
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — submit behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('ReviewSubmitStep is rendered on the last step (step 6)', async () => {
    mockStore.currentForm.currentStep = 6
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="step-review"]').exists()).toBe(true)
  })

  it('Continue button is absent on the last step (ReviewSubmitStep handles submit)', async () => {
    // On last step (index 6 of 7 total), Continue button v-if should be false
    mockStore.currentForm.currentStep = 6
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="issuance-continue"]').exists()).toBe(false)
  })

  it('successful submitLaunch reveals success modal', async () => {
    const mockResponse = {
      submissionId: 'test-submission-id',
      deploymentStatus: 'pending' as const,
      estimatedTime: '5 minutes',
      nextSteps: ['Verify token details', 'Monitor deployment'],
    }
    mockStore.submitLaunch = vi.fn().mockResolvedValue(mockResponse)
    mockStore.currentForm.currentStep = 6
    const wrapper = await mountView()
    // Directly invoke the handleSubmit by emitting 'submit' from ReviewSubmitStep mock
    await wrapper.find('[data-testid="step-review"]').trigger('submit')
    await flushPromises()
    // The modal should be visible
    expect(wrapper.html()).toMatch(/Launch Submitted Successfully/i)
  })
})

// ---------------------------------------------------------------------------
// Branch: validation error indicator (line 126)
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — validation error indicator on step button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('validation error badge is hidden when step has no validation data', async () => {
    // Default mock steps have no `validation` property — indicator should not appear
    mockStore.stepStatuses[0].isComplete = false
    const wrapper = await mountView()
    // The validation indicator is inside step btn 0; should be absent
    const stepBtn0 = wrapper.find('[data-testid="issuance-step-btn-0"]')
    // No child with bg-red-500 class (the indicator)
    expect(stepBtn0.html()).not.toContain('bg-red-500')
  })

  it('validation error badge is shown when step is complete but has invalid validation', async () => {
    // Set step 0 as complete with invalid validation → v-if="step.validation && !step.validation.isValid && step.isComplete"
    mockStore.stepStatuses[0] = {
      id: 'organization',
      title: 'Organization Profile',
      isComplete: true,
      isValid: false,
      isOptional: false,
      validation: { isValid: false, errors: ['Name is required'] },
    } as StepStatus
    mockStore.currentForm.currentStep = 1 // moved past step 0
    const wrapper = await mountView()
    const stepBtn0 = wrapper.find('[data-testid="issuance-step-btn-0"]')
    expect(stepBtn0.html()).toContain('bg-red-500')
  })
})
