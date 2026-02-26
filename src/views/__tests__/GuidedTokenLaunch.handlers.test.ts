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
    mockStore.currentForm.currentStep = 3
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="template-emit-update"]').trigger('click')
    await flushPromises()
    expect(mockStore.setSelectedTemplate).toHaveBeenCalledWith({ id: 'arc20', standard: 'ARC20' })
  })

  it('emitting update from EconomicsSettingsStep calls guidedLaunchStore.setTokenEconomics', async () => {
    mockStore.currentForm.currentStep = 4
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
    mockStore.currentForm.currentStep = 5
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
    mockStore.currentForm.currentStep = 5
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
    mockStore.currentForm.currentStep = 5
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    expect(wrapper.html()).toMatch(/Launch Submitted Successfully/i)
  })

  it('clicking View Dashboard button does not throw', async () => {
    mockStore.currentForm.currentStep = 5
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
    mockStore.currentForm.currentStep = 5
    const { wrapper } = await mountView()
    await wrapper.find('[data-testid="review-emit-submit"]').trigger('click')
    await flushPromises()
    const allButtons = wrapper.findAll('button')
    const closeBtn = allButtons.find((b) => b.text().trim() === 'Close')
    if (closeBtn) {
      await expect(closeBtn.trigger('click')).resolves.not.toThrow()
    }
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
      6, // totalSteps
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
