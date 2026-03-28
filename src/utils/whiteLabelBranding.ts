/**
 * whiteLabelBranding.ts
 *
 * Utility module for white-label branding configuration in the Biatec Tokens
 * enterprise white-label workspace. Provides types, validation helpers, contrast
 * checking, safe-text guards, and publish-state management for the branding
 * workspace.
 *
 * Design constraints:
 *  - No arbitrary HTML/CSS injection; all text fields are plain-text only.
 *  - Color choices must meet WCAG AA contrast requirements (4.5:1 for normal text).
 *  - Configuration failures degrade safely to the DEFAULT_BRAND_CONFIG.
 *  - Compliance-critical UI elements (warnings, evidence states) are never
 *    overridable by brand configuration.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The set of brand primitives an enterprise administrator may configure. */
export interface BrandPrimitives {
  /** Organization display name (shown in header and branded surfaces). */
  organizationName: string;
  /** Short product label (e.g. "MyBank Tokenization Portal"). Max 60 chars. */
  productLabel: string;
  /** URL to the organisation's logo image. Must be https. */
  logoUrl: string | null;
  /** URL to the organisation's favicon image. Must be https. */
  faviconUrl: string | null;
  /** Primary accent colour in 6-digit hex format (e.g. "#1A73E8"). */
  accentColor: string;
  /** Secondary / supporting colour in 6-digit hex format. */
  secondaryColor: string;
  /** Customer support email address surfaced in help sections. */
  supportEmail: string | null;
  /** Customer support URL surfaced in help sections. */
  supportUrl: string | null;
  /** Welcome heading shown on the authenticated home screen. Max 120 chars. */
  welcomeHeading: string | null;
  /** Organisation-specific compliance context note. Max 300 chars. Plain text. */
  complianceContextNote: string | null;
}

/** Publish state for a branding configuration. */
export type BrandPublishState =
  | 'draft'
  | 'published'
  | 'partially_configured'
  | 'blocked'
  | 'unknown';

/** Full branding configuration including metadata. */
export interface BrandConfig {
  id: string;
  tenantId: string;
  primitives: BrandPrimitives;
  publishState: BrandPublishState;
  /** ISO 8601 timestamp for the last time this configuration was saved. */
  lastUpdatedAt: string | null;
  /** ISO 8601 timestamp for the last publish action. */
  lastPublishedAt: string | null;
  /** Whether this config has unsaved draft changes relative to the published version. */
  hasDraftChanges: boolean;
}

/** Result of validating a BrandPrimitives object. */
export interface BrandValidationResult {
  isValid: boolean;
  errors: BrandValidationError[];
  warnings: BrandValidationWarning[];
}

export interface BrandValidationError {
  field: keyof BrandPrimitives;
  message: string;
}

export interface BrandValidationWarning {
  field: keyof BrandPrimitives;
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum lengths for brand text fields. */
export const BRAND_MAX_LENGTHS: Record<string, number> = {
  organizationName: 80,
  productLabel: 60,
  welcomeHeading: 120,
  complianceContextNote: 300,
};

/** data-testid constants for the branding workspace. */
export const BRAND_TEST_IDS = {
  WORKSPACE_SHELL: 'white-label-branding-workspace',
  PAGE_HEADING: 'branding-workspace-heading',
  PUBLISH_STATE_BADGE: 'branding-publish-state-badge',
  LAST_UPDATED_LABEL: 'branding-last-updated',
  ORG_NAME_INPUT: 'brand-org-name-input',
  PRODUCT_LABEL_INPUT: 'brand-product-label-input',
  LOGO_URL_INPUT: 'brand-logo-url-input',
  FAVICON_URL_INPUT: 'brand-favicon-url-input',
  ACCENT_COLOR_INPUT: 'brand-accent-color-input',
  SECONDARY_COLOR_INPUT: 'brand-secondary-color-input',
  SUPPORT_EMAIL_INPUT: 'brand-support-email-input',
  SUPPORT_URL_INPUT: 'brand-support-url-input',
  WELCOME_HEADING_INPUT: 'brand-welcome-heading-input',
  COMPLIANCE_NOTE_INPUT: 'brand-compliance-note-input',
  PREVIEW_PANEL: 'brand-preview-panel',
  PREVIEW_HEADER: 'brand-preview-header',
  PREVIEW_LOGIN: 'brand-preview-login',
  PREVIEW_DASHBOARD_SHELL: 'brand-preview-dashboard-shell',
  PREVIEW_COMPLIANCE_SURFACE: 'brand-preview-compliance-surface',
  CONTRAST_WARNING: 'brand-contrast-warning',
  SAVE_DRAFT_BUTTON: 'brand-save-draft-button',
  PUBLISH_BUTTON: 'brand-publish-button',
  DISCARD_BUTTON: 'brand-discard-button',
  VALIDATION_ERRORS: 'brand-validation-errors',
  FAILSAFE_BANNER: 'brand-failsafe-banner',
  CHANGE_HISTORY_SECTION: 'brand-change-history-section',
} as const;

/** Default brand config used when tenant config is missing or invalid (fail-safe). */
export const DEFAULT_BRAND_CONFIG: BrandPrimitives = {
  organizationName: 'Biatec Tokens',
  productLabel: 'Regulated Tokenization Platform',
  logoUrl: null,
  faviconUrl: null,
  accentColor: '#2563EB',
  secondaryColor: '#4F46E5',
  supportEmail: null,
  supportUrl: null,
  welcomeHeading: null,
  complianceContextNote: null,
};

// ---------------------------------------------------------------------------
// Color / Contrast helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the string is a valid 6-digit hex color (with leading #).
 * Example: "#1A73E8" → true; "red" → false; "#abc" → false.
 */
export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

/**
 * Parses a 6-digit hex color into its sRGB components in [0, 255].
 * Returns null for invalid input.
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHexColor(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/**
 * Converts a sRGB channel value (0–255) to its linearised form as required
 * by the WCAG relative luminance formula.
 */
function lineariseSrgb(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Computes the WCAG 2.1 relative luminance for an sRGB colour.
 * Returns a value in [0, 1] where 0 = black and 1 = white.
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * lineariseSrgb(r) +
    0.7152 * lineariseSrgb(g) +
    0.0722 * lineariseSrgb(b)
  );
}

/**
 * Computes the WCAG 2.1 contrast ratio between two hex colours.
 * Returns null when either colour is invalid.
 */
export function computeContrastRatio(hex1: string, hex2: string): number | null {
  const c1 = parseHexColor(hex1);
  const c2 = parseHexColor(hex2);
  if (!c1 || !c2) return null;

  const lum1 = relativeLuminance(c1.r, c1.g, c1.b);
  const lum2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns true when the contrast ratio between accentColor and white (#FFFFFF)
 * meets the WCAG AA threshold of 4.5:1 for normal text.
 *
 * If the ratio cannot be computed (invalid hex), returns false (conservative).
 */
export function meetsContrastRequirement(accentColor: string): boolean {
  const ratio = computeContrastRatio(accentColor, '#FFFFFF');
  if (ratio === null) return false;
  return ratio >= 4.5;
}

// ---------------------------------------------------------------------------
// Text / URL safety helpers
// ---------------------------------------------------------------------------

/** Characters that must not appear in brand text fields. */
const UNSAFE_CHARS_PATTERN = /<|>|&|"|'|`|\\|\/\//;

/**
 * Returns true when the text is safe to render in a brand context:
 *  - no HTML/script injection characters
 *  - no control characters
 */
export function isSafeBrandText(text: string): boolean {
  if (UNSAFE_CHARS_PATTERN.test(text)) return false;
  // Disallow ASCII control characters
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) return false;
  }
  return true;
}

/**
 * Strips unsafe characters and trims the text to the given max length.
 * This is a defensive sanitisation for display — input should also be
 * validated at save time via isSafeBrandText.
 */
export function sanitizeBrandText(text: string, maxLength: number): string {
  return text
    .replace(/<|>|&|"|'|`/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Returns true when the URL is a valid https URL suitable for logo/favicon
 * or support link fields. Empty strings are rejected.
 */
export function isValidHttpsUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Returns true when the string looks like a valid email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validates a BrandPrimitives object and returns a structured result with
 * errors (blocking) and warnings (non-blocking accessibility hints).
 */
export function validateBrandConfig(p: BrandPrimitives): BrandValidationResult {
  const errors: BrandValidationError[] = [];
  const warnings: BrandValidationWarning[] = [];

  // Organization name — required
  if (!p.organizationName || p.organizationName.trim() === '') {
    errors.push({ field: 'organizationName', message: 'Organization name is required.' });
  } else {
    if (p.organizationName.length > BRAND_MAX_LENGTHS.organizationName) {
      errors.push({
        field: 'organizationName',
        message: `Organization name must be ${BRAND_MAX_LENGTHS.organizationName} characters or fewer.`,
      });
    }
    if (!isSafeBrandText(p.organizationName)) {
      errors.push({
        field: 'organizationName',
        message: 'Organization name contains unsafe characters.',
      });
    }
  }

  // Product label — required
  if (!p.productLabel || p.productLabel.trim() === '') {
    errors.push({ field: 'productLabel', message: 'Product label is required.' });
  } else {
    if (p.productLabel.length > BRAND_MAX_LENGTHS.productLabel) {
      errors.push({
        field: 'productLabel',
        message: `Product label must be ${BRAND_MAX_LENGTHS.productLabel} characters or fewer.`,
      });
    }
    if (!isSafeBrandText(p.productLabel)) {
      errors.push({
        field: 'productLabel',
        message: 'Product label contains unsafe characters.',
      });
    }
  }

  // Accent color — required and must be valid hex
  if (!isValidHexColor(p.accentColor)) {
    errors.push({ field: 'accentColor', message: 'Accent color must be a valid 6-digit hex color (e.g. #1A73E8).' });
  } else if (!meetsContrastRequirement(p.accentColor)) {
    warnings.push({
      field: 'accentColor',
      message: 'Accent color may have insufficient contrast against white text (WCAG AA requires 4.5:1). Please verify accessibility before publishing.',
    });
  }

  // Secondary color — required and must be valid hex
  if (!isValidHexColor(p.secondaryColor)) {
    errors.push({ field: 'secondaryColor', message: 'Secondary color must be a valid 6-digit hex color (e.g. #4F46E5).' });
  }

  // Logo URL — optional but must be https if provided
  if (p.logoUrl !== null && p.logoUrl !== '') {
    if (!isValidHttpsUrl(p.logoUrl)) {
      errors.push({ field: 'logoUrl', message: 'Logo URL must be a valid HTTPS URL.' });
    }
  }

  // Favicon URL — optional but must be https if provided
  if (p.faviconUrl !== null && p.faviconUrl !== '') {
    if (!isValidHttpsUrl(p.faviconUrl)) {
      errors.push({ field: 'faviconUrl', message: 'Favicon URL must be a valid HTTPS URL.' });
    }
  }

  // Support email — optional but must be valid email if provided
  if (p.supportEmail !== null && p.supportEmail !== '') {
    if (!isValidEmail(p.supportEmail)) {
      errors.push({ field: 'supportEmail', message: 'Support email must be a valid email address.' });
    }
  }

  // Support URL — optional but must be https if provided
  if (p.supportUrl !== null && p.supportUrl !== '') {
    if (!isValidHttpsUrl(p.supportUrl)) {
      errors.push({ field: 'supportUrl', message: 'Support URL must be a valid HTTPS URL.' });
    }
  }

  // Welcome heading — optional, length and safety check
  if (p.welcomeHeading !== null && p.welcomeHeading !== '') {
    if (p.welcomeHeading.length > BRAND_MAX_LENGTHS.welcomeHeading) {
      errors.push({
        field: 'welcomeHeading',
        message: `Welcome heading must be ${BRAND_MAX_LENGTHS.welcomeHeading} characters or fewer.`,
      });
    }
    if (!isSafeBrandText(p.welcomeHeading)) {
      errors.push({
        field: 'welcomeHeading',
        message: 'Welcome heading contains unsafe characters.',
      });
    }
  }

  // Compliance context note — optional, length and safety check
  if (p.complianceContextNote !== null && p.complianceContextNote !== '') {
    if (p.complianceContextNote.length > BRAND_MAX_LENGTHS.complianceContextNote) {
      errors.push({
        field: 'complianceContextNote',
        message: `Compliance context note must be ${BRAND_MAX_LENGTHS.complianceContextNote} characters or fewer.`,
      });
    }
    if (!isSafeBrandText(p.complianceContextNote)) {
      errors.push({
        field: 'complianceContextNote',
        message: 'Compliance context note contains unsafe characters.',
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// Publish-state helpers
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable label for a BrandPublishState.
 */
export function buildPublishStateLabel(state: BrandPublishState): string {
  switch (state) {
    case 'published': return 'Published';
    case 'draft': return 'Draft';
    case 'partially_configured': return 'Partially Configured';
    case 'blocked': return 'Blocked';
    case 'unknown': return 'Unknown';
  }
}

/**
 * Returns the Tailwind CSS colour classes appropriate for the given publish state.
 * Used to style the publish-state badge in the workspace.
 */
export function publishStateBadgeClass(state: BrandPublishState): string {
  switch (state) {
    case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'partially_configured': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'unknown': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

/**
 * Constructs a BrandConfig object from a raw API response, providing safe
 * defaults for any missing or invalid fields. This is the fail-safe entry
 * point for brand configuration ingestion.
 */
export function brandConfigFromApi(raw: unknown): BrandConfig {
  const fallback: BrandConfig = {
    id: '',
    tenantId: '',
    primitives: { ...DEFAULT_BRAND_CONFIG },
    publishState: 'draft',
    lastUpdatedAt: null,
    lastPublishedAt: null,
    hasDraftChanges: false,
  };

  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;

  const primitives = (r.primitives && typeof r.primitives === 'object')
    ? (r.primitives as Record<string, unknown>)
    : {};

  const safeString = (val: unknown, max: number, fallbackVal: string): string => {
    if (typeof val !== 'string') return fallbackVal;
    return sanitizeBrandText(val, max);
  };

  const safeNullableString = (val: unknown): string | null => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val !== 'string') return null;
    return val.trim();
  };

  const resolvedPrimitives: BrandPrimitives = {
    organizationName: safeString(primitives.organizationName, BRAND_MAX_LENGTHS.organizationName, DEFAULT_BRAND_CONFIG.organizationName),
    productLabel: safeString(primitives.productLabel, BRAND_MAX_LENGTHS.productLabel, DEFAULT_BRAND_CONFIG.productLabel),
    logoUrl: safeNullableString(primitives.logoUrl),
    faviconUrl: safeNullableString(primitives.faviconUrl),
    accentColor: isValidHexColor(safeString(primitives.accentColor, 7, ''))
      ? safeString(primitives.accentColor, 7, DEFAULT_BRAND_CONFIG.accentColor)
      : DEFAULT_BRAND_CONFIG.accentColor,
    secondaryColor: isValidHexColor(safeString(primitives.secondaryColor, 7, ''))
      ? safeString(primitives.secondaryColor, 7, DEFAULT_BRAND_CONFIG.secondaryColor)
      : DEFAULT_BRAND_CONFIG.secondaryColor,
    supportEmail: safeNullableString(primitives.supportEmail),
    supportUrl: safeNullableString(primitives.supportUrl),
    welcomeHeading: safeNullableString(primitives.welcomeHeading),
    complianceContextNote: safeNullableString(primitives.complianceContextNote),
  };

  const validStates: BrandPublishState[] = ['draft', 'published', 'partially_configured', 'blocked', 'unknown'];
  const publishState: BrandPublishState = validStates.includes(r.publishState as BrandPublishState)
    ? (r.publishState as BrandPublishState)
    : 'unknown';

  return {
    id: typeof r.id === 'string' ? r.id : fallback.id,
    tenantId: typeof r.tenantId === 'string' ? r.tenantId : fallback.tenantId,
    primitives: resolvedPrimitives,
    publishState,
    lastUpdatedAt: safeNullableString(r.lastUpdatedAt),
    lastPublishedAt: safeNullableString(r.lastPublishedAt),
    hasDraftChanges: typeof r.hasDraftChanges === 'boolean' ? r.hasDraftChanges : false,
  };
}

/**
 * Determines the BrandPublishState from a validated draft and existing published config.
 * Used by the workspace to compute what state to surface in the UI.
 */
export function deriveBrandPublishState(
  validationResult: BrandValidationResult,
  hasDraftChanges: boolean,
  existingState: BrandPublishState,
): BrandPublishState {
  if (!validationResult.isValid) return 'blocked';
  if (existingState === 'published' && !hasDraftChanges) return 'published';
  return 'draft';
}
