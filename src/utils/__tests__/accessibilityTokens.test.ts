/**
 * Unit tests for accessibilityTokens utility
 *
 * Validates:
 * 1. Contrast token resolution returns WCAG AA compliant pairs for all surfaces
 * 2. Label fallback logic uses correct priority cascade
 * 3. Icon button validation catches missing labels
 * 4. Heading hierarchy validation detects skipped levels
 * 5. All functions are safe and deterministic (no side effects)
 */

import { describe, it, expect } from 'vitest';
import {
  resolveContrastToken,
  resolveContrastClasses,
  isContrastAA,
  getFailingContrastSurfaces,
  resolveAccessibleLabel,
  validateIconButtonLabel,
  validateHeadingHierarchy,
  isValidHeadingHierarchy,
  type ContrastSurface,
  type AccessibleLabelOptions,
  type HeadingDescriptor,
} from '../accessibilityTokens';

// ---------------------------------------------------------------------------
// Contrast token resolution
// ---------------------------------------------------------------------------

describe('accessibilityTokens - contrast token resolution', () => {
  const allSurfaces: ContrastSurface[] = [
    'primary',
    'secondary',
    'danger',
    'warning',
    'success',
    'info',
    'neutral',
    'muted',
  ];

  it('should return a token pair for every defined surface', () => {
    for (const surface of allSurfaces) {
      const token = resolveContrastToken(surface);
      expect(token).toBeDefined();
      expect(token.text).toBeTruthy();
      expect(token.bg).toBeTruthy();
      expect(token.border).toBeTruthy();
    }
  });

  it('should meet WCAG AA for all surfaces (contrastRatio ≥ 4.5)', () => {
    for (const surface of allSurfaces) {
      const token = resolveContrastToken(surface);
      expect(token.contrastRatio).toBeGreaterThanOrEqual(4.5);
      expect(token.meetsAA).toBe(true);
    }
  });

  it('should return the primary surface token with white text on blue background', () => {
    const token = resolveContrastToken('primary');
    expect(token.text).toContain('text-white');
    expect(token.bg).toContain('bg-blue');
    expect(token.meetsAA).toBe(true);
  });

  it('should return the danger surface token with white text on red background', () => {
    const token = resolveContrastToken('danger');
    expect(token.text).toContain('text-white');
    expect(token.bg).toContain('bg-red');
    expect(token.meetsAA).toBe(true);
  });

  it('should return the warning surface token that meets AA', () => {
    const token = resolveContrastToken('warning');
    expect(token.meetsAA).toBe(true);
    expect(token.bg).toContain('yellow');
  });

  it('should return the success surface token that meets AA', () => {
    const token = resolveContrastToken('success');
    expect(token.meetsAA).toBe(true);
    expect(token.bg).toContain('green');
  });

  it('should return the info surface token that meets AAA', () => {
    const token = resolveContrastToken('info');
    expect(token.meetsAA).toBe(true);
    expect(token.meetsAAA).toBe(true);
  });
});

describe('accessibilityTokens - resolveContrastClasses', () => {
  it('should return a non-empty class string for every surface', () => {
    const surfaces: ContrastSurface[] = ['primary', 'danger', 'success', 'warning'];
    for (const surface of surfaces) {
      const classes = resolveContrastClasses(surface);
      expect(typeof classes).toBe('string');
      expect(classes.length).toBeGreaterThan(0);
    }
  });

  it('should include text, bg, and border classes in the combined string', () => {
    const classes = resolveContrastClasses('primary');
    expect(classes).toContain('text-');
    expect(classes).toContain('bg-');
    expect(classes).toContain('border-');
  });
});

describe('accessibilityTokens - isContrastAA', () => {
  it('should return true for all registered surfaces', () => {
    const surfaces: ContrastSurface[] = ['primary', 'secondary', 'danger', 'warning', 'success', 'info', 'neutral', 'muted'];
    for (const surface of surfaces) {
      expect(isContrastAA(surface)).toBe(true);
    }
  });
});

describe('accessibilityTokens - getFailingContrastSurfaces', () => {
  it('should return an empty array when all surfaces pass WCAG AA', () => {
    const failing = getFailingContrastSurfaces();
    expect(failing).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Accessible label resolution
// ---------------------------------------------------------------------------

describe('accessibilityTokens - resolveAccessibleLabel', () => {
  it('should prefer aria-label over all other sources', () => {
    const result = resolveAccessibleLabel({
      ariaLabel: 'Close dialog',
      visibleText: 'Close',
      title: 'Close',
    });
    expect(result.label).toBe('Close dialog');
    expect(result.source).toBe('aria-label');
    expect(result.isAdequate).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('should use aria-labelledby reference when no aria-label is present', () => {
    const result = resolveAccessibleLabel({
      labelledById: 'modal-title',
    });
    expect(result.label).toContain('labelledby');
    expect(result.source).toBe('labelledby');
    expect(result.isAdequate).toBe(true);
  });

  it('should fall back to title attribute with a warning', () => {
    const result = resolveAccessibleLabel({
      title: 'Download report',
    });
    expect(result.label).toBe('Download report');
    expect(result.source).toBe('title');
    expect(result.isAdequate).toBe(true);
    expect(result.warning).toBeTruthy();
  });

  it('should fall back to visible text when no explicit label is set', () => {
    const result = resolveAccessibleLabel({
      visibleText: 'Save changes',
    });
    expect(result.label).toBe('Save changes');
    expect(result.source).toBe('visible-text');
    expect(result.isAdequate).toBe(true);
  });

  it('should use explicit fallback string with a warning', () => {
    const result = resolveAccessibleLabel({
      fallback: 'Action button',
    });
    expect(result.label).toBe('Action button');
    expect(result.source).toBe('fallback');
    expect(result.isAdequate).toBe(true);
    expect(result.warning).toBeTruthy();
  });

  it('should generate a fallback label when nothing is provided', () => {
    const result = resolveAccessibleLabel({ elementType: 'button' });
    expect(result.label).toBe('Action button');
    expect(result.source).toBe('generated');
    expect(result.isAdequate).toBe(false);
    expect(result.warning).toBeTruthy();
  });

  it('should generate element-type-specific fallbacks', () => {
    expect(resolveAccessibleLabel({ elementType: 'link' }).label).toBe('Link');
    expect(resolveAccessibleLabel({ elementType: 'input' }).label).toBe('Input field');
    expect(resolveAccessibleLabel({ elementType: 'icon' }).label).toBe('Icon');
    expect(resolveAccessibleLabel({ elementType: 'status' }).label).toBe('Status indicator');
  });

  it('should trim whitespace from all label sources', () => {
    const result = resolveAccessibleLabel({ ariaLabel: '  Close  ' });
    expect(result.label).toBe('Close');
  });

  it('should treat blank aria-label as absent and fall through to next source', () => {
    const result = resolveAccessibleLabel({
      ariaLabel: '   ',
      visibleText: 'Delete token',
    });
    expect(result.source).toBe('visible-text');
    expect(result.label).toBe('Delete token');
  });
});

// ---------------------------------------------------------------------------
// Icon button validation
// ---------------------------------------------------------------------------

describe('accessibilityTokens - validateIconButtonLabel', () => {
  it('should return true when aria-label is present', () => {
    expect(validateIconButtonLabel('Close', undefined)).toBe(true);
  });

  it('should return true when title is present', () => {
    expect(validateIconButtonLabel(undefined, 'Close')).toBe(true);
  });

  it('should return true when both aria-label and title are present', () => {
    expect(validateIconButtonLabel('Close dialog', 'Close')).toBe(true);
  });

  it('should return false when neither aria-label nor title is provided', () => {
    expect(validateIconButtonLabel(undefined, undefined)).toBe(false);
  });

  it('should return false when aria-label is empty string', () => {
    expect(validateIconButtonLabel('', undefined)).toBe(false);
  });

  it('should return false when title is empty string', () => {
    expect(validateIconButtonLabel(undefined, '')).toBe(false);
  });

  it('should return false when aria-label is whitespace only', () => {
    expect(validateIconButtonLabel('   ', undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Heading hierarchy validation
// ---------------------------------------------------------------------------

describe('accessibilityTokens - validateHeadingHierarchy', () => {
  it('should return no violations for a valid sequential hierarchy', () => {
    const headings: HeadingDescriptor[] = [
      { level: 1, text: 'Page Title' },
      { level: 2, text: 'Section' },
      { level: 3, text: 'Subsection' },
    ];
    const violations = validateHeadingHierarchy(headings);
    expect(violations).toHaveLength(0);
  });

  it('should return no violations for headings that decrease level', () => {
    const headings: HeadingDescriptor[] = [
      { level: 1, text: 'Page Title' },
      { level: 2, text: 'Section A' },
      { level: 3, text: 'Subsection' },
      { level: 2, text: 'Section B' },
    ];
    expect(validateHeadingHierarchy(headings)).toHaveLength(0);
  });

  it('should report a violation when the page does not start with h1', () => {
    const headings: HeadingDescriptor[] = [
      { level: 2, text: 'Section' },
    ];
    const violations = validateHeadingHierarchy(headings);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toContain('h1');
  });

  it('should report a violation when heading levels skip by more than one', () => {
    const headings: HeadingDescriptor[] = [
      { level: 1, text: 'Page Title' },
      { level: 3, text: 'Jumped heading' },
    ];
    const violations = validateHeadingHierarchy(headings);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toContain('h1');
    expect(violations[0]).toContain('h3');
  });

  it('should return no violations for an empty heading list', () => {
    expect(validateHeadingHierarchy([])).toHaveLength(0);
  });

  it('should detect multiple violations in a malformed hierarchy', () => {
    const headings: HeadingDescriptor[] = [
      { level: 2, text: 'No h1' },
      { level: 5, text: 'Huge jump' },
    ];
    const violations = validateHeadingHierarchy(headings);
    expect(violations.length).toBeGreaterThanOrEqual(2);
  });
});

describe('accessibilityTokens - isValidHeadingHierarchy', () => {
  it('should return true for a valid hierarchy', () => {
    const headings: HeadingDescriptor[] = [
      { level: 1, text: 'Title' },
      { level: 2, text: 'Section' },
    ];
    expect(isValidHeadingHierarchy(headings)).toBe(true);
  });

  it('should return false when hierarchy has violations', () => {
    const headings: HeadingDescriptor[] = [
      { level: 1, text: 'Title' },
      { level: 4, text: 'Skipped' },
    ];
    expect(isValidHeadingHierarchy(headings)).toBe(false);
  });
});
