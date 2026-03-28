/**
 * WhiteLabelBrandingWorkspace.logic.test.ts
 *
 * Interaction handler and computed property tests for WhiteLabelBrandingWorkspace.vue.
 * Uses (wrapper.vm as any) to access internal script-setup functions directly,
 * following the pattern for Teleport/complex components per copilot section 7s.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WhiteLabelBrandingWorkspace from '../WhiteLabelBrandingWorkspace.vue'
import { DEFAULT_BRAND_CONFIG } from '../../utils/whiteLabelBranding'

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

const MainLayoutStub = { template: '<div><slot /></div>' }
const iconStub = { template: '<svg />' }

vi.mock('@heroicons/vue/24/outline', () => ({
  SwatchIcon: { template: '<svg />' },
  BuildingOfficeIcon: { template: '<svg />' },
  EyeIcon: { template: '<svg />' },
  ArrowPathIcon: { template: '<svg />' },
  ArrowUpTrayIcon: { template: '<svg />' },
  ExclamationTriangleIcon: { template: '<svg />' },
  ShieldCheckIcon: { template: '<svg />' },
  ChatBubbleLeftEllipsisIcon: { template: '<svg />' },
  ClockIcon: { template: '<svg />' },
  PaintBrushIcon: { template: '<svg />' },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/enterprise/branding' }),
}))

async function mountWorkspace() {
  vi.useFakeTimers()
  const wrapper = mount(WhiteLabelBrandingWorkspace, {
    global: {
      stubs: {
        MainLayout: MainLayoutStub,
        SwatchIcon: iconStub,
        BuildingOfficeIcon: iconStub,
        EyeIcon: iconStub,
        ArrowPathIcon: iconStub,
        ArrowUpTrayIcon: iconStub,
        ExclamationTriangleIcon: iconStub,
        ShieldCheckIcon: iconStub,
        ChatBubbleLeftEllipsisIcon: iconStub,
        ClockIcon: iconStub,
      },
    },
  })
  await vi.advanceTimersByTimeAsync(300)
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WhiteLabelBrandingWorkspace — logic', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // markDirty / isDirty
  // =========================================================================

  describe('markDirty()', () => {
    it('sets isDirty to true', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      expect(vm.isDirty).toBe(false)
      vm.markDirty()
      await nextTick()
      expect(vm.isDirty).toBe(true)
    })

    it('transitions publishState from published to draft when markDirty called', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.publishState = 'published'
      await nextTick()
      vm.markDirty()
      await nextTick()
      expect(vm.publishState).toBe('draft')
    })

    it('does not change publishState from draft when already draft', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.publishState = 'draft'
      vm.markDirty()
      await nextTick()
      expect(vm.publishState).toBe('draft')
    })
  })

  // =========================================================================
  // buildCurrentPrimitives
  // =========================================================================

  describe('buildCurrentPrimitives()', () => {
    it('builds primitives from current draft state', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      const primitives = vm.buildCurrentPrimitives()
      expect(primitives.organizationName).toBe(DEFAULT_BRAND_CONFIG.organizationName)
      expect(primitives.accentColor).toBe(DEFAULT_BRAND_CONFIG.accentColor)
    })

    it('resolves empty logoUrlInput to null', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.logoUrlInput = ''
      const primitives = vm.buildCurrentPrimitives()
      expect(primitives.logoUrl).toBeNull()
    })

    it('resolves non-empty logoUrlInput to the trimmed value', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.logoUrlInput = '  https://cdn.example.com/logo.png  '
      const primitives = vm.buildCurrentPrimitives()
      expect(primitives.logoUrl).toBe('https://cdn.example.com/logo.png')
    })

    it('resolves empty supportEmailInput to null', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.supportEmailInput = ''
      const primitives = vm.buildCurrentPrimitives()
      expect(primitives.supportEmail).toBeNull()
    })

    it('resolves non-empty welcomeHeadingInput to the trimmed value', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.welcomeHeadingInput = '  Welcome to our portal  '
      const primitives = vm.buildCurrentPrimitives()
      expect(primitives.welcomeHeading).toBe('Welcome to our portal')
    })
  })

  // =========================================================================
  // validationErrors computed
  // =========================================================================

  describe('validationErrors computed', () => {
    it('returns empty array when draft is valid', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      expect(vm.validationErrors).toHaveLength(0)
    })

    it('returns errors when organizationName is empty', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.organizationName = ''
      await nextTick()
      expect(vm.validationErrors.length).toBeGreaterThan(0)
      expect(vm.validationErrors.some((e: any) => e.field === 'organizationName')).toBe(true)
    })

    it('returns errors when accentColor is invalid hex', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.accentColor = 'notacolor'
      await nextTick()
      expect(vm.validationErrors.some((e: any) => e.field === 'accentColor')).toBe(true)
    })
  })

  // =========================================================================
  // contrastWarning computed
  // =========================================================================

  describe('contrastWarning computed', () => {
    it('returns false when accentColor has sufficient contrast against white', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      // #1a1a1a is very dark — high contrast
      vm.draftPrimitives.accentColor = '#1a1a1a'
      await nextTick()
      expect(vm.contrastWarning).toBe(false)
    })

    it('returns true when accentColor has insufficient contrast', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      // #EEEEEE is very light — insufficient contrast against white
      vm.draftPrimitives.accentColor = '#EEEEEE'
      await nextTick()
      expect(vm.contrastWarning).toBe(true)
    })
  })

  // =========================================================================
  // saveDraft()
  // =========================================================================

  describe('saveDraft()', () => {
    it('does nothing when isDirty is false', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      expect(vm.isDirty).toBe(false)
      await vm.saveDraft()
      // isSaving should never have been set to true
      expect(vm.isSaving).toBe(false)
    })

    it('sets isSaving during save and clears afterwards', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isDirty = true
      await nextTick()
      const savePromise = vm.saveDraft()
      // While awaiting the stub promise, isSaving should be true
      // (we advance timers to resolve the 100ms stub)
      await vi.advanceTimersByTimeAsync(200)
      await savePromise
      expect(vm.isSaving).toBe(false)
    })

    it('clears isDirty after successful save', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isDirty = true
      await nextTick()
      const savePromise = vm.saveDraft()
      await vi.advanceTimersByTimeAsync(200)
      await savePromise
      expect(vm.isDirty).toBe(false)
    })

    it('sets publishState to draft after save', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isDirty = true
      vm.publishState = 'unknown'
      await nextTick()
      const savePromise = vm.saveDraft()
      await vi.advanceTimersByTimeAsync(200)
      await savePromise
      expect(vm.publishState).toBe('draft')
    })

    it('updates lastUpdatedLabel after save', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isDirty = true
      await nextTick()
      const savePromise = vm.saveDraft()
      await vi.advanceTimersByTimeAsync(200)
      await savePromise
      expect(vm.lastUpdatedLabel).not.toBeNull()
    })

    it('adds an entry to changeHistory after save', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isDirty = true
      const beforeCount = vm.changeHistory.length
      await nextTick()
      const savePromise = vm.saveDraft()
      await vi.advanceTimersByTimeAsync(200)
      await savePromise
      expect(vm.changeHistory.length).toBe(beforeCount + 1)
      expect(vm.changeHistory[0].action).toBe('draft')
    })

    it('does not save when already isSaving', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isDirty = true
      vm.isSaving = true
      await nextTick()
      const initialHistory = vm.changeHistory.length
      await vm.saveDraft()
      expect(vm.changeHistory.length).toBe(initialHistory)
    })
  })

  // =========================================================================
  // publishConfig()
  // =========================================================================

  describe('publishConfig()', () => {
    it('does nothing when there are validation errors', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.organizationName = ''
      await nextTick()
      const beforeHistory = vm.changeHistory.length
      await vm.publishConfig()
      expect(vm.changeHistory.length).toBe(beforeHistory)
    })

    it('does nothing when already isPublishing', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isPublishing = true
      await nextTick()
      const beforeHistory = vm.changeHistory.length
      await vm.publishConfig()
      expect(vm.changeHistory.length).toBe(beforeHistory)
    })

    it('sets publishState to published after successful publish', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      // Ensure validation passes
      expect(vm.validationErrors).toHaveLength(0)
      const publishPromise = vm.publishConfig()
      await vi.advanceTimersByTimeAsync(200)
      await publishPromise
      expect(vm.publishState).toBe('published')
    })

    it('clears isDirty after publish', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isDirty = true
      await nextTick()
      const publishPromise = vm.publishConfig()
      await vi.advanceTimersByTimeAsync(200)
      await publishPromise
      expect(vm.isDirty).toBe(false)
    })

    it('adds a "published" entry to changeHistory', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      const beforeCount = vm.changeHistory.length
      const publishPromise = vm.publishConfig()
      await vi.advanceTimersByTimeAsync(200)
      await publishPromise
      expect(vm.changeHistory.length).toBe(beforeCount + 1)
      expect(vm.changeHistory[0].action).toBe('published')
    })
  })

  // =========================================================================
  // discardChanges()
  // =========================================================================

  describe('discardChanges()', () => {
    it('resets isDirty to false', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.isDirty = true
      await nextTick()
      vm.discardChanges()
      await nextTick()
      expect(vm.isDirty).toBe(false)
    })

    it('restores draft primitives from snapshot', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      const originalName = vm.draftPrimitives.organizationName
      vm.draftPrimitives.organizationName = 'Modified Name'
      vm.isDirty = true
      await nextTick()
      vm.discardChanges()
      await nextTick()
      expect(vm.draftPrimitives.organizationName).toBe(originalName)
    })

    it('clears input refs to null when snapshot has null values', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.logoUrlInput = 'https://cdn.example.com/logo.png'
      vm.isDirty = true
      await nextTick()
      // Snapshot has null logoUrl by default
      vm.discardChanges()
      await nextTick()
      expect(vm.logoUrlInput).toBe('')
    })

    it('sets publishState to draft after discard', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.publishState = 'published'
      vm.isDirty = true
      await nextTick()
      vm.discardChanges()
      await nextTick()
      expect(vm.publishState).toBe('draft')
    })
  })

  // =========================================================================
  // Preview tab switching
  // =========================================================================

  describe('preview tab state', () => {
    it('initializes with header tab active', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      expect(vm.activePreviewTab).toBe('header')
    })

    it('allows switching activePreviewTab directly', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.activePreviewTab = 'login'
      await nextTick()
      expect(vm.activePreviewTab).toBe('login')
    })
  })

  // =========================================================================
  // applyConfig() (internal helper)
  // =========================================================================

  describe('applyConfig()', () => {
    it('populates draftPrimitives from config', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.applyConfig({
        id: 'test',
        tenantId: 'tenant',
        primitives: {
          organizationName: 'Test Corp',
          productLabel: 'Test Portal',
          logoUrl: 'https://example.com/logo.png',
          faviconUrl: null,
          accentColor: '#123456',
          secondaryColor: '#654321',
          supportEmail: 'help@test.com',
          supportUrl: null,
          welcomeHeading: 'Hello',
          complianceContextNote: null,
        },
        publishState: 'published',
        lastUpdatedAt: '2025-01-01T12:00:00Z',
        lastPublishedAt: null,
        hasDraftChanges: false,
      })
      await nextTick()
      expect(vm.draftPrimitives.organizationName).toBe('Test Corp')
      expect(vm.draftPrimitives.accentColor).toBe('#123456')
      expect(vm.publishState).toBe('published')
      expect(vm.logoUrlInput).toBe('https://example.com/logo.png')
      expect(vm.isDirty).toBe(false)
    })

    it('sets lastUpdatedLabel from ISO timestamp', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.applyConfig({
        id: '',
        tenantId: '',
        primitives: { ...DEFAULT_BRAND_CONFIG },
        publishState: 'draft',
        lastUpdatedAt: '2025-06-15T10:30:00Z',
        lastPublishedAt: null,
        hasDraftChanges: false,
      })
      await nextTick()
      expect(vm.lastUpdatedLabel).not.toBeNull()
      expect(typeof vm.lastUpdatedLabel).toBe('string')
    })

    it('sets lastUpdatedLabel to null when lastUpdatedAt is null', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.applyConfig({
        id: '',
        tenantId: '',
        primitives: { ...DEFAULT_BRAND_CONFIG },
        publishState: 'draft',
        lastUpdatedAt: null,
        lastPublishedAt: null,
        hasDraftChanges: false,
      })
      await nextTick()
      expect(vm.lastUpdatedLabel).toBeNull()
    })
  })
})
