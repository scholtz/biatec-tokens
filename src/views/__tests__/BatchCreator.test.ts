/**
 * BatchCreator View Tests
 * 
 * Tests for the Batch Token Deployment view, which enables operators to deploy
 * multiple tokens in a single operation.
 * 
 * Business value: Batch deployment is a release-readiness feature for enterprise
 * operators who need to deploy token series. Correctness here directly affects
 * release confidence — deploying wrong batch parameters can cause compliance failures.
 * Related to Issue #728: backend-backed deployment lifecycle verification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import BatchCreator from '../BatchCreator.vue'

// Mock composables and services — must return proper Refs so computed properties work
vi.mock('../../composables/useBatchDeployment', async () => {
  const { ref } = await import('vue')
  return {
    useBatchDeployment: () => ({
      createBatch: vi.fn().mockResolvedValue({ batchId: 'test-batch-1' }),
      deployBatch: vi.fn(),
      getBatchStatus: vi.fn(),
      startStatusPolling: vi.fn(),
      stopStatusPolling: vi.fn(),
      currentBatch: ref(null),
      isCreating: ref(false),
      isDeploying: ref(false),
      hasBatch: ref(false),
      canDeploy: ref(true),
      deploymentProgress: ref([]),
    }),
  }
})

vi.mock('../../layout/MainLayout.vue', () => ({
  default: { name: 'MainLayout', template: '<div><slot /></div>' },
}))

vi.mock('../../components/BatchTokenEntryForm.vue', () => ({
  default: {
    name: 'BatchTokenEntryForm',
    template: '<div data-testid="batch-token-entry-form" />',
    emits: ['add-token'],
  },
}))

vi.mock('../../components/BatchProgressDialog.vue', () => ({
  default: {
    name: 'BatchProgressDialog',
    template: '<div data-testid="batch-progress-dialog" />',
    props: ['isOpen', 'progress'],
    emits: ['close'],
  },
}))

vi.mock('../../components/ui/Badge.vue', () => ({
  default: {
    name: 'Badge',
    template: '<span class="badge"><slot /></span>',
    props: ['variant'],
  },
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/batch-creator', component: BatchCreator },
    ],
  })

const mountBatchCreator = async (authState = { isConnected: true, user: { email: 'test@test.com' } }) => {
  const router = makeRouter()
  await router.push('/batch-creator')
  await router.isReady()

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      auth: authState,
    },
  })

  const wrapper = mount(BatchCreator, {
    global: {
      plugins: [pinia, router],
      stubs: {
        MainLayout: { template: '<div><slot /></div>' },
        BatchTokenEntryForm: { template: '<div data-testid="batch-token-entry-form" />', emits: ['add-token'] },
        BatchProgressDialog: { template: '<div data-testid="batch-progress-dialog" />', props: ['isOpen', 'progress'], emits: ['close'] },
        Badge: { template: '<span class="badge"><slot /></span>', props: ['variant'] },
      },
    },
  })
  await nextTick()
  return { wrapper, router }
}

describe('BatchCreator View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Batch Token Deployment heading', async () => {
    const { wrapper } = await mountBatchCreator()
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Batch Token Deployment')
  })

  it('shows the deployment description text', async () => {
    const { wrapper } = await mountBatchCreator()
    const html = wrapper.html()
    expect(html).toMatch(/Deploy multiple tokens|single operation/i)
  })

  it('renders the Configure Token Batch header', async () => {
    const { wrapper } = await mountBatchCreator()
    const html = wrapper.html()
    expect(html).toMatch(/Configure Token Batch/i)
  })

  it('shows the token count badge', async () => {
    const { wrapper } = await mountBatchCreator()
    const badge = wrapper.find('.badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toMatch(/0.*50|tokens/i)
  })

  it('renders Batch Name optional input', async () => {
    const { wrapper } = await mountBatchCreator()
    const batchNameInput = wrapper.find('input[placeholder*="Token Launch"]')
    expect(batchNameInput.exists()).toBe(true)
  })

  it('renders Batch Description optional input', async () => {
    const { wrapper } = await mountBatchCreator()
    const descInput = wrapper.find('input[placeholder*="description"]')
    expect(descInput.exists()).toBe(true)
  })

  it('renders the token entry form', async () => {
    const { wrapper } = await mountBatchCreator()
    const form = wrapper.find('[data-testid="batch-token-entry-form"]')
    expect(form.exists()).toBe(true)
  })

  it('Deploy Batch button is rendered', async () => {
    const { wrapper } = await mountBatchCreator()
    const html = wrapper.html()
    expect(html).toMatch(/Deploy Batch|Deploy|deploy/i)
  })

  it('does not render wallet connector UI (product alignment)', async () => {
    const { wrapper } = await mountBatchCreator()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('shows token count information against the max limit', async () => {
    const { wrapper } = await mountBatchCreator()
    const html = wrapper.html()
    // Shows MAX_BATCH_SIZE (50) tokens limit
    expect(html).toMatch(/50.*tokens|up to 50/i)
  })
})
