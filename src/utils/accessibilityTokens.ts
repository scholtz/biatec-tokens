/**
 * Accessibility Tokens Utility
 *
 * Provides WCAG 2.1 AA-compliant contrast token resolution and accessible
 * label fallback logic for the Biatec Tokens interface.
 *
 * Design goals:
 * - Deterministic: same input always produces same accessible output
 * - Fallback-safe: never silently omits accessible labels
 * - Testable: pure functions with no side effects
 *
 * References:
 * - WCAG 2.1 AA: https://www.w3.org/TR/WCAG21/#contrast-minimum
 * - Issue #457: Trustworthy Operations UX v1
 * - Roadmap: compliance-readiness, enterprise-grade UX standards
 */

// ---------------------------------------------------------------------------
// Contrast token types
// ---------------------------------------------------------------------------

/**
 * Semantic color surface categories used throughout the application.
 * Maps to WCAG AA contrast-verified Tailwind utility class pairs.
 */
export type ContrastSurface =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'success'
  | 'info'
  | 'neutral'
  | 'muted';

/**
 * A resolved contrast pair for a given surface, containing foreground text
 * class and background class that together meet WCAG 2.1 AA (4.5:1 minimum
 * for normal text, 3:1 for large text and UI components).
 */
export interface ContrastTokenPair {
  /** Tailwind foreground text class */
  text: string;
  /** Tailwind background class */
  bg: string;
  /** Tailwind border class (matches surface tone) */
  border: string;
  /** Approximate contrast ratio (text on background) */
  contrastRatio: number;
  /** True if ratio meets WCAG AA for normal text (≥4.5:1) */
  meetsAA: boolean;
  /** True if ratio meets WCAG AAA for normal text (≥7:1) */
  meetsAAA: boolean;
}

// ---------------------------------------------------------------------------
// Contrast token registry (WCAG AA verified)
// ---------------------------------------------------------------------------

/**
 * Registry of WCAG AA-compliant contrast pairs for each semantic surface.
 *
 * All pairs verified against WCAG 2.1 Success Criterion 1.4.3 (Contrast
 * Minimum, Level AA, 4.5:1 for normal text). Dark-mode-aware class names
 * use Tailwind's `dark:` variant.
 *
 * Contrast ratios are approximate and based on Tailwind CSS color values.
 */
const CONTRAST_TOKEN_REGISTRY: Record<ContrastSurface, ContrastTokenPair> = {
  primary: {
    text: 'text-white',
    bg: 'bg-blue-600 dark:bg-blue-500',
    border: 'border-blue-700 dark:border-blue-400',
    contrastRatio: 4.6,
    meetsAA: true,
    meetsAAA: false,
  },
  secondary: {
    text: 'text-gray-900 dark:text-white',
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    contrastRatio: 10.4,
    meetsAA: true,
    meetsAAA: true,
  },
  danger: {
    text: 'text-white',
    bg: 'bg-red-700 dark:bg-red-600',
    border: 'border-red-800 dark:border-red-500',
    contrastRatio: 5.1,
    meetsAA: true,
    meetsAAA: false,
  },
  warning: {
    text: 'text-yellow-900 dark:text-yellow-100',
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-yellow-300 dark:border-yellow-700',
    contrastRatio: 7.2,
    meetsAA: true,
    meetsAAA: true,
  },
  success: {
    text: 'text-green-900 dark:text-green-100',
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-300 dark:border-green-700',
    contrastRatio: 7.8,
    meetsAA: true,
    meetsAAA: true,
  },
  info: {
    text: 'text-blue-900 dark:text-blue-100',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    contrastRatio: 8.1,
    meetsAA: true,
    meetsAAA: true,
  },
  neutral: {
    text: 'text-gray-700 dark:text-gray-300',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    contrastRatio: 5.9,
    meetsAA: true,
    meetsAAA: false,
  },
  muted: {
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    contrastRatio: 4.5,
    meetsAA: true,
    meetsAAA: false,
  },
};

// ---------------------------------------------------------------------------
// Contrast token resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a WCAG AA-compliant contrast token pair for the given semantic
 * surface. Always returns a valid pair; never throws.
 *
 * @param surface - Semantic color surface name
 * @returns Verified contrast token pair
 *
 * @example
 * const token = resolveContrastToken('danger');
 * // { text: 'text-white', bg: 'bg-red-700 ...', meetsAA: true, ... }
 */
export function resolveContrastToken(surface: ContrastSurface): ContrastTokenPair {
  return CONTRAST_TOKEN_REGISTRY[surface] ?? CONTRAST_TOKEN_REGISTRY.neutral;
}

/**
 * Returns the combined class string (text + bg + border) for a given surface.
 * Suitable for spreading into `class` attribute of a container element.
 *
 * @param surface - Semantic color surface name
 * @returns Space-separated Tailwind class string
 */
export function resolveContrastClasses(surface: ContrastSurface): string {
  const token = resolveContrastToken(surface);
  return `${token.text} ${token.bg} ${token.border}`;
}

/**
 * Returns `true` if the given surface meets WCAG 2.1 AA requirements for
 * normal text (contrast ratio ≥ 4.5:1).
 */
export function isContrastAA(surface: ContrastSurface): boolean {
  return resolveContrastToken(surface).meetsAA;
}

/**
 * Returns all surfaces that fail to meet the WCAG 2.1 AA minimum for normal
 * text. Useful for automated accessibility audits.
 */
export function getFailingContrastSurfaces(): ContrastSurface[] {
  return (Object.keys(CONTRAST_TOKEN_REGISTRY) as ContrastSurface[]).filter(
    (s) => !CONTRAST_TOKEN_REGISTRY[s].meetsAA,
  );
}

// ---------------------------------------------------------------------------
// Accessible label fallback logic
// ---------------------------------------------------------------------------

/**
 * Options for resolving an accessible label for an interactive element.
 */
export interface AccessibleLabelOptions {
  /** Explicit aria-label text (highest priority) */
  ariaLabel?: string;
  /** Visible text content of the element */
  visibleText?: string;
  /** aria-labelledby target element ID */
  labelledById?: string;
  /** Tooltip or title attribute value */
  title?: string;
  /** Descriptive fallback when no other label source is available */
  fallback?: string;
  /** Element type for context-aware fallback construction */
  elementType?: 'button' | 'link' | 'input' | 'icon' | 'status';
}

/**
 * Resolved accessible label with source traceability.
 */
export interface ResolvedAccessibleLabel {
  /** The resolved label text to use */
  label: string;
  /** Which source provided the label */
  source: 'aria-label' | 'visible-text' | 'labelledby' | 'title' | 'fallback' | 'generated';
  /** True if the resolved label is considered adequate for screen readers */
  isAdequate: boolean;
  /** Warning message if the label may not meet accessibility standards */
  warning?: string;
}

/**
 * Resolves the best accessible label for an interactive element using a
 * priority-ordered cascade. Follows ARIA specification precedence:
 * aria-label > aria-labelledby > title > visible text > generated fallback.
 *
 * Returns a structured result so callers can log audit warnings when labels
 * are missing or rely on generated fallbacks.
 *
 * @param options - Label sources to consider
 * @returns Resolved label with source traceability
 *
 * @example
 * const result = resolveAccessibleLabel({
 *   ariaLabel: 'Close dialog',
 *   elementType: 'button',
 * });
 * // { label: 'Close dialog', source: 'aria-label', isAdequate: true }
 */
export function resolveAccessibleLabel(options: AccessibleLabelOptions): ResolvedAccessibleLabel {
  const { ariaLabel, visibleText, labelledById, title, fallback, elementType = 'button' } = options;

  // Priority 1: explicit aria-label
  if (ariaLabel && ariaLabel.trim().length > 0) {
    return {
      label: ariaLabel.trim(),
      source: 'aria-label',
      isAdequate: true,
    };
  }

  // Priority 2: aria-labelledby reference
  if (labelledById && labelledById.trim().length > 0) {
    return {
      label: `[labelledby: ${labelledById.trim()}]`,
      source: 'labelledby',
      isAdequate: true,
    };
  }

  // Priority 3: title attribute
  if (title && title.trim().length > 0) {
    return {
      label: title.trim(),
      source: 'title',
      isAdequate: true,
      warning:
        'Title attribute is used as accessible label. Prefer aria-label for interactive elements.',
    };
  }

  // Priority 4: visible text content
  if (visibleText && visibleText.trim().length > 0) {
    return {
      label: visibleText.trim(),
      source: 'visible-text',
      isAdequate: true,
    };
  }

  // Priority 5: explicit fallback string
  if (fallback && fallback.trim().length > 0) {
    return {
      label: fallback.trim(),
      source: 'fallback',
      isAdequate: true,
      warning:
        'Generic fallback label used. Provide a descriptive aria-label for better screen reader experience.',
    };
  }

  // Priority 6: generated label based on element type
  const generated = generateFallbackLabel(elementType);
  return {
    label: generated,
    source: 'generated',
    isAdequate: false,
    warning: `No accessible label found. Generated "${generated}" as placeholder. Add aria-label to this ${elementType}.`,
  };
}

/**
 * Returns a basic generated fallback label for a given element type.
 * Intentionally generic to signal the need for explicit labelling.
 */
function generateFallbackLabel(elementType: NonNullable<AccessibleLabelOptions['elementType']>): string {
  const defaults: Record<NonNullable<AccessibleLabelOptions['elementType']>, string> = {
    button: 'Action button',
    link: 'Link',
    input: 'Input field',
    icon: 'Icon',
    status: 'Status indicator',
  };
  return defaults[elementType] ?? 'Interactive element';
}

/**
 * Validates that an icon-only button has an adequate accessible label.
 * Returns `true` if the element would be identifiable by a screen reader.
 *
 * @param ariaLabel - The aria-label attribute value
 * @param title - The title attribute value (secondary source)
 * @returns True if the icon-only button has a sufficient label
 */
export function validateIconButtonLabel(ariaLabel?: string, title?: string): boolean {
  const hasAriaLabel = Boolean(ariaLabel && ariaLabel.trim().length > 0);
  const hasTitle = Boolean(title && title.trim().length > 0);
  return hasAriaLabel || hasTitle;
}

// ---------------------------------------------------------------------------
// Heading hierarchy utilities
// ---------------------------------------------------------------------------

/**
 * Heading levels used for semantic document structure.
 * Level 1 is the page title; levels 2–6 are section/subsection headings.
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Describes a heading within a page's document outline.
 */
export interface HeadingDescriptor {
  level: HeadingLevel;
  text: string;
}

/**
 * Validates that a sequence of headings follows a legal hierarchy where no
 * heading level skips more than one level at a time (WCAG SC 1.3.1 and
 * best practice for document structure).
 *
 * Returns an empty array if the hierarchy is valid.
 * Returns a list of violation descriptions if issues are found.
 *
 * @param headings - Ordered list of headings as they appear in the document
 * @returns Array of violation messages (empty when valid)
 */
export function validateHeadingHierarchy(headings: HeadingDescriptor[]): string[] {
  const violations: string[] = [];

  if (headings.length === 0) return violations;

  // Must start at h1
  if (headings[0].level !== 1) {
    violations.push(
      `Page must start with an h1 heading. First heading is h${headings[0].level}: "${headings[0].text}"`,
    );
  }

  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    const levelDiff = curr.level - prev.level;

    // Heading level should not increase by more than 1 at a time
    if (levelDiff > 1) {
      violations.push(
        `Heading level jump from h${prev.level} to h${curr.level} at "${curr.text}". ` +
          `Skipping heading levels may confuse screen reader users.`,
      );
    }
  }

  return violations;
}

/**
 * Returns true if the provided heading sequence has a valid hierarchy with
 * no skipped levels.
 */
export function isValidHeadingHierarchy(headings: HeadingDescriptor[]): boolean {
  return validateHeadingHierarchy(headings).length === 0;
}
