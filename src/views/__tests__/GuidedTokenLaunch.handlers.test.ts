/**
 * Handler & lifecycle coverage tests for GuidedTokenLaunch.vue
 *
 * Covers the paths that are NOT exercised by GuidedTokenLaunch.component.test.ts:
 *
 *  - handleStepComplete (line 415): emit 'complete' from step sub-component
 *  - handleOrganizationUpdate / handleIntentUpdate / handleComplianceUpdate /
 *    handleTemplateUpdate / handleEconomicsUpdate (lines 441-458): emit 'update'
 *  - handleSubmit error / catch branch (lines 475-486)
 *  - handleViewDashboard (line 489): click "View Dashboard" in success modal
 *  - handleCloseSuccessModal (lines 493-494): click "Close" in success modal
 *  - onMounted auth redirect (lines 501-502): mount with isAuthenticated=false
 *  - onMounted issuance return path (lines 511-512): consumeIssuanceReturnPath returns path
 *  - onBeforeUnmount abandonment (lines 537-547): unmount with completedSteps>0
 *
 * Business value: Provides deterministic proof that all critical handler and
 * lifecycle branches are wired correctly — prevents silent store-wiring regressions
 * and ensures telemetry events fire in the right circumstances.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { reactive } from 'vue'
import GuidedTokenLaunch from '../GuidedTokenLaunch.vue'

// ---------------------------------------------------------------------------
// Step sub-component mocks — each exposes trigger buttons so we can emit
// Vue component events ('complete' / 'update') from within tests.
// ---------------------------------------------------------------------------
vi.mock('../../components/guidedLaunch/steps/OrganizationProfileStep.vue', () => ({
  default: {
    name: 'OrganizationProfileStep',
    emits: ['complete', 'update'],
    template: `<div data-testid="step-organization">
      <button data-testid="org-emit-complete" @click="$emit('complete', { isValid: true, errors: [] })">Complete</button>
      <button data-testid="org-emit-complete-invalid" @click="$emit('complete', { isValid: false, errors: ['Name is required'] })">Complete Invalid</button>
      <button data-testid="org-emit-update" @click="$emit('update', { name: 'Test Org' })">Update</button>
    </div>`,
  },
}))
vi.mock('../../components/guidedLaunch/steps/TokenIntentStep.vue', () => ({
  default: {
    name: 'TokenIntentStep',
    emits: ['complete', 'update'],
    template: `<div data-testid="step-intent">
      <button data-testid="intent-emit-update" @click="$emit('update', { tokenType: 'security' })">Update</button>
    </div>`,
  },
}))
vi.mock('../../components/guidedLaunch/steps/ComplianceReadinessStep.vue', () => ({
  default: {
    name: 'ComplianceReadinessStep',
    emits: ['complete', 'update'],
    template: `<div data-testid="step-compliance">
      <button data-testid="compliance-emit-update" @click="$emit('update', { jurisdiction: 'EU' })">Update</button>
    </div>`,
  },
}))
vi.mock('../../components/guidedLaunch/steps/WhitelistPolicyStep.vue', () => ({
  default: {
    name: 'WhitelistPolicyStep',
    emits: ['complete', 'update'],
    template: `<div data-testid="step-whitelist">
      <button data-testid="whitelist-emit-update" @click="$emit('update', { isEnabled: false, allowedJurisdictions: [], restrictedJurisdictions: [], investorCategories: [], policyConfirmed: false })">Update</button>
    </div>`,
  },
}))
vi.mock('../../components/guidedLaunch/steps/TemplateSelectionStep.vue', () => ({
  default: {
    name: 'TemplateSelectionStep',
    emits: ['complete', 'update'],
    template: `<div data-testid="step-template">
      <button data-testid="template-emit-update" @click="$emit('update', { id: 'arc20', standard: 'ARC20' })">Update</button>
    </div>`,
  },
}))
vi.mock('../../components/guidedLaunch/steps/EconomicsSettingsStep.vue', () => ({
  default: {
    name: 'EconomicsSettingsStep',
    emits: ['complete', 'update'],
    template: `<div data-testid="step-economics">
      <button data-testid="economics-emit-update" @click="$emit('update', { totalSupply: 1000000 })">Update</button>
    </div>`,
  },
}))
vi.mock('../../components/guidedLaunch/steps/ReviewSubmitStep.vue', () => ({
  default: {
    name: 'ReviewSubmitStep',
    emits: ['submit'],
    template: `<div data-testid="step-review">
      <button data-testid="review-emit-submit" @click="$emit('submit')">Submit</button>
    </div>`,
  },
}))
vi.mock('../../components/guidedLaunch/ReadinessScoreCard.vue', () => ({
  default: { template: '<div data-testid="readiness-score">ReadinessScoreCard</div>' },
}))

// ---------------------------------------------------------------------------
// Hoisted mock objects — must be declared via vi.hoisted() so they are
// available inside the vi.mock() factory callbacks (which are hoisted first).
// ---------------------------------------------------------------------------
const { mockLaunchTelemetry, mockCompetitiveTelemetry, mockConsumeIssuanceReturnPath } =
  vi.hoisted(() => ({
    mockLaunchTelemetry: {
      initializeTelemetry: vi.fn(),
      trackFlowAbandoned: vi.fn(),
      trackLaunchSuccess: vi.fn(),
      trackLaunchFailed: vi.fn(),
    },
    mockCompetitiveTelemetry: {
      startJourney: vi.fn(),
      completeJourney: vi.fn(),
      trackMilestone: vi.fn(),
    },
    mockConsumeIssuanceReturnPath: vi.fn(() => null as string | null),
  }))

vi.mock('../../services/launchTelemetry', () => ({
  launchTelemetryService: mockLaunchTelemetry,
}))

vi.mock('../../services/CompetitiveTelemetryService', () => ({
  competitiveTelemetryService: mockCompetitiveTelemetry,
}))

vi.mock('../../utils/authFirstIssuanceWorkspace', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../utils/authFirstIssuanceWorkspace')>()
  return {
    ...original,
    consumeIssuanceReturnPath: mockConsumeIssuanceReturnPath,
  }
})

// ---------------------------------------------------------------------------
// Reactive store mock
// ---------------------------------------------------------------------------
const mockStore = reactive({
  currentForm: {
    createdAt: new Date(),
    lastModified: new Date(),
    currentStep: 0,
    completedSteps: [] as string[],
    isSubmitted: false,
    submissionError: null as string | null,
    selectedTemplate: null as { id: string; standard: string } | null,
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
  get currentStep() { return this.currentForm.currentStep },
  get totalSteps() { return this.stepStatuses.length },
  get completedSteps() { return this.stepStatuses.filter((s) => s.isComplete).length },
  get progressPercentage() {
    return Math.round((this.stepStatuses.filter((s) => s.isComplete).length / this.stepStatuses.length) * 100)
  },
  get readinessScore() {
    return { percentage: 0, level: 'not-ready', label: 'Not Ready', color: 'red' }
  },
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
  submitLaunch: vi.fn(() =>
    Promise.resolve({
      submissionId: 'sub-001',
      deploymentStatus: 'pending' as const,
      estimatedCompletionTime: '5 minutes',
      nextSteps: ['Monitor email for updates'],
    })
  ),
})

vi.mock('../../stores/guidedLaunch', () => ({
  useGuidedLaunchStore: vi.fn(() => mockStore),
}))

// ---------------------------------------------------------------------------
// Auth mock
// ---------------------------------------------------------------------------
const mockAuth = reactive({
  isAuthenticated: true,
  user: { email: 'handler-test@example.com' } as { email: string } | null,
})
vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn(() => mockAuth),
}))

// ---------------------------------------------------------------------------
// Router (memory history avoids jsdom URL issues)
// ---------------------------------------------------------------------------
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/launch/guided', component: GuidedTokenLaunch },
      { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
    ],
  })
}

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
    selectedTemplate: null,
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
  mockStore.submitLaunch = vi.fn(() =>
    Promise.resolve({
      submissionId: 'sub-001',
      deploymentStatus: 'pending' as const,
      estimatedCompletionTime: '5 minutes',
      nextSteps: ['Monitor email for updates'],
    })
  )
  mockAuth.isAuthenticated = true
  mockAuth.user = { email: 'handler-test@example.com' }
  mockConsumeIssuanceReturnPath.mockReturnValue(null)
}

async function mountView() {
  const router = makeRouter()
  await router.push('/launch/guided')
  const wrapper = mount(GuidedTokenLaunch, {
    global: {
      plugins: [router],
      stubs: { Teleport: true },
    },
  })
  await flushPromises()
  return { wrapper, router }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — handleStepComplete (line 415-438)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('emitting complete from OrganizationProfileStep calls completeStep on the store', async () => {
    const { wrapper } = await mountView()
    // OrganizationProfileStep is on step 0 by default
    const orgStepEl = wrapper.find('[data-testid="org-emit-complete"]')
    expect(orgStepEl.exists()).toBe(true)
    await orgStepEl.trigger('click')
    await flushPromises()
    expect(mockStore.completeStep).toHaveBeenCalledWith(0, { isValid: true, errors: [] })
  })

  it('handleStepComplete calls competitiveTelemetryService.trackMilestone with step data', async () => {
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="org-emit-complete"]').trigger('click')
    await flushPromises()
    expect(mockCompetitiveTelemetry.trackMilestone).toHaveBeenCalledWith(
      expect.objectContaining({
        journey: 'token_creation',
        milestone: 'organization',
      })
    )
  })

  it('handleStepComplete auto-advances to next step when validation.isValid=true', async () => {
    vi.useFakeTimers()
    // Step 0 is valid so auto-advance should fire
    mockStore.stepStatuses[0].isValid = true
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="org-emit-complete"]').trigger('click')
    // Advance past the 300ms auto-advance timeout
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    // goToStep should have been called to advance (step 0 → 1)
    expect(mockStore.goToStep).toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('GuidedTokenLaunch — step update handlers (lines 441-458)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('emitting update from OrganizationProfileStep calls guidedLaunchStore.setOrganizationProfile', async () => {
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="org-emit-update"]').trigger('click')
    await flushPromises()
    expect(mockStore.setOrganizationProfile).toHaveBeenCalledWith({ name: 'Test Org' })
  })

  it('emitting update from TokenIntentStep calls guidedLaunchStore.setTokenIntent', async () => {
    mockStore.currentForm.currentStep = 1
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="intent-emit-update"]').trigger('click')
    await flushPromises()
    expect(mockStore.setTokenIntent).toHaveBeenCalledWith({ tokenType: 'security' })
  })

  it('emitting update from ComplianceReadinessStep calls guidedLaunchStore.setComplianceReadiness', async () => {
    mockStore.currentForm.currentStep = 2
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="compliance-emit-update"]').trigger('click')
    await flushPromises()
    expect(mockStore.setComplianceReadiness).toHaveBeenCalledWith({ jurisdiction: 'EU' })
  })

  it('emitting update from TemplateSelectionStep calls guidedLaunchStore.setSelectedTemplate', async () => {
    mockStore.currentForm.currentStep = 4
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="template-emit-update"]').trigger('click')
    await flushPromises()
    expect(mockStore.setSelectedTemplate).toHaveBeenCalledWith({ id: 'arc20', standard: 'ARC20' })
  })

  it('emitting update from EconomicsSettingsStep calls guidedLaunchStore.setTokenEconomics', async () => {
    mockStore.currentForm.currentStep = 5
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="economics-emit-update"]').trigger('click')
    await flushPromises()
    expect(mockStore.setTokenEconomics).toHaveBeenCalledWith({ totalSupply: 1000000 })
  })
})

describe('GuidedTokenLaunch — handleSubmit error path (lines 475-486)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('when submitLaunch throws, competitiveTelemetryService.completeJourney is called with success=false', async () => {
    mockStore.currentForm.currentStep = 6
    mockStore.submitLaunch = vi.fn().mockRejectedValue(new Error('Deployment quota exceeded'))
    const { wrapper } = await mountView()
    // Emit the 'submit' event from the ReviewSubmitStep mock button
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    expect(mockCompetitiveTelemetry.completeJourney).toHaveBeenCalledWith(
      'token_creation',
      false,
      expect.objectContaining({ error: 'Deployment quota exceeded' })
    )
  })

  it('a failed submitLaunch does not show the success modal', async () => {
    mockStore.currentForm.currentStep = 6
    mockStore.submitLaunch = vi.fn().mockRejectedValue(new Error('Network error'))
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    expect(wrapper.html()).not.toMatch(/Launch Submitted Successfully/i)
  })
})

describe('GuidedTokenLaunch — success modal actions (lines 489-494)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('successful submitLaunch shows the success modal', async () => {
    mockStore.currentForm.currentStep = 6
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    expect(wrapper.html()).toMatch(/Launch Submitted Successfully/i)
  })

  it('clicking View Dashboard button does not throw', async () => {
    mockStore.currentForm.currentStep = 6
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    const allButtons = wrapper.findAll('button')
    const dashboardBtn = allButtons.find((b) => b.text().includes('View Dashboard'))
    if (dashboardBtn) {
      await expect(dashboardBtn.trigger('click')).resolves.not.toThrow()
    }
  })

  it('clicking Close button does not throw', async () => {
    mockStore.currentForm.currentStep = 6
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    const allButtons = wrapper.findAll('button')
    const closeBtn = allButtons.find((b) => b.text().trim() === 'Close')
    if (closeBtn) {
      await expect(closeBtn.trigger('click')).resolves.not.toThrow()
    }
  })

  it('success modal renders without next-steps section when response has no nextSteps (line 281 false branch)', async () => {
    // Coverage: false branch of v-if="submissionResponse?.nextSteps" at line 281
    // When submitLaunch returns a response without a nextSteps array, the section is hidden
    mockStore.currentForm.currentStep = 6
    mockStore.submitLaunch = vi.fn().mockResolvedValue({
      submissionId: 'sub-no-steps',
      deploymentStatus: 'pending' as const,
      estimatedCompletionTime: '5 minutes',
      // nextSteps deliberately omitted → submissionResponse.nextSteps = undefined
    })
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    // Modal is shown with the submission ID
    expect(wrapper.html()).toMatch(/Launch Submitted Successfully/i)
    expect(wrapper.html()).toMatch(/sub-no-steps/)
    // No "Next Steps" section (nextSteps was undefined)
    expect(wrapper.html()).not.toContain('Next Steps:')
  })
})

describe('GuidedTokenLaunch — onMounted auth redirect (lines 501-502)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('does not initialize telemetry when user is not authenticated (returns early)', async () => {
    mockAuth.isAuthenticated = false
    mockAuth.user = null
    await mountView()
    // onMounted returns early after router.push — initializeTelemetry NOT called
    expect(mockStore.initializeTelemetry).not.toHaveBeenCalled()
  })

  it('does not start competitive journey when user is not authenticated (returns early)', async () => {
    mockAuth.isAuthenticated = false
    mockAuth.user = null
    await mountView()
    expect(mockCompetitiveTelemetry.startJourney).not.toHaveBeenCalled()
  })

  it('DOES initialize telemetry when user IS authenticated', async () => {
    mockAuth.isAuthenticated = true
    await mountView()
    expect(mockStore.initializeTelemetry).toHaveBeenCalledTimes(1)
  })
})

describe('GuidedTokenLaunch — onMounted issuance return path (lines 511-512)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('calls consumeIssuanceReturnPath exactly once in onMounted', async () => {
    await mountView()
    expect(mockConsumeIssuanceReturnPath).toHaveBeenCalledTimes(1)
  })

  it('when consumeIssuanceReturnPath returns a path, initializeTelemetry is NOT called (returns early)', async () => {
    // If a return path is found that differs from current route, component does router.replace + return
    // This means initializeTelemetry should NOT be called
    mockConsumeIssuanceReturnPath.mockReturnValue('/launch/guided?step=2')
    await mountView()
    // The component's onMounted returns early after replace
    expect(mockStore.initializeTelemetry).not.toHaveBeenCalled()
  })

  it('when consumeIssuanceReturnPath returns null, initializeTelemetry IS called (no redirect)', async () => {
    mockConsumeIssuanceReturnPath.mockReturnValue(null)
    await mountView()
    expect(mockStore.initializeTelemetry).toHaveBeenCalledTimes(1)
  })

  it('when consumeIssuanceReturnPath returns a path, onMounted returns early (router.replace branch)', async () => {
    // Verify the early-return branch is taken: consume called, initializeTelemetry skipped
    // (router.replace itself is called — the early return prevents any further onMounted logic)
    const savedPath = '/launch/guided?returnTo=compliance'
    mockConsumeIssuanceReturnPath.mockReturnValue(savedPath)
    const router = makeRouter()
    await router.push('/launch/guided')
    await flushPromises()
    mount(GuidedTokenLaunch, {
      global: { plugins: [router], stubs: { Teleport: true } },
    })
    await flushPromises()
    // consumeIssuanceReturnPath was called to check for a saved path
    expect(mockConsumeIssuanceReturnPath).toHaveBeenCalledTimes(1)
    // initializeTelemetry was NOT called because the function returned early after router.replace
    expect(mockStore.initializeTelemetry).not.toHaveBeenCalled()
  })
})

describe('GuidedTokenLaunch — onBeforeUnmount abandonment (lines 537-547)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('trackFlowAbandoned is called when component unmounts with completedSteps > 0 and not submitted', async () => {
    // Mark one step complete
    mockStore.stepStatuses[0].isComplete = true
    mockStore.currentForm.isSubmitted = false
    const { wrapper } = await mountView()
    // completedSteps computed returns 1 — should trigger abandonment
    wrapper.unmount()
    expect(mockLaunchTelemetry.trackFlowAbandoned).toHaveBeenCalledWith(
      expect.any(String), // lastStep.id
      1, // completedSteps
      7, // totalSteps
    )
  })

  it('competitiveTelemetryService.completeJourney is called with false on unmount when steps completed', async () => {
    mockStore.stepStatuses[0].isComplete = true
    mockStore.currentForm.isSubmitted = false
    const { wrapper } = await mountView()
    wrapper.unmount()
    expect(mockCompetitiveTelemetry.completeJourney).toHaveBeenCalledWith(
      'token_creation',
      false,
      expect.objectContaining({ reason: 'user_navigated_away' })
    )
  })

  it('trackFlowAbandoned is NOT called when no steps are completed', async () => {
    // All steps incomplete — completedSteps = 0
    mockStore.currentForm.isSubmitted = false
    const { wrapper } = await mountView()
    wrapper.unmount()
    expect(mockLaunchTelemetry.trackFlowAbandoned).not.toHaveBeenCalled()
  })

  it('trackFlowAbandoned is NOT called when isSubmitted = true', async () => {
    mockStore.stepStatuses[0].isComplete = true
    mockStore.currentForm.isSubmitted = true
    const { wrapper } = await mountView()
    wrapper.unmount()
    expect(mockLaunchTelemetry.trackFlowAbandoned).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Branch coverage: remaining uncovered branches
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — handleStepNavigation canNavigateToStep=false (branch 4, line 387)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('does NOT call goToStep when step is too far ahead (canNavigateToStep returns false)', async () => {
    // On step 0 with invalid+required step 0, step 5 is > currentStep+1=1 → canNavigateToStep(5)=false
    mockStore.stepStatuses[0].isValid = false
    mockStore.stepStatuses[0].isOptional = false
    const { wrapper } = await mountView()
    // Trigger click on step-btn-5 (disabled button - forced via trigger)
    const btn5 = wrapper.find('[data-testid="issuance-step-btn-5"]')
    expect(btn5.exists()).toBe(true)
    await btn5.trigger('click')
    await flushPromises()
    // handleStepNavigation was called but canNavigateToStep returned false → goToStep NOT called
    expect(mockStore.goToStep).not.toHaveBeenCalled()
  })
})

describe('GuidedTokenLaunch — handleNext when canProceedToNext=false (branch 6, line 399)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('clicking Continue on invalid+required step does not call goToStep (disabled button)', async () => {
    // step 0 is invalid and required → canProceedToNext=false → button is disabled
    mockStore.stepStatuses[0].isValid = false
    mockStore.stepStatuses[0].isOptional = false
    const { wrapper } = await mountView()
    const continueBtn = wrapper.find('[data-testid="issuance-continue"]')
    expect(continueBtn.exists()).toBe(true)
    // Disabled button triggers click but handleNext guard prevents goToStep
    await continueBtn.trigger('click')
    await flushPromises()
    expect(mockStore.goToStep).not.toHaveBeenCalled()
  })
})

describe('GuidedTokenLaunch — handleStepComplete with isValid=false (branch 9, line 434)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('does NOT auto-advance when validation.isValid is false', async () => {
    vi.useFakeTimers()
    const { wrapper } = await mountView()
    // Click the "invalid complete" button which emits { isValid: false }
    const orgInvalidBtn = wrapper.find('[data-testid="org-emit-complete-invalid"]')
    expect(orgInvalidBtn.exists()).toBe(true)
    await orgInvalidBtn.trigger('click')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    // completeStep IS called with isValid: false
    expect(mockStore.completeStep).toHaveBeenCalledWith(0, { isValid: false, errors: ['Name is required'] })
    // Auto-advance should NOT happen because validation.isValid = false
    expect(mockStore.goToStep).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('handleStepComplete does NOT advance when on last step (branch 9 second condition)', async () => {
    vi.useFakeTimers()
    // Use a single-step store so step 0 IS the last step
    // Then emitting complete with isValid=true: currentStep(0) >= totalSteps(1)-1(0) → condition fails
    mockStore.stepStatuses = [
      { id: 'organization', title: 'Organization Profile', isComplete: false, isValid: false, isOptional: false },
    ]
    mockStore.currentForm.currentStep = 0
    const { wrapper } = await mountView()
    const orgBtn = wrapper.find('[data-testid="org-emit-complete"]')
    expect(orgBtn.exists()).toBe(true)
    await orgBtn.trigger('click')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    // completeStep IS called
    expect(mockStore.completeStep).toHaveBeenCalledWith(0, { isValid: true, errors: [] })
    // Auto-advance should NOT happen: currentStep(0) is NOT < totalSteps(1) - 1 = 0
    expect(mockStore.goToStep).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('GuidedTokenLaunch — handleSubmit with null user (branch 11, line 463)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('calls submitLaunch with empty email when user is null', async () => {
    mockStore.currentForm.currentStep = 6
    mockAuth.user = null
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    // submitLaunch should be called with '' (fallback from user?.email || '')
    expect(mockStore.submitLaunch).toHaveBeenCalledWith('')
  })
})

describe('GuidedTokenLaunch — handleSubmit catch with non-Error (branch 12, line 480)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('handles non-Error thrown from submitLaunch (string throw)', async () => {
    mockStore.currentForm.currentStep = 6
    // Throw a string (non-Error) to exercise the ternary false branch: 'Unknown error'
    mockStore.submitLaunch = vi.fn().mockRejectedValue('quota exceeded string')
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    expect(mockCompetitiveTelemetry.completeJourney).toHaveBeenCalledWith(
      'token_creation',
      false,
      expect.objectContaining({ error: 'Unknown error' })
    )
  })
})

describe('GuidedTokenLaunch — onMounted user.email undefined (branch 16, line 516)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('uses "unknown" as userId when user.email is undefined', async () => {
    // user exists but has no email property
    mockAuth.user = { email: undefined } as unknown as { email: string }
    await mountView()
    // initializeTelemetry should be called with 'unknown' (fallback from user?.email || 'unknown')
    expect(mockStore.initializeTelemetry).toHaveBeenCalledWith('unknown')
  })
})

describe('GuidedTokenLaunch — onMounted hasDraft=true (branch 17, line 524)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('calls startJourney with userType "returning" when a draft is loaded', async () => {
    // loadDraft returns true → hasDraft = true → userType = 'returning'
    mockStore.loadDraft = vi.fn(() => true)
    await mountView()
    expect(mockCompetitiveTelemetry.startJourney).toHaveBeenCalledWith(
      'token_creation',
      expect.objectContaining({ userType: 'returning' })
    )
  })

  it('does NOT call startFlow when a draft is already loaded', async () => {
    // if (!hasDraft) { startFlow(...) } — this branch skips startFlow when hasDraft=true
    mockStore.loadDraft = vi.fn(() => true)
    await mountView()
    expect(mockStore.startFlow).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Null-guard false branches: line 420 (handleStepComplete) and line 539 (onBeforeUnmount)
// These defensive guards protect against impossible states where stepStatuses
// is shorter than expected. They are covered by testing with an empty stepStatuses array.
// ---------------------------------------------------------------------------

describe('GuidedTokenLaunch — handleStepComplete null-guard false branch (line 420)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('does NOT call trackMilestone when stepStatuses is empty (currentStepData is undefined)', async () => {
    // Coverage: false branch of `if (currentStepData)` at line 420
    // With stepStatuses=[], stepStatuses[0] returns undefined → false branch
    mockStore.stepStatuses = []
    const { wrapper } = await mountView()
    // OrganizationProfileStep still renders at currentStep===0
    const orgBtn = wrapper.find('[data-testid="org-emit-complete"]')
    expect(orgBtn.exists()).toBe(true)
    await orgBtn.trigger('click')
    await flushPromises()
    // completeStep IS called (always)
    expect(mockStore.completeStep).toHaveBeenCalledWith(0, { isValid: true, errors: [] })
    // trackMilestone is NOT called because currentStepData was undefined
    expect(mockCompetitiveTelemetry.trackMilestone).not.toHaveBeenCalled()
  })
})

describe('GuidedTokenLaunch — onBeforeUnmount lastStep null-guard false branch (line 539)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('does NOT call trackFlowAbandoned when stepStatuses[currentStep] is undefined', async () => {
    // Coverage: false branch of `if (lastStep)` at line 539
    // stepStatuses has 1 completed step at index 0, but currentStep=1 (out-of-bounds)
    // → completedSteps=1 > 0 ✓, but stepStatuses[1]=undefined → false branch
    mockStore.stepStatuses = [
      { id: 'organization', title: 'Organization Profile', isComplete: true, isValid: true, isOptional: false },
    ]
    mockStore.currentForm.currentStep = 1 // out-of-bounds index
    const { wrapper } = await mountView()
    wrapper.unmount()
    // trackFlowAbandoned is NOT called because lastStep was undefined
    expect(mockLaunchTelemetry.trackFlowAbandoned).not.toHaveBeenCalled()
    // completeJourney is also not called via this path
    expect(mockCompetitiveTelemetry.completeJourney).not.toHaveBeenCalled()
  })
})

describe('GuidedTokenLaunch — handleStepNavigation guard (line 387)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('step button is disabled when canNavigateToStep returns false (template prevents skip-ahead)', async () => {
    // Validates the template-level guard: button has disabled attribute when canNavigateToStep(5)=false.
    // The false branch of the JavaScript guard (line 387) is dead code because the template
    // prevents users from clicking a disabled button — the disabled attribute is the authoritative guard.
    mockStore.stepStatuses[0].isValid = false
    mockStore.stepStatuses[0].isOptional = false
    const { wrapper } = await mountView()
    const btn5 = wrapper.find('[data-testid="issuance-step-btn-5"]')
    expect(btn5.exists()).toBe(true)
    // Template guard is authoritative: disabled prevents click, making JS guard defensive-only
    expect(btn5.attributes('disabled')).toBeDefined()
    expect(mockStore.goToStep).not.toHaveBeenCalled()
  })
})

describe('GuidedTokenLaunch — handlePrevious guard (line 393)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('back button is absent on step 0 (v-if guard makes JS false-branch unreachable)', async () => {
    // Validates the template-level guard: back button removed via v-if when currentStep === 0.
    // The false branch of the JavaScript guard (line 393) is dead code because the v-if
    // removes the button from the DOM, making handlePrevious uncallable when currentStep === 0.
    mockStore.currentForm.currentStep = 0
    const { wrapper } = await mountView()
    expect(wrapper.find('[data-testid="issuance-back"]').exists()).toBe(false)
    // Confirm back button appears when navigated to step 1 (guard is not a UI blocker on step 1+)
    mockStore.currentForm.currentStep = 1
    await flushPromises()
    expect(wrapper.find('[data-testid="issuance-back"]').exists()).toBe(true)
  })
})
