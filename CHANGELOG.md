# Changelog

All notable changes to the Biatec Tokens platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - SaaS Authentication and Wizard UX Stabilization

#### Business Impact
- **User Conversion**: Authentication flow now uses familiar SaaS language, reducing cognitive load for non-crypto business users
- **Production Guidance**: Network selection prioritizes production-ready options (Algorand, Ethereum) with clear visual indicators
- **Accessibility**: Improved readability in both light and dark themes ensures content is accessible to all users
- **Error Handling**: Clear, actionable error messages reduce support tickets and improve user confidence

#### Features
- **SaaS-Friendly Authentication Language**
  - Replaced "Connect wallet" with "Sign In", "Sign In with Wallet", "Authenticate" throughout the application
  - Updated all error messages to use business-friendly terminology instead of crypto jargon
  - Landing page now uses approachable language suitable for non-technical users
  - Authentication flows follow standard SaaS patterns familiar to business users

- **Network Prioritization System**
  - Implemented three-tier network classification:
    - **Primary Mainnets** (Algorand, Ethereum): Green "✓ Recommended" badge
    - **Advanced Networks** (VOI, Aramid): Purple "Advanced" label
    - **Testnets** (Algorand Testnet, Sepolia): Yellow "Testnet" label
  - Network sorting algorithm ensures production-ready options appear first
  - Clear visual hierarchy guides users toward appropriate network choices

- **Wizard Readability Improvements**
  - Verified glass-effect backgrounds maintain full opacity (rgba α=1.0) for readability
  - Confirmed high-contrast text rendering in both light and dark themes
  - All wizard steps remain legible across different viewing conditions
  - Form inputs and error messages have improved contrast

#### Changed
- `src/components/LandingEntryModule.vue`: Updated copy to use SaaS-friendly language
- `src/components/WalletConnectModal.vue`: Added network prioritization labels and badges
- `src/components/WalletOnboardingWizard.vue`: Updated error message terminology
- `src/composables/useWalletManager.ts`: Added `isAdvanced` flag to network type, updated error messages
- `src/composables/useUnifiedWallet.ts`: Updated method descriptions and error messages to use SaaS terminology
- `src/composables/useNetworkValidation.ts`: Updated validation error messages
- `src/utils/networkSorting.ts`: Enhanced network sorting algorithm to support three-tier prioritization

#### Technical Details
- **Type System Enhancement**: Added optional `isAdvanced?: boolean` field to `BaseNetworkInfo` interface
- **Network Classification**: VOI and Aramid networks marked as advanced (not primary production networks)
- **Sorting Algorithm**: Updated to categorize networks as 0 (primary), 1 (advanced), 2 (testnet)
- **Error Handling**: Standardized error messages across authentication composables

#### Testing
- **Unit Tests**: All 2095 existing unit tests passing (100% pass rate)
- **Integration Tests**: NetworkPrioritization integration tests passing
- **E2E Tests**: Added 7 new E2E tests in `e2e/saas-auth-ux.spec.ts` covering:
  - SaaS-friendly language verification
  - Network prioritization label display
  - Wizard readability in both light and dark themes
  - Authentication modal behavior
  - Theme persistence
- **Visual Validation**: 6 screenshots documenting improvements across both themes
- **Coverage**: Maintained >80% coverage for all metrics (statements, branches, functions, lines)

#### Documentation
- Added `TESTING_SUMMARY.md` with comprehensive test results and validation details
- Captured screenshots demonstrating visual improvements in both themes
- Documented network prioritization system and labeling conventions

#### Files Modified
- 7 source files updated with language and network prioritization changes
- 1 new E2E test suite added
- 1 new testing summary document added
- 6 screenshots added for visual validation
- `.gitignore` updated to exclude temporary files

#### Issue Reference
This release addresses issue [Frontend: SaaS authentication and wizard UX stabilization](https://github.com/scholtz/biatec-tokens/issues/XXX)

**Business Value Delivered:**
- Reduces user onboarding friction by eliminating crypto-native jargon
- Guides users toward production-ready network options to prevent misconfiguration
- Improves accessibility and usability across different themes and viewing conditions
- Lowers support costs through clear error messages and user guidance
- Aligns platform with enterprise SaaS expectations to increase user trust and conversion

**Risk Mitigation:**
- No breaking changes to existing APIs or data structures
- All existing tests continue passing (zero regressions)
- Changes follow existing component patterns and design system
- Backward compatible with existing wallet connection flows
- Type-safe implementation prevents runtime errors

**Roadmap Alignment:**
This work directly supports the product roadmap's mandate to "make the product appear as a traditional SaaS application" and remove wallet-centric language. It's a prerequisite for beta launch and subscription model validation.

## [Previous Versions]
<!-- Previous changelog entries would go here -->
