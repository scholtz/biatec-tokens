/**
 * whiteLabelBranding.test.ts
 *
 * Comprehensive unit tests for the whiteLabelBranding utility module.
 * Covers validation, contrast helpers, text safety, publish-state helpers,
 * and the API ingestion fallback path.
 */
import { describe, it, expect } from 'vitest'
import {
  BRAND_TEST_IDS,
  BRAND_MAX_LENGTHS,
  DEFAULT_BRAND_CONFIG,
  isValidHexColor,
  parseHexColor,
  relativeLuminance,
  computeContrastRatio,
  meetsContrastRequirement,
  isSafeBrandText,
  sanitizeBrandText,
  isValidHttpsUrl,
  isValidEmail,
  validateBrandConfig,
  buildPublishStateLabel,
  publishStateBadgeClass,
  brandConfigFromApi,
  deriveBrandPublishState,
  type BrandPrimitives,
  type BrandPublishState,
} from '../whiteLabelBranding'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validPrimitives(overrides: Partial<BrandPrimitives> = {}): BrandPrimitives {
  return {
    organizationName: 'Acme Corp',
    productLabel: 'Acme Tokens',
    logoUrl: null,
    faviconUrl: null,
    accentColor: '#1A73E8',
    secondaryColor: '#4F46E5',
    supportEmail: null,
    supportUrl: null,
    welcomeHeading: null,
    complianceContextNote: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('BRAND_TEST_IDS', () => {
  it('exports all required test-id constants', () => {
    expect(BRAND_TEST_IDS.WORKSPACE_SHELL).toBe('white-label-branding-workspace')
    expect(BRAND_TEST_IDS.PAGE_HEADING).toBe('branding-workspace-heading')
    expect(BRAND_TEST_IDS.PUBLISH_STATE_BADGE).toBe('branding-publish-state-badge')
    expect(BRAND_TEST_IDS.ORG_NAME_INPUT).toBe('brand-org-name-input')
    expect(BRAND_TEST_IDS.PRODUCT_LABEL_INPUT).toBe('brand-product-label-input')
    expect(BRAND_TEST_IDS.ACCENT_COLOR_INPUT).toBe('brand-accent-color-input')
    expect(BRAND_TEST_IDS.SECONDARY_COLOR_INPUT).toBe('brand-secondary-color-input')
    expect(BRAND_TEST_IDS.PUBLISH_BUTTON).toBe('brand-publish-button')
    expect(BRAND_TEST_IDS.SAVE_DRAFT_BUTTON).toBe('brand-save-draft-button')
    expect(BRAND_TEST_IDS.VALIDATION_ERRORS).toBe('brand-validation-errors')
    expect(BRAND_TEST_IDS.CONTRAST_WARNING).toBe('brand-contrast-warning')
    expect(BRAND_TEST_IDS.FAILSAFE_BANNER).toBe('brand-failsafe-banner')
    expect(BRAND_TEST_IDS.PREVIEW_PANEL).toBe('brand-preview-panel')
  })
})

describe('DEFAULT_BRAND_CONFIG', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_BRAND_CONFIG.organizationName).toBe('Biatec Tokens')
    expect(DEFAULT_BRAND_CONFIG.productLabel).toBe('Regulated Tokenization Platform')
    expect(DEFAULT_BRAND_CONFIG.accentColor).toBe('#2563EB')
    expect(DEFAULT_BRAND_CONFIG.secondaryColor).toBe('#4F46E5')
    expect(DEFAULT_BRAND_CONFIG.logoUrl).toBeNull()
    expect(DEFAULT_BRAND_CONFIG.faviconUrl).toBeNull()
    expect(DEFAULT_BRAND_CONFIG.supportEmail).toBeNull()
    expect(DEFAULT_BRAND_CONFIG.supportUrl).toBeNull()
    expect(DEFAULT_BRAND_CONFIG.welcomeHeading).toBeNull()
    expect(DEFAULT_BRAND_CONFIG.complianceContextNote).toBeNull()
  })
})

describe('BRAND_MAX_LENGTHS', () => {
  it('defines max lengths for text fields', () => {
    expect(BRAND_MAX_LENGTHS.organizationName).toBe(80)
    expect(BRAND_MAX_LENGTHS.productLabel).toBe(60)
    expect(BRAND_MAX_LENGTHS.welcomeHeading).toBe(120)
    expect(BRAND_MAX_LENGTHS.complianceContextNote).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// isValidHexColor
// ---------------------------------------------------------------------------

describe('isValidHexColor', () => {
  it('accepts valid 6-digit hex colors', () => {
    expect(isValidHexColor('#1A73E8')).toBe(true)
    expect(isValidHexColor('#000000')).toBe(true)
    expect(isValidHexColor('#FFFFFF')).toBe(true)
    expect(isValidHexColor('#abcdef')).toBe(true)
    expect(isValidHexColor('#ABCDEF')).toBe(true)
  })

  it('rejects colors without leading #', () => {
    expect(isValidHexColor('1A73E8')).toBe(false)
    expect(isValidHexColor('FFFFFF')).toBe(false)
  })

  it('rejects short hex (3-digit)', () => {
    expect(isValidHexColor('#abc')).toBe(false)
    expect(isValidHexColor('#FFF')).toBe(false)
  })

  it('rejects named colors', () => {
    expect(isValidHexColor('red')).toBe(false)
    expect(isValidHexColor('blue')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidHexColor('')).toBe(false)
  })

  it('rejects invalid characters', () => {
    expect(isValidHexColor('#GGGGGG')).toBe(false)
    expect(isValidHexColor('#1234GH')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// parseHexColor
// ---------------------------------------------------------------------------

describe('parseHexColor', () => {
  it('parses a valid hex color into RGB components', () => {
    const result = parseHexColor('#FF8000')
    expect(result).not.toBeNull()
    expect(result!.r).toBe(255)
    expect(result!.g).toBe(128)
    expect(result!.b).toBe(0)
  })

  it('parses black correctly', () => {
    const result = parseHexColor('#000000')
    expect(result).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('parses white correctly', () => {
    const result = parseHexColor('#FFFFFF')
    expect(result).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('returns null for invalid input', () => {
    expect(parseHexColor('invalid')).toBeNull()
    expect(parseHexColor('#GGG')).toBeNull()
    expect(parseHexColor('')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// relativeLuminance
// ---------------------------------------------------------------------------

describe('relativeLuminance', () => {
  it('returns 0 for black (r=g=b=0)', () => {
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 5)
  })

  it('returns 1 for white (r=g=b=255)', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5)
  })

  it('returns value in [0, 1] range', () => {
    const val = relativeLuminance(128, 64, 200)
    expect(val).toBeGreaterThanOrEqual(0)
    expect(val).toBeLessThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// computeContrastRatio
// ---------------------------------------------------------------------------

describe('computeContrastRatio', () => {
  it('returns 21 for black on white (maximum contrast)', () => {
    const ratio = computeContrastRatio('#000000', '#FFFFFF')
    expect(ratio).not.toBeNull()
    expect(ratio!).toBeCloseTo(21, 0)
  })

  it('returns 1 for identical colors (no contrast)', () => {
    const ratio = computeContrastRatio('#FFFFFF', '#FFFFFF')
    expect(ratio).not.toBeNull()
    expect(ratio!).toBeCloseTo(1, 1)
  })

  it('returns null when first color is invalid', () => {
    expect(computeContrastRatio('invalid', '#FFFFFF')).toBeNull()
  })

  it('returns null when second color is invalid', () => {
    expect(computeContrastRatio('#000000', 'not-a-color')).toBeNull()
  })

  it('returns null when both colors are invalid', () => {
    expect(computeContrastRatio('bad', 'worse')).toBeNull()
  })

  it('produces a symmetric result (order independent)', () => {
    const r1 = computeContrastRatio('#1A73E8', '#FFFFFF')
    const r2 = computeContrastRatio('#FFFFFF', '#1A73E8')
    expect(r1).not.toBeNull()
    expect(r2).not.toBeNull()
    expect(r1!).toBeCloseTo(r2!, 5)
  })
})

// ---------------------------------------------------------------------------
// meetsContrastRequirement
// ---------------------------------------------------------------------------

describe('meetsContrastRequirement', () => {
  it('returns true for a dark color that meets WCAG AA against white', () => {
    // #1a1a1a is very dark, high contrast against white
    expect(meetsContrastRequirement('#1a1a1a')).toBe(true)
  })

  it('returns false for a light color with insufficient contrast against white', () => {
    // #AABBCC is a light color, contrast ratio < 4.5 against white
    expect(meetsContrastRequirement('#CCDDEE')).toBe(false)
  })

  it('returns false for invalid hex', () => {
    expect(meetsContrastRequirement('invalid')).toBe(false)
  })

  it('returns false for white (contrast 1:1)', () => {
    expect(meetsContrastRequirement('#FFFFFF')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isSafeBrandText
// ---------------------------------------------------------------------------

describe('isSafeBrandText', () => {
  it('accepts clean alphanumeric text', () => {
    expect(isSafeBrandText('Acme Corporation')).toBe(true)
    expect(isSafeBrandText('My Token Portal 2024')).toBe(true)
  })

  it('rejects text with HTML tags', () => {
    expect(isSafeBrandText('<script>alert(1)</script>')).toBe(false)
    expect(isSafeBrandText('<b>bold</b>')).toBe(false)
  })

  it('rejects text with ampersand', () => {
    expect(isSafeBrandText('Foo & Bar')).toBe(false)
  })

  it('rejects text with double quotes', () => {
    expect(isSafeBrandText('Say "hello"')).toBe(false)
  })

  it('rejects text with single quotes', () => {
    expect(isSafeBrandText("it's fine")).toBe(false)
  })

  it('rejects text with backticks', () => {
    expect(isSafeBrandText('code `snippet`')).toBe(false)
  })

  it('rejects text with double-slash', () => {
    expect(isSafeBrandText('https://example.com')).toBe(false)
  })

  it('rejects text with ASCII control characters (below 32 except tab/lf/cr)', () => {
    // Character code 1 (SOH) is a control character
    expect(isSafeBrandText('hello\x01world')).toBe(false)
  })

  it('accepts text with tab, LF, CR (whitelisted control chars)', () => {
    expect(isSafeBrandText('line1\nline2')).toBe(true)
    expect(isSafeBrandText('col1\tcol2')).toBe(true)
  })

  it('accepts empty string', () => {
    expect(isSafeBrandText('')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// sanitizeBrandText
// ---------------------------------------------------------------------------

describe('sanitizeBrandText', () => {
  it('strips HTML angle brackets', () => {
    expect(sanitizeBrandText('<b>Hello</b>', 100)).toBe('bHello/b')
  })

  it('strips ampersands', () => {
    expect(sanitizeBrandText('Foo & Bar', 100)).toBe('Foo  Bar')
  })

  it('trims whitespace', () => {
    expect(sanitizeBrandText('  hello  ', 100)).toBe('hello')
  })

  it('truncates to maxLength', () => {
    const result = sanitizeBrandText('Hello World', 5)
    expect(result).toBe('Hello')
  })

  it('handles empty string', () => {
    expect(sanitizeBrandText('', 100)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// isValidHttpsUrl
// ---------------------------------------------------------------------------

describe('isValidHttpsUrl', () => {
  it('accepts valid https URLs', () => {
    expect(isValidHttpsUrl('https://example.com')).toBe(true)
    expect(isValidHttpsUrl('https://cdn.example.com/logo.png')).toBe(true)
    expect(isValidHttpsUrl('https://example.com/path?q=1')).toBe(true)
  })

  it('rejects http URLs', () => {
    expect(isValidHttpsUrl('http://example.com')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidHttpsUrl('')).toBe(false)
  })

  it('rejects whitespace-only string', () => {
    expect(isValidHttpsUrl('   ')).toBe(false)
  })

  it('rejects non-URL strings', () => {
    expect(isValidHttpsUrl('not a url')).toBe(false)
    expect(isValidHttpsUrl('example.com')).toBe(false)
  })

  it('rejects ftp URLs', () => {
    expect(isValidHttpsUrl('ftp://files.example.com')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------

describe('isValidEmail', () => {
  it('accepts standard email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('support+alias@corp.io')).toBe(true)
    expect(isValidEmail('admin@sub.domain.org')).toBe(true)
  })

  it('rejects addresses without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejects addresses without domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejects addresses with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateBrandConfig
// ---------------------------------------------------------------------------

describe('validateBrandConfig', () => {
  describe('organizationName', () => {
    it('is valid with a proper name', () => {
      const result = validateBrandConfig(validPrimitives())
      expect(result.isValid).toBe(true)
    })

    it('errors when organizationName is empty', () => {
      const result = validateBrandConfig(validPrimitives({ organizationName: '' }))
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'organizationName')).toBe(true)
    })

    it('errors when organizationName is whitespace only', () => {
      const result = validateBrandConfig(validPrimitives({ organizationName: '   ' }))
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'organizationName')).toBe(true)
    })

    it('errors when organizationName exceeds 80 chars', () => {
      const result = validateBrandConfig(
        validPrimitives({ organizationName: 'A'.repeat(81) })
      )
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'organizationName' && e.message.includes('80'))).toBe(true)
    })

    it('errors when organizationName contains unsafe characters', () => {
      const result = validateBrandConfig(
        validPrimitives({ organizationName: '<script>' })
      )
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'organizationName' && e.message.includes('unsafe'))).toBe(true)
    })
  })

  describe('productLabel', () => {
    it('errors when productLabel is empty', () => {
      const result = validateBrandConfig(validPrimitives({ productLabel: '' }))
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'productLabel')).toBe(true)
    })

    it('errors when productLabel exceeds 60 chars', () => {
      const result = validateBrandConfig(
        validPrimitives({ productLabel: 'A'.repeat(61) })
      )
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'productLabel' && e.message.includes('60'))).toBe(true)
    })

    it('errors when productLabel contains unsafe characters', () => {
      const result = validateBrandConfig(
        validPrimitives({ productLabel: 'Hello & World' })
      )
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'productLabel' && e.message.includes('unsafe'))).toBe(true)
    })
  })

  describe('accentColor', () => {
    it('errors when accentColor is not a valid hex', () => {
      const result = validateBrandConfig(validPrimitives({ accentColor: 'blue' }))
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'accentColor')).toBe(true)
    })

    it('produces a warning when accentColor has insufficient contrast against white', () => {
      // #DDDDDD is a light grey — low contrast against white
      const result = validateBrandConfig(validPrimitives({ accentColor: '#DDDDDD' }))
      // isValid can be true (warnings don't block), but a warning is present
      expect(result.warnings.some(w => w.field === 'accentColor')).toBe(true)
    })

    it('does not warn when accentColor has sufficient contrast', () => {
      // #1a1a1a is very dark — high contrast
      const result = validateBrandConfig(validPrimitives({ accentColor: '#1a1a1a' }))
      expect(result.warnings.filter(w => w.field === 'accentColor')).toHaveLength(0)
    })
  })

  describe('secondaryColor', () => {
    it('errors when secondaryColor is not a valid hex', () => {
      const result = validateBrandConfig(validPrimitives({ secondaryColor: 'purple' }))
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'secondaryColor')).toBe(true)
    })
  })

  describe('logoUrl', () => {
    it('passes when logoUrl is null', () => {
      const result = validateBrandConfig(validPrimitives({ logoUrl: null }))
      expect(result.errors.some(e => e.field === 'logoUrl')).toBe(false)
    })

    it('passes when logoUrl is empty string', () => {
      const result = validateBrandConfig(validPrimitives({ logoUrl: '' }))
      expect(result.errors.some(e => e.field === 'logoUrl')).toBe(false)
    })

    it('errors when logoUrl is http (not https)', () => {
      const result = validateBrandConfig(
        validPrimitives({ logoUrl: 'http://example.com/logo.png' })
      )
      expect(result.errors.some(e => e.field === 'logoUrl')).toBe(true)
    })

    it('passes when logoUrl is a valid https URL', () => {
      const result = validateBrandConfig(
        validPrimitives({ logoUrl: 'https://cdn.example.com/logo.png' })
      )
      expect(result.errors.some(e => e.field === 'logoUrl')).toBe(false)
    })
  })

  describe('faviconUrl', () => {
    it('passes when faviconUrl is null', () => {
      const result = validateBrandConfig(validPrimitives({ faviconUrl: null }))
      expect(result.errors.some(e => e.field === 'faviconUrl')).toBe(false)
    })

    it('errors when faviconUrl is not a valid https URL', () => {
      const result = validateBrandConfig(
        validPrimitives({ faviconUrl: 'ftp://files.example.com/favicon.ico' })
      )
      expect(result.errors.some(e => e.field === 'faviconUrl')).toBe(true)
    })
  })

  describe('supportEmail', () => {
    it('passes when supportEmail is null', () => {
      const result = validateBrandConfig(validPrimitives({ supportEmail: null }))
      expect(result.errors.some(e => e.field === 'supportEmail')).toBe(false)
    })

    it('errors when supportEmail is invalid', () => {
      const result = validateBrandConfig(
        validPrimitives({ supportEmail: 'not-an-email' })
      )
      expect(result.errors.some(e => e.field === 'supportEmail')).toBe(true)
    })

    it('passes when supportEmail is valid', () => {
      const result = validateBrandConfig(
        validPrimitives({ supportEmail: 'support@acme.com' })
      )
      expect(result.errors.some(e => e.field === 'supportEmail')).toBe(false)
    })
  })

  describe('supportUrl', () => {
    it('passes when supportUrl is null', () => {
      const result = validateBrandConfig(validPrimitives({ supportUrl: null }))
      expect(result.errors.some(e => e.field === 'supportUrl')).toBe(false)
    })

    it('errors when supportUrl is not https', () => {
      const result = validateBrandConfig(
        validPrimitives({ supportUrl: 'http://help.acme.com' })
      )
      expect(result.errors.some(e => e.field === 'supportUrl')).toBe(true)
    })
  })

  describe('welcomeHeading', () => {
    it('passes when welcomeHeading is null', () => {
      const result = validateBrandConfig(validPrimitives({ welcomeHeading: null }))
      expect(result.errors.some(e => e.field === 'welcomeHeading')).toBe(false)
    })

    it('errors when welcomeHeading exceeds 120 chars', () => {
      const result = validateBrandConfig(
        validPrimitives({ welcomeHeading: 'W'.repeat(121) })
      )
      expect(result.errors.some(e => e.field === 'welcomeHeading' && e.message.includes('120'))).toBe(true)
    })

    it('errors when welcomeHeading contains unsafe characters', () => {
      const result = validateBrandConfig(
        validPrimitives({ welcomeHeading: 'Hello <World>' })
      )
      expect(result.errors.some(e => e.field === 'welcomeHeading' && e.message.includes('unsafe'))).toBe(true)
    })
  })

  describe('complianceContextNote', () => {
    it('passes when complianceContextNote is null', () => {
      const result = validateBrandConfig(validPrimitives({ complianceContextNote: null }))
      expect(result.errors.some(e => e.field === 'complianceContextNote')).toBe(false)
    })

    it('errors when complianceContextNote exceeds 300 chars', () => {
      const result = validateBrandConfig(
        validPrimitives({ complianceContextNote: 'C'.repeat(301) })
      )
      expect(result.errors.some(e => e.field === 'complianceContextNote' && e.message.includes('300'))).toBe(true)
    })

    it('errors when complianceContextNote contains unsafe characters', () => {
      const result = validateBrandConfig(
        validPrimitives({ complianceContextNote: 'Note with "quotes"' })
      )
      expect(result.errors.some(e => e.field === 'complianceContextNote' && e.message.includes('unsafe'))).toBe(true)
    })
  })

  it('accumulates multiple errors', () => {
    const result = validateBrandConfig(
      validPrimitives({
        organizationName: '',
        productLabel: '',
        accentColor: 'bad',
      })
    )
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('returns no errors for a fully valid config with optional fields filled', () => {
    const result = validateBrandConfig(
      validPrimitives({
        logoUrl: 'https://cdn.example.com/logo.png',
        faviconUrl: 'https://cdn.example.com/favicon.ico',
        supportEmail: 'help@example.com',
        supportUrl: 'https://help.example.com',
        welcomeHeading: 'Welcome to our portal',
        complianceContextNote: 'MICA-regulated as of 2025',
      })
    )
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// buildPublishStateLabel
// ---------------------------------------------------------------------------

describe('buildPublishStateLabel', () => {
  const cases: Array<[BrandPublishState, string]> = [
    ['published', 'Published'],
    ['draft', 'Draft'],
    ['partially_configured', 'Partially Configured'],
    ['blocked', 'Blocked'],
    ['unknown', 'Unknown'],
  ]

  cases.forEach(([state, label]) => {
    it(`returns "${label}" for state "${state}"`, () => {
      expect(buildPublishStateLabel(state)).toBe(label)
    })
  })
})

// ---------------------------------------------------------------------------
// publishStateBadgeClass
// ---------------------------------------------------------------------------

describe('publishStateBadgeClass', () => {
  it('returns green classes for published state', () => {
    expect(publishStateBadgeClass('published')).toContain('green')
  })

  it('returns yellow classes for draft state', () => {
    expect(publishStateBadgeClass('draft')).toContain('yellow')
  })

  it('returns orange classes for partially_configured state', () => {
    expect(publishStateBadgeClass('partially_configured')).toContain('orange')
  })

  it('returns red classes for blocked state', () => {
    expect(publishStateBadgeClass('blocked')).toContain('red')
  })

  it('returns gray classes for unknown state', () => {
    expect(publishStateBadgeClass('unknown')).toContain('gray')
  })
})

// ---------------------------------------------------------------------------
// brandConfigFromApi
// ---------------------------------------------------------------------------

describe('brandConfigFromApi', () => {
  it('returns fallback for null input', () => {
    const config = brandConfigFromApi(null)
    expect(config.primitives.organizationName).toBe(DEFAULT_BRAND_CONFIG.organizationName)
    expect(config.publishState).toBe('draft')
  })

  it('returns fallback for undefined input', () => {
    const config = brandConfigFromApi(undefined)
    expect(config.primitives.organizationName).toBe(DEFAULT_BRAND_CONFIG.organizationName)
  })

  it('returns fallback for non-object input', () => {
    expect(brandConfigFromApi(42).primitives.organizationName).toBe(DEFAULT_BRAND_CONFIG.organizationName)
    expect(brandConfigFromApi('string').primitives.organizationName).toBe(DEFAULT_BRAND_CONFIG.organizationName)
  })

  it('parses a valid API response', () => {
    const raw = {
      id: 'cfg-001',
      tenantId: 'tenant-abc',
      primitives: {
        organizationName: 'Meridian Capital',
        productLabel: 'Meridian Tokens',
        logoUrl: 'https://cdn.example.com/logo.png',
        faviconUrl: null,
        accentColor: '#2563EB',
        secondaryColor: '#4F46E5',
        supportEmail: 'help@meridian.com',
        supportUrl: 'https://help.meridian.com',
        welcomeHeading: 'Welcome',
        complianceContextNote: null,
      },
      publishState: 'published',
      lastUpdatedAt: '2025-01-01T12:00:00Z',
      lastPublishedAt: '2025-01-01T10:00:00Z',
      hasDraftChanges: false,
    }
    const config = brandConfigFromApi(raw)
    expect(config.id).toBe('cfg-001')
    expect(config.tenantId).toBe('tenant-abc')
    expect(config.primitives.organizationName).toBe('Meridian Capital')
    expect(config.primitives.productLabel).toBe('Meridian Tokens')
    expect(config.primitives.accentColor).toBe('#2563EB')
    expect(config.publishState).toBe('published')
    expect(config.hasDraftChanges).toBe(false)
    expect(config.lastUpdatedAt).toBe('2025-01-01T12:00:00Z')
  })

  it('falls back to default accentColor when provided color is invalid hex', () => {
    const raw = {
      primitives: { organizationName: 'Corp', productLabel: 'Portal', accentColor: 'notacolor', secondaryColor: 'alsobad' },
    }
    const config = brandConfigFromApi(raw)
    expect(config.primitives.accentColor).toBe(DEFAULT_BRAND_CONFIG.accentColor)
    expect(config.primitives.secondaryColor).toBe(DEFAULT_BRAND_CONFIG.secondaryColor)
  })

  it('falls back to unknown publishState for unrecognised values', () => {
    const raw = { publishState: 'something_weird', primitives: {} }
    const config = brandConfigFromApi(raw)
    expect(config.publishState).toBe('unknown')
  })

  it('sets hasDraftChanges to false when not a boolean', () => {
    const raw = { hasDraftChanges: 'yes', primitives: {} }
    const config = brandConfigFromApi(raw)
    expect(config.hasDraftChanges).toBe(false)
  })

  it('converts nullable string fields to null when empty', () => {
    const raw = {
      primitives: {
        organizationName: 'Corp',
        productLabel: 'Portal',
        logoUrl: '',
        supportEmail: null,
        welcomeHeading: undefined,
      },
    }
    const config = brandConfigFromApi(raw)
    expect(config.primitives.logoUrl).toBeNull()
    expect(config.primitives.supportEmail).toBeNull()
    expect(config.primitives.welcomeHeading).toBeNull()
  })

  it('handles missing primitives object gracefully', () => {
    const raw = { id: 'cfg-002', publishState: 'draft' }
    const config = brandConfigFromApi(raw)
    expect(config.primitives.organizationName).toBe(DEFAULT_BRAND_CONFIG.organizationName)
    expect(config.publishState).toBe('draft')
  })

  it('sanitizes overly long organizationName by truncating', () => {
    const longName = 'A'.repeat(100)
    const raw = {
      primitives: { organizationName: longName, productLabel: 'Portal' },
    }
    const config = brandConfigFromApi(raw)
    expect(config.primitives.organizationName.length).toBeLessThanOrEqual(
      BRAND_MAX_LENGTHS.organizationName
    )
  })
})

// ---------------------------------------------------------------------------
// deriveBrandPublishState
// ---------------------------------------------------------------------------

describe('deriveBrandPublishState', () => {
  const validResult = { isValid: true, errors: [], warnings: [] }
  const invalidResult = { isValid: false, errors: [{ field: 'organizationName' as const, message: 'Required' }], warnings: [] }

  it('returns "blocked" when validation fails', () => {
    expect(deriveBrandPublishState(invalidResult, false, 'draft')).toBe('blocked')
    expect(deriveBrandPublishState(invalidResult, true, 'published')).toBe('blocked')
  })

  it('returns "published" when valid, no draft changes, and existing state is published', () => {
    expect(deriveBrandPublishState(validResult, false, 'published')).toBe('published')
  })

  it('returns "draft" when valid but has draft changes', () => {
    expect(deriveBrandPublishState(validResult, true, 'published')).toBe('draft')
  })

  it('returns "draft" when valid and existing state is not published', () => {
    expect(deriveBrandPublishState(validResult, false, 'draft')).toBe('draft')
    expect(deriveBrandPublishState(validResult, false, 'unknown')).toBe('draft')
    expect(deriveBrandPublishState(validResult, false, 'partially_configured')).toBe('draft')
  })
})
