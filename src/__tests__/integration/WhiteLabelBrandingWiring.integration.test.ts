/**
 * WhiteLabelBrandingWiring.integration.test.ts
 *
 * Integration tests proving that utility functions in whiteLabelBranding.ts
 * correctly flow into WhiteLabelBrandingWorkspace.vue's rendered output.
 *
 * Per copilot section 7f: utility + component pairs must have integration
 * tests proving wiring correctness.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WhiteLabelBrandingWorkspace from '../../views/WhiteLabelBrandingWorkspace.vue'
import {
  BRAND_TEST_IDS,
  DEFAULT_BRAND_CONFIG,
  validateBrandConfig,
  buildPublishStateLabel,
  publishStateBadgeClass,
  deriveBrandPublishState,
  meetsContrastRequirement,
  brandConfigFromApi,
} from '../../utils/whiteLabelBranding'

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
// Integration tests
// ---------------------------------------------------------------------------

describe('WhiteLabelBrandingWorkspace — utility→view wiring', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // DEFAULT_BRAND_CONFIG → view defaults
  // =========================================================================

  describe('DEFAULT_BRAND_CONFIG fallback wiring', () => {
    it('org name input defaults to DEFAULT_BRAND_CONFIG.organizationName', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.ORG_NAME_INPUT}"]`)
      expect((input.element as HTMLInputElement).value).toBe(DEFAULT_BRAND_CONFIG.organizationName)
    })

    it('product label input defaults to DEFAULT_BRAND_CONFIG.productLabel', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PRODUCT_LABEL_INPUT}"]`)
      expect((input.element as HTMLInputElement).value).toBe(DEFAULT_BRAND_CONFIG.productLabel)
    })

    it('accent color input defaults to DEFAULT_BRAND_CONFIG.accentColor', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.ACCENT_COLOR_INPUT}"]`)
      expect((input.element as HTMLInputElement).value).toBe(DEFAULT_BRAND_CONFIG.accentColor)
    })

    it('secondary color input defaults to DEFAULT_BRAND_CONFIG.secondaryColor', async () => {
      const wrapper = await mountWorkspace()
      const input = wrapper.find(`[data-testid="${BRAND_TEST_IDS.SECONDARY_COLOR_INPUT}"]`)
      expect((input.element as HTMLInputElement).value).toBe(DEFAULT_BRAND_CONFIG.secondaryColor)
    })
  })

  // =========================================================================
  // validateBrandConfig() → validation errors display
  // =========================================================================

  describe('validateBrandConfig() result → validation errors UI', () => {
    it('validation errors block is hidden when config is valid', async () => {
      const wrapper = await mountWorkspace()
      // Default config is valid
      const utilResult = validateBrandConfig({
        ...DEFAULT_BRAND_CONFIG,
        logoUrl: null,
        faviconUrl: null,
        supportEmail: null,
        supportUrl: null,
        welcomeHeading: null,
        complianceContextNote: null,
      })
      expect(utilResult.isValid).toBe(true)
      const errorsEl = wrapper.find(`[data-testid="${BRAND_TEST_IDS.VALIDATION_ERRORS}"]`)
      expect(errorsEl.exists()).toBe(false)
    })

    it('validation errors block appears when organizationName is emptied', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.organizationName = ''
      await nextTick()
      // Confirm utility also reports an error for this state
      const utilResult = validateBrandConfig(vm.buildCurrentPrimitives())
      expect(utilResult.isValid).toBe(false)
      // View should display the errors block
      const errorsEl = wrapper.find(`[data-testid="${BRAND_TEST_IDS.VALIDATION_ERRORS}"]`)
      expect(errorsEl.exists()).toBe(true)
    })

    it('validation error count in view matches utility error count', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.organizationName = ''
      vm.draftPrimitives.productLabel = ''
      vm.draftPrimitives.accentColor = 'invalid'
      await nextTick()
      const utilResult = validateBrandConfig(vm.buildCurrentPrimitives())
      // Exact count: 3 errors from the 3 invalid fields
      expect(utilResult.errors.length).toBe(3)
      // View computed matches utility
      expect(vm.validationErrors.length).toBe(3)
    })

    it('publish button is disabled when validation errors exist', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.organizationName = ''
      await nextTick()
      const publishBtn = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_BUTTON}"]`)
      expect(publishBtn.attributes('disabled')).toBeDefined()
    })

    it('publish button is NOT disabled when config is valid', async () => {
      const wrapper = await mountWorkspace()
      // Default config is valid and DEFAULT accent color has sufficient contrast
      const vm = wrapper.vm as any
      expect(vm.validationErrors).toHaveLength(0)
      const publishBtn = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_BUTTON}"]`)
      expect(publishBtn.attributes('disabled')).toBeUndefined()
    })
  })

  // =========================================================================
  // meetsContrastRequirement() → contrast warning display
  // =========================================================================

  describe('meetsContrastRequirement() → contrast warning UI', () => {
    it('contrast warning is hidden when accent color has sufficient contrast', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.accentColor = '#1a1a1a'
      await nextTick()
      // Utility confirms no contrast issue
      expect(meetsContrastRequirement('#1a1a1a')).toBe(true)
      // View hides warning
      const warning = wrapper.find(`[data-testid="${BRAND_TEST_IDS.CONTRAST_WARNING}"]`)
      expect(warning.exists()).toBe(false)
    })

    it('contrast warning appears when accent color has insufficient contrast', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.accentColor = '#EEEEEE'
      await nextTick()
      // Utility confirms contrast issue
      expect(meetsContrastRequirement('#EEEEEE')).toBe(false)
      // View shows warning
      const warning = wrapper.find(`[data-testid="${BRAND_TEST_IDS.CONTRAST_WARNING}"]`)
      expect(warning.exists()).toBe(true)
    })

    it('contrast warning has role="status" for non-blocking accessibility (WCAG SC 4.1.3)', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.accentColor = '#EEEEEE'
      await nextTick()
      const warning = wrapper.find(`[data-testid="${BRAND_TEST_IDS.CONTRAST_WARNING}"]`)
      expect(warning.attributes('role')).toBe('status')
    })
  })

  // =========================================================================
  // buildPublishStateLabel() → publish state badge text
  // =========================================================================

  describe('buildPublishStateLabel() → publish state badge text', () => {
    it('badge shows "Draft" text for draft state', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.publishState = 'draft'
      await nextTick()
      const badge = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
      expect(badge.text()).toBe(buildPublishStateLabel('draft'))
      expect(badge.text()).toBe('Draft')
    })

    it('badge shows "Published" text after publish', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.publishState = 'published'
      await nextTick()
      const badge = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
      expect(badge.text()).toBe(buildPublishStateLabel('published'))
      expect(badge.text()).toBe('Published')
    })

    it('badge shows "Blocked" when state is blocked', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.publishState = 'blocked'
      await nextTick()
      const badge = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
      expect(badge.text()).toBe('Blocked')
    })
  })

  // =========================================================================
  // publishStateBadgeClass() → badge CSS classes
  // =========================================================================

  describe('publishStateBadgeClass() → badge CSS class wiring', () => {
    it('badge uses green classes for published state', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.publishState = 'published'
      await nextTick()
      const badge = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
      const utilClass = publishStateBadgeClass('published')
      // The utility-returned class string should be applied to the badge
      utilClass.split(' ').forEach(cls => {
        if (cls) expect(badge.classes()).toContain(cls)
      })
    })

    it('badge uses yellow classes for draft state', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.publishState = 'draft'
      await nextTick()
      const badge = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
      const utilClass = publishStateBadgeClass('draft')
      utilClass.split(' ').forEach(cls => {
        if (cls) expect(badge.classes()).toContain(cls)
      })
    })
  })

  // =========================================================================
  // deriveBrandPublishState() → publish flow consistency
  // =========================================================================

  describe('deriveBrandPublishState() → publish flow consistency', () => {
    it('utility returns "blocked" when validation fails, view disables publish button', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.organizationName = ''
      await nextTick()
      const utilResult = validateBrandConfig(vm.buildCurrentPrimitives())
      const derivedState = deriveBrandPublishState(utilResult, false, 'draft')
      expect(derivedState).toBe('blocked')
      // Publish button disabled in view
      const btn = wrapper.find(`[data-testid="${BRAND_TEST_IDS.PUBLISH_BUTTON}"]`)
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  // =========================================================================
  // brandConfigFromApi() → applyConfig fallback
  // =========================================================================

  describe('brandConfigFromApi() fallback → view renders defaults', () => {
    it('ingesting null API response renders DEFAULT_BRAND_CONFIG values', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      // Manually apply the result of brandConfigFromApi(null)
      vm.applyConfig(brandConfigFromApi(null))
      await nextTick()
      expect(vm.draftPrimitives.organizationName).toBe(DEFAULT_BRAND_CONFIG.organizationName)
      expect(vm.draftPrimitives.accentColor).toBe(DEFAULT_BRAND_CONFIG.accentColor)
    })

    it('ingesting a valid API response correctly populates inputs', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      const apiResponse = {
        id: 'cfg-001',
        tenantId: 'tenant-xyz',
        primitives: {
          organizationName: 'Wired Corp',
          productLabel: 'Wired Portal',
          logoUrl: null,
          faviconUrl: null,
          accentColor: '#2563EB',
          secondaryColor: '#7C3AED',
          supportEmail: null,
          supportUrl: null,
          welcomeHeading: null,
          complianceContextNote: null,
        },
        publishState: 'published' as const,
        lastUpdatedAt: '2025-01-15T09:00:00Z',
        lastPublishedAt: null,
        hasDraftChanges: false,
      }
      vm.applyConfig(brandConfigFromApi(apiResponse))
      await nextTick()
      const orgInput = wrapper.find(`[data-testid="${BRAND_TEST_IDS.ORG_NAME_INPUT}"]`)
      expect((orgInput.element as HTMLInputElement).value).toBe('Wired Corp')
      expect(vm.publishState).toBe('published')
    })
  })

  // =========================================================================
  // Compliance-critical UI is never affected by branding
  // =========================================================================

  describe('compliance truthfulness — branding does not override compliance UI', () => {
    it('failsafe banner uses fixed warning styling, not brand accentColor', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      // Simulate a config load failure
      vm.configLoadFailed = true
      vm.isLoading = false
      await nextTick()
      const banner = wrapper.find(`[data-testid="${BRAND_TEST_IDS.FAILSAFE_BANNER}"]`)
      expect(banner.exists()).toBe(true)
      // Banner uses amber (warning) styling, not the brand accent color
      expect(banner.classes().join(' ')).toContain('amber')
    })

    it('validation error block uses fixed red styling, independent of brand accent', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.organizationName = ''
      await nextTick()
      const errorsEl = wrapper.find(`[data-testid="${BRAND_TEST_IDS.VALIDATION_ERRORS}"]`)
      expect(errorsEl.exists()).toBe(true)
      // Always red — compliance/error state must not be branded
      expect(errorsEl.classes().join(' ')).toContain('red')
    })

    it('contrast warning block uses fixed yellow styling, independent of brand', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any
      vm.draftPrimitives.accentColor = '#EEEEEE'
      await nextTick()
      const warning = wrapper.find(`[data-testid="${BRAND_TEST_IDS.CONTRAST_WARNING}"]`)
      expect(warning.exists()).toBe(true)
      expect(warning.classes().join(' ')).toContain('yellow')
    })
  })
})
