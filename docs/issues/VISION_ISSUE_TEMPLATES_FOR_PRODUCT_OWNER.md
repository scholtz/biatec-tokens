# Issue Templates: Recommended UX/Design Priorities

**Purpose**: This document provides ready-to-use issue templates for the 4 UX/design priorities identified in the roadmap analysis.

**Product Owner**: Copy each template below to create separate GitHub issues.

---

## Issue Template #1: WCAG 2.1 AA Accessibility Compliance

### Title
```
WCAG 2.1 AA Accessibility Compliance Implementation
```

### Labels
```
priority: critical, accessibility, legal-compliance, ux-improvement
```

### Summary

Achieve full WCAG 2.1 AA accessibility compliance to meet legal requirements (EU Web Accessibility Directive, ADA) and expand market reach by 15%+ to users with visual impairments. Current color contrast violations and missing focus indicators likely violate WCAG standards and block enterprise sales to regulated entities.

### Business Value

**Revenue Impact**: HIGH
- Unblocks enterprise sales requiring accessibility compliance
- Expands addressable market by 15%+ (users with visual impairments)
- Required for MICA compliance (accessibility is part of consumer protection)

**Legal Risk**: CRITICAL
- EU Web Accessibility Directive requires compliance
- ADA compliance required for US market
- Potential regulatory fines for non-compliance

**Competitive Advantage**:
- Most token platforms lack accessibility compliance
- Differentiator for regulated enterprise buyers

### Scope

#### In Scope
1. Audit all color combinations using automated tools (axe DevTools, WAVE)
2. Replace low-contrast grays with WCAG AA compliant alternatives
   - `text-gray-300` on dark backgrounds (current: ~2.5:1, target: 4.5:1)
   - `text-gray-400` on dark backgrounds (current: ~3.2:1, target: 4.5:1)
   - `text-gray-500` on dark backgrounds (current: ~4.0:1, target: 4.5:1)
3. Redesign error state colors to meet 4.5:1 minimum contrast
   - `text-red-300` on light backgrounds (needs verification and fix)
4. Implement visible focus indicators on all interactive elements
   - Buttons, inputs, selects, navigation links, modals
   - Minimum 2px visible outline at 1.5rem distance
5. Test with real screen readers
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS/iOS)
6. Document keyboard navigation patterns for all workflows
   - Token creation flow
   - Compliance setup
   - Authentication
   - Dashboard navigation
   - Settings configuration

#### Out of Scope
- WCAG AAA compliance (beyond minimum legal requirement)
- Video captions (no video content currently)
- Audio transcripts (no audio content currently)
- Dynamic content compliance (future enhancement)

### Acceptance Criteria

1. **AC #1: Automated Compliance**
   - [ ] 100% axe DevTools pass rate (0 violations)
   - [ ] WAVE scanner shows 0 contrast errors
   - [ ] Lighthouse accessibility score ≥95

2. **AC #2: Color Contrast**
   - [ ] All text-to-background contrasts meet 4.5:1 minimum (WCAG AA)
   - [ ] Large text (18pt+) meets 3:1 minimum
   - [ ] Error messages meet 4.5:1 contrast ratio
   - [ ] Color palette documentation includes contrast ratios

3. **AC #3: Focus Indicators**
   - [ ] All interactive elements have visible focus indicators
   - [ ] Focus indicators visible at 1.5rem distance
   - [ ] Focus indicators use 2px+ outline or equivalent
   - [ ] Focus trap works correctly in modals/dialogs

4. **AC #4: Screen Reader Compatibility**
   - [ ] 5 critical flows tested with NVDA
   - [ ] 5 critical flows tested with JAWS
   - [ ] 5 critical flows tested with VoiceOver
   - [ ] All interactive elements have proper labels
   - [ ] Form fields announce errors correctly

5. **AC #5: Keyboard Navigation**
   - [ ] All features accessible via keyboard only
   - [ ] Tab order is logical and sequential
   - [ ] Escape key closes modals/dialogs
   - [ ] Enter key submits forms
   - [ ] Arrow keys navigate lists/menus
   - [ ] Keyboard shortcuts documented

6. **AC #6: Documentation**
   - [ ] Keyboard navigation guide created
   - [ ] Accessibility testing checklist for QA
   - [ ] Color palette with contrast ratios documented
   - [ ] Screen reader testing results documented

### Testing

#### Unit Tests
- [ ] Focus trap behavior in modals/dialogs (5+ tests)
- [ ] Keyboard event handlers (10+ tests)
- [ ] ARIA attributes on components (10+ tests)
- [ ] Color contrast calculation utilities (if created)

#### Integration Tests
- [ ] Keyboard navigation through forms (5+ tests)
- [ ] Focus management between route changes (5+ tests)
- [ ] Modal focus trap integration (3+ tests)

#### E2E Tests
- [ ] Automated accessibility checks with @axe-core/playwright (5+ tests)
- [ ] Keyboard-only navigation flows (5+ tests)
- [ ] Tab order verification (3+ tests)

#### Manual Tests
- [ ] NVDA testing on 5 critical flows (documented results)
- [ ] JAWS testing on 5 critical flows (documented results)
- [ ] VoiceOver testing on 5 critical flows (documented results)
- [ ] Keyboard-only navigation testing (documented results)

#### Evidence Required
- [ ] axe DevTools report (PDF or screenshot)
- [ ] WAVE scanner summary (screenshot)
- [ ] Lighthouse accessibility audit (screenshot)
- [ ] Screen reader test logs (text file or video)
- [ ] Before/after contrast ratio comparison

### Estimated Effort
40-60 hours (2-3 weeks, 1 developer)

### Priority
CRITICAL (blocks enterprise sales, legal compliance risk)

---

## Issue Template #2: Navigation Simplification & Mobile Parity

### Title
```
Navigation Simplification & Mobile/Desktop Parity
```

### Labels
```
priority: medium, ux-improvement, mobile, navigation
```

### Summary

Simplify navigation to reduce cognitive load for non-crypto native users (target audience) and ensure 100% parity between desktop and mobile navigation. Current desktop shows 9 navigation items (exceeds 7±2 cognitive limit) and mobile is missing 2 items (22% feature gap).

### Business Value

**Revenue Impact**: MEDIUM
- Improves feature discovery by 15%+ (analytics hypothesis)
- Reduces task completion time by 20%+ (user testing hypothesis)
- Increases user activation rate by 5-10%

**User Experience**:
- Target audience (non-crypto native) needs simplified navigation
- Current 9 items exceeds cognitive load limit (7±2 items)
- Mobile users missing features (40%+ of traffic)

**Competitive Advantage**:
- Cleaner, more focused navigation vs typical crypto dashboards
- Mobile-first design for growing mobile user base

### Scope

#### In Scope
1. Consolidate desktop navigation to 5-7 core items maximum
   - Current: Home, Cockpit, Guided Launch, Compliance, Create, Dashboard, Insights, Pricing, Settings (9 items)
   - Target: 5-7 top-level items with sub-navigation for grouped features
2. Group related items under dropdowns
   - Example: "Compliance" → Compliance Setup, Compliance Dashboard, Whitelists
   - Example: "Tools" → Token Creation, Guided Launch, Batch Deployment
3. Ensure 100% parity between desktop and mobile navigation
   - Same items, same order, same functionality
   - Currently mobile missing 2 items (needs investigation)
4. Add visual hierarchy (primary vs secondary actions)
   - Primary: Create Token, Dashboard, Compliance
   - Secondary: Settings, Pricing, Insights
5. A/B test reduced navigation for conversion impact (optional)
   - 50/50 split between old and new navigation
   - Track feature discovery and task completion metrics

#### Out of Scope
- Complete navigation redesign (keep existing patterns)
- Mega-menu implementation (too complex for MVP)
- Personalized navigation (future enhancement)

### Acceptance Criteria

1. **AC #1: Consolidated Navigation**
   - [ ] Maximum 7 top-level navigation items on desktop
   - [ ] Grouped items use sub-navigation (dropdowns or menus)
   - [ ] Visual hierarchy clear (primary vs secondary actions)
   - [ ] Navigation labels user-friendly (non-technical language)

2. **AC #2: Mobile/Desktop Parity**
   - [ ] 100% parity: same items on mobile and desktop
   - [ ] Same order on mobile and desktop
   - [ ] Same functionality on mobile and desktop
   - [ ] Mobile menu accessibility verified (keyboard, screen reader)

3. **AC #3: User Testing**
   - [ ] User testing shows 20%+ improvement in task completion time
   - [ ] User testing shows 15%+ improvement in feature discovery
   - [ ] 5+ non-technical users complete testing
   - [ ] Test results documented with evidence

4. **AC #4: Analytics Baseline**
   - [ ] Analytics tracking implemented for navigation clicks
   - [ ] Baseline metrics captured before changes
   - [ ] Conversion funnel tracking enabled
   - [ ] A/B test setup (if proceeding with optional testing)

### Testing

#### Unit Tests
- [ ] Navigation component renders correct items (5+ tests)
- [ ] Sub-navigation dropdown functionality (5+ tests)
- [ ] Mobile menu toggle behavior (3+ tests)
- [ ] Navigation item visibility logic (3+ tests)

#### Integration Tests
- [ ] Router navigation integration (5+ tests)
- [ ] Auth state affects navigation (3+ tests)
- [ ] Mobile menu toggle and display (3+ tests)

#### E2E Tests
- [ ] Navbar navigation parity test (desktop vs mobile) (5+ tests)
- [ ] Dropdown sub-navigation (3+ tests)
- [ ] Mobile menu functionality (3+ tests)
- [ ] Keyboard navigation (2+ tests)

#### Manual Tests
- [ ] User testing with 5+ non-technical users
- [ ] Mobile device testing (iOS and Android)
- [ ] Desktop browser testing (Chrome, Firefox, Safari)
- [ ] Tablet testing (iPad, Android tablet)

#### Evidence Required
- [ ] Before/after screenshots (desktop and mobile)
- [ ] Analytics data (baseline and post-implementation)
- [ ] User testing notes (5+ sessions)
- [ ] Navigation click heatmap (if available)

### Estimated Effort
24-32 hours (1-2 weeks, 1 developer)

### Priority
MEDIUM (affects user activation and feature discovery)

---

## Issue Template #3: Legacy Wizard Flow Cleanup

### Title
```
Legacy Wizard Flow Cleanup: Remove /create/wizard References
```

### Labels
```
priority: medium, technical-debt, testing, cleanup
```

### Summary

Remove or update all legacy `/create/wizard` test references to improve development velocity and QA confidence. Currently 6 test files reference the old wizard path, creating confusion about which flow is canonical (wizard vs guided launch).

### Business Value

**Revenue Impact**: LOW (internal quality improvement)
- Faster development velocity (clear which flow to maintain)
- Higher QA confidence (no skipped tests for old flows)
- Reduced documentation maintenance burden

**Developer Experience**:
- Eliminates confusion about canonical token creation flow
- Reduces test maintenance burden
- Improves CI reliability (no skipped wizard tests)

**User Impact**:
- Prevents confusion if old documentation references wizard path
- Ensures new users are directed to guided launch flow

### Scope

#### In Scope
1. Migrate all wizard functionality to `/launch/guided` flow (if not already complete)
2. Remove or update all `/create/wizard` test references in 6 files:
   - `e2e/token-wizard-whitelist.spec.ts`
   - `e2e/compliance-orchestration.spec.ts`
   - `e2e/token-utility-recommendations.spec.ts`
   - `e2e/guided-token-launch.spec.ts`
   - `e2e/compliance-setup-workspace.spec.ts`
   - `e2e/auth-first-token-creation.spec.ts`
3. Verify `/create/wizard` → `/launch/guided` redirect works correctly
   - Router guard implementation
   - Preserve query parameters if needed
4. Update all documentation to reference guided launch only
   - Search docs/ folder for "wizard" or "/create/wizard" references
   - Update or remove outdated documentation
5. Remove `TokenCreationWizard.vue` component if no longer used
   - Verify no components import it
   - Verify no routes reference it
   - Mark as deprecated or remove entirely

#### Out of Scope
- Redesign of guided launch flow (already implemented)
- Migration of wizard-specific features (assume already in guided launch)
- User notification of old path deprecation (redirect handles it)

### Acceptance Criteria

1. **AC #1: Test Migration**
   - [ ] Zero skipped tests referencing `/create/wizard`
   - [ ] All wizard tests either migrated to guided launch or removed
   - [ ] All 6 affected test files updated and passing
   - [ ] No test.skip() for wizard-related tests

2. **AC #2: Router Redirect**
   - [ ] Router guard redirects `/create/wizard` to `/launch/guided`
   - [ ] Redirect preserves query parameters (if applicable)
   - [ ] Redirect tested in E2E suite with explicit assertion
   - [ ] Redirect works for all auth states (authenticated, unauthenticated)

3. **AC #3: Documentation Audit**
   - [ ] Search results for "wizard" and "/create/wizard" show zero matches in docs/
   - [ ] All documentation references guided launch flow
   - [ ] Old wizard documentation removed or clearly marked as deprecated

4. **AC #4: Component Cleanup**
   - [ ] `TokenCreationWizard.vue` removed OR clearly marked as deprecated
   - [ ] No components import TokenCreationWizard
   - [ ] No routes reference TokenCreationWizard
   - [ ] Component removed from src/views/ if unused

### Testing

#### Unit Tests
- [ ] Router guard redirects wizard path (3+ tests)
- [ ] Router guard preserves query params (2+ tests)
- [ ] No unit tests import TokenCreationWizard (verification)

#### Integration Tests
- [ ] Navigation to wizard path redirects correctly (2+ tests)
- [ ] Redirect works for authenticated users (1 test)
- [ ] Redirect works for unauthenticated users (1 test)

#### E2E Tests
- [ ] Navigate to `/create/wizard`, verify redirect to `/launch/guided` (3+ tests)
- [ ] All 6 affected test files updated and passing (verification)
- [ ] Guided launch E2E tests cover all wizard functionality (verification)

#### Manual Tests
- [ ] Click old bookmarked links, verify redirect
- [ ] Test redirect with various query parameters
- [ ] Verify guided launch has all wizard features

#### Evidence Required
- [ ] E2E test logs showing redirect behavior
- [ ] Router test coverage report
- [ ] Before/after test file comparison (git diff)
- [ ] Documentation search results (zero wizard matches)

### Estimated Effort
16-24 hours (1 week, 1 developer)

### Priority
MEDIUM (development velocity improvement)

---

## Issue Template #4: User-Friendly Error Messages

### Title
```
User-Friendly Error Messages: 3-Part Structure Implementation
```

### Labels
```
priority: medium, ux-improvement, error-handling, support-reduction
```

### Summary

Implement consistent user-friendly error messages across the application to reduce support ticket volume by 40% and improve user confidence. Current error messages sometimes expose technical details (stack traces, error codes) instead of actionable guidance, confusing non-crypto native users (target audience).

### Business Value

**Revenue Impact**: MEDIUM
- Reduces support ticket volume by 40% (hypothesis based on error-related tickets)
- Improves user trust and confidence
- Increases completion rate for complex flows by 10-15%
- Reduces user abandonment at error points

**User Experience**:
- Target audience (non-crypto native) confused by technical errors
- Faster time to resolution for user errors
- Increased user confidence and trust

**Support Efficiency**:
- Lower support ticket volume
- Clearer error context for support team
- Self-service resolution for common errors

### Scope

#### In Scope
1. Audit all error handling code for user-facing error messages
   - Components using `err.message` patterns
   - API error responses
   - Form validation messages
   - Network error handling
2. Implement consistent error message translation layer
   - Pattern: `mapError()` (existing pattern in codebase)
   - Pattern: `mapProvisioningError()` (existing pattern in codebase)
   - Extend to all error types
3. Ensure all errors include 3-part structure:
   - **What happened**: User-friendly description (no technical jargon)
   - **Why it matters**: Business impact or consequence
   - **How to fix it**: Actionable next steps
   - **Support contact**: For unresolvable errors (optional)
4. Add error message testing to QA checklist
   - Manual testing of error scenarios
   - Verification that no stack traces shown
   - Confirmation that messages are non-technical
5. Document error message patterns in style guide
   - 10+ examples of good error messages
   - Anti-patterns to avoid
   - Guidelines for writing error messages

#### Out of Scope
- Backend API error message changes (frontend translation only)
- Error logging/monitoring system (separate concern)
- Error recovery workflows (future enhancement)

### Acceptance Criteria

1. **AC #1: Translation Layer**
   - [ ] 100% of user-facing errors use translation layer
   - [ ] All error types covered (API, validation, network, auth, etc.)
   - [ ] Translation layer has unit tests (20+ tests)
   - [ ] Fallback error message for uncaught errors

2. **AC #2: 3-Part Structure**
   - [ ] All errors include "What happened" description
   - [ ] All errors include "Why it matters" impact
   - [ ] All errors include "How to fix it" next steps
   - [ ] Support contact included for complex errors
   - [ ] Examples: "Could not create token. Token creation requires a valid organization profile. Please complete your organization setup in Settings."

3. **AC #3: No Technical Details**
   - [ ] No stack traces shown to users
   - [ ] No error codes (e.g., ERR_CONNECTION_REFUSED)
   - [ ] No internal variable names or paths
   - [ ] No raw API error responses

4. **AC #4: User Testing**
   - [ ] Error messages tested with 5+ non-technical users
   - [ ] Users successfully resolve errors without support
   - [ ] Users report confidence in error guidance
   - [ ] Test results documented

5. **AC #5: Style Guide**
   - [ ] Error message style guide created (10+ examples)
   - [ ] Anti-patterns documented (what NOT to do)
   - [ ] Guidelines for writing new error messages
   - [ ] QA checklist includes error message review

### Testing

#### Unit Tests
- [ ] Error translation layer maps all error types correctly (20+ tests)
- [ ] Fallback error message for unknown errors (2+ tests)
- [ ] 3-part structure validation (5+ tests)
- [ ] No technical details in translated messages (5+ tests)

#### Integration Tests
- [ ] API errors show user-friendly messages (10+ tests)
- [ ] Form validation errors are user-friendly (5+ tests)
- [ ] Network errors show actionable guidance (3+ tests)
- [ ] Auth errors explain how to resolve (3+ tests)

#### E2E Tests
- [ ] Trigger errors in flows, verify messages understandable (10+ tests)
- [ ] Test error recovery flows (5+ tests)
- [ ] Verify no stack traces in any error scenario (5+ tests)

#### Manual Tests
- [ ] User testing on error scenarios (5+ users)
- [ ] Support team review of error messages
- [ ] Verify error messages on different browsers/devices
- [ ] Test all error types manually

#### Evidence Required
- [ ] Before/after error message comparison table
- [ ] User testing notes (5+ sessions)
- [ ] Support ticket volume comparison (before/after, after 30 days)
- [ ] QA checklist with error message examples

### Estimated Effort
32-48 hours (2 weeks, 1 developer)

### Priority
MEDIUM (affects user retention and support costs)

---

## Usage Instructions for Product Owner

1. **Select Priority**: Choose which issue to create first based on business needs
2. **Copy Template**: Copy the entire template for the selected issue
3. **Create GitHub Issue**: Paste into new GitHub issue
4. **Customize**: Adjust any specifics based on current product state
5. **Assign**: Assign to development team or Copilot agent
6. **Track**: Monitor progress using acceptance criteria as checklist

## Sequencing Recommendation

**Recommended Implementation Order**:
1. Issue #1: WCAG Accessibility (CRITICAL, legal/compliance risk)
2. Issue #4: Error Messages (MEDIUM, quick win for user satisfaction)
3. Issue #3: Wizard Cleanup (MEDIUM, enables development velocity)
4. Issue #2: Navigation (MEDIUM, requires design/UX input)

**Total Timeline**: 8 weeks (can be parallelized with multiple developers)

---

**Document Version**: 1.0  
**Last Updated**: February 19, 2026  
**Created By**: GitHub Copilot Agent  
**Related Documents**: 
- `VISION_ISSUE_ANALYSIS_AND_ROADMAP_PRIORITIES.md`
- `VISION_ISSUE_SPECIFICATION_REQUIRED.md`
