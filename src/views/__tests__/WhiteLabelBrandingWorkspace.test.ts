/**
 * WhiteLabelBrandingWorkspace.test.ts
 *
 * Rendering and WCAG accessibility tests for WhiteLabelBrandingWorkspace.vue.
 * Tests landmarks, data-testid bindings, aria attributes, and state-dependent UI.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WhiteLabelBrandingWorkspace from '../WhiteLabelBrandingWorkspace.vue'
import { BRAND_TEST_IDS } from '../../utils/whiteLabelBranding'

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

const MainLayoutStub = { template: '<div><slot /></div>' }
const iconStub = { template: '<svg aria-hidden="true" />' }

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
  // Advance timers to complete onMounted async load
  await vi.advanceTimersByTimeAsync(300)
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WhiteLabelBrandingWorkspace', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic mounting', () => {
    it('mounts without throwing', async () => {
      const wrapper = await mountWorkspace()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the workspace shell with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const shell = wrapper.find(`[data-testid="${BRAND_TEST_IDS.WORKSPACE_SHELL}"]`)
      expect(shell.exists()).toBe(true)
    })
  })

  describe('page header', () => {
    it('renders h1 heading with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const heading = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PAGE_HEADING}"]`)
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toContain('White-Label Branding')
    })

    it('renders a publish state badge', async () => {
      const wrapper = await mountWorkspace()
      const badge = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
      expect(badge.exists()).toBe(true)
    })

    it('publish state badge has aria-label for accessibility (WCAG SC 1.3.1)', async () => {
      const wrapper = await mountWorkspace()
      const badge = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
      expect(badge.attributes('aria-label')).toBeTruthy()
    })
  })

  describe('loading state', () => {
    it('shows loading indicator while async fetch runs', async () => {
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
      // Before timers fire, loading state should be active
      await nextTick()
      const loadingEl = wrapper.find('[data-testid="branding-loading-state"]')
      expect(loadingEl.exists()).toBe(true)
      vi.useRealTimers()
    })

    it('loading element has role="status" and aria-live for screen readers', async () => {
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
      await nextTick()
      const loadingEl = wrapper.find('[data-testid="branding-loading-state"]')
      expect(loadingEl.attributes('role')).toBe('status')
      expect(loadingEl.attributes('aria-live')).toBe('polite')
      vi.useRealTimers()
    })
  })

  describe('identity section', () => {
    it('renders org name input with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.ORG_NAME_INPUT}"]`)
      expect(input.exists()).toBe(true)
    })

    it('renders product label input with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PRODUCT_LABEL_INPUT}"]`)
      expect(input.exists()).toBe(true)
    })

    it('org name input has aria-required="true" (WCAG SC 1.3.5)', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.ORG_NAME_INPUT}"]`)
      expect(input.attributes('aria-required')).toBe('true')
    })

    it('product label input has aria-required="true"', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PRODUCT_LABEL_INPUT}"]`)
      expect(input.attributes('aria-required')).toBe('true')
    })

    it('org name input has an associated label via id', async () => {
      const wrapper = await mountWorkspace()
      const label = wrapper.find('label[for="brand-org-name"]')
      expect(label.exists()).toBe(true)
      expect(label.text()).toContain('Organisation Display Name')
    })
  })

  describe('color section', () => {
    it('renders accent color input with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.ACCENT_COLOR_INPUT}"]`)
      expect(input.exists()).toBe(true)
    })

    it('renders secondary color input with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.SECONDARY_COLOR_INPUT}"]`)
      expect(input.exists()).toBe(true)
    })
  })

  describe('action buttons', () => {
    it('renders save draft button with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const btn = wrapper.find(`[data-testid="${BRAND_TEST_IDS.SAVE_DRAFT_BUTTON}"]`)
      expect(btn.exists()).toBe(true)
    })

    it('renders publish button with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const btn = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_BUTTON}"]`)
      expect(btn.exists()).toBe(true)
    })

    it('save draft button has aria-label (WCAG SC 2.4.6)', async () => {
      const wrapper = await mountWorkspace()
      const btn = wrapper.find(`[data-testid="${BRAND_TEST_IDS.SAVE_DRAFT_BUTTON}"]`)
      expect(btn.attributes('aria-label')).toBeTruthy()
    })

    it('publish button has aria-label', async () => {
      const wrapper = await mountWorkspace()
      const btn = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_BUTTON}"]`)
      expect(btn.attributes('aria-label')).toBeTruthy()
    })

    it('save draft button is disabled when not dirty (no unsaved changes)', async () => {
      const wrapper = await mountWorkspace()
      const btn = wrapper.find(`[data-testid="${BRAND_TEST_IDS.SAVE_DRAFT_BUTTON}"]`)
      // On fresh load isDirty is false
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  describe('workspace region accessibility', () => {
    it('workspace shell has role="region" (WCAG SC 1.3.6)', async () => {
      const wrapper = await mountWorkspace()
      const shell = wrapper.find(`[data-testid="${BRAND_TEST_IDS.WORKSPACE_SHELL}"]`)
      expect(shell.attributes('role')).toBe('region')
    })

    it('workspace shell has aria-label (WCAG SC 1.3.6)', async () => {
      const wrapper = await mountWorkspace()
      const shell = wrapper.find(`[data-testid="${BRAND_TEST_IDS.WORKSPACE_SHELL}"]`)
      expect(shell.attributes('aria-label')).toBeTruthy()
    })

    it('has a skip-to-main-content link (WCAG SC 2.4.1)', async () => {
      const wrapper = await mountWorkspace()
      const skipLink = wrapper.find('a[href="#branding-workspace-main"]')
      expect(skipLink.exists()).toBe(true)
      expect(skipLink.classes()).toContain('sr-only')
    })

    it('brand sections use section elements with aria-labelledby', async () => {
      const wrapper = await mountWorkspace()
      const sections = wrapper.findAll('section')
      expect(sections.length).toBeGreaterThan(0)
      sections.forEach(section => {
        expect(section.attributes('aria-labelledby')).toBeTruthy()
      })
    })
  })

  describe('failsafe banner', () => {
    it('failsafe banner is NOT shown when config loads successfully', async () => {
      const wrapper = await mountWorkspace()
      // fetchBrandingConfig returns null which triggers the fallback path, so configLoadFailed is true
      // Actually the catch block sets configLoadFailed=true only on throw, null triggers applyConfig(brandConfigFromApi(null))
      // Let's check it accordingly
      const banner = wrapper.find(`[data-testid="${BRAND_TEST_IDS.FAILSAFE_BANNER}"]`)
      // fetchBrandingConfig returns null (no throw), so configLoadFailed stays false
      expect(banner.exists()).toBe(false)
    })
  })

  describe('preview panel', () => {
    it('renders preview panel with correct data-testid', async () => {
      const wrapper = await mountWorkspace()
      const panel = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PREVIEW_PANEL}"]`)
      expect(panel.exists()).toBe(true)
    })
  })

  describe('change history section', () => {
    it('renders change history section with correct data-testid after a draft save', async () => {
      const wrapper = await mountWorkspace()
      // The section is conditionally rendered (v-if="changeHistory.length > 0").
      // Trigger a save to populate change history, then verify the section appears.
      const vm = wrapper.vm as any
      vm.isDirty = true
      await nextTick()
      const savePromise = vm.saveDraft()
      await vi.advanceTimersByTimeAsync(200)
      await savePromise
      await nextTick()
      const section = wrapper.find(`[data-testid="${BRAND_TEST_IDS.CHANGE_HISTORY_SECTION}"]`)
      expect(section.exists()).toBe(true)
    })
  })

  describe('validation display', () => {
    it('validation errors block is NOT shown when config is valid', async () => {
      const wrapper = await mountWorkspace()
      // Default config is valid — no validation errors
      const errorsEl = wrapper.find(`[data-testid="${BRAND_TEST_IDS.VALIDATION_ERRORS}"]`)
      expect(errorsEl.exists()).toBe(false)
    })
  })
})
